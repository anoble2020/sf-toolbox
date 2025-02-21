import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'

export async function POST(request: Request) {
    try {
        const { domain } = await request.json()
        
        // Check if we have a refresh token for this domain
        const domainData = storage.getFromDomain(domain, 'refresh_token')
        
        return NextResponse.json({
            authenticated: !!domainData
        })
    } catch (error) {
        console.error('Error checking domain:', error)
        return NextResponse.json({ 
            authenticated: false,
            error: 'Failed to check domain authentication'
        })
    }
} 