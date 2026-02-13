import { NextRequest, NextResponse } from "next/server"
import { put, list } from "@vercel/blob"
import { getDefaultConfig, type CalendarConfig } from "@/lib/calendar-data"

const BLOB_CONFIG_PATH = "calendar-config.json"

async function readConfig(): Promise<CalendarConfig> {
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

async function writeConfig(config: CalendarConfig) {
  await put(BLOB_CONFIG_PATH, JSON.stringify(config, null, 2), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  })
}

export async function GET() {
  const config = await readConfig()
  return NextResponse.json(config)
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const config = await readConfig()

    if (body.totalDays !== undefined) config.totalDays = body.totalDays
    if (body.startDate !== undefined) config.startDate = body.startDate
    if (body.sitePassword !== undefined) config.sitePassword = body.sitePassword
    if (body.letters !== undefined) config.letters = body.letters

    await writeConfig(config)
    return NextResponse.json(config)
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.action === "reset") {
      const config = getDefaultConfig()
      if (body.startDate) config.startDate = body.startDate
      if (body.totalDays) {
        config.totalDays = body.totalDays
        config.letters = Array.from({ length: body.totalDays }, (_, i) => {
          const date = new Date(config.startDate)
          date.setDate(date.getDate() + i)
          const dateStr = date.toISOString().split("T")[0]
          return {
            day: i + 1,
            title: `Day ${i + 1}`,
            body: `[Insert your letter for Day ${i + 1} here]\n\n[Write something meaningful for this day]\n\n[Add a memory, inside joke, or future dream]`,
            unlockDate: dateStr,
          }
        })
      }
      await writeConfig(config)
      return NextResponse.json(config)
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
