import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { refresh_token } = await request.json()
        const userInfo = request.headers.get('userInfo')
        if (!userInfo) {
            return NextResponse.json({ error: 'User info not found' }, { status: 400 })
        }

        const environmentType = JSON.parse(userInfo).environmentType
        const response = await fetch(`https://${environmentType}.salesforce.com/services/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: process.env.SF_CLIENT_ID!,
                client_secret: process.env.SF_CLIENT_SECRET!,
                refresh_token,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json({ error: data.error_description || data.error }, { status: response.status })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Refresh token error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
