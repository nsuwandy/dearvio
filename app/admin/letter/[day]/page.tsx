"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FloatingHearts } from "@/components/floating-hearts"
import { formatDate, type CalendarConfig, type Letter } from "@/lib/calendar-data"

export default function AdminLetterPreviewPage({
  params,
}: {
  params: Promise<{ day: string }>
}) {
  const { day: dayParam } = use(params)
  const dayNum = parseInt(dayParam, 10)
  const [letter, setLetter] = useState<Letter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchLetter() {
      try {
        const res = await fetch("/api/calendar")
        if (!res.ok) {
          setError("Failed to load letter.")
          return
        }
        const data: CalendarConfig = await res.json()
        const found = data.letters.find((l) => l.day === dayNum)
        if (!found) {
          setError("This letter doesn't exist.")
          return
        }
        setLetter(found)
      } catch {
        setError("Something went wrong. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchLetter()
  }, [dayNum])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading letter...</div>
      </div>
    )
  }

  if (error || !letter) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-6 text-center">
          <p className="font-serif text-lg text-foreground">{error || "Letter not found."}</p>
          <Link href="/admin">
            <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
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
        <div>
          <Link href="/admin">
            <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground hover:bg-secondary sm:mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Button>
          </Link>

          <article className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-10">
            <div className="mb-6 text-center sm:mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1">
                <ShieldCheck className="h-3 w-3 text-gold" />
                <span className="text-[10px] font-medium text-gold">Admin Preview</span>
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-wide text-foreground sm:text-3xl md:text-4xl">
                {letter.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Unlock date: {formatDate(letter.unlockDate)}
              </p>
            </div>

            <div className="mx-auto mb-6 h-px w-16 bg-gold/40 sm:mb-8 sm:w-24" />

            {(letter.audioUrl || letter.audioDataUrl) && (
              <section className="mb-6 rounded-xl border border-border/70 bg-background/40 p-4 sm:mb-8">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {letter.audioTitle?.trim() || "Voice Recording"}
                </p>
                <audio controls src={letter.audioUrl || letter.audioDataUrl} className="w-full" />

                {letter.audioAttachmentText?.trim() && (
                  <details className="mt-3 rounded-lg border border-border/60 bg-card/70 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-foreground">
                      Open attached note
                    </summary>
                    <div className="mt-3 space-y-2">
                      {letter.audioAttachmentText.split("\n").map((line, i) => (
                        <p key={i} className="text-sm leading-relaxed text-foreground/85">
                          {line || "\u00A0"}
                        </p>
                      ))}
                    </div>
                  </details>
                )}
              </section>
            )}

            <div className="prose prose-sm mx-auto max-w-none sm:prose-base">
              {letter.body.split("\n").map((line, i) => (
                <p key={i} className="text-foreground/90 leading-relaxed text-sm sm:text-base">
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
