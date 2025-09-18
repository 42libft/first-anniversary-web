export interface SaveJourneyResponsePayload {
  journeyKey: string
  prompt: string
  answer: string
}

export interface JourneyPromptResponse extends SaveJourneyResponsePayload {
  recordedAt: string
}
