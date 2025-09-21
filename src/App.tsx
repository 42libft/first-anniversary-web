import { useMemo, useState } from 'react'

import './App.css'
import { DistanceHUD } from './components/DistanceHUD'
import { GlobalStarfield } from './components/GlobalStarfield'
import { BuildStamp } from './components/BuildStamp'
import { journeys } from './data/journeys'
import { useStoredJourneyResponses } from './hooks/useStoredJourneyResponses'
import { IntroScene } from './scenes/IntroScene'
import { JourneysScene } from './scenes/JourneysScene'
import { LetterScene } from './scenes/LetterScene'
import { LikesScene } from './scenes/LikesScene'
import { MeetupsScene } from './scenes/MeetupsScene'
import { MessagesScene } from './scenes/MessagesScene'
import { PrologueScene } from './scenes/PrologueScene'
import { ResultScene } from './scenes/ResultScene'
import type { SceneId, SceneComponentProps } from './types/scenes'
import { sceneOrder } from './types/scenes'

const sceneTitleMap: Record<SceneId, string> = {
  intro: 'Intro',
  prologue: 'Prologue',
  journeys: 'Journeys',
  messages: 'Messages',
  likes: 'Likes',
  meetups: 'Meetups',
  letter: 'Letter',
  result: 'Result',
}

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
    case 'meetups':
      return <MeetupsScene {...props} />
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
  const currentSceneId = sceneOrder[sceneIndex]

  const totalJourneyDistance = useMemo(
    () => journeys.reduce((sum, journey) => sum + journey.distanceKm, 0),
    []
  )

  const [distanceTraveled, setDistanceTraveled] = useState(0)

  const { responses, saveResponse } = useStoredJourneyResponses()

  const goToScene = (sceneId: SceneId) => {
    const targetIndex = sceneOrder.indexOf(sceneId)
    if (targetIndex === -1) {
      return
    }

    setSceneIndex(targetIndex)
  }

  const goToNextScene = () => {
    setSceneIndex((index) =>
      Math.min(index + 1, sceneOrder.length - 1)
    )
  }

  const restartExperience = () => {
    setSceneIndex(0)
    setDistanceTraveled(0)
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
  }

  return (
    <div className={`app-shell scene-${currentSceneId}`}>
      {(['intro', 'prologue'] as SceneId[]).includes(currentSceneId) && (
        <GlobalStarfield />
      )}
      <DistanceHUD distanceKm={distanceTraveled} />
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
