"use client"

import { Button } from "@/components/ui/button"
import Image from 'next/image'

export default function AuthPage() {
  
  const SF_CLIENT_ID = process.env.NEXT_PUBLIC_SF_CLIENT_ID
  const SF_REDIRECT_URI = "http://localhost:3000/auth/callback"
  
  const handleLogin = () => {
    if (!SF_CLIENT_ID) {
      console.error("Missing SF_CLIENT_ID")
      return
    }
    
    const authUrl = `https://login.salesforce.com/services/oauth2/authorize?` +
      `client_id=${SF_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(SF_REDIRECT_URI)}&` +
      `response_type=code`

    console.log('Redirecting to:', authUrl)
    window.location.href = authUrl
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen">
      <div
        style={{
          backgroundImage: "url('/auth_bg_design.jpg')",
          backgroundRepeat: 'repeat',
          backgroundSize: 100,
          backgroundPosition: 'center',
          opacity: 0.1,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
      />
      <div className="relative w-full max-w-md space-y-8 z-10 p-6 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center">
          <Image
            src="/icon_128_purp.png"
            alt="SF Toolkit Logo"
            width={128}
            height={128}
            priority
          />
          <h1 className="text-2xl font-semibold mb-8">sf toolbox</h1>
          <div className="flex gap-4">
            <Button 
              size="lg"
              onClick={handleLogin}
              className="font-medium bg-gray-600"
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
              Sandbox
            </Button>
            <Button 
              size="lg"
              onClick={handleLogin}
              className="font-medium bg-gray-600"
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
              Production
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 