export interface MeetupArt {
  /** CSS gradient string that paints the main aurora-like background. */
  gradient: string
  /** Optional overlay pattern that sits on top of the gradient. */
  overlay?: string
  /** Optional opacity for the overlay pattern (0-1). Defaults to 0.35. */
  overlayOpacity?: number
  /** Accent color used for chips/borders that match the artwork. */
  accent: string
  /** Optional opacity for the grain layer (0-1). Defaults to 0.22. */
  noiseOpacity?: number
}

export interface MeetupPhoto {
  url: string
  alt: string
  /** Aspect ratio expressed as width / height. */
  aspectRatio?: number
  caption?: string
}

export interface MeetupEntry {
  id: string
  monthLabel: string
  title: string
  location: string
  summary: string
  highlights: string[]
  photo: MeetupPhoto
  art: MeetupArt
  memo?: string
}
