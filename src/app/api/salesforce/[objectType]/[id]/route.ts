import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { objectType: string; id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const instance_url = searchParams.get('instance_url')
    const authorization = request.headers.get('authorization')

    if (!instance_url || !authorization) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const { objectType, id } = params
    let endpoint: string

    switch (objectType) {
      case 'apexclass':
        endpoint = `/services/data/v59.0/tooling/sobjects/ApexClass/${id}`
        break
      case 'apextrigger':
        endpoint = `/services/data/v59.0/tooling/sobjects/ApexTrigger/${id}`
        break
      case 'lwcresource':
        endpoint = `/services/data/v59.0/tooling/sobjects/LightningComponentResource/${id}`
        break
      case 'auradefinition':
        endpoint = `/services/data/v59.0/tooling/sobjects/AuraDefinition/${id}`
        break
      default:
        return NextResponse.json({ error: 'Invalid object type' }, { status: 400 })
    }

    const response = await fetch(`${instance_url}${endpoint}`, {
      headers: {
        Authorization: authorization,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch file')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 