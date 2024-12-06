'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SessionAuthPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const sessionToken = searchParams.get('session_token')
        let instanceUrl = searchParams.get('instance_url')
        const domain = searchParams.get('domain')

        if (!sessionToken || !instanceUrl || !domain) {
            console.error('Missing required parameters')
            return
        }

        // Correct the instance URL if it contains lightning.force.com
        if (instanceUrl.includes('lightning.force.com')) {
            instanceUrl = instanceUrl.replace('lightning.force.com', 'my.salesforce.com');
        }

        // Store the session information
        localStorage.setItem('sf_session_token', sessionToken)
        localStorage.setItem('sf_session_domain', new URL(instanceUrl).hostname)
        localStorage.setItem('sf_org_domain', domain)

        // Redirect to dashboard
        router.push('/dashboard')
    }, [searchParams, router])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Opening toolbox with session token...</span>
        </div>
    )
} 