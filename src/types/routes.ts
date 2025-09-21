export type RouteMode = 'walk' | 'bus' | 'train' | 'flight'

export interface RouteSpec {
  id: string
  title?: string
  mode: RouteMode
  origin: string
  destination: string
  waypoints?: string[]
  departAt?: string
  distanceKm?: number
  mapLink?: string
}

export interface GeoJsonFeature {
  type: 'Feature'
  geometry: {
    type: 'LineString'
    coordinates: [number, number][]
  }
  properties?: Record<string, unknown>
}

export interface GeoJsonLineString {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

