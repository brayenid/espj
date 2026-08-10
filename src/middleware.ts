import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Daftar sub-routes utama yang harus dialihkan ke halaman depan (/)
  const pathsToRedirect = ['/spj', '/pegawai', '/users']
  
  if (pathsToRedirect.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/spj/:path*', '/pegawai/:path*', '/users/:path*']
}
