import { auth } from '@/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isSpjRoute = req.nextUrl.pathname.startsWith('/spj')

  if (isSpjRoute && !isLoggedIn) {
    const url = new URL('/login', req.nextUrl.origin)
    url.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return Response.redirect(url)
  }

  return undefined
})

export const config = {
  matcher: ['/spj/:path*']
}
