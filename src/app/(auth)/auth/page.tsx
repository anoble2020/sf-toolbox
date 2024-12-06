'use client'

import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function AuthPage() {

    const handleLogin = async (environment: string) => {
        try {
            const response = await fetch(`/api/auth/authorize?environment=${environment}`)
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
        <div className="relative flex flex-col items-center justify-center min-h-screen">
            <div
                style={{
                    backgroundImage: "url('/icon_128.png')",
                    backgroundRepeat: 'repeat',
                    backgroundSize: 50,
                    backgroundPosition: 'center',
                    opacity: 0.2,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                }}
            />
            <div className="relative w-full max-w-md space-y-8 z-10 p-6 bg-background rounded-lg shadow-lg">
                <div className="flex flex-col items-center">
                    <Image src="/icon_128_purp.png" alt="SF Toolkit Logo" width={128} height={128} priority />
                    <h1 className="text-2xl font-semibold mb-8">sf toolbox</h1>
                    <div className="flex gap-4">
                        <Button size="lg" onClick={() => handleLogin('sandbox')} className="font-medium bg-slate-600 dark:bg-background">
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
                            Sandbox
                        </Button>
                        <Button size="lg" onClick={() => handleLogin('production')} className="font-medium bg-slate-600 dark:bg-background">
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
                            Production
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
