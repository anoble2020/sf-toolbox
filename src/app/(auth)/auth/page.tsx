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
    <div className="flex flex-col items-center justify-center min-h-screen"
      >
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Image
            src="/icon_128_purp.png"
            alt="SF Toolkit Logo"
            width={128}
            height={128}
            priority
          />
          <h1 className="text-2xl font-semibold mb-8">sf toolkit</h1>
          <div className="flex gap-4">
            <Button 
              size="lg"
              onClick={handleLogin}
              className="font-medium"
            >
              Sandbox
            </Button>
            <Button 
              size="lg"
              onClick={handleLogin}
              className="font-medium"
            >
              Production
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 