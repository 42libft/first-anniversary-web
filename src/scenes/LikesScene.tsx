import { useCallback, useEffect, useRef } from 'react'

import {
  CanvasHeartWaves,
  DEFAULT_HEART_WAVE_SETTINGS,
  type HeartWaveSettings,
} from '../components/CanvasHeartWaves'
import { totalLikes } from '../data/likes'
import type { SceneComponentProps } from '../types/scenes'
import { useActionHistory } from '../history/ActionHistoryContext'
import { useHistoryTrackedState } from '../history/useHistoryTrackedState'

const FINAL_TARGET = totalLikes
const TAPS_TO_COMPLETE = 42
const TAP_INCREMENT = Math.ceil(FINAL_TARGET / TAPS_TO_COMPLETE)

const formatNumber = (value: number) => value.toLocaleString('ja-JP')

export const LikesScene = ({ onAdvance }: SceneComponentProps) => {
  const [count, setCount] = useHistoryTrackedState(
    'likes:count',
    Math.min(24, FINAL_TARGET)
  )
  const [phase, setPhase] = useHistoryTrackedState<'play' | 'announce' | 'cta'>(
    'likes:phase',
    FINAL_TARGET > 0 ? 'play' : 'announce'
  )
  const [ctaVisible, setCtaVisible] = useHistoryTrackedState('likes:ctaVisible', false)
  const [showTopLine, setShowTopLine] = useHistoryTrackedState('likes:showTopLine', false)
  const [showBottomLine, setShowBottomLine] = useHistoryTrackedState(
    'likes:showBottomLine',
    false
  )
  const waveSettingsRef = useRef<HeartWaveSettings>({ ...DEFAULT_HEART_WAVE_SETTINGS })
  const timersRef = useRef<number[]>([])
  const { record } = useActionHistory()

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    timersRef.current = []
  }, [])

  const scheduleTimer = useCallback((handler: () => void, delay: number) => {
    const timerId = window.setTimeout(() => {
      handler()
      timersRef.current = timersRef.current.filter((id) => id !== timerId)
    }, delay)
    timersRef.current.push(timerId)
    return timerId
  }, [])

  useEffect(() => {
    if (phase !== 'play') return
    if (count >= FINAL_TARGET) {
      setPhase('announce', { record: false })
    }
  }, [FINAL_TARGET, count, phase, setPhase])

  useEffect(() => {
    if (phase !== 'announce') return
    setShowTopLine(false, { record: false })
    setShowBottomLine(false, { record: false })
    setCtaVisible(false, { record: false })
    const t1 = scheduleTimer(() => setShowTopLine(true, { record: false }), 1200)
    const t2 = scheduleTimer(() => setShowBottomLine(true, { record: false }), 2600)
    const t3 = scheduleTimer(() => {
      setCtaVisible(true, { record: false })
      setPhase('cta', { record: false })
    }, 4600)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      timersRef.current = timersRef.current.filter(
        (timerId) => timerId !== t1 && timerId !== t2 && timerId !== t3
      )
    }
  }, [phase, scheduleTimer, setCtaVisible, setPhase, setShowBottomLine, setShowTopLine])

  useEffect(() => () => clearTimers(), [clearTimers])

  const handlePulse = () => {
    if (phase !== 'play') return
    const step = Math.max(1, Math.ceil(TAP_INCREMENT / 2))
    const snapshot = {
      count,
      phase,
      ctaVisible,
      showTopLine,
      showBottomLine,
    }

    clearTimers()

    record(() => {
      clearTimers()
      setCount(snapshot.count, { record: false })
      setPhase(snapshot.phase, { record: false })
      setCtaVisible(snapshot.ctaVisible, { record: false })
      setShowTopLine(snapshot.showTopLine, { record: false })
      setShowBottomLine(snapshot.showBottomLine, { record: false })
    }, { label: 'Likes: pulse tap' })

    let iteration = 0
    const tick = () => {
      setCount((prev) => {
        if (prev >= FINAL_TARGET) return prev
        const next = Math.min(FINAL_TARGET, prev + step)
        return next
      }, { record: false })
      iteration += 1
      if (iteration < 2) {
        scheduleTimer(tick, 140)
      }
    }
    tick()
  }

  return (
    <section
      className="likes-full"
      role="presentation"
      aria-label="好きのカウントをハートのメディアアートで楽しむ"
    >
      <CanvasHeartWaves
        disabled={phase !== 'play'}
        onPulse={handlePulse}
        settings={waveSettingsRef.current}
      />

      <div className="likes-count-center" aria-hidden>
        {formatNumber(count)}
      </div>

      {phase !== 'play' && (
        <div className="likes-announce" role="status">
          <div className="likes-announce__layout">
            {showTopLine && (
              <p className="likes-announce__line likes-announce__line--top">
                １年間で送った「好き」は
              </p>
            )}
            {showBottomLine && (
              <p className="likes-announce__line likes-announce__line--bottom">
                全部でこの回数になりました
              </p>
            )}
          </div>
        </div>
      )}

      {phase === 'cta' && ctaVisible && (
        <div className="likes-cta-wrap">
          <button
            type="button"
            className="likes-cta"
            onClick={onAdvance}
          >
            タップで次へ
          </button>
        </div>
      )}

    </section>
  )
}
