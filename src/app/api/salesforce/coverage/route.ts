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
    const response = await fetch(
      `${instance_url}/services/data/v59.0/tooling/query/?q=` +
      encodeURIComponent(`
        SELECT 
          ApexClassOrTrigger.Name,
          ApexClassOrTriggerId,
          NumLinesCovered,
          NumLinesUncovered,
          Coverage
        FROM ApexCodeCoverage
        WHERE ApexClassOrTrigger.Name != null
        ORDER BY ApexClassOrTrigger.Name ASC
      `),
      {
        headers: {
          'Authorization': authorization
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Coverage query error:', error)
      throw new Error(`Coverage query failed: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    
    const coverage = data.records.map((record: any) => ({
      ApexClassOrTriggerId: record.ApexClassOrTriggerId,
      NumLinesCovered: record.NumLinesCovered,
      NumLinesUncovered: record.NumLinesUncovered,
      ApexClassName: record.ApexClassOrTrigger?.Name || 'Unknown',
      Coverage: record.Coverage || {
        coveredLines: [],
        uncoveredLines: []
      }
    }))

    return NextResponse.json(coverage)
  } catch (error) {
    console.error('Error fetching coverage:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch coverage' },
      { status: 500 }
    )
  }
} 