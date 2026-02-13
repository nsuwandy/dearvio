"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { ArrowLeft, FolderArchive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FloatingHearts } from "@/components/floating-hearts"
import { formatDate, type Archive, type Letter } from "@/lib/calendar-data"

export default function ArchivedLetterPage({
  params,
}: {
  params: Promise<{ id: string; day: string }>
}) {
  const { id, day: dayParam } = use(params)
  const dayNum = parseInt(dayParam, 10)
  const [letter, setLetter] = useState<Letter | null>(null)
  const [archiveLabel, setArchiveLabel] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchArchivedLetter() {
      try {
        const res = await fetch(`/api/archives/${id}`)
        if (!res.ok) {
          setError("Archive not found.")
          return
        }
        const archive: Archive = await res.json()
        setArchiveLabel(archive.label)
        const found = archive.config.letters.find((l) => l.day === dayNum)

        if (!found) {
          setError("This letter doesn't exist in this archive.")
          return
        }

        setLetter(found)
      } catch {
        setError("Something went wrong. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchArchivedLetter()
  }, [id, dayNum])

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

  if (error || !letter) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-700">
          <FolderArchive className="h-12 w-12 text-muted-foreground/40" />
          <p className="font-serif text-lg text-foreground leading-relaxed max-w-md">
            {error || "Letter not found."}
          </p>
          <Link href={`/archive/${id}`}>
            <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Archive
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background">
      <FloatingHearts />

      <main className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-16">
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          <Link href={`/archive/${id}`}>
            <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground hover:bg-secondary sm:mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {archiveLabel || "Archive"}
            </Button>
          </Link>

          <article className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-10">
            <div className="mb-6 text-center sm:mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1">
                <FolderArchive className="h-3 w-3 text-gold" />
                <span className="text-[10px] font-medium text-gold">{archiveLabel}</span>
              </div>
              <div className="mb-3 text-gold">
                <svg viewBox="0 0 24 24" fill="currentColor" className="mx-auto h-6 w-6 sm:h-8 sm:w-8">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-wide text-foreground sm:text-3xl md:text-4xl">
                {letter.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatDate(letter.unlockDate)}
              </p>
            </div>

            <div className="mx-auto mb-6 h-px w-16 bg-gold/40 sm:mb-8 sm:w-24" />

            <div className="prose prose-sm mx-auto max-w-none sm:prose-base">
              {letter.body.split("\n").map((line, i) => (
                <p
                  key={i}
                  className="text-foreground/90 leading-relaxed text-sm sm:text-base"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {line || "\u00A0"}
                </p>
              ))}
            </div>
          </article>
        </div>
      </main>
    </div>
  )
}
