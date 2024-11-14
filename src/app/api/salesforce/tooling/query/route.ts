import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const instance_url = searchParams.get('instance_url')
  const q = searchParams.get('q')

  if (!instance_url || !q) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  const authorization = request.headers.get('authorization')
  if (!authorization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const response = await fetch(
      `${instance_url}/services/data/v59.0/tooling/query?q=${encodeURIComponent(q)}`,
      {
        headers: {
          'Authorization': authorization
        }
      }
    )

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error querying Tooling API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 