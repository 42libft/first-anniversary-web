import { useCallback, useEffect, useState } from 'react'

import type {
  JourneyPromptResponse,
  JourneySessionInfo,
  SaveJourneyResponsePayload,
} from '../types/experience'
import { APP_BUILD_ID } from '../constants/build'

interface JourneyQuizStats {
  correctCount: number
  answeredCount: number
  recordedAt: string
}

type JourneyResponseArchive = Record<string, JourneyPromptResponse[]>
type JourneyQuizStatsArchive = Record<string, JourneyQuizStats>

const RESPONSES_STORAGE_KEY = 'first-anniversary-web:journey-responses'
const QUIZ_STATS_STORAGE_KEY = 'first-anniversary-web:journey-quiz-stats'
const SESSION_STORAGE_KEY = 'first-anniversary-web:journey-session'
const SESSION_HISTORY_STORAGE_KEY = 'first-anniversary-web:journey-session-history'

const isBrowser = typeof window !== 'undefined'

const CURRENT_BUILD_ID = APP_BUILD_ID

const createSessionRecord = (): JourneySessionInfo => ({
  id: `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  createdAt: new Date().toISOString(),
  buildId: CURRENT_BUILD_ID,
})

const isSessionRecord = (value: unknown): value is JourneySessionInfo => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const entry = value as Record<string, unknown>
  if (typeof entry.id !== 'string' || typeof entry.createdAt !== 'string') {
    return false
  }
  if ('buildId' in entry && typeof entry.buildId !== 'string' && entry.buildId !== undefined) {
    return false
  }
  return true
}

const withCurrentBuild = (session: JourneySessionInfo): JourneySessionInfo => {
  if (session.buildId === CURRENT_BUILD_ID) {
    return session
  }
  return { ...session, buildId: CURRENT_BUILD_ID }
}

const readSessionHistory = (): JourneySessionInfo[] => {
  if (!isBrowser) {
    return []
  }
  const raw = window.localStorage.getItem(SESSION_HISTORY_STORAGE_KEY)
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter(isSessionRecord)
  } catch (error) {
    console.warn('Failed to read journey session history', error)
    return []
  }
}

const writeSessionHistory = (history: JourneySessionInfo[]) => {
  if (!isBrowser) {
    return
  }
  try {
    window.localStorage.setItem(SESSION_HISTORY_STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    console.warn('Failed to persist journey session history', error)
  }
}

const appendSessionHistory = (session: JourneySessionInfo) => {
  if (!isBrowser) {
    return
  }
  const history = readSessionHistory()
  const index = history.findIndex((entry) => entry.id === session.id)
  if (index >= 0) {
    history[index] = session
  } else {
    history.push(session)
  }
  writeSessionHistory(history)
}

const readCurrentSession = (): JourneySessionInfo | undefined => {
  if (!isBrowser) {
    return undefined
  }
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) {
    return undefined
  }
  try {
    const parsed = JSON.parse(raw)
    if (isSessionRecord(parsed)) {
      return parsed
    }
    return undefined
  } catch (error) {
    console.warn('Failed to read current journey session', error)
    return undefined
  }
}

const writeCurrentSession = (session: JourneySessionInfo) => {
  if (!isBrowser) {
    return
  }
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch (error) {
    console.warn('Failed to persist current journey session', error)
  }
}

const ensureSession = (): JourneySessionInfo => {
  const existing = readCurrentSession()
  if (existing && existing.buildId === CURRENT_BUILD_ID) {
    return existing
  }
  const created = createSessionRecord()
  if (isBrowser) {
    writeCurrentSession(created)
    appendSessionHistory(created)
  }
  return created
}

const sanitizeResponseEntry = (
  entry: unknown,
  fallbackSessionId: string
): JourneyPromptResponse | undefined => {
  if (typeof entry !== 'object' || entry === null) {
    return undefined
  }
  const value = entry as Record<string, unknown>
  if (
    typeof value.journeyId !== 'string' ||
    typeof value.stepId !== 'string' ||
    typeof value.storageKey !== 'string' ||
    typeof value.prompt !== 'string' ||
    typeof value.answer !== 'string'
  ) {
    return undefined
  }

  const recordedAt =
    typeof value.recordedAt === 'string' ? value.recordedAt : new Date().toISOString()

  const questionType =
    value.questionType === 'choice' || value.questionType === 'text'
      ? (value.questionType as 'choice' | 'text')
      : undefined

  const correctAnswer = typeof value.correctAnswer === 'string' ? value.correctAnswer : undefined
  const isCorrect =
    typeof value.isCorrect === 'boolean'
      ? value.isCorrect
      : correctAnswer !== undefined
        ? value.answer === correctAnswer
        : undefined

  const sessionId =
    typeof value.sessionId === 'string' && value.sessionId.length > 0
      ? value.sessionId
      : fallbackSessionId

  return {
    journeyId: value.journeyId,
    stepId: value.stepId,
    storageKey: value.storageKey,
    prompt: value.prompt,
    answer: value.answer,
    questionType,
    correctAnswer,
    isCorrect,
    recordedAt,
    sessionId,
  }
}

const getEarliestTimestamp = (entries: JourneyPromptResponse[]): number | undefined => {
  let earliest: number | undefined
  entries.forEach((entry) => {
    const value = Date.parse(entry.recordedAt)
    if (Number.isNaN(value)) {
      return
    }
    if (earliest === undefined || value < earliest) {
      earliest = value
    }
  })
  return earliest
}

const normalizeTimestampIsoString = (timestamp?: number): string => {
  if (timestamp === undefined) {
    return new Date().toISOString()
  }
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString()
  }
  return date.toISOString()
}

const normalizeRecordedAt = (value: string, fallbackIso: string): string => {
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return fallbackIso
  }
  return new Date(parsed).toISOString()
}

const migrateLegacyResponses = (
  legacyEntries: unknown[],
): Map<string, JourneyPromptResponse[]> => {
  const sanitized = legacyEntries
    .map((entry) => sanitizeResponseEntry(entry, 'legacy'))
    .filter((entry): entry is JourneyPromptResponse => Boolean(entry))

  if (sanitized.length === 0) {
    if (isBrowser) {
      try {
        window.localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify({}))
      } catch (error) {
        console.warn('Failed to clear empty legacy journey responses', error)
      }
    }
    return new Map()
  }

  const grouped = new Map<string, JourneyPromptResponse[]>()
  sanitized.forEach((entry) => {
    const key = entry.sessionId && entry.sessionId !== 'legacy' ? entry.sessionId : 'legacy'
    const list = grouped.get(key) ?? []
    list.push(entry)
    grouped.set(key, list)
  })

  const migrated = new Map<string, JourneyPromptResponse[]>()

  grouped.forEach((entries, key) => {
    const earliest = getEarliestTimestamp(entries)
    const createdAtIso = normalizeTimestampIsoString(earliest)

    const sessionRecord =
      key === 'legacy'
        ? (() => {
            const created = createSessionRecord()
            return { ...created, createdAt: createdAtIso }
          })()
        : { id: key, createdAt: createdAtIso }

    const normalizedEntries = entries.map((entry) => ({
      ...entry,
      sessionId: sessionRecord.id,
      recordedAt: normalizeRecordedAt(entry.recordedAt, createdAtIso),
    }))

    migrated.set(sessionRecord.id, normalizedEntries)

    if (!isBrowser) {
      return
    }

    try {
      persistResponsesForSession(sessionRecord.id, normalizedEntries)
    } catch (error) {
      console.warn('Failed to persist migrated journey responses', error)
    }
    appendSessionHistory(sessionRecord)
  })

  return migrated
}

const readResponsesForSession = (sessionId: string): JourneyPromptResponse[] => {
  if (!isBrowser || !sessionId) {
    return []
  }
  const raw = window.localStorage.getItem(RESPONSES_STORAGE_KEY)
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      const migrated = migrateLegacyResponses(parsed)
      return migrated.get(sessionId) ?? []
    }
    if (typeof parsed === 'object' && parsed !== null) {
      const archive = parsed as JourneyResponseArchive
      const list = Array.isArray(archive[sessionId]) ? archive[sessionId] : []
      return list
        .map((entry) => sanitizeResponseEntry(entry, sessionId))
        .filter((entry): entry is JourneyPromptResponse => Boolean(entry))
        .filter((entry) => entry.sessionId === sessionId)
    }
    return []
  } catch (error) {
    console.warn('Failed to read stored journey responses', error)
    return []
  }
}

const persistResponsesForSession = (
  sessionId: string,
  responses: JourneyPromptResponse[]
) => {
  if (!isBrowser || !sessionId) {
    return
  }
  try {
    const raw = window.localStorage.getItem(RESPONSES_STORAGE_KEY)
    let archive: JourneyResponseArchive = {}
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            archive[key] = value as JourneyPromptResponse[]
          }
        })
      }
    }
    archive[sessionId] = responses
    window.localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(archive))
  } catch (error) {
    throw error
  }
}

const readQuizStatsArchive = (): JourneyQuizStatsArchive => {
  if (!isBrowser) {
    return {}
  }
  const raw = window.localStorage.getItem(QUIZ_STATS_STORAGE_KEY)
  if (!raw) {
    return {}
  }
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null) {
      const archive: JourneyQuizStatsArchive = {}
      Object.entries(parsed as Record<string, unknown>).forEach(([sessionId, value]) => {
        if (typeof value !== 'object' || value === null) {
          return
        }
        const stats = value as Record<string, unknown>
        const correctCount = Number(stats.correctCount)
        const answeredCount = Number(stats.answeredCount)
        const recordedAt =
          typeof stats.recordedAt === 'string' ? stats.recordedAt : new Date().toISOString()
        if (Number.isNaN(correctCount) || Number.isNaN(answeredCount)) {
          return
        }
        archive[sessionId] = {
          correctCount,
          answeredCount,
          recordedAt,
        }
      })
      return archive
    }
    return {}
  } catch (error) {
    console.warn('Failed to read journey quiz stats', error)
    return {}
  }
}

const persistQuizStatsForSession = (sessionId: string, stats: JourneyQuizStats) => {
  if (!isBrowser || !sessionId) {
    return
  }
  const archive = readQuizStatsArchive()
  archive[sessionId] = stats
  try {
    window.localStorage.setItem(QUIZ_STATS_STORAGE_KEY, JSON.stringify(archive))
  } catch (error) {
    console.warn('Failed to persist journey quiz stats', error)
  }
}

export const useStoredJourneyResponses = () => {
  const initialSession = ensureSession()
  const [session, setSession] = useState<JourneySessionInfo>(initialSession)
  const [responses, setResponses] = useState<JourneyPromptResponse[]>(() =>
    readResponsesForSession(initialSession.id)
  )

  useEffect(() => {
    if (!isBrowser) {
      return
    }

    let requiresNormalization = false
    const normalized = responses.map((entry) => {
      if (entry.sessionId === session.id) {
        return entry
      }
      requiresNormalization = true
      return { ...entry, sessionId: session.id }
    })

    if (requiresNormalization) {
      setResponses(normalized)
      return
    }

    try {
      persistResponsesForSession(session.id, normalized)
    } catch (error) {
      console.warn('Failed to persist journey responses', error)
    }

    const quizEntries = normalized.filter((entry) => entry.questionType === 'choice')
    const stats: JourneyQuizStats = {
      correctCount: quizEntries.filter((entry) => entry.isCorrect === true).length,
      answeredCount: quizEntries.length,
      recordedAt: new Date().toISOString(),
    }
    persistQuizStatsForSession(session.id, stats)
  }, [responses, session])

  const commitSession = useCallback((next: JourneySessionInfo) => {
    const normalized = withCurrentBuild(next)
    setSession((prev) => {
      if (prev.id === normalized.id && prev.createdAt === normalized.createdAt) {
        return prev
      }
      if (isBrowser) {
        writeCurrentSession(normalized)
        appendSessionHistory(normalized)
      }
      return normalized
    })
  }, [])

  const beginNewSession = useCallback(() => {
    const next = createSessionRecord()
    if (isBrowser) {
      writeCurrentSession(next)
      appendSessionHistory(next)
    }
    setSession(next)
    setResponses([])
  }, [])

  const saveResponse = useCallback(
    (payload: SaveJourneyResponsePayload) => {
      const timestamp = new Date().toISOString()
      setResponses((prev) => {
        const filtered = prev.filter((entry) => entry.storageKey !== payload.storageKey)
        const updated: JourneyPromptResponse = {
          ...payload,
          sessionId: session.id,
          recordedAt: timestamp,
        }
        return [...filtered, updated]
      })
    },
    [session.id]
  )

  const clearResponses = useCallback(() => {
    setResponses([])
  }, [])

  const replaceResponses = useCallback(
    (items: JourneyPromptResponse[], sessionOverride?: JourneySessionInfo) => {
      const targetSession = sessionOverride ? withCurrentBuild(sessionOverride) : session
      commitSession(targetSession)
      setResponses(
        items.map((entry) =>
          entry.sessionId === targetSession.id
            ? { ...entry }
            : { ...entry, sessionId: targetSession.id }
        )
      )
    },
    [commitSession, session]
  )

  return {
    responses,
    saveResponse,
    clearResponses,
    replaceResponses,
    session,
    beginNewSession,
  }
}
