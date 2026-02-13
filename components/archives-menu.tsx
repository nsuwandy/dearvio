"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, FolderArchive, ChevronRight } from "lucide-react"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import type { Archive } from "@/lib/calendar-data"

type ArchiveSummary = Omit<Archive, "config">

export function ArchivesMenu() {
  const [archives, setArchives] = useState<ArchiveSummary[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Don't show on admin pages
  const isAdmin = pathname.startsWith("/admin")

  useEffect(() => {
    if (isAdmin) return

    async function fetchArchives() {
      try {
        const res = await fetch("/api/archives")
        const data = await res.json()
        setArchives(data.archives || [])
      } catch {
        // Silently fail - menu just won't show
      } finally {
        setLoaded(true)
      }
    }
    fetchArchives()
  }, [isAdmin])

  // Don't render anything if on admin, still loading, or no archives
  if (isAdmin || !loaded || archives.length === 0) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-card hover:shadow-lg"
          aria-label="Open archives"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-card border-border w-80 sm:max-w-80">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="flex items-center gap-2 font-serif text-lg text-foreground">
            <FolderArchive className="h-5 w-5 text-gold" />
            Archives
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm">
            Browse past letter collections
          </SheetDescription>
        </SheetHeader>

        <nav className="flex flex-col gap-1 overflow-y-auto py-4 px-4" aria-label="Archive folders">
          {archives.map((archive) => {
            const isActive = pathname === `/archive/${archive.id}`
            return (
              <Link
                key={archive.id}
                href={`/archive/${archive.id}`}
                onClick={() => setOpen(false)}
                className={`group flex items-center justify-between rounded-lg px-3 py-3 transition-colors ${
                  isActive
                    ? "bg-primary/15 text-foreground"
                    : "text-foreground hover:bg-secondary/60"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-serif font-medium text-sm truncate">{archive.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(archive.archivedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto border-t border-border p-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-blush">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            Current Calendar
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
