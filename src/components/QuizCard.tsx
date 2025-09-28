import { useEffect, useState } from 'react'
import { loadQuizAnswer, saveQuizAnswer, type StoredQuizAnswer } from '../utils/quizStorage'

export type QuizOption = { value: string; label: string; meta?: string }

type QuizCardProps = {
  id: string
  question: string
  options: QuizOption[]
  correct?: string
  hint?: string
  onAnswered?: (value: string, stored: StoredQuizAnswer) => void
  lockAfterSave?: boolean
  sessionId: string
}

export const QuizCard = ({
  id,
  question,
  options,
  correct,
  hint,
  onAnswered,
  lockAfterSave = true,
  sessionId,
}: QuizCardProps) => {
  const [saved, setSaved] = useState<StoredQuizAnswer | undefined>(() =>
    sessionId ? loadQuizAnswer(id, sessionId) : undefined
  )
  const [selected, setSelected] = useState<string | null>(() => saved?.answer ?? null)

  useEffect(() => {
    if (!sessionId) {
      setSaved(undefined)
      setSelected(null)
      return
    }
    const entry = loadQuizAnswer(id, sessionId)
    setSaved(entry)
    setSelected(entry?.answer ?? null)
  }, [id, sessionId])

  const isLocked = lockAfterSave && !!saved
  const isCorrect = correct ? selected === correct : undefined

  const handleSelect = (value: string) => {
    if (isLocked || !sessionId) return
    setSelected(value)
    const entry = saveQuizAnswer(id, value, sessionId)
    setSaved(entry)
    onAnswered?.(value, entry)
  }

  return (
    <section className="quiz-card" aria-live="polite">
      <p className="quiz-card__question">{question}</p>
      <div className="quiz-card__options">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            className={`quiz-option${selected === opt.value ? ' is-selected' : ''}${
              selected && correct && opt.value === correct ? ' is-correct' : ''
            }`}
            aria-pressed={selected === opt.value}
            disabled={isLocked}
          >
            <span className="quiz-option__label">{opt.label}</span>
            {opt.meta ? <span className="quiz-option__meta">{opt.meta}</span> : null}
          </button>
        ))}
      </div>
      {selected ? (
        correct ? (
          <p className={`quiz-card__feedback${isCorrect ? ' is-success' : ' is-error'}`}>
            {isCorrect ? '正解！' : '惜しい…'}
          </p>
        ) : null
      ) : hint ? (
        <p className="quiz-card__hint">{hint}</p>
      ) : null}
    </section>
  )
}
