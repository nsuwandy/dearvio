import { NextResponse } from "next/server"
import { list, del, put } from "@vercel/blob"
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { blobs } = await list({ prefix: `${ARCHIVES_PREFIX}${id}.json` })

    if (blobs.length === 0) {
      return NextResponse.json({ error: "Archive not found" }, { status: 404 })
    }

    await del(blobs[0].url)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting archive:", err)
    return NextResponse.json({ error: "Failed to delete archive" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { label } = await request.json()

    if (!label || typeof label !== "string") {
      return NextResponse.json({ error: "Label is required" }, { status: 400 })
    }

    const { blobs } = await list({ prefix: `${ARCHIVES_PREFIX}${id}.json` })

    if (blobs.length === 0) {
      return NextResponse.json({ error: "Archive not found" }, { status: 404 })
    }

    const res = await fetch(blobs[0].url)
    const archive: Archive = await res.json()
    archive.label = label.trim()

    await put(`${ARCHIVES_PREFIX}${id}.json`, JSON.stringify(archive, null, 2), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    })

    return NextResponse.json({ id: archive.id, label: archive.label, archivedAt: archive.archivedAt })
  } catch (err) {
    console.error("Error updating archive:", err)
    return NextResponse.json({ error: "Failed to update archive" }, { status: 500 })
  }
}
