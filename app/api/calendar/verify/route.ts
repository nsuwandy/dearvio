import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { getDefaultConfig } from "@/lib/calendar-data"

const DATA_FILE = path.join(process.cwd(), "data", "calendar.json")

async function readConfig() {
  try {
    await fs.access(DATA_FILE)
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    return JSON.parse(raw)
  } catch {
    return getDefaultConfig()
  }
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
