import { auth } from '@/auth'

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Daftar sub-routes utama yang dialihkan ke halaman depan (/)
  const pathsToRedirect = ['/spj', '/pegawai', '/users']

  if (pathsToRedirect.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    const url = new URL('/', req.nextUrl.origin)
    return Response.redirect(url)
  }

  return undefined
})

export const config = {
  matcher: ['/spj/:path*', '/pegawai/:path*', '/users/:path*']
}
