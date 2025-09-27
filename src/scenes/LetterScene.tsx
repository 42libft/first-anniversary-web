import { useCallback, useState } from 'react'

import { LetterExperience, type InteractionStage } from '../components/LetterExperience'
import { SceneLayout } from '../components/SceneLayout'
import type { SceneComponentProps } from '../types/scenes'
import { useActionHistory } from '../history/ActionHistoryContext'

export const LetterScene = ({ onAdvance }: SceneComponentProps) => {
  const [canAdvance, setCanAdvance] = useState(false)
  const { record } = useActionHistory()

  const handleStageChange = useCallback((stage: InteractionStage) => {
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

  const advanceHandler = canAdvance ? onAdvance : undefined

  return (
    <SceneLayout
      hideHeader
      onAdvance={advanceHandler}
      advanceLabel="Resultへ"
    >
      <LetterExperience onStageChange={handleStageChange} />
    </SceneLayout>
  )
}
