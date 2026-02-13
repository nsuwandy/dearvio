"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { X } from "lucide-react"

interface SlideshowImage {
  url: string
  pathname: string
  filename: string
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function HomepageSlideshow() {
  const [images, setImages] = useState<SlideshowImage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch("/api/slideshow")
      const data = await res.json()
      if (data.images && data.images.length > 0) {
        setImages(shuffleArray(data.images))
        setCurrentIndex(0)
      }
    } catch (err) {
      console.error("Failed to load slideshow images:", err)
    }
  }, [])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  useEffect(() => {
    if (images.length <= 1) return

    intervalRef.current = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
        setIsTransitioning(false)
      }, 500)
    }, 15000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [images])

  // Close on Escape key
  useEffect(() => {
    if (!expanded) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExpanded(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [expanded])

  if (images.length === 0) return null

  const currentImage = images[currentIndex]

  return (
    <>
      {/* Thumbnail */}
      <button
        type="button"
        className="fixed bottom-4 left-4 z-50 pointer-events-auto appearance-none border-0 bg-transparent p-0 outline-none"
        style={{ zIndex: 50, WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
        onClick={() => setExpanded(true)}
        aria-label="View photo fullscreen"
      >
        <div className="relative overflow-hidden rounded-2xl shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage.url}
            alt=""
            className="h-auto w-[110px] rounded-2xl object-cover sm:w-[150px] transition-opacity duration-500"
            style={{ opacity: isTransitioning ? 0 : 1, pointerEvents: "none" }}
            draggable={false}
          />
        </div>
      </button>

      {/* Fullscreen Lightbox */}
      {expanded && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setExpanded(false)}
          role="dialog"
          aria-label="Fullscreen photo viewer"
          style={{ touchAction: "manipulation" }}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(false) }}
            className="absolute top-4 right-4 z-[101] flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white/90 transition-colors hover:bg-black/70 hover:text-white"
            style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
            aria-label="Close fullscreen view"
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage.url}
            alt="Slideshow photo fullscreen"
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
            style={{ pointerEvents: "none" }}
          />
        </div>
      )}
    </>
  )
}
