export type JourneyMoveMode = 'flight' | 'walk' | 'bus' | 'train'

export type JourneyCoordinate = [number, number]

export interface JourneyMoveMeta {
  flightNo?: string
  dep?: string
  arr?: string
  note?: string
}

export interface JourneyMoveIllustration {
  src: string
  alt: string
}

export interface JourneyMoveStep {
  id: string
  type: 'move'
  mode: JourneyMoveMode
  from: string
  to: string
  /** 距離HUDに反映する移動距離（km）。 */
  distanceKm: number
  /** メディアアート背景のキー。 */
  artKey?: string
  /** 画面上の開始地点の座標（0〜100の正規化値）。 */
  fromCoord?: JourneyCoordinate
  /** 画面上の到着地点の座標（0〜100の正規化値）。 */
  toCoord?: JourneyCoordinate
  /** 抽象マップ上のルート。 */
  route?: JourneyCoordinate[]
  /** 実際の地図イメージなど、移動ページで利用する視覚素材。 */
  mapImage?: JourneyMoveIllustration
  /** フライト番号や発着時間などの補足情報。 */
  meta?: JourneyMoveMeta
  /** ステップ固有のラベルや補足文。 */
  description?: string
}

export interface JourneyEpisodeStep {
  id: string
  type: 'episode'
  title?: string
  text: string[]
  artKey?: string
  photo: {
    src: string
    alt: string
    objectPosition?: string
  }
  /** 任意: この思い出ステップに紐付けたい移動距離（km）。 */
  distanceKm?: number
}

export type JourneyQuestionStyle = 'choice' | 'text'

export interface JourneyQuestionStep {
  id: string
  type: 'question'
  style: JourneyQuestionStyle
  prompt: string
  storageKey: string
  choices?: string[]
  placeholder?: string
  helper?: string
  readonlyAfterSave?: boolean
  correctAnswer?: string
  /** 任意: HUDに足し込みたい距離（km）。 */
  distanceKm?: number
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
