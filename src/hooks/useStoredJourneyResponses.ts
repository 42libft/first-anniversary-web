import { useCallback, useEffect, useState } from 'react'

import type {
  JourneyPromptResponse,
  SaveJourneyResponsePayload,
} from '../types/experience'

const STORAGE_KEY = 'first-anniversary-web:journey-responses'

const isBrowser = typeof window !== 'undefined'

const readFromStorage = (): JourneyPromptResponse[] => {
  if (!isBrowser) {
    return []
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as JourneyPromptResponse[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (entry) =>
        typeof entry === 'object' &&
        typeof entry.journeyId === 'string' &&
        typeof entry.stepId === 'string' &&
        typeof entry.storageKey === 'string' &&
        typeof entry.prompt === 'string' &&
        typeof entry.answer === 'string' &&
        typeof entry.recordedAt === 'string'
    )
  } catch (error) {
    console.warn('Failed to read stored journey responses', error)
    return []
  }
}

export const useStoredJourneyResponses = () => {
  const [responses, setResponses] = useState<JourneyPromptResponse[]>(() =>
    readFromStorage()
  )

  useEffect(() => {
    if (!isBrowser) {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(responses))
    } catch (error) {
      console.warn('Failed to persist journey responses', error)
    }
  }, [responses])

  const saveResponse = useCallback(
    (payload: SaveJourneyResponsePayload) => {
      setResponses((prev) => {
        const filtered = prev.filter(
          (entry) => entry.storageKey !== payload.storageKey
        )

        const updated: JourneyPromptResponse = {
          ...payload,
          recordedAt: new Date().toISOString(),
        }

        return [...filtered, updated]
      })
    },
    []
  )

  const clearResponses = useCallback(() => {
    setResponses([])
  }, [])

  return {
    responses,
    saveResponse,
    clearResponses,
  }
}
