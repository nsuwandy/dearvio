import { NextRequest, NextResponse } from "next/server"
import { ADMIN_AUTH_COOKIE, isAdminAuthEnabled, isAdminPasswordValid, getAdminSessionToken } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!isAdminAuthEnabled()) {
      return NextResponse.json({ error: "Admin password is not configured." }, { status: 400 })
    }

    if (!isAdminPasswordValid(password || "")) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set({
      name: ADMIN_AUTH_COOKIE,
      value: getAdminSessionToken(),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
