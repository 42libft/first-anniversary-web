import { useMemo, useState } from 'react'

import './App.css'
import { SceneQuickPanel } from './components/SceneQuickPanel'
import { DistanceHUD } from './components/DistanceHUD'
import { BuildStamp } from './components/BuildStamp'
import { journeys } from './data/journeys'
import { useStoredJourneyResponses } from './hooks/useStoredJourneyResponses'
import { IntroScene } from './scenes/IntroScene'
import { JourneysScene } from './scenes/JourneysScene'
import { LetterScene } from './scenes/LetterScene'
import { LikesScene } from './scenes/LikesScene'
import { LinksScene } from './scenes/LinksScene'
import { MediaScene } from './scenes/MediaScene'
import { MessagesScene } from './scenes/MessagesScene'
import { PrologueScene } from './scenes/PrologueScene'
import { ResultScene } from './scenes/ResultScene'
import type { SceneComponentProps, SceneId } from './types/scenes'
import { sceneOrder, sceneTitleMap } from './types/scenes'

const renderScene = (
  sceneId: SceneId,
  props: SceneComponentProps
) => {
  switch (sceneId) {
    case 'intro':
      return <IntroScene {...props} />
    case 'prologue':
      return <PrologueScene {...props} />
    case 'journeys':
      return <JourneysScene {...props} />
    case 'messages':
      return <MessagesScene {...props} />
    case 'likes':
      return <LikesScene {...props} />
    case 'links':
      return <LinksScene {...props} />
    case 'media':
      return <MediaScene {...props} />
    case 'letter':
      return <LetterScene {...props} />
    case 'result':
      return <ResultScene {...props} />
    default:
      return null
  }
}

function App() {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [introBootState, setIntroBootState] = useState<'loading' | 'ready' | 'error'>('loading')
  const currentSceneId = sceneOrder[sceneIndex]

  const totalJourneyDistance = useMemo(
    () => journeys.reduce((sum, journey) => sum + journey.distanceKm, 0),
    []
  )

  const [distanceTraveled, setDistanceTraveled] = useState(0)

  const { responses, saveResponse } = useStoredJourneyResponses()

  const introLocked = introBootState !== 'ready'

  const goToScene = (sceneId: SceneId) => {
    const targetIndex = sceneOrder.indexOf(sceneId)
    if (targetIndex === -1) {
      return
    }
    if (introLocked && currentSceneId === 'intro' && sceneId !== 'intro') {
      return
    }
    setSceneIndex(targetIndex)
  }

  const goToNextScene = () => {
    if (introLocked && currentSceneId === 'intro') {
      return
    }
    setSceneIndex((index) =>
      Math.min(index + 1, sceneOrder.length - 1)
    )
  }

  const goToPreviousScene = () => {
    setSceneIndex((index) => Math.max(index - 1, 0))
  }

  const restartExperience = () => {
    setSceneIndex(0)
    setDistanceTraveled(0)
    setIntroBootState('loading')
  }

  const sceneProps: SceneComponentProps = {
    onAdvance: goToNextScene,
    goToScene,
    onRestart: restartExperience,
    journeys,
    distanceTraveled,
    totalJourneyDistance,
    responses,
    saveResponse,
    setDistanceTraveled,
    reportIntroBootState: setIntroBootState,
  }

  return (
    <div className={`app-shell scene-${currentSceneId}`}>
      {/* HUDはJourneysのみ表示 */}
      {currentSceneId === 'journeys' && (
        <DistanceHUD distanceKm={distanceTraveled} />
      )}
      <SceneQuickPanel
        currentSceneId={currentSceneId}
        goToScene={goToScene}
        goToNext={goToNextScene}
        goToPrevious={goToPreviousScene}
        onRestart={restartExperience}
      />
      <main className="scene-container">
        {renderScene(currentSceneId, sceneProps)}
      </main>
      <BuildStamp />
      <footer className="scene-footer" aria-hidden="true">
        <span className="scene-footer__label">SCENE</span>
        <span className="scene-footer__value">{sceneTitleMap[currentSceneId]}</span>
      </footer>
    </div>
  )
}

export default App
