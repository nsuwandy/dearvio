"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { ArrowLeft, FolderArchive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CalendarGrid } from "@/components/calendar-grid"
import { FloatingHearts } from "@/components/floating-hearts"
import type { Archive } from "@/lib/calendar-data"

export default function ArchivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [archive, setArchive] = useState<Archive | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchArchive() {
      try {
        const res = await fetch(`/api/archives/${id}`)
        if (!res.ok) {
          setError("Archive not found.")
          return
        }
        const data: Archive = await res.json()
        setArchive(data)
      } catch {
        setError("Something went wrong. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchArchive()
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-blush">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      </div>
    )
  }

  if (error || !archive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-700">
          <FolderArchive className="h-12 w-12 text-muted-foreground/40" />
          <p className="font-serif text-lg text-foreground leading-relaxed max-w-md">
            {error || "Archive not found."}
          </p>
          <Link href="/">
            <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Calendar
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background">
      <FloatingHearts />

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Link href="/">
            <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground hover:bg-secondary sm:mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Calendar
            </Button>
          </Link>
        </div>

        <header className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 sm:mb-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1">
            <FolderArchive className="h-3.5 w-3.5 text-gold" />
            <span className="text-xs font-medium text-gold">Archived</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-foreground sm:text-4xl md:text-5xl text-balance">
            {archive.label}
          </h1>
          <div className="mx-auto mt-4 h-px w-24 bg-gold/40" />
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed sm:text-base">
            Archived on {new Date(archive.archivedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
          <CalendarGrid letters={archive.config.letters} readOnly archiveId={archive.id} />
        </div>
      </main>
    </div>
  )
}
