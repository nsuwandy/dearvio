"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FloatingHearts } from "@/components/floating-hearts"
import { ConfettiEffect } from "@/components/confetti-effect"
import { isLetterUnlocked, formatDate, type CalendarConfig, type Letter } from "@/lib/calendar-data"

export default function LetterPage({ params }: { params: Promise<{ day: string }> }) {
  const { day: dayParam } = use(params)
  const dayNum = parseInt(dayParam, 10)
  const [letter, setLetter] = useState<Letter | null>(null)
  const [totalDays, setTotalDays] = useState(25)
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)
  const [lockMessage, setLockMessage] = useState("")

  useEffect(() => {
    async function fetchLetter() {
      try {
        const res = await fetch("/api/calendar")
        const data: CalendarConfig = await res.json()
        const found = data.letters.find((l) => l.day === dayNum)
        setTotalDays(data.totalDays)

        if (!found) {
          setLocked(true)
          setLockMessage("This letter doesn't exist.")
          return
        }

        if (!isLetterUnlocked(found.unlockDate)) {
          setLocked(true)
          setLockMessage(
            `Not yet, my love. Come back on ${formatDate(found.unlockDate)}.`
          )
          return
        }

        setLetter(found)
      } catch {
        setLocked(true)
        setLockMessage("Something went wrong. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchLetter()
  }, [dayNum])

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

  if (locked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-700">
          <div className="text-blush">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-12 w-12">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <p className="font-serif text-lg text-foreground leading-relaxed max-w-md">
            {lockMessage}
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

  if (!letter) return null

  const isLastDay = dayNum === totalDays

  return (
    <div className="relative min-h-screen bg-background">
      <FloatingHearts />
      <ConfettiEffect active={isLastDay} />

      <main className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-16">
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          <Link href="/">
            <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground hover:bg-secondary sm:mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Calendar
            </Button>
          </Link>

          <article className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-10">
            <div className="mb-6 text-center sm:mb-8">
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

            {isLastDay && (
              <div className="mt-8 text-center animate-in fade-in duration-1000 delay-500 sm:mt-10">
                <div className="mx-auto h-px w-16 bg-gold/40 sm:w-24" />
                <p className="mt-4 font-serif text-lg text-gold italic sm:text-xl">
                  With all my love, always.
                </p>
              </div>
            )}
          </article>
        </div>
      </main>
    </div>
  )
}
