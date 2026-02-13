import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const DATA_FILE = path.join(process.cwd(), "data", "slideshow.json")
const UPLOAD_DIR = path.join(process.cwd(), "public", "images", "slideshow")

interface SlideshowData {
  images: string[]
}

async function ensureDir(dir: string) {
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

async function readData(): Promise<SlideshowData> {
  try {
    await fs.access(DATA_FILE)
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    return JSON.parse(raw)
  } catch {
    const data: SlideshowData = { images: [] }
    await ensureDir(path.dirname(DATA_FILE))
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
    return data
  }
}

async function writeData(data: SlideshowData) {
  await ensureDir(path.dirname(DATA_FILE))
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
}

export async function GET() {
  const data = await readData()
  return NextResponse.json(data)
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

    await ensureDir(UPLOAD_DIR)

    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer)

    const data = await readData()
    data.images.push(filename)
    await writeData(data)

    return NextResponse.json({ filename, images: data.images })
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { filename } = body

    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }

    // Prevent path traversal
    if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }

    const filePath = path.join(UPLOAD_DIR, filename)
    try {
      await fs.unlink(filePath)
    } catch {
      // File may already be deleted, continue to remove from data
    }

    const data = await readData()
    data.images = data.images.filter((img) => img !== filename)
    await writeData(data)

    return NextResponse.json({ images: data.images })
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
