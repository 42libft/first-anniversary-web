import type { JourneyQuestionStyle } from './journey'

export interface SaveJourneyResponsePayload {
  journeyId: string
  stepId: string
  storageKey: string
  prompt: string
  answer: string
  questionType?: JourneyQuestionStyle
  correctAnswer?: string
  isCorrect?: boolean
}

export interface JourneyPromptResponse extends SaveJourneyResponsePayload {
  recordedAt: string
}
