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
  totalDistance: number
  responses: JourneyPromptResponse[]
  saveResponse: (payload: SaveJourneyResponsePayload) => void
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
