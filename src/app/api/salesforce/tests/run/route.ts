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
    const { classId, methodNames } = await request.json()

    if (!classId || !methodNames?.length) {
      return NextResponse.json({ error: 'Missing classId or methodNames' }, { status: 400 })
    }

    console.log('Running tests for:', { classId, methodNames })

    // Create the test run
    const response = await fetch(
      `${instance_url}/services/data/v59.0/tooling/runTestsAsynchronous`,
      {
        method: 'POST',
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classids: [classId],
          testLevel: 'RunSpecifiedTests',
          tests: methodNames.map(methodName => ({
            classId,
            testMethods: [methodName]
          }))
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Salesforce API error:', error)
      return NextResponse.json({ error: error.message || 'Failed to start tests' }, { status: response.status })
    }

    // The response is just the ID as a string
    const testRunId = await response.text()
    console.log('Test run created with ID:', testRunId)

    if (!testRunId) {
      return NextResponse.json({ error: 'No test run ID returned from Salesforce' }, { status: 500 })
    }

    return NextResponse.json({ testRunId })
  } catch (error) {
    console.error('Error running tests:', error)
    return NextResponse.json({ error: 'Failed to run tests' }, { status: 500 })
  }
} 