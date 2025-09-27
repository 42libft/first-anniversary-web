import { useCallback, useMemo, useState } from 'react'

import './App.css'
import { SceneQuickPanel } from './components/SceneQuickPanel'
import { DistanceHUD } from './components/DistanceHUD'
import { BuildStamp } from './components/BuildStamp'
import { GlobalBackButton } from './components/GlobalBackButton'
import { journeys } from './data/journeys'
import { useStoredJourneyResponses } from './hooks/useStoredJourneyResponses'
import { useActionHistory } from './history/ActionHistoryContext'
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

  const allowMaintenanceNavigation = useMemo(() => {
    if (import.meta.env.DEV) {
      return true
    }
    if (typeof window === 'undefined') {
      return false
    }
    if (window.location.hostname === 'localhost') {
      return true
    }
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.has('maintenanceNav')) {
        return true
      }
      return window.localStorage.getItem('first-anniversary-web:maintenance-nav') === '1'
    } catch (error) {
      console.warn('Failed to read maintenance navigation flag', error)
      return false
    }
  }, [])

  const totalJourneyDistance = useMemo(
    () => journeys.reduce((sum, journey) => sum + journey.distanceKm, 0),
    []
  )

  const [distanceTraveled, setDistanceTraveled] = useState(0)

  const { responses, saveResponse, replaceResponses } = useStoredJourneyResponses()
  const { record } = useActionHistory()

  const introLocked = !allowMaintenanceNavigation && introBootState !== 'ready'

  const createSnapshot = useCallback(() => {
    return {
      sceneIndex,
      distanceTraveled,
      introBootState,
      responses: responses.map((entry) => ({ ...entry })),
    }
  }, [sceneIndex, distanceTraveled, introBootState, responses])

  const recordSnapshot = useCallback(
    (label?: string) => {
      const snapshot = createSnapshot()
      record(() => {
        setSceneIndex(snapshot.sceneIndex)
        setDistanceTraveled(snapshot.distanceTraveled)
        setIntroBootState(snapshot.introBootState)
        replaceResponses(snapshot.responses.map((entry) => ({ ...entry })))
      }, { label })
    },
    [createSnapshot, record, replaceResponses]
  )

  const goToScene = (sceneId: SceneId) => {
    const targetIndex = sceneOrder.indexOf(sceneId)
    if (targetIndex === -1) {
      return
    }
    if (introLocked && currentSceneId === 'intro' && sceneId !== 'intro') {
      return
    }
    if (targetIndex === sceneIndex) {
      return
    }
    recordSnapshot(`Scene to ${sceneId}`)
    setSceneIndex(targetIndex)
  }

  const goToNextScene = () => {
    if (introLocked && currentSceneId === 'intro') {
      return
    }
    if (sceneIndex >= sceneOrder.length - 1) {
      return
    }
    recordSnapshot('Next scene')
    setSceneIndex(sceneIndex + 1)
  }

  const goToPreviousScene = () => {
    if (sceneIndex <= 0) {
      return
    }
    recordSnapshot('Previous scene')
    setSceneIndex(sceneIndex - 1)
  }

  const restartExperience = () => {
    if (sceneIndex === 0 && distanceTraveled === 0 && introBootState === 'loading') {
      return
    }
    recordSnapshot('Restart experience')
    setSceneIndex(0)
    setDistanceTraveled(0)
    setIntroBootState('loading')
  }

  const saveResponseWithHistory = useCallback(
    (payload: Parameters<typeof saveResponse>[0]) => {
      const existing = responses.find((entry) => entry.storageKey === payload.storageKey)
      if (existing && existing.answer === payload.answer) {
        saveResponse(payload)
        return
      }
      recordSnapshot('Save response')
      saveResponse(payload)
    },
    [recordSnapshot, responses, saveResponse]
  )

  const sceneProps: SceneComponentProps = {
    onAdvance: goToNextScene,
    goToScene,
    onRestart: restartExperience,
    journeys,
    distanceTraveled,
    totalJourneyDistance,
    responses,
    saveResponse: saveResponseWithHistory,
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
      <GlobalBackButton />
    </div>
  )
}

export default App
