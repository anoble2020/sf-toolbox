import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { token, instanceUrl } = await request.json()

        if (!token || !instanceUrl) {
            return NextResponse.json(
                { error: 'Token and instanceUrl are required' }, 
                { status: 400 }
            )
        }

        const response = await fetch(`${instanceUrl}/services/oauth2/introspect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                token,
                client_id: process.env.SF_CLIENT_ID!,
                client_secret: process.env.SF_CLIENT_SECRET!,
                token_type_hint: 'access_token'
            }),
        })

        const data = await response.json()
        console.log('Introspection response:', data)

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error_description || data.error }, 
                { status: response.status }
            )
        }

        // Calculate remaining minutes from expires_at
        const expiresAt = new Date(data.exp * 1000)
        const now = new Date()
        const remainingMinutes = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60))

        return NextResponse.json({ remaining_minutes: remainingMinutes })
    } catch (error) {
        console.error('Token introspection error:', error)
        return NextResponse.json(
            { error: 'Internal server error' }, 
            { status: 500 }
        )
    }
} 