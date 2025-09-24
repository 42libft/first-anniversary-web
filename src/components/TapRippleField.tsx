import { useCallback, useRef, useState } from 'react'

export type TapRippleFieldProps = {
  disabled?: boolean
  onPulse?: () => void
  className?: string
  variant?: 'links' | 'media'
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
    const ripple: Ripple = { id: idRef.current, x, y }
    setRipples((prev) => [...prev, ripple])
    onPulse?.()
    event.preventDefault()
    window.setTimeout(() => removeRipple(ripple.id), 1100)
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
      {ripples.map((ripple) => (
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
