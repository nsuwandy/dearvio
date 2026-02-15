import { NextRequest, NextResponse } from "next/server"
import { ADMIN_AUTH_COOKIE, isAdminAuthEnabled, isAdminSessionValid } from "@/lib/admin-auth"

function isProtectedApiRoute(pathname: string, method: string): boolean {
  if (pathname.startsWith("/api/admin/")) return false

  if (pathname.startsWith("/api/calendar") && method !== "GET") return true
  if (pathname.startsWith("/api/slideshow") && method !== "GET") return true
  if (pathname.startsWith("/api/archives") && method !== "GET") return true

  return false
}

export function middleware(request: NextRequest) {
  if (!isAdminAuthEnabled()) {
    return NextResponse.next()
  }

  const { pathname, search } = request.nextUrl
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login"
  const isProtectedApi = isProtectedApiRoute(pathname, request.method)

  if (!isAdminPage && !isProtectedApi) {
    return NextResponse.next()
  }

  const token = request.cookies.get(ADMIN_AUTH_COOKIE)?.value
  if (isAdminSessionValid(token)) {
    return NextResponse.next()
  }

  if (isProtectedApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = request.nextUrl.clone()
  url.pathname = "/admin/login"
  url.searchParams.set("from", `${pathname}${search}`)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
}
