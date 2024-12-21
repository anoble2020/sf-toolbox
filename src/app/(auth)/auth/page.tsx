'use client'

import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function AuthContent() {
    const searchParams = useSearchParams()
    const isConnecting = searchParams.get('connect') === 'true'
    const environment = searchParams.get('environment')

    const handleLogin = async (envType: 'sandbox' | 'production') => {
        try {
            const params = new URLSearchParams({
                environment: envType,
                ...(isConnecting && { connect: 'true' })
            })
            
            const response = await fetch(`/api/auth/authorize?${params}`)
            const { authUrl } = await response.json()
            
            if (!authUrl) {
                console.error('Failed to get authorization URL')
                return
            }

            window.location.href = authUrl
        } catch (error) {
            console.error('Failed to initiate login:', error)
        }
    }

    return (
        <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
            <div className="flex flex-col items-center">
                <Image src="/icon_128_purp.png" alt="SF Toolkit Logo" width={128} height={128} priority />
                <h1 className="text-2xl font-semibold mb-8">
                    {isConnecting ? 'Connect New Organization' : 'sf toolbox'}
                </h1>
                <div className="flex gap-4">
                    <Button 
                        size="lg" 
                        onClick={() => handleLogin('sandbox')} 
                        className="font-medium bg-slate-600 dark:bg-background"
                    >
                        <Image
                            src="/sf_cloud_logo.png"
                            alt="SF Logo"
                            width={30}
                            height={30}
                            priority
                            style={{
                                paddingTop: 10,
                                paddingBottom: 10,
                            }}
                        />
                        {environment === 'sandbox' ? 'Connect Sandbox' : 'Sandbox'}
                    </Button>
                    <Button 
                        size="lg" 
                        onClick={() => handleLogin('production')} 
                        className="font-medium bg-slate-600 dark:bg-background"
                    >
                        <Image
                            src="/sf_cloud_logo.png"
                            alt="SF Logo"
                            width={30}
                            height={30}
                            priority
                            style={{
                                paddingTop: 10,
                                paddingBottom: 10,
                            }}
                        />
                        {environment === 'production' ? 'Connect Production' : 'Production'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default function AuthPage() {
    return (
        <Suspense 
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading...</span>
                </div>
            }
        >
            <AuthContent />
        </Suspense>
    )
}
