'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { storage } from '@/lib/storage'

export default function RootPage() {
    const router = useRouter()

    useEffect(() => {
        const currentDomain = storage.getCurrentDomain();
        const hasRefreshToken = currentDomain && storage.getFromDomain(currentDomain, 'refresh_token');
        const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';
    
        if (hasRefreshToken || bypassAuth) {
            router.push('/dashboard');
        } else {
            router.push('/auth');
        }
    }, [router])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading...</span>
        </div>
    )
}