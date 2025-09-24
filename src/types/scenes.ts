import type { Dispatch, SetStateAction } from 'react'

import type { Journey } from './journey'
import type {
  JourneyPromptResponse,
  SaveJourneyResponsePayload,
} from './experience'

export type SceneId =
  | 'intro'
  | 'prologue'
  | 'journeys'
  | 'messages'
  | 'likes'
  | 'links'
  | 'media'
  | 'letter'
  | 'result'

export interface SceneComponentProps {
  onAdvance: () => void
  goToScene: (scene: SceneId) => void
  onRestart: () => void
  journeys: Journey[]
  /**
   * moveステップの移動距離を積算した合計値。
   * 距離HUDおよびMessages/Resultで利用する。
   */
  distanceTraveled: number
  /** Total distance if every journey in the dataset is completed. */
  totalJourneyDistance: number
  responses: JourneyPromptResponse[]
  saveResponse: (payload: SaveJourneyResponsePayload) => void
  setDistanceTraveled: Dispatch<SetStateAction<number>>
}

export const sceneOrder: SceneId[] = [
  'intro',
  'prologue',
  'journeys',
  'messages',
  'likes',
  'links',
  'media',
  'letter',
  'result',
]

export const sceneTitleMap: Record<SceneId, string> = {
  intro: 'Intro',
  prologue: 'Prologue',
  journeys: 'Journeys',
  messages: 'Messages',
  likes: 'Likes',
  links: 'Links',
  media: 'Media',
  letter: 'Letter',
  result: 'Result',
}
