import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        // Get test run ID from URL path
        const segments = request.nextUrl.pathname.split('/')
        const testRunId = segments[segments.length - 1].replace(/"/g, '')
        
        const instance_url = request.nextUrl.searchParams.get('instance_url')
        const authorization = request.headers.get('authorization')

        if (!instance_url || !authorization) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        console.log('Checking status for test run:', testRunId)

        // First, check the ApexTestRunResult status
        const jobStatusResponse = await fetch(
            `${instance_url}/services/data/v59.0/tooling/query/?q=` +
                encodeURIComponent(`
                    SELECT Id, Status, ClassesCompleted, ClassesEnqueued, MethodsCompleted, MethodsEnqueued, TestTime
                    FROM ApexTestRunResult
                    WHERE AsyncApexJobId = '${testRunId}'
                `),
            {
                headers: {
                    Authorization: authorization,
                },
            },
        )

        if (!jobStatusResponse.ok) {
            const errorData = await jobStatusResponse.json()
            console.error('Job status query error:', errorData)
            throw new Error(`Job status query failed: ${JSON.stringify(errorData)}`)
        }

        const jobStatus = await jobStatusResponse.json()
        console.log('Job status response:', jobStatus)

        // If job is completed, get results regardless of whether we find them or not
        if (jobStatus.records?.[0]?.Status === 'Completed') {
            // Get test results
            const resultsResponse = await fetch(
                `${instance_url}/services/data/v59.0/tooling/query/?q=` +
                    encodeURIComponent(`
                        SELECT Id, AsyncApexJobId, StackTrace, Message, MethodName, Outcome, ApexClass.Name, RunTime, TestTimestamp
                        FROM ApexTestResult 
                        WHERE AsyncApexJobId = '${testRunId}'
                        ORDER BY TestTimestamp DESC
                    `),
                {
                    headers: {
                        Authorization: authorization,
                    },
                },
            )

            if (!resultsResponse.ok) {
                const errorData = await resultsResponse.json()
                console.error('Results query error:', errorData)
                throw new Error(`Results query failed: ${JSON.stringify(errorData)}`)
            }

            const results = await resultsResponse.json()
            console.log('Test results:', results)

            // Get coverage regardless of whether we found results
            const coverageResponse = await fetch(
                `${instance_url}/services/data/v59.0/tooling/query/?q=` +
                    encodeURIComponent(`
                        SELECT ApexClassOrTriggerId, NumLinesCovered, NumLinesUncovered, Coverage
                        FROM ApexCodeCoverageAggregate
                        WHERE ApexClassOrTriggerId IN (
                            SELECT ApexClassId FROM ApexTestResult 
                            WHERE AsyncApexJobId = '${testRunId}'
                        )
                    `),
                {
                    headers: {
                        Authorization: authorization,
                    },
                },
            )

            if (!coverageResponse.ok) {
                const errorData = await coverageResponse.json()
                console.error('Coverage query error:', errorData)
                throw new Error(`Coverage query failed: ${JSON.stringify(errorData)}`)
            }

            const coverage = await coverageResponse.json()
            console.log('Coverage data:', coverage)

            return NextResponse.json({
                isComplete: true,
                results: results.records,
                coverage: coverage.records,
                jobInfo: jobStatus.records[0],
            })
        }

        // If job is still running, return status
        return NextResponse.json({
            isComplete: false,
            jobInfo: jobStatus.records?.[0] || null,
        })
    } catch (error) {
        console.error('Error fetching test results:', error)
        return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
    }
}
