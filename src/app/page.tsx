'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function RootPage() {
    const router = useRouter()

    useEffect(() => {
        const refreshToken = localStorage.getItem('sf_refresh_token')
        const sessionToken = localStorage.getItem('sf_session_token')
        const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

        if (refreshToken || sessionToken || bypassAuth) {
            router.push('/dashboard')
        } else {
            router.push('/auth')
        }
    }, [router])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading...</span>
        </div>
    )
}