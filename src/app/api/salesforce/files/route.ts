import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const instance_url = searchParams.get('instance_url')
  const authorization = request.headers.get('authorization')

  if (!instance_url || !authorization) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  try {
    console.log('Fetching files with composite API...')
    const compositeRequest = {
      compositeRequest: [
        {
          method: 'GET',
          url: '/services/data/v59.0/tooling/query/?q=' + encodeURIComponent(`
            SELECT Id, Name, LastModifiedDate
            FROM ApexClass 
            WHERE NamespacePrefix = null 
            AND Status = 'Active'
            ORDER BY Name
          `),
          referenceId: 'apexClasses'
        },
        {
          method: 'GET',
          url: '/services/data/v59.0/tooling/query/?q=' + encodeURIComponent(`
            SELECT Id, Name, LastModifiedDate
            FROM ApexTrigger 
            WHERE Status = 'Active'
            ORDER BY Name
          `),
          referenceId: 'triggers'
        },
        {
          method: 'GET',
          url: '/services/data/v59.0/tooling/query/?q=' + encodeURIComponent(`
            SELECT Id, DeveloperName, LastModifiedDate
            FROM LightningComponentBundle
            WHERE ApiVersion > 0
            ORDER BY DeveloperName
          `),
          referenceId: 'lwc'
        },
        {
          method: 'GET',
          url: '/services/data/v59.0/tooling/query/?q=' + encodeURIComponent(`
            SELECT Id, DeveloperName, LastModifiedDate
            FROM AuraDefinitionBundle
            WHERE ApiVersion > 0
            ORDER BY DeveloperName
          `),
          referenceId: 'aura'
        }
      ]
    }

    console.log('Composite request:', JSON.stringify(compositeRequest, null, 2))

    const response = await fetch(
      `${instance_url}/services/data/v59.0/tooling/composite`,
      {
        method: 'POST',
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(compositeRequest)
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Failed to fetch files:', errorData)
      throw new Error('Failed to fetch files')
    }

    const data = await response.json()
    console.log('Composite response:', JSON.stringify(data, null, 2))

    console.log('all lwcs', data.compositeResponse[2].body.records)
    console.log('all aura', data.compositeResponse[3].body.records)

    // Process and format the response
    const files = {
      apexClasses: (data.compositeResponse[0].body.records || []).map((record: any) => ({
        Id: record.Id,
        Name: record.Name,
        Type: 'ApexClass',
        LastModifiedDate: record.LastModifiedDate
      })),
      triggers: (data.compositeResponse[1].body.records || []).map((record: any) => ({
        Id: record.Id,
        Name: record.Name,
        Type: 'ApexTrigger',
        LastModifiedDate: record.LastModifiedDate
      })),
      lwc: (data.compositeResponse[2].body.records || []).map((record: any) => ({
        Id: record.Id,
        Name: record.DeveloperName,
        Type: 'LightningComponentBundle',
        LastModifiedDate: record.LastModified
      })),
      aura: (data.compositeResponse[3].body.records || []).map((record: any) => ({
        Id: record.Id,
        Name: record.DeveloperName,
        Type: 'AuraDefinitionBundle',
        LastModifiedDate: record.LastModified
      }))
    }

    //console.log('Final processed files:', JSON.stringify(files, null, 2))
    return NextResponse.json(files)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}