interface DistanceHUDProps {
  distanceKm: number
}

const formatDistance = (distanceKm: number) =>
  new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 0,
  }).format(Math.round(distanceKm))

export const DistanceHUD = ({ distanceKm }: DistanceHUDProps) => {
  return (
    <div className="distance-hud" aria-live="polite">
      <span className="distance-hud__label">TOTAL DISTANCE</span>
      <span className="distance-hud__value">{formatDistance(distanceKm)} km</span>
    </div>
  )
}
