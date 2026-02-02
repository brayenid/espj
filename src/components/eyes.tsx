'use client'

import { useEffect, useRef } from 'react'

/**
 * Mascot Eyes (Cartoon)
 * - Blink animation
 * - Follow mouse (requestAnimationFrame optimized)
 * - Theme-aware (shadcn css variables)
 */
export default function MascotEyes() {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  // Mouse tracking (store only)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // RAF loop for smooth movement
  useEffect(() => {
    const animate = () => {
      if (wrapperRef.current) {
        const eyes = wrapperRef.current.querySelectorAll<HTMLDivElement>('[data-eye]')

        eyes.forEach((eye) => {
          const pupil = eye.querySelector<HTMLDivElement>('[data-pupil]')
          if (!pupil) return

          const r = eye.getBoundingClientRect()
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2

          const dx = mouseRef.current.x - cx
          const dy = mouseRef.current.y - cy
          const angle = Math.atan2(dy, dx)

          const max = r.width * 0.22
          const x = Math.cos(angle) * max
          const y = Math.sin(angle) * max

          pupil.style.transform = `translate(${x}px, ${y}px)`
        })
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div ref={wrapperRef} className="flex items-center gap-6">
      {[0, 1].map((i) => (
        <div
          key={i}
          data-eye
          className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-border bg-background shadow-inner overflow-hidden animate-blink">
          {/* iris */}
          <div data-pupil className="h-6 w-6 rounded-full bg-primary transition-transform duration-75">
            <div className="absolute inset-2 rounded-full bg-background" />
          </div>
        </div>
      ))}

      {/* Blink animation */}
      <style jsx global>{`
        @keyframes blink {
          0%,
          92%,
          100% {
            transform: scaleY(1);
          }
          94%,
          96% {
            transform: scaleY(0.1);
          }
        }
        .animate-blink {
          animation: blink 4s infinite;
          transform-origin: center;
        }
      `}</style>
    </div>
  )
}
