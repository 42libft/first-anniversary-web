import { useCallback, useState } from 'react'

import { LetterExperience, type InteractionStage } from '../components/LetterExperience'
import { SceneLayout } from '../components/SceneLayout'
import type { SceneComponentProps } from '../types/scenes'

export const LetterScene = ({ onAdvance }: SceneComponentProps) => {
  const [canAdvance, setCanAdvance] = useState(false)

  const handleStageChange = useCallback((stage: InteractionStage) => {
    setCanAdvance(stage === 'revealed')
  }, [])

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
