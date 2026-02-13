import { NextResponse } from "next/server"
import { list } from "@vercel/blob"
import type { Archive } from "@/lib/calendar-data"

const ARCHIVES_PREFIX = "archives/"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { blobs } = await list({ prefix: `${ARCHIVES_PREFIX}${id}.json` })

    if (blobs.length === 0) {
      return NextResponse.json({ error: "Archive not found" }, { status: 404 })
    }

    const res = await fetch(blobs[0].url)
    const archive: Archive = await res.json()
    return NextResponse.json(archive)
  } catch (err) {
    console.error("Error fetching archive:", err)
    return NextResponse.json({ error: "Failed to fetch archive" }, { status: 500 })
  }
}
