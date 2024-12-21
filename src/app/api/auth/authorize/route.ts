import { NextResponse, NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const SF_CLIENT_ID = process.env.SF_CLIENT_ID
    const SF_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    const environmentType = request.nextUrl.searchParams.get('environment') === 'sandbox' ? 'test' : 'login'

    console.log('Environment type:', environmentType)
    
    if (!SF_CLIENT_ID) {
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    const authUrl =
        `https://${environmentType}.salesforce.com/services/oauth2/authorize?prompt=login&` +
        `client_id=${SF_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(SF_REDIRECT_URI)}&` +
        `response_type=code&` +
        `state=${encodeURIComponent(JSON.stringify({ environmentType }))}`

    return NextResponse.json({ authUrl })
} 