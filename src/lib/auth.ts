interface TokenResponse {
    access_token: string
    instance_url: string
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
        const error = await response.json()
        throw new Error(`Failed to refresh token: ${error.error}`)
    }

    return response.json()
}
