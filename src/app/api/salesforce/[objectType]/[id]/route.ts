import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { objectType: string; id: string } }
) {
    const objectType = await params.objectType
    const id = await params.id

    try {
        const { searchParams } = new URL(request.url)
        const instance_url = searchParams.get('instance_url')
        const authorization = request.headers.get('authorization')

        if (!instance_url || !authorization) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        let endpoint: string

        switch (objectType) {
            case 'apexclass':
                endpoint = `/services/data/v59.0/tooling/sobjects/ApexClass/${id}`
                break
            case 'apextrigger':
                endpoint = `/services/data/v59.0/tooling/sobjects/ApexTrigger/${id}`
                break
            case 'lightningcomponentbundle':
                endpoint =
                    `/services/data/v59.0/tooling/query/?q=` +
                    encodeURIComponent(`
          SELECT Id, Source, FilePath
          FROM LightningComponentResource
          WHERE LightningComponentBundleId = '${id}'
        `)
                console.log('LWC Query:', endpoint)
                break
            case 'auradefinitionbundle':
                endpoint =
                    `/services/data/v59.0/tooling/query/?q=` +
                    encodeURIComponent(`
          SELECT Id, Source, DefType
          FROM AuraDefinition
          WHERE AuraDefinitionBundleId = '${id}'
          AND DefType IN ('COMPONENT', 'CONTROLLER', 'HELPER', 'STYLE', 'DOCUMENTATION', 'RENDERER')
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

        let result
        switch (objectType) {
            case 'apexclass':
            case 'apextrigger':
                result = {
                    Name: data.Name,
                    Body: data.Body,
                    files: [
                        {
                            name: data.Name,
                            content: data.Body,
                            type: 'apex',
                        },
                    ],
                }
                break
            case 'lightningcomponentbundle':
                if (!data.records?.length) {
                    throw new Error('No files found')
                }

                const files = data.records
                    .map((record: any) => ({
                        name: record.FilePath.split('/').pop(),
                        content: record.Source,
                        type: getFileType(record.FilePath),
                        filePath: record.FilePath
                    }))
                    .sort((a, b) => {
                        const order = ['js', 'html', 'css', 'xml'];
                        const extA = a.filePath.split('.').pop() || '';
                        const extB = b.filePath.split('.').pop() || '';
                        return order.indexOf(extA) - order.indexOf(extB);
                    });

                console.log('Processed bundle files:', files)

                result = {
                    Name: files[0].name.split('.')[0],
                    Body: files[0].content,
                    files: files,
                }
                break
            case 'auradefinitionbundle':
                if (!data.records?.length) {
                    throw new Error('No files found')
                }

                const auraFiles = data.records
                    .map((record: any) => ({
                        name: record.FilePath ? record.FilePath.split('/').pop() : `${record.DefType}`,
                        content: record.Source,
                        type: getFileType(record.FilePath || record.DefType),
                        defType: record.DefType
                    }))
                    .sort((a, b) => {
                        const order = ['COMPONENT', 'CONTROLLER', 'HELPER', 'STYLE', 'DOCUMENTATION', 'RENDERER', 'DESIGN', 'SVG'];
                        const typeA = a.defType || '';
                        const typeB = b.defType || '';
                        return order.indexOf(typeA) - order.indexOf(typeB);
                    });

                result = {
                    Name: auraFiles[0].name.split('.')[0],
                    Body: auraFiles[0].content,
                    files: auraFiles,
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
            {
                error: error instanceof Error ? error.message : 'Internal server error',
            },
            { status: 500 },
        )
    }
}

function getFileType(path: string): string {
    if (path.endsWith('.js')) return 'javascript'
    if (path.endsWith('.html')) return 'html'
    if (path.endsWith('.css')) return 'css'
    if (path.endsWith('.xml')) return 'xml'
    if (path.endsWith('.design')) return 'xml'
    if (path.endsWith('.svg')) return 'svg'
    if (path.endsWith('.auradoc')) return 'xml'
    return 'text'
}
