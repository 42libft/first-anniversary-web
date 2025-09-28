import { useCallback, useMemo, useState } from 'react'

import { LetterExperience, type InteractionStage } from '../components/LetterExperience'
import { SceneLayout } from '../components/SceneLayout'
import type { SceneComponentProps } from '../types/scenes'
import { useActionHistory } from '../history/ActionHistoryContext'

import './LetterScene.css'

const LETTER_ENVELOPE_IMAGE = {
  src: '/images/letters/20250929022653_005.jpg',
  alt: '手紙が入った封筒のスキャン画像',
}

const LETTER_PAGE_IMAGES = [
  { src: '/images/letters/20250929022653_001.jpg', alt: '手紙の1枚目' },
  { src: '/images/letters/20250929022653_002.jpg', alt: '手紙の2枚目' },
  { src: '/images/letters/20250929022653_003.jpg', alt: '手紙の3枚目' },
  { src: '/images/letters/20250929022653_004.jpg', alt: '手紙の4枚目' },
]

export const LetterScene = ({ onAdvance }: SceneComponentProps) => {
  const [canAdvance, setCanAdvance] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isLetterOpen, setIsLetterOpen] = useState(false)
  const [letterPageIndex, setLetterPageIndex] = useState(0)
  const { record } = useActionHistory()

  const handleStageChange = useCallback((stage: InteractionStage) => {
    setIsRevealed(stage === 'revealed')
    if (stage !== 'revealed') {
      setIsLetterOpen(false)
      setLetterPageIndex(0)
    }

    setCanAdvance((prev) => {
      const next = stage === 'revealed'
      if (next === prev) {
        return prev
      }
      record(() => {
        setCanAdvance(prev)
      }, { label: `Letter: stage ${stage}` })
      return next
    })
  }, [record])

  const pageCount = LETTER_PAGE_IMAGES.length
  const hasPages = pageCount > 0

  const handleLetterInteraction = useCallback(() => {
    if (!isRevealed || !hasPages) {
      return
    }

    if (!isLetterOpen) {
      setIsLetterOpen(true)
      setLetterPageIndex(0)
      return
    }

    setLetterPageIndex((index) => (index + 1) % pageCount)
  }, [hasPages, isLetterOpen, isRevealed, pageCount])

  const handleNextPage = useCallback(() => {
    if (!hasPages) {
      return
    }

    if (!isLetterOpen) {
      setIsLetterOpen(true)
      setLetterPageIndex(0)
      return
    }

    setLetterPageIndex((index) => (index + 1) % pageCount)
  }, [hasPages, isLetterOpen, pageCount])

  const handlePrevPage = useCallback(() => {
    if (!isLetterOpen || !hasPages) {
      return
    }

    setLetterPageIndex((index) => (index - 1 + pageCount) % pageCount)
  }, [hasPages, isLetterOpen, pageCount])

  const handleCloseLetter = useCallback(() => {
    setIsLetterOpen(false)
    setLetterPageIndex(0)
  }, [])

  const currentLetterImage = useMemo(() => {
    if (!isRevealed) {
      return undefined
    }

    if (!isLetterOpen || !hasPages) {
      return LETTER_ENVELOPE_IMAGE
    }

    return LETTER_PAGE_IMAGES[letterPageIndex] ?? LETTER_PAGE_IMAGES[0]
  }, [hasPages, isLetterOpen, isRevealed, letterPageIndex])

  const letterActionLabel = useMemo(() => {
    if (!isRevealed) {
      return undefined
    }

    if (!isLetterOpen || !hasPages) {
      return '封筒を開いて手紙を表示'
    }

    return '手紙の次のページを表示'
  }, [hasPages, isLetterOpen, isRevealed])

  const advanceHandler = canAdvance ? onAdvance : undefined
  const pageNumber = hasPages ? letterPageIndex + 1 : 0

  return (
    <SceneLayout
      hideHeader
      onAdvance={advanceHandler}
      advanceLabel="Resultへ"
    >
      <LetterExperience
        onStageChange={handleStageChange}
        letterImage={currentLetterImage}
        onLetterClick={handleLetterInteraction}
        letterActionLabel={letterActionLabel}
      />
      {isRevealed && (
        <div className="letter-scene__viewer" role="group" aria-label="手紙の表示コントロール">
          <p className="letter-scene__instruction">
            {isLetterOpen && hasPages
              ? '画像をタップするかボタンでページをめくれます。'
              : '封筒をタップすると中の手紙を表示します。'}
          </p>
          <div className="letter-scene__controls">
            <button
              type="button"
              className="letter-scene__button"
              onClick={handlePrevPage}
              disabled={!isLetterOpen || !hasPages}
            >
              前のページ
            </button>
            <span className="letter-scene__status" role="status" aria-live="polite">
              {isLetterOpen && hasPages ? `ページ ${pageNumber} / ${pageCount}` : '封筒を表示中'}
            </span>
            <button
              type="button"
              className="letter-scene__button"
              onClick={handleNextPage}
              disabled={!hasPages}
            >
              {isLetterOpen && hasPages ? '次のページ' : '封筒を開く'}
            </button>
          </div>
          {isLetterOpen && hasPages && (
            <button
              type="button"
              className="letter-scene__button letter-scene__button--secondary"
              onClick={handleCloseLetter}
            >
              封筒に戻す
            </button>
          )}
        </div>
      )}
    </SceneLayout>
  )
}
