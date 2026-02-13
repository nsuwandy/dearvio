"use client"

import { useEffect } from "react"

export function SleepingSamoyed() {
  useEffect(() => {
    console.log("[v0] SleepingSamoyed mounted")
  }, [])

  return (
    <div
      className="fixed bottom-4 left-4 z-50 pointer-events-none select-none"
      style={{ zIndex: 50 }}
    >
      <div className="relative">
        {/* Floating Zzz */}
        <div className="absolute -top-6 left-[55%] flex flex-col items-start gap-0">
          <span className="animate-samoyed-zzz3 font-serif text-[10px] text-blush/40 sm:text-xs">
            z
          </span>
          <span className="animate-samoyed-zzz2 font-serif text-xs text-blush/50 sm:text-sm">
            z
          </span>
          <span className="animate-samoyed-zzz1 font-serif text-sm text-blush/60 sm:text-base">
            z
          </span>
        </div>

        {/* Samoyed image with breathing animation */}
        <div className="animate-samoyed-breathe origin-bottom">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/sleeping-samoyed.jpg"
            alt="A sleeping samoyed"
            className="h-auto w-[110px] rounded-2xl sm:w-[150px]"
          />
        </div>
      </div>
    </div>
  )
}
