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

    const objectType = (await params.objectType).toLowerCase()
    const id = await params.id

    let endpoint: string
    
    switch (objectType) {
      case 'apexclass':
        endpoint = `/services/data/v59.0/tooling/sobjects/ApexClass/${id}`
        break
      case 'apextrigger':
        endpoint = `/services/data/v59.0/tooling/sobjects/ApexTrigger/${id}`
        break
      case 'lightningcomponentbundle':
        endpoint = `/services/data/v59.0/tooling/query/?q=` + encodeURIComponent(`
          SELECT Id, Source, FilePath
          FROM LightningComponentResource
          WHERE LightningComponentBundleId = '${id}'
          AND FilePath LIKE '%.js'
        `)
        break
      case 'auradefinitionbundle':
        endpoint = `/services/data/v59.0/tooling/query/?q=` + encodeURIComponent(`
          SELECT Id, Source, DefType
          FROM AuraDefinition
          WHERE AuraDefinitionBundleId = '${id}'
          AND DefType = 'COMPONENT'
        `)
        break
      default:
        return NextResponse.json({ error: 'Invalid object type' }, { status: 400 })
    }

    console.log('Fetching from endpoint:', endpoint)

    const response = await fetch(`${instance_url}${endpoint}`, {
      headers: {
        Authorization: authorization,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to fetch file:', errorText)
      throw new Error(`Failed to fetch file: ${errorText}`)
    }

    const data = await response.json()
    console.log('Response data:', data)

    // Format response based on type
    let result
    switch (objectType) {
      case 'apexclass':
      case 'apextrigger':
        result = {
          Name: data.Name,
          Body: data.Body // Direct access to Body field from sobject endpoint
        }
        break
      case 'lightningcomponentbundle':
      case 'auradefinitionbundle':
        if (!data.records?.length) {
          throw new Error('No file found')
        }
        const record = data.records[0]
        result = {
          Name: record.FilePath ? record.FilePath.split('/').pop() : `${record.DefType} File`,
          Body: record.Source
        }
        break
    }

    if (!result?.Body) {
      throw new Error('No content found in file')
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}