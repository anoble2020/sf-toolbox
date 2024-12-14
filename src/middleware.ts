import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    console.log('Middleware running for:', request.nextUrl.pathname)
    
    const isAuthPath = request.nextUrl.pathname.startsWith('/auth')
    const isRootPath = request.nextUrl.pathname === '/'
    const hasRefreshToken = request.cookies.get('sf_refresh_token')
    const bypassAuth = process.env.BYPASS_AUTH === 'true'

    // Allow all auth-related paths to proceed
    if (isAuthPath || isRootPath) {
        return NextResponse.next()
    }

    // Only check auth for non-auth paths
    if (!hasRefreshToken && !bypassAuth) {
        console.log('Redirecting to auth from middleware - no refresh token')
        return NextResponse.redirect(new URL('/auth', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|auth_bg_design\\.jpg|icon_128_purp\\.png|.*\\.png$).*)',
    ],
}
