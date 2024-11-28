'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createTraceFlag } from '@/lib/salesforce'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

console.log('CallbackPage component defined')

export default function CallbackPage() {
    console.log('CallbackPage render')
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        console.log('CallbackPage mounted')
        const code = searchParams.get('code')
        const error = searchParams.get('error')

        if (error) {
            console.error('OAuth Error:', error)
            console.error('Error Description:', searchParams.get('error_description'))
            router.push('/auth')
            return
        }

        if (!code) {
            console.error('No auth code received')
            router.push('/auth')
            return
        }

        console.log('Received auth code, exchanging for tokens...', code)

        fetch(`${window.location.origin}/api/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        })
            .then(async (response) => {
                if (!response.ok) {
                    const errorData = await response.json()
                    console.error('Token endpoint error:', {
                        status: response.status,
                        statusText: response.statusText,
                        data: errorData,
                    })
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                return response.json()
            })
            .then((data) => {
                console.log('Received data from token endpoint:', data)

                if (!data.tokens?.refresh_token) {
                    console.error('No refresh token in response:', data)
                    router.push('/auth')
                    return
                }

                if (!data.user) {
                    console.error('No user data in response:', data)
                    router.push('/auth')
                    return
                }

                console.log('got user info:', data.user)
                // Store in localStorage for client-side access
                localStorage.setItem('sf_refresh_token', data.tokens.refresh_token)
                localStorage.setItem('sf_user_info', JSON.stringify(data.user))

                // Store in cookies for server-side access
                document.cookie = `sf_refresh_token=${data.tokens.refresh_token}; path=/`

                // Make sure we have a user ID before creating trace flag
                if (data.user.user_id) {
                    createTraceFlag(data.user.user_id, '', 'USER_DEBUG')
                        .then(() => {
                            console.log('Trace flag created successfully')
                            toast.success('Trace flag created successfully for your user')
                })
                        .catch((error) => {
                            if (!error.message?.includes('trace flag already exists')) {
                                console.error('Failed to create trace flag:', error)
                                toast.error('Failed to create trace flag for your user')
                            } else {
                                console.log('Trace flag already exists')
                                toast.info('An active trace flag already exists for your user')
                            }
                        })
                } else {
                    console.warn('No user ID found in response:', data)
                }

                // Store connected org
                const connectedOrgs = JSON.parse(localStorage.getItem('connected_orgs') || '[]')
                const newOrg: ConnectedOrg = {
                    orgId: data.user.orgId,
                    orgDomain: data.user.orgDomain,
                    username: data.user.username,
                    refreshToken: data.tokens.refresh_token,
                    lastAccessed: new Date().toISOString()
                }

                // Update or add the org
                const updatedOrgs = connectedOrgs.some(org => org.orgId === newOrg.orgId)
                    ? connectedOrgs.map(org => org.orgId === newOrg.orgId ? newOrg : org)
                    : [...connectedOrgs, newOrg]

                localStorage.setItem('connected_orgs', JSON.stringify(updatedOrgs))

                console.log('Stored tokens, redirecting to /dashboard...')
                router.push('/dashboard')
            })
            .catch((error) => {
                console.error('Fetch error:', error)
                router.push('/auth')
            })
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-4">Authenticating...</h2>
                      <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        </div>
    )
}
