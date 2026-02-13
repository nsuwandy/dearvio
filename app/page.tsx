"use client"

import { useEffect, useState, useCallback } from "react"
import { CalendarGrid } from "@/components/calendar-grid"
import { FloatingHearts } from "@/components/floating-hearts"
import { PasswordGate } from "@/components/password-gate"
import { HomepageSlideshow } from "@/components/homepage-slideshow"
import type { CalendarConfig } from "@/lib/calendar-data"

export default function Home() {
  const [config, setConfig] = useState<CalendarConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar")
      const data = await res.json()
      setConfig(data)

      if (data.sitePassword && !sessionStorage.getItem("calendar-auth")) {
        setNeedsPassword(true)
      } else {
        setAuthenticated(true)
      }
    } catch (err) {
      console.error("Failed to load calendar:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="text-blush">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  if (needsPassword && !authenticated) {
    return (
      <PasswordGate
        onUnlock={() => {
          setAuthenticated(true)
          setNeedsPassword(false)
        }}
      />
    )
  }

  if (!config) return null

  return (
    <div className="relative min-h-screen bg-background">
      <FloatingHearts />
      <HomepageSlideshow />

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 sm:mb-12">
          <div className="mb-4 text-blush">
            <svg viewBox="0 0 24 24" fill="currentColor" className="mx-auto h-8 w-8 sm:h-10 sm:w-10">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-foreground sm:text-4xl md:text-5xl text-balance">
            Dear Vio
          </h1>
          <div className="mx-auto mt-4 h-px w-24 bg-gold/40" />
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed sm:text-base">
            A new letter for each day. Open them one at a time.
          </p>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
          <CalendarGrid letters={config.letters} />
        </div>
      </main>
    </div>
  )
}
