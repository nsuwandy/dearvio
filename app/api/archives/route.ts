import { NextResponse } from "next/server"
import { put, list } from "@vercel/blob"
import { getDefaultConfig, type CalendarConfig, type Archive } from "@/lib/calendar-data"
import { format, parse } from "date-fns"

const ARCHIVES_PREFIX = "archives/"
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
  try {
    const { blobs } = await list({ prefix: ARCHIVES_PREFIX })

    const archives: Omit<Archive, "config">[] = blobs
      .filter((blob) => blob.pathname.endsWith(".json"))
      .map((blob) => {
        const filename = blob.pathname.replace(ARCHIVES_PREFIX, "").replace(".json", "")
        const date = parse(filename, "yyyy-MM", new Date())
        return {
          id: filename,
          label: format(date, "MMMM yyyy"),
          archivedAt: new Date(blob.uploadedAt).toISOString(),
        }
      })
      .sort((a, b) => b.id.localeCompare(a.id))

    return NextResponse.json({ archives })
  } catch (err) {
    console.error("Error listing archives:", err)
    return NextResponse.json({ archives: [] })
  }
}

export async function POST() {
  try {
    const config = await readConfig()
    const archiveId = config.startDate.substring(0, 7) // "2026-03"
    const date = parse(archiveId, "yyyy-MM", new Date())
    const label = format(date, "MMMM yyyy")

    const archive: Archive = {
      id: archiveId,
      label,
      archivedAt: new Date().toISOString(),
      config,
    }

    await put(`${ARCHIVES_PREFIX}${archiveId}.json`, JSON.stringify(archive, null, 2), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    })

    // Reset the calendar to defaults
    const defaultConfig = getDefaultConfig()
    defaultConfig.startDate = config.startDate
    defaultConfig.totalDays = config.totalDays
    defaultConfig.sitePassword = config.sitePassword
    defaultConfig.letters = Array.from({ length: config.totalDays }, (_, i) => {
      const d = new Date(config.startDate)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split("T")[0]
      return {
        day: i + 1,
        title: `Day ${i + 1}`,
        body: `[Insert your letter for Day ${i + 1} here]\n\n[Write something meaningful for this day]\n\n[Add a memory, inside joke, or future dream]`,
        unlockDate: dateStr,
        audioTitle: "",
        audioUrl: "",
        audioAttachmentText: "",
      }
    })

    await writeConfig(defaultConfig)

    return NextResponse.json({ archive: { id: archive.id, label: archive.label, archivedAt: archive.archivedAt }, config: defaultConfig })
  } catch (err) {
    console.error("Error creating archive:", err)
    return NextResponse.json({ error: "Failed to create archive" }, { status: 500 })
  }
}
