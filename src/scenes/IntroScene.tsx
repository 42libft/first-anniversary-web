import { useEffect, useMemo, useState } from 'react'

import { AsciiStartScene } from '../components/AsciiStartScene'
import { GlobalStarfield } from '../components/GlobalStarfield'
import { preloadAssets } from '../data/preloadManifest'
import { useAssetPreloader } from '../hooks/useAssetPreloader'
import type { SceneComponentProps } from '../types/scenes'

const PROGRESS_BAR_UNITS = 24

const formatPercent = (progress: number, status: 'loading' | 'complete' | 'error' | 'idle') => {
  if (status === 'complete') return 100
  if (status === 'idle') return 0
  const value = Math.floor(progress * 100)
  return Math.max(0, Math.min(99, value))
}

const formatCategoryLabel = (label: string) => label.replace(/\//g, ' › ')

const formatRemaining = (ms: number) => {
  if (!Number.isFinite(ms) || ms <= 120) return '<1s'
  if (ms < 1000) return '<1s'
  if (ms < 90_000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.ceil(ms / 1000 / 60)
  return `${minutes}m`
}

export const IntroScene = ({ onAdvance, reportIntroBootState }: SceneComponentProps) => {
  const [stage, setStage] = useState<'terminal' | 'start'>('terminal')
  const preloader = useAssetPreloader(preloadAssets, { maxRetries: 3 })

  const {
    logs,
    status,
    progress,
    loaded,
    total,
    currentAsset,
    currentRetries,
    estimatedRemainingMs,
    hasMissing,
  } = preloader

  const lastMissingLabel = useMemo(() => {
    for (let i = logs.length - 1; i >= 0; i -= 1) {
      const entry = logs[i]
      if (entry.kind === 'missing') {
        return entry.label
      }
    }
    return undefined
  }, [logs])

  useEffect(() => {
    if (!reportIntroBootState) return
    if (status === 'complete') {
      reportIntroBootState('ready')
    } else if (status === 'error') {
      reportIntroBootState('error')
    } else {
      reportIntroBootState('loading')
    }
  }, [reportIntroBootState, status])

  useEffect(() => {
    if (stage !== 'terminal') return
    if (status === 'complete') {
      const timer = setTimeout(() => setStage('start'), 500)
      return () => clearTimeout(timer)
    }
  }, [stage, status])

  const percent = useMemo(() => formatPercent(progress, status), [progress, status])

  const progressBar = useMemo(() => {
    const rawFilled = (percent / 100) * PROGRESS_BAR_UNITS
    const filledUnits = Math.floor(rawFilled)
    const hasTail = status === 'loading' && filledUnits < PROGRESS_BAR_UNITS
    const tailChar = hasTail ? '>' : filledUnits > 0 || percent === 100 ? '=' : ' '
    const remainingUnits = PROGRESS_BAR_UNITS - filledUnits - (hasTail ? 1 : 0)
    const barCore = `${'='.repeat(filledUnits)}${hasTail ? tailChar : ''}${'.'.repeat(Math.max(0, remainingUnits))}`
    return `[${barCore}]`
  }, [percent, status])

  const progressLine = useMemo(() => {
    const counts = total > 0 ? `${loaded}/${total}` : `${loaded}`
    if (status === 'complete') {
      return `progress ${progressBar} 100% (${counts}) [done]`
    }
    if (status === 'error') {
      return `progress ${progressBar} ${percent}% (${counts}) [halted]`
    }
    if (status === 'idle') {
      return `progress ${progressBar} ${percent}% (${counts}) [idle]`
    }
    return `progress ${progressBar} ${percent}% (${counts})`
  }, [loaded, percent, progressBar, status, total])

  const footerLabel = useMemo(() => {
    if (hasMissing) {
      return {
        label: lastMissingLabel ? `missing: ${lastMissingLabel}` : 'missing asset',
        status: '再確認が必要です',
        tone: 'error',
      } as const
    }
    if (status === 'complete') {
      return {
        label: 'all assets verified',
        status: 'ready to launch',
        tone: 'success',
      } as const
    }
    const label = currentAsset?.label ?? 'queue idle'
    const remaining = estimatedRemainingMs > 0 ? `~${formatRemaining(estimatedRemainingMs)} remaining` : 'estimating…'
    const retry = currentRetries > 0 ? `retry x${currentRetries}` : null
    return {
      label,
      status: retry ? `${remaining} · ${retry}` : remaining,
      tone: 'default',
    } as const
  }, [currentAsset?.label, currentRetries, estimatedRemainingMs, hasMissing, status])

  const handleClick = () => {
    if (stage === 'start') {
      onAdvance()
    }
  }

  return (
    <section
      className={`intro-scene stage-${stage}`}
      role="button"
      onClick={handleClick}
      aria-disabled={stage !== 'start'}
      aria-label={stage === 'start' ? 'Tap to start experience' : 'Terminal boot in progress'}
    >
      {stage === 'terminal' ? (
        <div className="intro-terminal" role="status" aria-live="polite">
          <div className="intro-terminal__logs">
            <div className="terminal">
              {logs.map((line) => {
                if (line.kind === 'category') {
                  return (
                    <div
                      key={line.id}
                      className={`terminal__line terminal__line--category terminal__line--${line.status}`}
                    >
                      loading {formatCategoryLabel(line.label)} … {line.loaded}/{line.total}
                    </div>
                  )
                }

                if (line.kind === 'retry') {
                  return (
                    <div key={line.id} className="terminal__line terminal__line--retry">
                      retry x{line.attempt} → {line.label}
                    </div>
                  )
                }

                return (
                  <div key={line.id} className="terminal__line terminal__line--missing">
                    missing → {line.label}
                  </div>
                )
              })}
                <div className="terminal__line terminal__line--progress" aria-live="polite">
                  {progressLine}
                </div>
              </div>
            </div>

          <div className="intro-terminal__meter" aria-live="polite">
            <div className="intro-terminal__counts">{loaded}/{total}</div>
          </div>

          <div className="intro-terminal__footer" aria-live="polite">
            <span
              className={`intro-terminal__footer-label intro-terminal__footer-label--${footerLabel.tone}`}
            >
              {footerLabel.label}
            </span>
            <span className="intro-terminal__footer-status">{footerLabel.status}</span>
          </div>
        </div>
      ) : (
        <>
          <GlobalStarfield />
          <AsciiStartScene />
          <div className="start-ui">
            <h1 className="start-title">TITLE PLACEHOLDER</h1>
            <p className="start-subtitle">SUBTITLE PLACEHOLDER</p>
            <div className="start-tap"><span className="tap-dot" /> TAP ANYWHERE TO START</div>
          </div>
        </>
      )}
    </section>
  )
}
