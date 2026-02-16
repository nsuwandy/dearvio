import { NextRequest, NextResponse } from "next/server"
import { del, put } from "@vercel/blob"

const AUDIO_PREFIX = "letter-audio/"

function isManagedAudioUrl(url: string): boolean {
  return typeof url === "string" && url.includes(`/${AUDIO_PREFIX}`)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const previousUrl = formData.get("previousUrl")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("audio/")) {
      return NextResponse.json({ error: "Invalid file type. Please upload audio." }, { status: 400 })
    }

    const ext = file.name.split(".").pop() || "webm"
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const blob = await put(`${AUDIO_PREFIX}${filename}`, file, {
      access: "public",
      addRandomSuffix: false,
    })

    if (typeof previousUrl === "string" && isManagedAudioUrl(previousUrl)) {
      try {
        await del(previousUrl)
      } catch (err) {
        console.error("Failed to delete previous audio blob:", err)
      }
    }

    return NextResponse.json({ url: blob.url, pathname: blob.pathname })
  } catch (err) {
    console.error("Audio upload error:", err)
    return NextResponse.json({ error: "Audio upload failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body as { url?: string }

    if (!url || !isManagedAudioUrl(url)) {
      return NextResponse.json({ error: "Invalid audio URL" }, { status: 400 })
    }

    await del(url)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Audio delete error:", err)
    return NextResponse.json({ error: "Audio delete failed" }, { status: 500 })
  }
}
