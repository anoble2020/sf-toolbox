import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { code } = await request.json()

        console.log('Received code in token endpoint:', code)

        if (!code) {
            return NextResponse.json({ error: 'No code provided' }, { status: 400 })
        }

        console.log('Exchanging code for token...', code) // Debug log

        const tokenResponse = await fetch('https://login.salesforce.com/services/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: process.env.NEXT_PUBLIC_SF_CLIENT_ID!,
                client_secret: process.env.SF_CLIENT_SECRET!,
                redirect_uri: 'http://localhost:3000/auth/callback',
                code: code,
            }),
        })

        const tokens = await tokenResponse.json()
        console.log('Token response:', tokens) // Debug log

        if (!tokenResponse.ok) {
            console.error('Token response error:', tokens)
            return NextResponse.json({ error: tokens.error_description }, { status: 400 })
        } else {
            console.log('Token response ok:', tokenResponse) // Debug log
        }

        // Get user info
        const userInfoResponse = await fetch('https://login.salesforce.com/services/oauth2/userinfo', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        })

        const userInfo = await userInfoResponse.json()
        console.log('User info:', userInfo) // Debug log

        return NextResponse.json({
            tokens,
            user: {
                username: userInfo.preferred_username,
                orgDomain: userInfo.organization_id,
                photoUrl: userInfo.picture,
                timezone: userInfo.zoneinfo,
                user_id: userInfo.user_id,
            },
        })
    } catch (error) {
        console.error('Callback error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
