import { useCallback, useRef, useState } from 'react'

export type TapRippleFieldProps = {
  disabled?: boolean
  onPulse?: (position?: { x: number; y: number }) => void
  className?: string
  variant?: 'links' | 'media'
  showRipples?: boolean
}

type Ripple = {
  id: number
  x: number
  y: number
}

export const TapRippleField = ({
  disabled = false,
  onPulse,
  className,
  variant,
  showRipples = true,
}: TapRippleFieldProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const idRef = useRef(0)
  const [ripples, setRipples] = useState<Ripple[]>([])

  const removeRipple = useCallback((id: number) => {
    setRipples((prev) => prev.filter((ripple) => ripple.id !== id))
  }, [])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    idRef.current += 1
    const normalized = {
      x: Math.min(1, Math.max(0, x / 100)),
      y: Math.min(1, Math.max(0, y / 100)),
    }

    if (showRipples) {
      const ripple: Ripple = { id: idRef.current, x, y }
      setRipples((prev) => [...prev, ripple])
      window.setTimeout(() => removeRipple(ripple.id), 1100)
    }
    onPulse?.(normalized)
    event.preventDefault()
  }

  return (
    <div
      ref={containerRef}
      className={[
        'tap-ripple-field',
        variant ? `tap-ripple-field--${variant}` : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      onPointerDown={handlePointerDown}
      role="presentation"
    >
      {showRipples &&
        ripples.map((ripple) => (
          <span
            key={ripple.id}
            className={['tap-ripple', variant ? `tap-ripple--${variant}` : '']
              .filter(Boolean)
              .join(' ')}
            style={{
              left: `${ripple.x}%`,
              top: `${ripple.y}%`,
            }}
          />
        ))}
    </div>
  )
}
