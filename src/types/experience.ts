export interface SaveJourneyResponsePayload {
  journeyId: string
  stepId: string
  storageKey: string
  prompt: string
  answer: string
}

export interface JourneyPromptResponse extends SaveJourneyResponsePayload {
  recordedAt: string
}
