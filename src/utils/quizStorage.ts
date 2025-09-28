const isBrowser = typeof window !== 'undefined'

export type StoredQuizAnswer = {
  id: string
  answer: string
  recordedAt: string
  sessionId: string
}

type QuizAnswerArchive = Record<string, Record<string, StoredQuizAnswer>>

const STORAGE_KEY = 'first-anniversary-web:journey-quiz-answers'

const isStoredQuizAnswer = (value: unknown): value is StoredQuizAnswer => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const entry = value as Record<string, unknown>
  return (
    typeof entry.id === 'string' &&
    typeof entry.answer === 'string' &&
    typeof entry.recordedAt === 'string' &&
    typeof entry.sessionId === 'string'
  )
}

const readArchive = (): QuizAnswerArchive => {
  if (!isBrowser) {
    return {}
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return {}
    }

    const archive: QuizAnswerArchive = {}
    Object.entries(parsed as Record<string, unknown>).forEach(([sessionId, value]) => {
      if (typeof value !== 'object' || value === null) {
        return
      }
      const sessionEntries: Record<string, StoredQuizAnswer> = {}
      Object.entries(value as Record<string, unknown>).forEach(([quizId, entry]) => {
        if (isStoredQuizAnswer(entry)) {
          sessionEntries[quizId] = entry
        }
      })
      archive[sessionId] = sessionEntries
    })
    return archive
  } catch (error) {
    console.warn('Failed to read stored quiz answers', error)
    return {}
  }
}

const writeArchive = (archive: QuizAnswerArchive) => {
  if (!isBrowser) {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(archive))
  } catch (error) {
    console.warn('Failed to persist quiz answers', error)
  }
}

export const loadQuizAnswer = (
  id: string,
  sessionId: string
): StoredQuizAnswer | undefined => {
  if (!sessionId) {
    return undefined
  }
  const archive = readArchive()
  return archive[sessionId]?.[id]
}

export const saveQuizAnswer = (
  id: string,
  answer: string,
  sessionId: string
): StoredQuizAnswer => {
  const entry: StoredQuizAnswer = {
    id,
    answer,
    recordedAt: new Date().toISOString(),
    sessionId,
  }

  const archive = readArchive()
  const sessionEntries = archive[sessionId] ?? {}
  sessionEntries[id] = entry
  archive[sessionId] = sessionEntries
  writeArchive(archive)
  return entry
}

export const clearQuizAnswersForSession = (sessionId: string) => {
  if (!sessionId) {
    return
  }
  const archive = readArchive()
  if (!(sessionId in archive)) {
    return
  }
  delete archive[sessionId]
  writeArchive(archive)
}
