import { type NextRequest } from 'next/server'

interface RouteHandlerContext {
    params: {
        id: string
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params
        const instance_url = request.nextUrl.searchParams.get('instance_url')

        console.log('Renewing trace flag:', { id, instance_url })

        if (!instance_url) {
            console.error('Missing instance_url')
            return new Response('Missing instance_url', { status: 400 })
        }

        const authHeader = request.headers.get('Authorization')
        if (!authHeader) {
            console.error('Unauthorized')
            return new Response('Unauthorized', { status: 401 })
        }

        const newExpirationDate = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()

        const response = await fetch(`${instance_url}/services/data/v59.0/tooling/sobjects/TraceFlag/${id}`, {
            method: 'PATCH',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ExpirationDate: newExpirationDate,
                StartDate: new Date(Date.now()).toISOString(),
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            console.error('Failed to renew trace flag:', {
                status: response.status,
                statusText: response.statusText,
                error: error,
            })
            return new Response(JSON.stringify(error), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        return new Response(null, { status: 204 })
    } catch (error: any) {
        console.error('Error renewing trace flag:', error)
        return new Response(JSON.stringify({ error: 'Failed to renew trace flag' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

export async function DELETE(
    req: NextRequest,
    context: RouteHandlerContext
): Promise<Response> {
    try {
        const { id } = context.params
        const instance_url = req.nextUrl.searchParams.get('instance_url')

        if (!instance_url) {
            return new Response('Missing instance_url', { status: 400 })
        }

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401 })
        }

        const url = `${instance_url}/services/data/v59.0/tooling/sobjects/TraceFlag/${id}`
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                Authorization: authHeader,
            },
        })

        if (!response.ok) {
            const error = await response.json()
            return new Response(JSON.stringify(error), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        return new Response(null, { status: 204 })
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to delete trace flag' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
