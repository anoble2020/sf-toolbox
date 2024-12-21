import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { code } = await request.json()
        const stateHeader = request.headers.get('state')
        
        console.log('Token request received:', { code, stateHeader })
        
        if (!stateHeader) {
            console.error('Missing state header')
            return NextResponse.json({ error: 'Missing state parameter' }, { status: 400 })
        }

        let environmentType
        try {
            const parsedState = JSON.parse(stateHeader)
            environmentType = parsedState.environmentType
            console.log('Parsed state:', { environmentType })
        } catch (error) {
            console.error('Failed to parse state:', error)
            return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 })
        }

        //const domain = environmentType === 'test' ? 'test' : 'login'
        
        if (!code) {
            console.error('No code provided')
            return NextResponse.json({ error: 'No code provided' }, { status: 400 })
        }

        const tokenUrl = `https://${environmentType}.salesforce.com/services/oauth2/token`
        const params = {
            grant_type: 'authorization_code',
            client_id: process.env.SF_CLIENT_ID!,
            client_secret: process.env.SF_CLIENT_SECRET!,
            redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
            code: code,
        }

        console.log('Making token request to:', tokenUrl)
        console.log('With params:', { ...params, client_secret: '[REDACTED]' })

        const tokenResponse = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(params),
        })

        const tokens = await tokenResponse.json()

        if (!tokenResponse.ok) {
            console.error('Token response error:', {
                status: tokenResponse.status,
                statusText: tokenResponse.statusText,
                error: tokens
            })
            return NextResponse.json({ 
                error: tokens.error_description || tokens.error || 'Token exchange failed',
                details: tokens
            }, { status: tokenResponse.status })
        }

        // Get user info from the correct domain
        const userInfoResponse = await fetch(`https://${environmentType}.salesforce.com/services/oauth2/userinfo`, {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        })

        const userInfo = await userInfoResponse.json()

        return NextResponse.json({
            tokens,
            user: {
                username: userInfo.preferred_username,
                orgDomain: tokens.instance_url.replace('https://', ''),
                orgId: userInfo.organization_id,
                environmentType: environmentType,
                photoUrl: userInfo.picture,
                timezone: userInfo.zoneinfo,
                user_id: userInfo.user_id,
            },
        })
    } catch (error) {
        console.error('Token exchange error:', error)
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Internal server error',
            details: error
        }, { status: 500 })
    }
}   
