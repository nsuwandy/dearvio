export interface Letter {
  day: number
  title: string
  body: string
  unlockDate: string // ISO date string YYYY-MM-DD
}

export interface CalendarConfig {
  totalDays: number
  startDate: string // ISO date string YYYY-MM-DD
  sitePassword: string // empty string = no password
  letters: Letter[]
}

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
  const unlock = new Date(unlockDate + "T00:00:00")
  return now >= unlock
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
