export type TransportMode = 'plane' | 'bus' | 'train'

export interface JourneyPrompt {
  q: string
  answer?: string
}

export interface Journey {
  date: string
  from: string
  to: string
  transport: TransportMode
  caption: string
  photoURL: string
  artKey: string
  distanceKm: number
  prompts: JourneyPrompt[]
}
