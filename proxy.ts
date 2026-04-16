import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

const PUBLIC_ROUTES = new Set(["/", "/login", "/register"])
const AUTH_ROUTES = new Set(["/login", "/register"])
const PUBLIC_API_PREFIXES = ["/api/auth"]

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isPublicApiRoute = PUBLIC_API_PREFIXES.some((prefix) =>
    nextUrl.pathname.startsWith(prefix)
  )
  if (isPublicApiRoute) return NextResponse.next()

  if (isLoggedIn && AUTH_ROUTES.has(nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin))
  }

  const isPublicRoute = PUBLIC_ROUTES.has(nextUrl.pathname)
  if (isPublicRoute) return NextResponse.next()

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
