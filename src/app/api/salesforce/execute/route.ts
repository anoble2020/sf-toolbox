import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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
        const { code } = await request.json()

        const response = await fetch(
            `${instance_url}/services/data/v59.0/tooling/executeAnonymous/?anonymousBody=${encodeURIComponent(code)}`,
            {
                headers: {
                    Authorization: authorization,
                },
            },
        )

        const result = await response.json()

        if (!response.ok) {
            return NextResponse.json({ error: result.message }, { status: response.status })
        }

        // If execution was successful, get the latest debug log ID and status
        if (result.success) {
            const logsResponse = await fetch(
                `${instance_url}/services/data/v59.0/tooling/query/?q=${encodeURIComponent(
                    'SELECT Id, Status, Operation FROM ApexLog ORDER BY StartTime DESC LIMIT 1',
                )}`,
                {
                    headers: {
                        Authorization: authorization,
                    },
                },
            )

            const logsData = await logsResponse.json()

            if (logsData.records?.[0]) {
                const latestLog = logsData.records[0]
                result.logId = latestLog.Id
                result.logStatus = latestLog.Status
                result.operation = latestLog.Operation
            }
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error executing anonymous apex:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
