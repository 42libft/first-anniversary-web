import type { JourneyQuestionStyle } from './journey'

export interface JourneySessionInfo {
  id: string
  createdAt: string
}

export interface SaveJourneyResponsePayload {
  journeyId: string
  stepId: string
  storageKey: string
  prompt: string
  answer: string
  questionType?: JourneyQuestionStyle
  correctAnswer?: string
  isCorrect?: boolean
  sessionId?: string
}

export interface JourneyPromptResponse extends SaveJourneyResponsePayload {
  recordedAt: string
  sessionId: string
}
