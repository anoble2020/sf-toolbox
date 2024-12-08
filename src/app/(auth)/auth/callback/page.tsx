'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createTraceFlag } from '@/lib/salesforce'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { ConnectedOrg } from '@/lib/types'
import { storage } from '@/lib/storage'

function CallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        if (!code || !state) {
            console.error('No authorization code or state found in URL')
            router.push('/auth')
            return
        }

        console.log('Starting auth callback process...')

        fetch('/api/auth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                state: state
            },
            body: JSON.stringify({ code }),
        })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(`Token exchange failed: ${errorData.error || response.statusText}`)
            }
            return response.json()
        })
        .then((data) => {
            try {
                console.log('Received auth data:', { 
                    hasTokens: !!data.tokens, 
                    hasUser: !!data.user,
                    domain: data.user?.orgDomain 
                })

                if (data.error) {
                    throw new Error(data.error)
                }

                if (!data.tokens?.refresh_token || !data.user) {
                    throw new Error('Invalid response: Missing tokens or user data')
                }

                const domain = data.user.orgDomain
                if (!domain) {
                    throw new Error('Invalid response: Missing orgDomain')
                }

                // Set this as the current domain
                storage.setCurrentDomain(domain)

                // Store domain-specific data
                storage.setForDomain(domain, 'refresh_token', data.tokens.refresh_token)
                storage.setForDomain(domain, 'user_info', data.user)
                storage.setForDomain(domain, 'last_accessed', new Date())

                // Update connected orgs list
                const newOrg = {
                    orgId: data.user.orgId,
                    orgDomain: domain,
                    username: data.user.username,
                    environmentType: data.user.environmentType,
                    refreshToken: data.tokens.refresh_token,
                    lastAccessed: new Date().toISOString()
                }

                // Get existing connected orgs
                const connectedOrgs = storage.getFromDomain(domain, 'connected_orgs') || []
                console.log('Existing connected orgs:', connectedOrgs)
                
                // Update or add the org
                const updatedOrgs = connectedOrgs.some((org: ConnectedOrg) => org.orgId === newOrg.orgId)
                    ? connectedOrgs.map((org: ConnectedOrg) => 
                        org.orgId === newOrg.orgId ? newOrg : org
                    )
                    : [...connectedOrgs, newOrg]

                storage.setForDomain(domain, 'connected_orgs', updatedOrgs)

                // Store refresh token in cookie for server-side access
                document.cookie = `sf_refresh_token=${data.tokens.refresh_token}; path=/`

                // Create trace flag if needed
                if (data.user.user_id) {
                    return createTraceFlag(data.user.user_id, '', 'USER_DEBUG')
                        .then(() => {
                            console.log('Trace flag created successfully')
                            toast.success('Trace flag created successfully for your user')
                        })
                        .catch((error: any) => {
                            if (!error.message?.includes('trace flag already exists')) {
                                console.error('Failed to create trace flag:', error)
                                toast.error('Failed to create trace flag for your user')
                            } else {
                                console.log('Trace flag already exists')
                                toast.info('An active trace flag already exists for your user')
                            }
                        })
                }
            } catch (error) {
                console.error('Error processing auth data:', error)
                throw error
            }
        })
        .then(() => {
            console.log('Auth process complete, redirecting to dashboard...')
            router.push('/dashboard')
        })
        .catch((error) => {
            console.error('Auth callback error:', error)
            toast.error(error.message || 'Authentication failed')
            router.push('/auth')
        })
    }, [router, searchParams])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Completing authentication...</span>
        </div>
    )
}

export default function CallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        }>
            <CallbackContent />
        </Suspense>
    )
}
