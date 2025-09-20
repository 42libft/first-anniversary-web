interface DistanceHUDProps {
  distanceKm: number
  goalKm?: number
}

const formatDistance = (distanceKm: number) =>
  new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 0,
  }).format(Math.round(distanceKm))

export const DistanceHUD = ({ distanceKm, goalKm }: DistanceHUDProps) => {
  const hasGoal = typeof goalKm === 'number'
  return (
    <div className="distance-hud" aria-live="polite">
      <span className="distance-hud__label">TOTAL DISTANCE</span>
      <span className="distance-hud__value">
        {formatDistance(distanceKm)} km
        {hasGoal ? (
          <span className="distance-hud__goal"> / {formatDistance(goalKm!)} km</span>
        ) : null}
      </span>
    </div>
  )
}
