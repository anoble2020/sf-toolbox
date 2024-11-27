import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const type = searchParams.get('type')
        const instance_url = searchParams.get('instance_url')
        const authorization = request.headers.get('authorization')

        if (!id || !type || !instance_url || !authorization) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        // Get the appropriate API endpoint based on type
        const endpoint = getEndpoint(type, id)

        const response = await fetch(
            `${instance_url}/services/data/v59.0/tooling/query/?q=${encodeURIComponent(endpoint)}`,
            {
                headers: {
                    Authorization: authorization,
                },
            },
        )

        if (!response.ok) {
            throw new Error('Failed to fetch file')
        }

        const data = await response.json()

        if (!data.records?.[0]) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        return NextResponse.json(data.records[0])
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

function getEndpoint(type: string, id: string) {
    const baseFields = 'Id, Name, Body'

    switch (type) {
        case 'ApexClass':
            return `SELECT ${baseFields} FROM ApexClass WHERE Id = '${id}'`
        case 'ApexTrigger':
            return `SELECT ${baseFields} FROM ApexTrigger WHERE Id = '${id}'`
        case 'LightningComponentBundle':
            return `SELECT ${baseFields} FROM LightningComponentBundle WHERE Id = '${id}'`
        case 'AuraDefinitionBundle':
            return `SELECT ${baseFields} FROM AuraDefinitionBundle WHERE Id = '${id}'`
        default:
            return `SELECT ${baseFields} FROM ApexClass WHERE Id = '${id}'`
    }
}
