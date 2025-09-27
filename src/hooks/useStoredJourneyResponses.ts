import { useCallback, useEffect, useState } from 'react'

import type {
  JourneyPromptResponse,
  SaveJourneyResponsePayload,
} from '../types/experience'

interface JourneyQuizStats {
  correctCount: number
  answeredCount: number
  recordedAt: string
}

const STORAGE_KEY = 'first-anniversary-web:journey-responses'
const QUIZ_STATS_KEY = 'first-anniversary-web:journey-quiz-stats'

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

    return parsed.filter((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return false
      }

      if (
        typeof entry.journeyId !== 'string' ||
        typeof entry.stepId !== 'string' ||
        typeof entry.storageKey !== 'string' ||
        typeof entry.prompt !== 'string' ||
        typeof entry.answer !== 'string' ||
        typeof entry.recordedAt !== 'string'
      ) {
        return false
      }

      if (
        'questionType' in entry &&
        entry.questionType !== undefined &&
        entry.questionType !== 'choice' &&
        entry.questionType !== 'text'
      ) {
        return false
      }

      if (
        'correctAnswer' in entry &&
        entry.correctAnswer !== undefined &&
        typeof entry.correctAnswer !== 'string'
      ) {
        return false
      }

      if ('isCorrect' in entry && entry.isCorrect !== undefined && typeof entry.isCorrect !== 'boolean') {
        return false
      }

      return true
    }) as JourneyPromptResponse[]
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

    try {
      const quizEntries = responses.filter((entry) => entry.questionType === 'choice')
      const stats: JourneyQuizStats = {
        correctCount: quizEntries.filter((entry) => entry.isCorrect === true).length,
        answeredCount: quizEntries.length,
        recordedAt: new Date().toISOString(),
      }
      window.localStorage.setItem(QUIZ_STATS_KEY, JSON.stringify(stats))
    } catch (error) {
      console.warn('Failed to persist journey quiz stats', error)
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

  const replaceResponses = useCallback((items: JourneyPromptResponse[]) => {
    setResponses(items)
  }, [])

  return {
    responses,
    saveResponse,
    clearResponses,
    replaceResponses,
  }
}
