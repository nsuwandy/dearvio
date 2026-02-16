"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Save, RotateCcw, ChevronDown, ChevronUp, Settings, FileText, ImageIcon, Upload, Trash2, Archive, Pencil, FolderArchive, Plus, Check, X, Mic, Square } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { CalendarConfig, Letter, Archive as ArchiveType } from "@/lib/calendar-data"

export default function AdminPage() {
  const [config, setConfig] = useState<CalendarConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedLetter, setExpandedLetter] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"settings" | "letters" | "slideshow" | "archives">("settings")
  const [slideshowImages, setSlideshowImages] = useState<{ url: string; filename: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [deletingImage, setDeletingImage] = useState<string | null>(null)
  const [archives, setArchives] = useState<Omit<ArchiveType, "config">[]>([])
  const [archivesLoading, setArchivesLoading] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [archiveName, setArchiveName] = useState("")
  const [renamingArchive, setRenamingArchive] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [deletingArchive, setDeletingArchive] = useState<string | null>(null)
  const [recordingDay, setRecordingDay] = useState<number | null>(null)
  const [uploadingAudioDay, setUploadingAudioDay] = useState<number | null>(null)
  const [recordingError, setRecordingError] = useState("")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

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

  const fetchArchives = useCallback(async () => {
    setArchivesLoading(true)
    try {
      const res = await fetch("/api/archives")
      const data = await res.json()
      setArchives(data.archives || [])
    } catch (err) {
      console.error("Failed to load archives:", err)
    } finally {
      setArchivesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
    fetchSlideshow()
    fetchArchives()
  }, [fetchConfig, fetchSlideshow, fetchArchives])

  function stopMediaTracks() {
    if (!mediaStreamRef.current) return
    mediaStreamRef.current.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
  }

  function cleanupRecorder() {
    mediaRecorderRef.current = null
    chunksRef.current = []
    stopMediaTracks()
  }

  useEffect(() => {
    return () => {
      cleanupRecorder()
    }
  }, [])

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

  async function handleImageDelete(url: string) {
    setDeletingImage(url)
    try {
      const res = await fetch("/api/slideshow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
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

  function updateLetterFields(day: number, updates: Partial<Letter>) {
    if (!config) return
    setConfig({
      ...config,
      letters: config.letters.map((l) => (l.day === day ? { ...l, ...updates } : l)),
    })
  }

  async function uploadRecordedAudio(day: number, blob: Blob, previousUrl?: string) {
    const fileExt = blob.type.includes("mp4") ? "m4a" : "webm"
    const file = new File([blob], `letter-${day}-${Date.now()}.${fileExt}`, {
      type: blob.type || "audio/webm",
    })
    const formData = new FormData()
    formData.append("file", file)
    if (previousUrl) {
      formData.append("previousUrl", previousUrl)
    }

    const res = await fetch("/api/letter-audio", {
      method: "POST",
      body: formData,
    })

    if (!res.ok) {
      throw new Error("Failed to upload recording")
    }

    const data = await res.json()
    if (!data?.url || typeof data.url !== "string") {
      throw new Error("Invalid upload response")
    }
    return data.url as string
  }

  async function startRecording(day: number, previousAudioUrl?: string) {
    if (recordingDay !== null) return
    setRecordingError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ]
      const supportedType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = supportedType
        ? new MediaRecorder(stream, { mimeType: supportedType })
        : new MediaRecorder(stream)

      mediaRecorderRef.current = recorder
      chunksRef.current = []
      setRecordingDay(day)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onerror = () => {
        setRecordingError("Recording failed. Please try again.")
      }

      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
          if (blob.size > 0) {
            setUploadingAudioDay(day)
            const audioUrl = await uploadRecordedAudio(day, blob, previousAudioUrl)
            updateLetterFields(day, { audioUrl, audioDataUrl: "" })
          }
        } catch {
          setRecordingError("Failed to upload recording. Please try again.")
        } finally {
          setUploadingAudioDay(null)
          cleanupRecorder()
          setRecordingDay(null)
        }
      }

      recorder.start()
    } catch {
      cleanupRecorder()
      setRecordingDay(null)
      setRecordingError("Microphone access was denied or unavailable.")
    }
  }

  function stopRecording() {
    if (!mediaRecorderRef.current) return
    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
      return
    }
    cleanupRecorder()
    setRecordingDay(null)
  }

  async function handleRemoveAudio(day: number, url?: string) {
    setRecordingError("")

    if (url) {
      try {
        await fetch("/api/letter-audio", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        })
      } catch (err) {
        console.error("Failed to delete audio from blob:", err)
      }
    }

    updateLetterFields(day, { audioTitle: "", audioUrl: "", audioDataUrl: "", audioAttachmentText: "" })
  }

  async function handleCreateArchive() {
    if (!config) return
    setArchiving(true)
    try {
      const res = await fetch("/api/archives", { method: "POST" })
      const data = await res.json()
      if (data.config) {
        setConfig(data.config)
      }
      // If a custom name was provided, rename the archive
      if (archiveName.trim() && data.archive?.id) {
        await fetch(`/api/archives/${data.archive.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: archiveName.trim() }),
        })
      }
      setArchiveName("")
      await fetchArchives()
    } catch (err) {
      console.error("Failed to create archive:", err)
    } finally {
      setArchiving(false)
    }
  }

  async function handleRenameArchive(id: string) {
    if (!renameValue.trim()) return
    try {
      await fetch(`/api/archives/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: renameValue.trim() }),
      })
      setRenamingArchive(null)
      setRenameValue("")
      await fetchArchives()
    } catch (err) {
      console.error("Failed to rename archive:", err)
    }
  }

  async function handleDeleteArchive(id: string) {
    setDeletingArchive(id)
    try {
      await fetch(`/api/archives/${id}`, { method: "DELETE" })
      await fetchArchives()
    } catch (err) {
      console.error("Failed to delete archive:", err)
    } finally {
      setDeletingArchive(null)
    }
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
          audioTitle: "",
          audioUrl: "",
          audioAttachmentText: "",
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
          <button
            onClick={() => setActiveTab("archives")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "archives"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Archive className="h-4 w-4" />
            Archives
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

                    <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background/40 p-3">
                      <Label className="text-foreground">Audio Recording</Label>
                      <p className="text-xs text-muted-foreground">
                        Record a voice message for this letter. Save changes after recording.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {recordingDay === letter.day ? (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={stopRecording}
                            disabled={uploadingAudioDay === letter.day}
                          >
                            <Square className="mr-1.5 h-3.5 w-3.5" />
                            Stop Recording
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              startRecording(letter.day, letter.audioUrl || letter.audioDataUrl)
                            }
                            disabled={recordingDay !== null || uploadingAudioDay === letter.day}
                            className="bg-primary text-primary-foreground hover:bg-blush/80"
                          >
                            <Mic className="mr-1.5 h-3.5 w-3.5" />
                            {uploadingAudioDay === letter.day ? "Uploading..." : "Record Audio"}
                          </Button>
                        )}

                        {(letter.audioUrl || letter.audioDataUrl) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveAudio(letter.day, letter.audioUrl)}
                            className="border-border text-foreground hover:bg-secondary"
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Remove Audio
                          </Button>
                        )}
                      </div>

                      {recordingDay === letter.day && (
                        <p className="text-xs font-medium text-blush">Recording in progress...</p>
                      )}

                      {recordingError && (
                        <p className="text-xs text-destructive">{recordingError}</p>
                      )}

                      {(letter.audioUrl || letter.audioDataUrl) && (
                        <audio controls src={letter.audioUrl || letter.audioDataUrl} className="w-full" />
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground">Audio Title</Label>
                      <Input
                        value={letter.audioTitle || ""}
                        onChange={(e) =>
                          updateLetter(letter.day, "audioTitle", e.target.value)
                        }
                        placeholder="Example: A message from me"
                        className="border-border bg-background text-foreground"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground">Audio Attachment Text (Expandable)</Label>
                      <Textarea
                        value={letter.audioAttachmentText || ""}
                        onChange={(e) =>
                          updateLetter(letter.day, "audioAttachmentText", e.target.value)
                        }
                        rows={4}
                        placeholder="Optional message shown in an expandable section below the audio player."
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
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG, WebP, GIF, or HEIC
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
                  {slideshowImages.map((image) => (
                    <div
                      key={image.url}
                      className="group relative overflow-hidden rounded-lg border border-border bg-secondary/30"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt="Slideshow image"
                        className="aspect-square w-full object-cover"
                      />
                      <button
                        onClick={() => handleImageDelete(image.url)}
                        disabled={deletingImage === image.url}
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive disabled:opacity-50"
                        aria-label={`Delete ${image.filename}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {deletingImage === image.url && (
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

        {/* Archives Tab */}
        {activeTab === "archives" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Create Archive */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h2 className="mb-2 font-serif text-lg font-semibold text-foreground">
                Create Archive
              </h2>
              <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                Snapshot the current letters into an archive folder. This will reset all letters to placeholder text.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor="archiveName" className="text-foreground">Folder Name</Label>
                  <Input
                    id="archiveName"
                    type="text"
                    placeholder={new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    value={archiveName}
                    onChange={(e) => setArchiveName(e.target.value)}
                    className="border-border bg-background text-foreground placeholder:text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use the default month name.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      disabled={archiving}
                      className="bg-primary text-primary-foreground hover:bg-blush/80"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      {archiving ? "Archiving..." : "Create Archive"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-serif text-foreground">Archive current letters?</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground leading-relaxed">
                        This will snapshot all current letters into an archive folder and reset every letter to placeholder text. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-border text-foreground hover:bg-secondary">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCreateArchive}
                        className="bg-primary text-primary-foreground hover:bg-blush/80"
                      >
                        Archive &amp; Reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Archives List */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
                Saved Archives
              </h2>

              {archivesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-pulse text-muted-foreground text-sm">Loading archives...</div>
                </div>
              ) : archives.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
                  <FolderArchive className="mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No archives yet</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    Create your first archive above
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {archives.map((archive) => (
                    <div
                      key={archive.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-background p-4 transition-colors hover:bg-secondary/30"
                    >
                      <div className="flex-1 min-w-0">
                        {renamingArchive === archive.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRenameArchive(archive.id)
                                if (e.key === "Escape") {
                                  setRenamingArchive(null)
                                  setRenameValue("")
                                }
                              }}
                              className="h-8 border-border bg-card text-foreground text-sm"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRenameArchive(archive.id)}
                              className="h-8 w-8 p-0 text-foreground hover:bg-secondary"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setRenamingArchive(null); setRenameValue("") }}
                              className="h-8 w-8 p-0 text-muted-foreground hover:bg-secondary"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="font-serif font-medium text-foreground truncate">{archive.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Archived {new Date(archive.archivedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                            </p>
                          </>
                        )}
                      </div>

                      {renamingArchive !== archive.id && (
                        <div className="flex items-center gap-1 ml-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRenamingArchive(archive.id)
                              setRenameValue(archive.label)
                            }}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Rename archive</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={deletingArchive === archive.id}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="sr-only">Delete archive</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-serif text-foreground">Delete &ldquo;{archive.label}&rdquo;?</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground leading-relaxed">
                                  This will permanently delete this archive and all its letters. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-border text-foreground hover:bg-secondary">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteArchive(archive.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
