"use client"

import { useEffect, useState, useCallback, useRef } from "react"

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

  if (images.length === 0) return null

  const currentImage = images[currentIndex]

  return (
    <div
      className="fixed bottom-4 left-4 z-50 pointer-events-none select-none"
      style={{ zIndex: 50 }}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage.url}
          alt="Slideshow photo"
          className="h-auto w-[110px] rounded-2xl object-cover sm:w-[150px] transition-opacity duration-500"
          style={{ opacity: isTransitioning ? 0 : 1 }}
        />
      </div>
    </div>
  )
}
