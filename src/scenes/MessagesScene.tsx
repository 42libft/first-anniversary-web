import { useCallback, useEffect, useMemo, useRef } from 'react'

import { CanvasMemoryStream } from '../components/CanvasMemoryStream'
import { messageMilestones } from '../data/messages'
import type { SceneComponentProps } from '../types/scenes'
import { useActionHistory } from '../history/ActionHistoryContext'
import { useHistoryTrackedState } from '../history/useHistoryTrackedState'

const formatNumber = (value: number) => value.toLocaleString('ja-JP')

// フルブリードのメディアアートに刷新したMessagesシーン
export const MessagesScene = ({ onAdvance }: SceneComponentProps) => {
  const FINAL_TARGET = 41086
  const TAPS_TO_COMPLETE = 120
  const TAP_INCREMENT = Math.ceil(FINAL_TARGET / TAPS_TO_COMPLETE)
  const [count, setCount] = useHistoryTrackedState('messages:count', 0)
  const [phase, setPhase] = useHistoryTrackedState<'play' | 'announce' | 'cta'>(
    'messages:phase',
    'play'
  )
  const [ctaVisible, setCtaVisible] = useHistoryTrackedState('messages:ctaVisible', false)
  const [showTopLine, setShowTopLine] = useHistoryTrackedState('messages:showTopLine', false)
  const [showBottomLine, setShowBottomLine] = useHistoryTrackedState(
    'messages:showBottomLine',
    false
  )
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

  // 文字プール（既存のプレビューとハイライトを合成）
  const messageStrings = useMemo(() => {
    const out: string[] = []
    messageMilestones.forEach((m) => {
      m.preview.forEach((p) => out.push(p.text))
      m.highlight.split('。').forEach((s) => {
        const t = s.trim()
        if (t) out.push(t)
      })
    })
    return out.length ? out : ['だいすき']
  }, [])

  // カウント満了でannounceへ一度だけ遷移
  useEffect(() => {
    if (phase !== 'play') return
    if (count >= FINAL_TARGET) {
      setPhase('announce', { record: false })
    }
  }, [FINAL_TARGET, count, phase, setPhase])

  // announceに入ったら行ごとのフェード→CTAの順で表示
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

  const handleReveal = () => {
    if (phase !== 'play') return
    // 1タップで3段階に分けて加算（約1/3ずつ）
    const step = Math.ceil(TAP_INCREMENT / 3)
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
    }, { label: 'Messages: reveal tap' })

    let i = 0
    const tick = () => {
      setCount((c) => {
        if (c >= FINAL_TARGET) return c
        const next = Math.min(FINAL_TARGET, c + step)
        return next
      }, { record: false })
      i += 1
      if (i < 3) {
        scheduleTimer(tick, 120)
      }
    }
    tick()
  }

  return (
    <section className="messages-full" role="presentation" aria-label="画面全体で文字の流れを楽しむメディアアート">
      {/* フルブリードCanvas（背景メディアアート） */}
      <CanvasMemoryStream messages={messageStrings} onReveal={handleReveal} disabled={phase !== 'play'} />

      {/* HUDテキストは非表示（固定デザインのため削除） */}

      {/* 画面中央の大きなカウント */}
      <div className="messages-count-center" aria-hidden>{formatNumber(count)}</div>

      {/* タップ誘導のテキストは非表示 */}

      {phase !== 'play' && (
        <div className="messages-announce" role="status">
          <div className="messages-announce__layout">
            {showTopLine && (
              <p className="messages-announce__line messages-announce__line--top">１年間で二人が送った</p>
            )}
            {/* 中央のカウント（messages-count-center）を再利用するため、ここでは数字を描画しない */}
            {showBottomLine && (
              <p className="messages-announce__line messages-announce__line--bottom">総メッセージ数でした！</p>
            )}
          </div>
        </div>
      )}

      {phase === 'cta' && ctaVisible && (
        <div className="scene-floating-cta scene-floating-cta--messages">
          <button
            type="button"
            className="scene-floating-cta__button"
            onClick={onAdvance}
          >
            タップで次へ
          </button>
        </div>
      )}
    </section>
  )
}
