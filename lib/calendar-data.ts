export interface Letter {
  day: number
  title: string
  body: string
  unlockDate: string // ISO date string YYYY-MM-DD
}

export interface Archive {
  id: string // e.g. "2026-03"
  label: string // e.g. "March 2026"
  archivedAt: string // ISO timestamp
  config: CalendarConfig
}

export interface CalendarConfig {
  totalDays: number
  startDate: string // ISO date string YYYY-MM-DD
  sitePassword: string // empty string = no password
  letters: Letter[]
}

const SITE_TIME_ZONE = process.env.NEXT_PUBLIC_SITE_TIME_ZONE || "UTC"

export function getDefaultConfig(): CalendarConfig {
  const startDate = "2026-03-01"
  const totalDays = 25

  const letters: Letter[] = Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split("T")[0]

    return {
      day: i + 1,
      title: `Day ${i + 1}`,
      body: `[Insert your letter for Day ${i + 1} here]\n\n[Write something meaningful for this day]\n\n[Add a memory, inside joke, or future dream]`,
      unlockDate: dateStr,
    }
  })

  return {
    totalDays,
    startDate,
    sitePassword: "",
    letters,
  }
}

export function isLetterUnlocked(unlockDate: string): boolean {
  const now = new Date()
  let parts: Intl.DateTimeFormatPart[]

  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: SITE_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now)
  } catch {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now)
  }

  const year = parts.find((p) => p.type === "year")?.value
  const month = parts.find((p) => p.type === "month")?.value
  const day = parts.find((p) => p.type === "day")?.value

  if (!year || !month || !day) return false

  const todayInSiteTimeZone = `${year}-${month}-${day}`
  return todayInSiteTimeZone >= unlockDate
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
