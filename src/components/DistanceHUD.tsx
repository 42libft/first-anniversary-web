import type { CSSProperties } from 'react'

interface DistanceHUDProps {
  distanceKm: number
  goalKm?: number
}

const formatDistance = (distanceKm: number) =>
  new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 0,
  }).format(Math.round(distanceKm))

const goalStyles: CSSProperties = {
  display: 'inline-block',
  marginLeft: '0.4rem',
  fontSize: '0.75rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgba(245, 244, 255, 0.7)',
}

export const DistanceHUD = ({ distanceKm, goalKm }: DistanceHUDProps) => {
  const hasGoal = typeof goalKm === 'number'
  const goalValue = hasGoal ? goalKm ?? 0 : null
  return (
    <div className="distance-hud" aria-live="polite">
      <span className="distance-hud__label">TOTAL DISTANCE</span>
      <span className="distance-hud__value">
        {formatDistance(distanceKm)} km
        {goalValue !== null ? (
          <span style={goalStyles}>/ {formatDistance(goalValue)} km</span>
        ) : null}
      </span>
    </div>
  )
}
