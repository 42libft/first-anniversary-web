import type { Journey } from './journey'
import type {
  JourneyPromptResponse,
  SaveJourneyResponsePayload,
} from './experience'
import type { MeetupEntry } from './meetup'

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
  meetups: MeetupEntry[]
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
