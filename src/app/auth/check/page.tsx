'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { storage } from '@/lib/storage'

export default function CheckAuth() {
    const searchParams = useSearchParams()
    
    useEffect(() => {
        const domain = searchParams.get('domain')
        console.log('Checking auth for domain:', domain)
        
        if (!domain) {
            console.error('No domain provided');
            return;
        }
        
        // Always perform the check
        const sfData = JSON.parse(localStorage.getItem('sf_data') || '{}')
        console.log('SF Data:', sfData)
        
        // Check for refresh token in the correct domain format
        const mySalesforceVersion = domain.replace('.lightning.force.com', '.my.salesforce.com')
        const lightningVersion = domain.replace('.my.salesforce.com', '.lightning.force.com')
        
        const hasAuth = !!(sfData[mySalesforceVersion]?.refresh_token || sfData[lightningVersion]?.refresh_token)
        console.log('Has auth:', hasAuth)
        
        if (hasAuth) {
            // Set as current domain (use the .my.salesforce.com version)
            storage.setCurrentDomain(mySalesforceVersion)
            console.log('Set current domain to:', mySalesforceVersion)
            // Redirect to dashboard
            window.location.replace('/dashboard')
        } else {
            // Redirect to auth
            const authUrl = new URL('/auth', window.location.origin)
            authUrl.searchParams.set('connect', 'true')
            authUrl.searchParams.set('domain', domain)
            authUrl.searchParams.set('environment', domain.includes('sandbox') ? 'sandbox' : 'production')
            window.location.replace(authUrl.toString())
        }
    }, [searchParams])

    return <div>Checking authentication...</div>
} 