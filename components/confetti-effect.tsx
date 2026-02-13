"use client"

import { useEffect, useState } from "react"

interface Piece {
  id: number
  left: number
  color: string
  size: number
  delay: number
  duration: number
  rotation: number
}

const COLORS = ["#d4a0a0", "#c9956b", "#f0e6dc", "#e8d8c8", "#8b7272"]

export function ConfettiEffect({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([])

  useEffect(() => {
    if (!active) {
      setPieces([])
      return
    }
    const generated: Piece[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 4,
      rotation: Math.random() * 360,
    }))
    setPieces(generated)
  }, [active])

  if (!active || pieces.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50" aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            top: "-20px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          <div
            style={{
              width: p.size,
              height: p.size * 0.6,
              backgroundColor: p.color,
              borderRadius: "2px",
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        </div>
      ))}
    </div>
  )
}
