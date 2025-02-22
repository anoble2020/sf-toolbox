'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { storage } from '@/lib/storage'

export function OrgContextWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        // Skip this for auth-related pages
        if (pathname.startsWith('/auth')) {
            return
        }

        const currentParams = new URLSearchParams(searchParams.toString())
        const orgFromUrl = currentParams.get('org')
        const currentDomain = storage.getCurrentDomain()

        // If we have a domain but it's not in the URL, add it
        if (currentDomain && !orgFromUrl) {
            currentParams.set('org', currentDomain)
            const newUrl = `${pathname}?${currentParams.toString()}`
            router.replace(newUrl)
        }
    }, [pathname, searchParams, router])

    return <>{children}</>
} 