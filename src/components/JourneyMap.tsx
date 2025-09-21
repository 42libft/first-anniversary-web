import { useEffect, useMemo, useState } from 'react'
import type { GeoJsonLineString } from '../types/routes'

type JourneyMapProps = {
  data?: GeoJsonLineString
  title?: string
}

// Minimal, dependency-free renderer: projects a LineString into a 100x100 viewBox.
// Later, we can swap with MapLibre/Google. This stays as a safe fallback.
export const JourneyMap = ({ data, title }: JourneyMapProps) => {
  const [pathD, setPathD] = useState<string>('')

  const bounds = useMemo(() => {
    if (!data?.features?.length) return null
    const coords = data.features.flatMap((f) => f.geometry.coordinates)
    const xs = coords.map((c) => c[0])
    const ys = coords.map((c) => c[1])
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    return { minX, maxX, minY, maxY }
  }, [data])

  useEffect(() => {
    if (!data?.features?.length || !bounds) {
      setPathD('')
      return
    }

    const pad = 6
    const w = Math.max(bounds.maxX - bounds.minX, 1e-6)
    const h = Math.max(bounds.maxY - bounds.minY, 1e-6)
    const sx = (100 - pad * 2) / w
    const sy = (100 - pad * 2) / h
    const s = Math.min(sx, sy)
    const ox = (100 - (w * s)) / 2 - bounds.minX * s
    const oy = (100 - (h * s)) / 2 - bounds.minY * s

    const feature = data.features[0]
    const d = feature.geometry.coordinates
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c[0] * s + ox} ${100 - (c[1] * s + oy)}`)
      .join(' ')

    setPathD(d)
  }, [data, bounds])

  return (
    <svg
      className="journeys-map journeys-map--route"
      viewBox="0 0 100 100"
      role="img"
      aria-label={title ?? '移動ルート'}
    >
      <defs>
        <linearGradient id="journey-route-line" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7fd7ff" />
          <stop offset="100%" stopColor="#ff66c4" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="12" fill="rgba(10,14,36,0.7)" />
      {pathD ? (
        <>
          <path d={pathD} stroke="#1a3159" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.4" />
          <path d={pathD} stroke="url(#journey-route-line)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <text x="50" y="52" textAnchor="middle" fontSize="8" fill="#cdd7ff" opacity="0.8">
          ルートデータ未設定
        </text>
      )}
    </svg>
  )
}
