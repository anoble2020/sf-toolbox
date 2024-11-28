"use client"

import { Button } from "@/components/ui/button"
import React, { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function AuthPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Salesforce OAuth configuration
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
      `response_type=code&` +
      `scope=refresh_token api web`
    
    window.location.href = authUrl
  }

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get("code")
    if (code) {
      // Exchange code for tokens
      fetch('/api/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })
      .then(response => response.json())
      .then(data => {
        localStorage.setItem('sf_refresh_token', data.tokens.refresh_token)
        localStorage.setItem('sf_user_info', JSON.stringify(data.user))
        router.push('/logs')
      })
      .catch(error => {
        console.error('Error during authentication:', error)
      })
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="mb-8">
        <img src="/icon_128.png" alt="Apex Toolbox" className="w-16 h-16" />
      </div>
      <h1 className="text-2xl font-semibold mb-8">Welcome to Apex Toolbox</h1>
      <Button 
        size="lg"
        onClick={handleLogin}
        className="font-medium"
      >
        Connect to Salesforce
      </Button>
    </div>
  )
} 