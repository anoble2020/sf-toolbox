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
            headers: {
                Authorization: authorization,
            },
        })

        if (!limitsResponse.ok) {
            throw new Error('Failed to fetch org limits')
        }

        // Fetch API event logs for the trend
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const isoDate = yesterday.toISOString()

        const query = `
            SELECT Id, LogDate, LogFileLength 
            FROM EventLogFile 
            WHERE LogDate > ${isoDate} 
            AND EventType = 'API' 
            ORDER BY LogDate ASC
        `

        const eventsResponse = await fetch(
            `${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(query)}`,
            {
                headers: {
                    Authorization: authorization,
                },
            },
        )

        if (!eventsResponse.ok) {
            throw new Error('Failed to fetch API events')
        }

        const [limits, events] = await Promise.all([
            limitsResponse.json(),
            eventsResponse.json(),
        ])

        console.log('limits', limits)
        //console.log('events', events)

        return NextResponse.json({
            limits,
            events: events.records,
        })
    } catch (error) {
        console.error('Error fetching org limits:', error)
        return NextResponse.json({ error: 'Failed to fetch org data' }, { status: 500 })
    }
} 