import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { getDefaultConfig, type CalendarConfig } from "@/lib/calendar-data"

const DATA_FILE = path.join(process.cwd(), "data", "calendar.json")

async function ensureDataDir() {
  const dir = path.dirname(DATA_FILE)
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

async function readConfig(): Promise<CalendarConfig> {
  try {
    await fs.access(DATA_FILE)
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    return JSON.parse(raw)
  } catch {
    const config = getDefaultConfig()
    await ensureDataDir()
    await fs.writeFile(DATA_FILE, JSON.stringify(config, null, 2))
    return config
  }
}

async function writeConfig(config: CalendarConfig) {
  await ensureDataDir()
  await fs.writeFile(DATA_FILE, JSON.stringify(config, null, 2))
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
