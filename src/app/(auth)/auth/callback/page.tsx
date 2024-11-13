"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

console.log('CallbackPage component defined')

export default function CallbackPage() {
  console.log('CallbackPage render')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    console.log('CallbackPage mounted')
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    
    if (error) {
      console.error('OAuth Error:', error)
      console.error('Error Description:', searchParams.get("error_description"))
      router.push('/auth')
      return
    }

    if (!code) {
      console.error('No auth code received')
      router.push('/auth')
      return
    }

    console.log('Received auth code, exchanging for tokens...', code);

    fetch(`${window.location.origin}/api/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })
    .then(async response => {
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Token endpoint error:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.tokens?.refresh_token) {
        // Store in localStorage for client-side access
        localStorage.setItem('sf_refresh_token', data.tokens.refresh_token)
        localStorage.setItem('sf_user_info', JSON.stringify(data.user))
        
        // Store in cookies for server-side access
        document.cookie = `sf_refresh_token=${data.tokens.refresh_token}; path=/`
        
        console.log('Stored tokens, redirecting to /logs...')
        router.push('/logs')
      } else {
        console.error('No refresh token in response:', data)
        router.push('/auth')
      }
    })
    .catch(error => {
      console.error('Fetch error:', error);
      router.push('/auth');
    })
  }, 
  [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Authenticating...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  )
} 