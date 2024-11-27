import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const instance_url = searchParams.get('instance_url')

    if (!instance_url) {
        return NextResponse.json({ error: 'Missing instance URL' }, { status: 400 })
    }

    const authorization = request.headers.get('authorization')
    if (!authorization) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Fetch org limits
        const limitsResponse = await fetch(`${instance_url}/services/data/v59.0/limits/`, {
            headers: { Authorization: authorization },
        })

        if (!limitsResponse.ok) {
            throw new Error('Failed to fetch org limits')
        }

        const limits = await limitsResponse.json()

        // Set up date range for the last 24 hours
        const now = new Date()
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setUTCHours(0, 0, 0, 0)

        // Query Event Log Files
        const queryResponse = await fetch(
            `${instance_url}/services/data/v59.0/query/?q=${encodeURIComponent(`
                SELECT Id, LogDate, LogFile 
                FROM EventLogFile 
                WHERE LogDate >= ${yesterday.toISOString()} 
                AND EventType = 'ApiTotalUsage' 
                ORDER BY LogDate DESC
            `)}`,
            { headers: { Authorization: authorization } }
        )

        if (!queryResponse.ok) {
            throw new Error('Failed to fetch event logs')
        }

        const { records } = await queryResponse.json()
        console.log('EventLogFile records:', records)

        // Fetch and process log files
        const logData = await Promise.all(
            records.map(async (record: any) => {
                const logResponse = await fetch(
                    `${instance_url}${record.LogFile}`,
                    { headers: { Authorization: authorization } }
                )

                if (!logResponse.ok) {
                    console.error('Failed to fetch log file:', record.Id)
                    return null
                }

                const csvText = await logResponse.text()
                console.log('CSV Text sample:', csvText.substring(0, 200))

                const rows = csvText.split('\n').map(row => 
                    row.split(',').map(cell => cell.replace(/^"|"$/g, '')) // Remove quotes
                )
                const headers = rows[0]

                // We know the timestamp is in column 1 (second column)
                const timestampIndex = 1
                const runTimeIndex = headers.indexOf('RUN_TIME') || -1
                const cpuTimeIndex = headers.indexOf('CPU_TIME') || -1

                // Group data by minute to reduce data points
                const minuteAggregates = new Map<string, { count: number, totalRunTime: number, totalCpuTime: number }>()

                rows.slice(1).forEach(row => {
                    if (row.length < 2) {
                        console.log('Skipping malformed row:', row)
                        return
                    }

                    const timestamp = row[timestampIndex]?.split('.')[0] // Remove milliseconds
                    if (!timestamp) {
                        console.log('Skipping row with no timestamp:', row)
                        return
                    }

                    // Group by minute (first 12 chars of timestamp: YYYYMMDDHHMM)
                    const timeKey = timestamp.substring(0, 12)
                    
                    const existing = minuteAggregates.get(timeKey) || {
                        count: 0,
                        totalRunTime: 0,
                        totalCpuTime: 0
                    }

                    minuteAggregates.set(timeKey, {
                        count: existing.count + 1,
                        totalRunTime: existing.totalRunTime,
                        totalCpuTime: existing.totalCpuTime
                    })
                })

                // Convert to array and sort by timestamp
                const dataPoints = Array.from(minuteAggregates.entries())
                    .map(([timestamp, data]) => ({
                        timestamp,
                        count: data.count,
                        runTime: Math.round(data.totalRunTime / data.count),
                        cpuTime: Math.round(data.totalCpuTime / data.count)
                    }))
                    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

                return {
                    logDate: record.LogDate,
                    dataPoints
                }
            })
        )

        const processedLogData = logData.filter(Boolean)
        console.log('Processed log data summary:', {
            totalEvents: processedLogData.length,
            firstEventDataPoints: processedLogData[0]?.dataPoints?.length || 0
        })

        return NextResponse.json({
            limits,
            events: processedLogData
        })
    } catch (error) {
        console.error('Error fetching org limits:', error)
        return NextResponse.json({ error: 'Failed to fetch org data' }, { status: 500 })
    }
} 