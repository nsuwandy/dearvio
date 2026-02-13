import { NextRequest, NextResponse } from "next/server"
import { list } from "@vercel/blob"
import { getDefaultConfig } from "@/lib/calendar-data"

const BLOB_CONFIG_PATH = "calendar-config.json"

async function readConfig() {
  try {
    const { blobs } = await list({ prefix: BLOB_CONFIG_PATH })
    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url)
      return await res.json()
    }
  } catch (err) {
    console.error("Error reading config from blob:", err)
  }
  return getDefaultConfig()
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    const config = await readConfig()

    if (!config.sitePassword || config.sitePassword === password) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
