'use client'

import { Suspense, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function AuthContent() {
    const searchParams = useSearchParams()
    const isConnecting = searchParams.get('connect') === 'true'
    const environment = searchParams.get('environment')
    const [customDomain, setCustomDomain] = useState('')
    const [showCustomDomain, setShowCustomDomain] = useState(false)

    const handleLogin = async (envType: 'sandbox' | 'production') => {
        try {

            let loginDomain = ''
            if (customDomain) {
                // Remove any protocol and trailing slashes
                loginDomain = customDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
            } else {
                // Use default domains
                loginDomain = envType === 'sandbox' ? 'test.salesforce.com' : 'login.salesforce.com'
            }

            const params = new URLSearchParams({
                environment: envType,
                ...(isConnecting && { connect: 'true' }),
                domain: loginDomain
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
        <div className="container relative min-h-screen flex items-center justify-center lg:max-w-none lg:px-0 bg-gradient-to-b from-white to-slate-200 dark:from-slate-900 dark:to-black">
            <div className="w-full max-w-xl p-8 rounded-2xl bg-gradient-to-b from-white to-slate-150 text-slate-900 dark:from-slate-700/95 dark:to-slate-900/95 backdrop-blur-sm shadow-xl">
                <div className="flex flex-col items-center text-slate-900 dark:text-white">
                    <Image src="/icon_128_purp.png" alt="SF Toolkit Logo" width={128} height={128} priority />
                    <h1 className="text-2xl font-semibold mb-2">
                        {isConnecting ? 'Connect New Organization' : 'sf toolbox'}
                    </h1>
                    <div className="flex flex-col items-center mb-12 font-mono text-sm whitespace-nowrap">
                        the open-source Salesforce developer console replacement
                    </div>
                    <div className="flex flex-col items-center mb-6 text-sm">
                        Connect your Salesforce org below to get started:
                    </div>

                    <div className="flex gap-4">
                        <Button 
                            size="lg" 
                            onClick={() => handleLogin('sandbox')} 
                            className="font-medium text-slate-900 dark:text-white bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-700"
                            disabled={environment === 'production'}
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
                            <div className="dark:text-white">
                                {environment === 'sandbox' ? 'Connect Sandbox' : 'Sandbox'}
                            </div>
                        </Button>
                        <Button 
                            size="lg" 
                            onClick={() => handleLogin('production')} 
                            className="font-medium text-slate-900 dark:text-white bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-700"
                            disabled={environment === 'sandbox'}
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
                            <div className="dark:text-white">
                                {environment === 'production' ? 'Connect Production' : 'Production'}
                            </div>
                        </Button>
                    </div>

                    {showCustomDomain ? (
                        <div className="mt-4 w-full max-w-sm">
                            <Input
                                type="text"
                                placeholder="my-domain.my.salesforce.com"
                                value={customDomain}
                                onChange={(e) => setCustomDomain(e.target.value)}
                                className="mb-2"
                            />
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowCustomDomain(false)}
                                className="w-full"
                            >
                                Use Standard Login
                            </Button>
                        </div>
                    ) : (
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowCustomDomain(true)}
                            className="mt-4"
                        >
                            Use Custom Domain
                        </Button>
                    )}

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
