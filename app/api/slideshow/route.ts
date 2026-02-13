import { NextRequest, NextResponse } from "next/server"
import { put, del, list } from "@vercel/blob"

const SLIDESHOW_PREFIX = "slideshow/"

export async function GET() {
  try {
    const { blobs } = await list({ prefix: SLIDESHOW_PREFIX })
    const images = blobs.map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      filename: blob.pathname.replace(SLIDESHOW_PREFIX, ""),
    }))
    return NextResponse.json({ images })
  } catch (err) {
    console.error("Error listing slideshow images:", err)
    return NextResponse.json({ images: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: jpg, png, webp, gif" },
        { status: 400 }
      )
    }

    const ext = file.name.split(".").pop() || "jpg"
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const blob = await put(`${SLIDESHOW_PREFIX}${filename}`, file, {
      access: "public",
    })

    // Re-fetch the full list
    const { blobs } = await list({ prefix: SLIDESHOW_PREFIX })
    const images = blobs.map((b) => ({
      url: b.url,
      pathname: b.pathname,
      filename: b.pathname.replace(SLIDESHOW_PREFIX, ""),
    }))

    return NextResponse.json({ uploaded: blob.url, images })
  } catch (err) {
    console.error("Upload error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    await del(url)

    // Re-fetch the full list
    const { blobs } = await list({ prefix: SLIDESHOW_PREFIX })
    const images = blobs.map((b) => ({
      url: b.url,
      pathname: b.pathname,
      filename: b.pathname.replace(SLIDESHOW_PREFIX, ""),
    }))

    return NextResponse.json({ images })
  } catch (err) {
    console.error("Delete error:", err)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
