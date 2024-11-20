import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const instance_url = searchParams.get('instance_url')
  const id = params.id
  
  if (!instance_url) {
    return NextResponse.json({ error: 'Missing instance URL' }, { status: 400 })
  }

  const authorization = request.headers.get('authorization')
  if (!authorization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    const response = await fetch(
      `${instance_url}/services/data/v59.0/tooling/sobjects/TraceFlag/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error updating trace flag:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const instance_url = searchParams.get('instance_url')
  const id = params.id
  
  if (!instance_url) {
    return NextResponse.json({ error: 'Missing instance URL' }, { status: 400 })
  }

  const authorization = request.headers.get('authorization')
  if (!authorization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const response = await fetch(
      `${instance_url}/services/data/v59.0/tooling/sobjects/TraceFlag/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': authorization
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting trace flag:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}