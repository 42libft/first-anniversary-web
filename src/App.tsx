import { useCallback, useMemo, useState, type CSSProperties } from 'react'

import './App.css'
import { SceneQuickPanel } from './components/SceneQuickPanel'
import { DistanceHUD } from './components/DistanceHUD'
import { GlobalBackButton } from './components/GlobalBackButton'
import { journeys } from './data/journeys'
import { useStoredJourneyResponses } from './hooks/useStoredJourneyResponses'
import { useActionHistory } from './history/ActionHistoryContext'
import { IntroScene } from './scenes/IntroScene'
import { IntroStartScene } from './scenes/IntroStartScene'
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

const sceneBackgrounds: Record<SceneId, string> = {
  intro:
    'radial-gradient(circle at top, rgba(38, 61, 136, 0.55), transparent 60%), linear-gradient(180deg, #050516 0%, #090320 100%)',
  introStart:
    'radial-gradient(circle at 12% 18%, rgba(118, 162, 255, 0.28), transparent 62%), linear-gradient(180deg, #040720 0%, #080b26 100%)',
  prologue:
    'radial-gradient(circle at 16% 12%, rgba(120, 146, 255, 0.18), transparent 58%), radial-gradient(circle at 78% 86%, rgba(255, 169, 214, 0.16), transparent 62%), linear-gradient(180deg, #040514 0%, #070819 100%)',
  journeys:
    'radial-gradient(circle at 10% 20%, rgba(64, 196, 255, 0.18), transparent 55%), radial-gradient(circle at 78% 72%, rgba(68, 132, 255, 0.15), transparent 62%), linear-gradient(180deg, #03121f 0%, #041f2f 100%)',
  messages:
    'radial-gradient(circle at 16% 18%, rgba(255, 163, 229, 0.18), transparent 60%), radial-gradient(circle at 84% 82%, rgba(124, 174, 255, 0.2), transparent 60%), linear-gradient(180deg, #120725 0%, #1a1038 100%)',
  likes:
    'radial-gradient(circle at 14% 16%, rgba(126, 236, 255, 0.2), transparent 60%), radial-gradient(circle at 84% 74%, rgba(90, 206, 255, 0.16), transparent 62%), linear-gradient(180deg, #051422 0%, #08283a 100%)',
  links:
    'radial-gradient(circle at 12% 18%, rgba(120, 214, 255, 0.18), transparent 58%), radial-gradient(circle at 82% 78%, rgba(118, 194, 255, 0.16), transparent 60%), linear-gradient(180deg, #04121f 0%, #062034 100%)',
  media:
    'radial-gradient(circle at 20% 18%, rgba(188, 162, 255, 0.2), transparent 60%), radial-gradient(circle at 78% 82%, rgba(116, 118, 255, 0.18), transparent 62%), linear-gradient(180deg, #110726 0%, #1b0f36 100%)',
  letter:
    'radial-gradient(circle at 12% 16%, rgba(255, 202, 170, 0.2), transparent 58%), radial-gradient(circle at 88% 82%, rgba(255, 173, 149, 0.18), transparent 62%), linear-gradient(180deg, #12070f 0%, #1c0d16 100%)',
  result:
    'radial-gradient(circle at 20% 16%, rgba(255, 224, 164, 0.22), transparent 62%), radial-gradient(circle at 78% 84%, rgba(134, 162, 255, 0.18), transparent 64%), linear-gradient(180deg, #090912 0%, #121525 100%)',
}

const renderScene = (
  sceneId: SceneId,
  props: SceneComponentProps
) => {
  switch (sceneId) {
    case 'intro':
      return <IntroScene {...props} />
    case 'introStart':
      return <IntroStartScene {...props} />
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

  const { responses, saveResponse, replaceResponses, session, beginNewSession } =
    useStoredJourneyResponses()
  const { record } = useActionHistory()

  const introLocked = !allowMaintenanceNavigation && introBootState !== 'ready'

  const createSnapshot = useCallback(() => {
    return {
      sceneIndex,
      distanceTraveled,
      introBootState,
      responses: responses.map((entry) => ({ ...entry })),
      journeySession: { ...session },
    }
  }, [sceneIndex, distanceTraveled, introBootState, responses, session])

  const recordSnapshot = useCallback(
    (label?: string) => {
      const snapshot = createSnapshot()
      record(() => {
        setSceneIndex(snapshot.sceneIndex)
        setDistanceTraveled(snapshot.distanceTraveled)
        setIntroBootState(snapshot.introBootState)
        replaceResponses(
          snapshot.responses.map((entry) => ({ ...entry })),
          snapshot.journeySession
        )
      }, { label })
    },
    [createSnapshot, record, replaceResponses]
  )

  const goToScene = (sceneId: SceneId) => {
    const targetIndex = sceneOrder.indexOf(sceneId)
    if (targetIndex === -1) {
      return
    }
    if (
      introLocked &&
      currentSceneId === 'intro' &&
      sceneId !== 'intro' &&
      sceneId !== 'introStart'
    ) {
      return
    }
    if (targetIndex === sceneIndex) {
      return
    }
    recordSnapshot(`Scene to ${sceneId}`)
    setSceneIndex(targetIndex)
    if (sceneId === 'introStart') {
      setIntroBootState('ready')
    }
  }

  const goToNextScene = () => {
    if (sceneIndex >= sceneOrder.length - 1) {
      return
    }
    const nextIndex = Math.min(sceneIndex + 1, sceneOrder.length - 1)
    const nextSceneId = sceneOrder[nextIndex]
    if (introLocked && currentSceneId === 'intro' && nextSceneId !== 'introStart') {
      return
    }
    recordSnapshot('Next scene')
    setSceneIndex(nextIndex)
    if (nextSceneId === 'introStart') {
      setIntroBootState('ready')
    }
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
    beginNewSession()
  }

  const beginJourneySessionWithHistory = useCallback(() => {
    recordSnapshot('Begin journey session')
    beginNewSession()
  }, [beginNewSession, recordSnapshot])

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
    journeySession: session,
    beginJourneySession: beginJourneySessionWithHistory,
    reportIntroBootState: setIntroBootState,
  }

  const sceneStyle = useMemo(() => {
    return {
      ['--app-shell-background' as const]:
        sceneBackgrounds[currentSceneId] ?? sceneBackgrounds.intro,
    } as CSSProperties
  }, [currentSceneId])

  return (
    <div className={`app-shell scene-${currentSceneId}`} style={sceneStyle}>
      {/* HUDはJourneysのみ表示 */}
      {currentSceneId === 'journeys' && (
        <DistanceHUD distanceKm={distanceTraveled} />
      )}
      {allowMaintenanceNavigation && (
        <SceneQuickPanel
          currentSceneId={currentSceneId}
          goToScene={goToScene}
          goToNext={goToNextScene}
          goToPrevious={goToPreviousScene}
          onRestart={restartExperience}
        />
      )}
      <main className="scene-container">
        {renderScene(currentSceneId, sceneProps)}
      </main>
      <footer className="scene-footer" aria-hidden="true">
        <span className="scene-footer__label">SCENE</span>
        <span className="scene-footer__value">{sceneTitleMap[currentSceneId]}</span>
      </footer>
      <GlobalBackButton />
    </div>
  )
}

export default App
