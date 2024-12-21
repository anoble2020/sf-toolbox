import { storage } from "./storage";

interface TokenResponse {
    access_token: string
    instance_url: string
}

export const getAccessToken = async (): Promise<TokenResponse> => {
    const currentDomain = storage.getCurrentDomain();
    if (!currentDomain) {
        throw new Error('No current domain found');
    }

    const refreshToken = storage.getFromDomain(currentDomain, 'refresh_token');
    if (!refreshToken) {
        throw new Error('No refresh token found');
    }

    return refreshAccessToken(refreshToken);
}

export const refreshAccessToken = async (refreshToken: string): Promise<TokenResponse> => {
    const currentDomain = storage.getCurrentDomain();
    if (!currentDomain) {
        throw new Error('No current domain found');
    }

    const userInfo = storage.getFromDomain(currentDomain, 'user_info');
    
    const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'userInfo': JSON.stringify(userInfo || {}),
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
