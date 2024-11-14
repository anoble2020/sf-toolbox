import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    console.log('POST request received in traceflags')
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
    const body = await request.json()
    console.log('Creating trace flag with:', { instance_url, body })
    
    const response = await fetch(
      `${instance_url}/services/data/v59.0/tooling/sobjects/TraceFlag`,
      {
        method: 'POST',
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      console.error('Salesforce error:', data)
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating trace flag:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
      { status: 500 }
    )
  }
} 