interface TokenResponse {
    access_token: string
    instance_url: string
}

interface SessionInfo {
    sessionId: string
    domain: string
    orgDomain: string
}

export const getAccessToken = async (): Promise<TokenResponse> => {
    const sessionToken = localStorage.getItem('sf_session_token')
    const sessionDomain = localStorage.getItem('sf_session_domain')
    const currentOrgDomain = localStorage.getItem('sf_org_domain')
    const refreshToken = localStorage.getItem('sf_refresh_token')

    // Only use session token if it matches the current org
    if (sessionToken && sessionDomain && currentOrgDomain) {
        if (sessionDomain.includes(currentOrgDomain)) {
            const info = await introspectToken(sessionToken)
            if (info.remaining_minutes > 0) {
                return {
                    access_token: sessionToken,
                    instance_url: `https://${currentOrgDomain}`
                }
            }
        }
    }

    // Fall back to refresh token if session is invalid or doesn't match org
    if (refreshToken) {
        return refreshAccessToken(refreshToken)
    }

    throw new Error('No valid tokens found for current org')
}

export const refreshAccessToken = async (refreshToken: string): Promise<TokenResponse> => {
    const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
        throw new Error('Failed to refresh access token')
    }

    return response.json()
}

export const introspectToken = async (token: string): Promise<{ remaining_minutes: number }> => {
    const instanceUrl = `https://${localStorage.getItem('sf_session_domain')}`
    const response = await fetch('/api/auth/introspect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            token,
            instanceUrl 
        }),
    })

    if (!response.ok) {
        throw new Error('Failed to introspect token')
    }

    return response.json()
}
