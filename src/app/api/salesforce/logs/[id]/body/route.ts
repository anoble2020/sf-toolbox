import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    // Get log ID from URL path
    const segments = request.nextUrl.pathname.split('/')
    const id = segments[segments.length - 2] // Get the ID segment (second to last)
    
    const instance_url = request.nextUrl.searchParams.get('instance_url')

    if (!instance_url) {
        return NextResponse.json({ error: 'Missing instance URL' }, { status: 400 })
    }

    const authorization = request.headers.get('authorization')
    if (!authorization) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log(`Fetching log body for ${id}`)
        const response = await fetch(
            `${instance_url}/services/data/v59.0/sobjects/ApexLog/${id}/Body`,
            {
                headers: {
                    'Authorization': authorization
                }
            }
        )

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch log body from Salesforce' }, 
                { status: response.status }
            )
        }

        const text = await response.text()
        return new NextResponse(text, {
            headers: {
                'Content-Type': 'text/plain'
            }
        })
    } catch (error) {
        console.error('Error fetching log body:', error)
        return NextResponse.json(
            { error: 'Internal server error' }, 
            { status: 500 }
        )
    }
}