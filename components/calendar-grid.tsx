"use client"

import Link from "next/link"
import { Lock } from "lucide-react"
import { isLetterUnlocked, formatDate, type Letter } from "@/lib/calendar-data"
import { SparkleEffect } from "./sparkle-effect"

interface CalendarGridProps {
  letters: Letter[]
}

export function CalendarGrid({ letters }: CalendarGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {letters.map((letter) => {
        const unlocked = isLetterUnlocked(letter.unlockDate)
        const isLast = letter.day === letters.length

        return (
          <CalendarCard
            key={letter.day}
            letter={letter}
            unlocked={unlocked}
            isLast={isLast}
          />
        )
      })}
    </div>
  )
}

function CalendarCard({
  letter,
  unlocked,
  isLast,
}: {
  letter: Letter
  unlocked: boolean
  isLast: boolean
}) {
  const cardContent = (
    <div
      className={`
        group relative flex aspect-square flex-col items-center justify-center 
        rounded-xl border p-4 text-center transition-all duration-500
        ${
          unlocked
            ? "cursor-pointer border-gold/40 bg-card shadow-md hover:shadow-lg hover:shadow-blush/20 hover:-translate-y-1"
            : "cursor-default border-border bg-secondary/50 opacity-70"
        }
        ${isLast && unlocked ? "ring-2 ring-gold/40" : ""}
      `}
    >
      <SparkleEffect active={unlocked} />

      {unlocked ? (
        <>
          <div className="mb-2 text-gold transition-transform duration-300 group-hover:scale-110">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 sm:h-7 sm:w-7">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <span className="font-serif text-lg font-semibold text-foreground sm:text-xl">
            Day {letter.day}
          </span>
          <span className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
            Open me
          </span>
          {unlocked && (
            <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gold/5" />
          )}
        </>
      ) : (
        <>
          <Lock className="mb-2 h-5 w-5 text-muted-foreground/60 sm:h-6 sm:w-6" />
          <span className="font-serif text-lg font-semibold text-muted-foreground sm:text-xl">
            Day {letter.day}
          </span>
          <span className="mt-1 text-[10px] leading-tight text-muted-foreground/70 sm:text-[11px]">
            Unlocks {formatDate(letter.unlockDate).split(",")[0]}
          </span>
        </>
      )}
    </div>
  )

  if (unlocked) {
    return (
      <Link href={`/letter/${letter.day}`} className="animate-in fade-in duration-500">
        {cardContent}
      </Link>
    )
  }

  return <div className="animate-in fade-in duration-500">{cardContent}</div>
}
