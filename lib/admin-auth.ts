import { createHash, timingSafeEqual } from "node:crypto"

export const ADMIN_AUTH_COOKIE = "admin-auth"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ""
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || ADMIN_PASSWORD

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

export function isAdminAuthEnabled(): boolean {
  return ADMIN_PASSWORD.length > 0
}

export function isAdminPasswordValid(input: string): boolean {
  if (!isAdminAuthEnabled()) return true
  return safeEqual(input, ADMIN_PASSWORD)
}

export function getAdminSessionToken(): string {
  if (!isAdminAuthEnabled()) return ""
  return hash(`${ADMIN_PASSWORD}:${ADMIN_SESSION_SECRET}`)
}

export function isAdminSessionValid(token: string | undefined): boolean {
  if (!isAdminAuthEnabled()) return true
  if (!token) return false
  return safeEqual(token, getAdminSessionToken())
}
