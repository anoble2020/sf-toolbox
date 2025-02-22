'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { storage } from '@/lib/storage'
import { Loader2 } from 'lucide-react'

function CheckAuthContent() {
    const searchParams = useSearchParams()
    
    useEffect(() => {
        const domain = searchParams.get('domain')
        console.log('Check page - Initial domain:', domain)
        
        if (!domain) {
            console.error('No domain provided');
            return;
        }
        
        const sfData = JSON.parse(localStorage.getItem('sf_data') || '{}')
        console.log('Check page - SF Data:', sfData)
        
        // Check for refresh token in the correct domain format
        const mySalesforceVersion = domain.replace('.lightning.force.com', '.my.salesforce.com')
        const lightningVersion = domain.replace('.my.salesforce.com', '.lightning.force.com')
        
        const hasAuth = !!(sfData[mySalesforceVersion]?.refresh_token || sfData[lightningVersion]?.refresh_token)
        console.log('Check page - Has auth:', hasAuth, 'for domain:', mySalesforceVersion)
        
        if (hasAuth) {
            // Explicitly construct dashboard URL with org parameter
            const dashboardUrl = new URL('/dashboard', window.location.origin)
            dashboardUrl.searchParams.set('org', mySalesforceVersion)
            console.log('Check page - Redirecting to:', dashboardUrl.toString())
            window.location.replace(dashboardUrl.toString())
        } else {
            const authUrl = new URL('/auth', window.location.origin)
            authUrl.searchParams.set('connect', 'true')
            authUrl.searchParams.set('domain', domain)
            authUrl.searchParams.set('environment', domain.includes('sandbox') ? 'sandbox' : 'production')
            console.log('Check page - Redirecting to auth:', authUrl.toString())
            window.location.replace(authUrl.toString())
        }
    }, [searchParams])

    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Connecting...
        </div>
    )
}

export default function CheckAuth() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
            </div>
        }>
            <CheckAuthContent />
        </Suspense>
    )
}