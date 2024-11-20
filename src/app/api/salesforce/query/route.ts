import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const instance_url = searchParams.get('instance_url')
  const q = searchParams.get('q')

  console.log('SOQL Query Request:', {
    instance_url,
    query: q
  })

  if (!instance_url || !q) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  const authorization = request.headers.get('authorization')
  if (!authorization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = `${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(q)}`
    console.log('Fetching from Salesforce:', url)

    const response = await fetch(url, {
      headers: {
        'Authorization': authorization
      }
    })

    const data = await response.json()
    console.log('Salesforce response:', data)

    if (!response.ok) {
      console.error('Error from Salesforce:', data)
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error querying Salesforce:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 