"use client"

import { useState, type FormEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface PasswordGateProps {
  onUnlock: () => void
}

export function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)

    try {
      const res = await fetch("/api/calendar/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        sessionStorage.setItem("calendar-auth", "true")
        onUnlock()
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-in fade-in duration-700">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="text-blush">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-12 w-12">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl tracking-wide text-foreground">
            This is just for you
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Enter the password to continue
          </p>

          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-border bg-card text-center text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive animate-in fade-in">
                That{"'"}s not quite right. Try again.
              </p>
            )}
            <Button
              type="submit"
              disabled={loading || !password}
              className="bg-primary text-primary-foreground hover:bg-blush/80"
            >
              {loading ? "..." : "Enter"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
