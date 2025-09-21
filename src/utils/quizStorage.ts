export type StoredQuizAnswer = {
  id: string
  answer: string
  recordedAt: string
}

const keyFor = (id: string) => `quiz:${id}`

export const loadQuizAnswer = (id: string): StoredQuizAnswer | undefined => {
  try {
    const raw = localStorage.getItem(keyFor(id))
    return raw ? (JSON.parse(raw) as StoredQuizAnswer) : undefined
  } catch {
    return undefined
  }
}

export const saveQuizAnswer = (id: string, answer: string): StoredQuizAnswer => {
  const entry: StoredQuizAnswer = {
    id,
    answer,
    recordedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(keyFor(id), JSON.stringify(entry))
  } catch {
    // ignore
  }
  return entry
}

