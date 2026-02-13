"use client"

import { useEffect, useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Save, RotateCcw, ChevronDown, ChevronUp, Settings, FileText, ImageIcon, Upload, Trash2 } from "lucide-react"
import type { CalendarConfig, Letter } from "@/lib/calendar-data"

export default function AdminPage() {
  const [config, setConfig] = useState<CalendarConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedLetter, setExpandedLetter] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"settings" | "letters" | "slideshow">("settings")
  const [slideshowImages, setSlideshowImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [deletingImage, setDeletingImage] = useState<string | null>(null)

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar")
      const data = await res.json()
      setConfig(data)
    } catch (err) {
      console.error("Failed to load config:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSlideshow = useCallback(async () => {
    try {
      const res = await fetch("/api/slideshow")
      const data = await res.json()
      setSlideshowImages(data.images || [])
    } catch (err) {
      console.error("Failed to load slideshow:", err)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
    fetchSlideshow()
  }, [fetchConfig, fetchSlideshow])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/slideshow", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.images) {
        setSlideshowImages(data.images)
      }
    } catch (err) {
      console.error("Failed to upload image:", err)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function handleImageDelete(filename: string) {
    setDeletingImage(filename)
    try {
      const res = await fetch("/api/slideshow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      })
      const data = await res.json()
      if (data.images) {
        setSlideshowImages(data.images)
      }
    } catch (err) {
      console.error("Failed to delete image:", err)
    } finally {
      setDeletingImage(null)
    }
  }

  async function handleSave() {
    if (!config) return
    setSaving(true)
    setSaved(false)

    try {
      await fetch("/api/calendar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error("Failed to save:", err)
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!config) return
    if (!confirm("This will reset all letters to placeholder text. Are you sure?")) return

    setSaving(true)
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset",
          startDate: config.startDate,
          totalDays: config.totalDays,
        }),
      })
      const data = await res.json()
      setConfig(data)
    } catch (err) {
      console.error("Failed to reset:", err)
    } finally {
      setSaving(false)
    }
  }

  function updateLetter(day: number, field: keyof Letter, value: string) {
    if (!config) return
    setConfig({
      ...config,
      letters: config.letters.map((l) =>
        l.day === day ? { ...l, [field]: field === "day" ? parseInt(value) : value } : l
      ),
    })
  }

  function handleTotalDaysChange(newTotal: number) {
    if (!config || newTotal < 1 || newTotal > 365) return

    const currentLetters = [...config.letters]
    let newLetters: Letter[]

    if (newTotal > currentLetters.length) {
      newLetters = [...currentLetters]
      for (let i = currentLetters.length; i < newTotal; i++) {
        const date = new Date(config.startDate)
        date.setDate(date.getDate() + i)
        newLetters.push({
          day: i + 1,
          title: `Day ${i + 1}`,
          body: `[Insert your letter for Day ${i + 1} here]\n\n[Write something meaningful for this day]\n\n[Add a memory, inside joke, or future dream]`,
          unlockDate: date.toISOString().split("T")[0],
        })
      }
    } else {
      newLetters = currentLetters.slice(0, newTotal)
    }

    setConfig({ ...config, totalDays: newTotal, letters: newLetters })
  }

  function handleStartDateChange(newDate: string) {
    if (!config) return
    const newLetters = config.letters.map((letter, i) => {
      const date = new Date(newDate)
      date.setDate(date.getDate() + i)
      return { ...letter, unlockDate: date.toISOString().split("T")[0] }
    })
    setConfig({ ...config, startDate: newDate, letters: newLetters })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading admin...</div>
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <h1 className="font-serif text-lg font-semibold text-foreground sm:text-xl">
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={saving}
              className="border-border text-foreground hover:bg-secondary"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-blush/80"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saving ? "Saving..." : saved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Tab Navigation */}
        <div className="mb-6 flex gap-1 rounded-lg bg-secondary p-1">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "settings"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={() => setActiveTab("letters")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "letters"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            Letters
          </button>
          <button
            onClick={() => setActiveTab("slideshow")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "slideshow"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            Slideshow
          </button>
        </div>

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
                Calendar Settings
              </h2>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="startDate" className="text-foreground">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={config.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="border-border bg-background text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Day 1 unlocks on this date. All other days follow sequentially.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="totalDays" className="text-foreground">Number of Days</Label>
                  <Input
                    id="totalDays"
                    type="number"
                    min={1}
                    max={365}
                    value={config.totalDays}
                    onChange={(e) => handleTotalDaysChange(parseInt(e.target.value) || 1)}
                    className="border-border bg-background text-foreground"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password" className="text-foreground">Site Password</Label>
                  <Input
                    id="password"
                    type="text"
                    placeholder="Leave empty for no password"
                    value={config.sitePassword}
                    onChange={(e) =>
                      setConfig({ ...config, sitePassword: e.target.value })
                    }
                    className="border-border bg-background text-foreground placeholder:text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Visitors must enter this password to view the calendar. Leave empty for open access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Letters Tab */}
        {activeTab === "letters" && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-300">
            {config.letters.map((letter) => (
              <div
                key={letter.day}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedLetter(expandedLetter === letter.day ? null : letter.day)
                  }
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 font-serif text-sm font-semibold text-foreground">
                      {letter.day}
                    </span>
                    <div>
                      <span className="font-medium text-foreground text-sm">
                        {letter.title}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {letter.unlockDate}
                      </span>
                    </div>
                  </div>
                  {expandedLetter === letter.day ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {expandedLetter === letter.day && (
                  <div className="flex flex-col gap-4 border-t border-border p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground">Title</Label>
                      <Input
                        value={letter.title}
                        onChange={(e) =>
                          updateLetter(letter.day, "title", e.target.value)
                        }
                        className="border-border bg-background text-foreground"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground">Unlock Date</Label>
                      <Input
                        type="date"
                        value={letter.unlockDate}
                        onChange={(e) =>
                          updateLetter(letter.day, "unlockDate", e.target.value)
                        }
                        className="border-border bg-background text-foreground"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground">Letter Body</Label>
                      <Textarea
                        value={letter.body}
                        onChange={(e) =>
                          updateLetter(letter.day, "body", e.target.value)
                        }
                        rows={8}
                        className="border-border bg-background text-foreground resize-y"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {/* Slideshow Tab */}
        {activeTab === "slideshow" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
                Slideshow Images
              </h2>
              <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                Upload images to display in the homepage slideshow. Images will shuffle and cycle every 15 seconds.
              </p>

              {/* Upload area */}
              <div className="mb-6">
                <Label htmlFor="slideshow-upload" className="sr-only">Upload image</Label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="slideshow-upload"
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary/50 ${
                      uploading ? "opacity-50 pointer-events-none" : "text-foreground"
                    }`}
                  >
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    {uploading ? "Uploading..." : "Choose image"}
                  </label>
                  <input
                    id="slideshow-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG, WebP, or GIF
                  </span>
                </div>
              </div>

              {/* Image grid */}
              {slideshowImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
                  <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No images uploaded yet</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    Upload images above to create a slideshow
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {slideshowImages.map((filename) => (
                    <div
                      key={filename}
                      className="group relative overflow-hidden rounded-lg border border-border bg-secondary/30"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/images/slideshow/${filename}`}
                        alt="Slideshow image"
                        className="aspect-square w-full object-cover"
                      />
                      <button
                        onClick={() => handleImageDelete(filename)}
                        disabled={deletingImage === filename}
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive disabled:opacity-50"
                        aria-label={`Delete ${filename}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {deletingImage === filename && (
                        <div className="absolute inset-0 flex items-center justify-center bg-card/70">
                          <span className="text-xs text-muted-foreground">Deleting...</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {slideshowImages.length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  {slideshowImages.length} image{slideshowImages.length !== 1 ? "s" : ""} uploaded. Hover over an image to delete it.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
