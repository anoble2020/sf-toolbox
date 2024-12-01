import { NextResponse } from 'next/server'

export async function GET() {
    const SF_CLIENT_ID = process.env.SF_CLIENT_ID
    const SF_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`

    if (!SF_CLIENT_ID) {
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    const authUrl =
        `https://login.salesforce.com/services/oauth2/authorize?` +
        `client_id=${SF_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(SF_REDIRECT_URI)}&` +
        `response_type=code`

    return NextResponse.json({ authUrl })
} 