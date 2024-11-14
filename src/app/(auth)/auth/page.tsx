"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const router = useRouter()
  
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="mb-4">
        <img src="/icon_128_purp.png" alt="toolkit" className="w-16 h-16" />
      </div>
      <h1 className="text-2xl font-semibold mb-8">apex toolkit</h1>
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
  )
} 