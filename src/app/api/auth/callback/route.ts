import { NextResponse } from "next/server"

// This route is deprecated - we should remove it and use /api/auth/token instead
export async function POST(request: Request) {
  return NextResponse.redirect(new URL('/api/auth/token', request.url))
} 