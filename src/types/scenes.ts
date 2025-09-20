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
  | 'meetups'
  | 'letter'
  | 'result'

export interface SceneComponentProps {
  onAdvance: () => void
  goToScene: (scene: SceneId) => void
  onRestart: () => void
  journeys: Journey[]
  /**
   * Sum of the journey distances that have been experienced so far.
   * Displayed in the persistent HUD and reused by later scenes (quizzes/result).
   */
  distanceTraveled: number
  /** Total distance if every journey in the dataset is completed. */
  totalJourneyDistance: number
  responses: JourneyPromptResponse[]
  saveResponse: (payload: SaveJourneyResponsePayload) => void
  setDistanceTraveled: (value: number) => void
}

export const sceneOrder: SceneId[] = [
  'intro',
  'prologue',
  'journeys',
  'messages',
  'likes',
  'meetups',
  'letter',
  'result',
]
