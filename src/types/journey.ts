export type TransportMode = 'plane' | 'bus' | 'train'

export interface JourneyMoveStep {
  id: string
  type: 'move'
  from: string
  to: string
  transport: TransportMode
  /** 距離HUDに反映する移動距離（km）。 */
  distanceKm: number
  /** メディアアート背景のキー。 */
  artKey: string
  /** ステップ固有のラベルや補足文。 */
  description?: string
}

export interface JourneyEpisodeStep {
  id: string
  type: 'episode'
  title: string
  caption: string
  artKey: string
  media: {
    src: string
    alt: string
    objectPosition?: string
  }
}

export interface JourneyQuestionStep {
  id: string
  type: 'question'
  prompt: string
  placeholder?: string
  helper?: string
}

export type JourneyStep =
  | JourneyMoveStep
  | JourneyEpisodeStep
  | JourneyQuestionStep

export interface Journey {
  id: string
  title: string
  date: string
  /** 旅全体の距離（moveステップの合計）。 */
  distanceKm: number
  steps: JourneyStep[]
}
