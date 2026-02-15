export const ADMIN_AUTH_COOKIE = "admin-auth"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ""
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || ADMIN_PASSWORD

async function hash(value: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(value)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export function isAdminAuthEnabled(): boolean {
  return ADMIN_PASSWORD.length > 0
}

export function isAdminPasswordValid(input: string): boolean {
  if (!isAdminAuthEnabled()) return true
  return safeEqual(input, ADMIN_PASSWORD)
}

export async function getAdminSessionToken(): Promise<string> {
  if (!isAdminAuthEnabled()) return ""
  return await hash(`${ADMIN_PASSWORD}:${ADMIN_SESSION_SECRET}`)
}

export async function isAdminSessionValid(token: string | undefined): Promise<boolean> {
  if (!isAdminAuthEnabled()) return true
  if (!token) return false
  const expectedToken = await getAdminSessionToken()
  return safeEqual(token, expectedToken)
}
