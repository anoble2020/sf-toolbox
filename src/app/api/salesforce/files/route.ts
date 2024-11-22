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
            SELECT Id, DeveloperName, LastModified
            FROM LightningComponentBundle
            ORDER BY DeveloperName
          `),
          referenceId: 'lwc'
        },
        {
          method: 'GET',
          url: '/services/data/v59.0/tooling/query/?q=' + encodeURIComponent(`
            SELECT Id, DeveloperName, LastModified
            FROM AuraDefinitionBundle
            ORDER BY DeveloperName
          `),
          referenceId: 'aura'
        }
      ]
    }

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
      throw new Error('Failed to fetch files')
    }

    const data = await response.json()

    // Process and format the response with safe fallbacks
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
      lwc: await Promise.all((data.compositeResponse[2].body.records || []).map(async (record: any) => {
        try {
          // Fetch component files
          const filesResponse = await fetch(
            `${instance_url}/services/data/v59.0/tooling/query/?q=` + 
            encodeURIComponent(`
              SELECT Id, FilePath, Format
              FROM LightningComponentResource
              WHERE LightningComponentBundleId = '${record.Id}'
            `),
            {
              headers: { Authorization: authorization }
            }
          )
          
          if (!filesResponse.ok) {
            throw new Error('Failed to fetch LWC resources')
          }
          
          const filesData = await filesResponse.json()
          
          return {
            Id: record.Id,
            Name: record.DeveloperName,
            Type: 'LightningComponentBundle',
            LastModifiedDate: record.LastModified,
            SubComponents: (filesData.records || []).map((file: any) => ({
              Id: file.Id,
              Name: file.FilePath.split('/').pop(),
              Type: file.Format,
              Path: file.FilePath
            }))
          }
        } catch (error) {
          console.error('Error fetching LWC resources:', error)
          return {
            Id: record.Id,
            Name: record.DeveloperName,
            Type: 'LightningComponentBundle',
            LastModifiedDate: record.LastModified,
            SubComponents: []
          }
        }
      })),
      aura: await Promise.all((data.compositeResponse[3].body.records || []).map(async (record: any) => {
        try {
          // Fetch bundle files
          const filesResponse = await fetch(
            `${instance_url}/services/data/v59.0/tooling/query/?q=` + 
            encodeURIComponent(`
              SELECT Id, DefType, Format
              FROM AuraDefinition
              WHERE AuraDefinitionBundleId = '${record.Id}'
            `),
            {
              headers: { Authorization: authorization }
            }
          )
          
          if (!filesResponse.ok) {
            throw new Error('Failed to fetch Aura resources')
          }
          
          const filesData = await filesResponse.json()
          
          return {
            Id: record.Id,
            Name: record.DeveloperName,
            Type: 'AuraDefinitionBundle',
            LastModifiedDate: record.LastModified,
            SubComponents: (filesData.records || []).map((file: any) => ({
              Id: file.Id,
              Name: `${record.DeveloperName}.${file.DefType}`,
              Type: file.Format
            }))
          }
        } catch (error) {
          console.error('Error fetching Aura resources:', error)
          return {
            Id: record.Id,
            Name: record.DeveloperName,
            Type: 'AuraDefinitionBundle',
            LastModifiedDate: record.LastModified,
            SubComponents: []
          }
        }
      }))
    }

    return NextResponse.json(files)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 