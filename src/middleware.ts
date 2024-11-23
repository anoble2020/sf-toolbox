import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isAuthPath = request.nextUrl.pathname.startsWith('/auth')
  const hasRefreshToken = request.cookies.get('sf_refresh_token')
  const bypassAuth = process.env.BYPASS_AUTH === 'true'

  if (request.nextUrl.pathname === '/logs' && (hasRefreshToken || bypassAuth)) {
    return NextResponse.next()
  }

  if (!isAuthPath && !hasRefreshToken && !bypassAuth) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  if (request.nextUrl.pathname === '/auth' && (hasRefreshToken || bypassAuth)) {
    return NextResponse.redirect(new URL('/logs', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except:
    '/((?!api|_next/static|_next/image|favicon.ico|icon_128_purp.png|.*\\.png$).*)'
  ],
} 
