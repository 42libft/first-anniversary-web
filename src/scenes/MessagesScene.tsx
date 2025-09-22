import { useEffect, useMemo, useState } from 'react'

import { CanvasMemoryStream } from '../components/CanvasMemoryStream'
import { messageMilestones } from '../data/messages'
import type { SceneComponentProps } from '../types/scenes'

const formatNumber = (value: number) => value.toLocaleString('ja-JP')

// フルブリードのメディアアートに刷新したMessagesシーン
export const MessagesScene = ({ onAdvance }: SceneComponentProps) => {
  const FINAL_TARGET = 41086
  const TAPS_TO_COMPLETE = 120
  const TAP_INCREMENT = Math.ceil(FINAL_TARGET / TAPS_TO_COMPLETE)
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState<'play' | 'announce' | 'cta'>('play')
  const [ctaVisible, setCtaVisible] = useState(false)

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

  // カウントが満了したらアナウンス→CTA
  useEffect(() => {
    if (phase !== 'play') return
    if (count >= FINAL_TARGET) {
      setPhase('announce')
      const t = setTimeout(() => {
        setCtaVisible(true)
        setPhase('cta')
      }, 2200)
      return () => clearTimeout(t)
    }
  }, [count, phase])

  const handleReveal = () => {
    setCount((c) => (c < FINAL_TARGET ? Math.min(FINAL_TARGET, c + TAP_INCREMENT) : c))
  }

  return (
    <section className="messages-full" role="presentation" aria-label="画面全体で文字の流れを楽しむメディアアート">
      {/* フルブリードCanvas（背景メディアアート） */}
      <CanvasMemoryStream messages={messageStrings} onReveal={handleReveal} disabled={phase !== 'play'} />

      {/* 極小HUD（枠なし・重ね文字） */}
      <header className="messages-hud" aria-hidden>
        <div className="messages-hud__left">
          <p className="messages-eyebrow">MESSAGES</p>
          <p className="messages-sub">夜空に言葉を流す</p>
        </div>
      </header>

      {/* 画面中央の大きなカウント */}
      <div className="messages-count-center" aria-hidden>{formatNumber(count)}</div>

      {phase === 'play' && <div className="messages-hint">タップで流す</div>}

      {phase !== 'play' && (
        <div className="messages-announce" role="status">
          <p className="messages-announce__line">１年間で二人が送った</p>
          <p className="messages-announce__count">{formatNumber(count)}</p>
          <p className="messages-announce__line">総メッセージ数でした！</p>
        </div>
      )}

      {phase === 'cta' && ctaVisible && (
        <button
          type="button"
          className="messages-cta"
          onClick={onAdvance}
        >
          タップで次へ
        </button>
      )}
    </section>
  )
}
