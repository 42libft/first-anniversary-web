import { useEffect, useMemo, useRef } from 'react'

import { preloadAssets } from '../data/preloadManifest'
import { useAssetPreloader } from '../hooks/useAssetPreloader'
import type { SceneComponentProps } from '../types/scenes'

const PROGRESS_BAR_UNITS = 24

const EARLY_COMPLETE_THRESHOLD = 0.75

const formatPercent = (progress: number, status: 'loading' | 'complete' | 'error' | 'idle') => {
  if (status === 'complete') return 100
  if (status === 'idle') return 0
  if (status === 'loading' && progress >= EARLY_COMPLETE_THRESHOLD) {
    return 100
  }
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

const isSensitiveAssetLabel = (label: string) => /\.jpe?g(?:\?|$)/i.test(label.trim())

const sanitizeAssetLabel = (label: string) =>
  isSensitiveAssetLabel(label) ? 'media asset' : label

export const IntroScene = ({ onAdvance, reportIntroBootState }: SceneComponentProps) => {
  const preloader = useAssetPreloader(preloadAssets, { maxRetries: 3 })

  const {
    logs,
    status,
    total,
    currentAsset,
    currentRetries,
    estimatedRemainingMs,
    hasMissing,
    displayStatus,
    displayProgress,
    displayLoaded,
    softCompleted,
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
    if (displayStatus === 'complete') {
      reportIntroBootState('ready')
    } else if (displayStatus === 'error') {
      reportIntroBootState('error')
    } else {
      reportIntroBootState('loading')
    }
  }, [displayStatus, reportIntroBootState])

  const percent = useMemo(
    () => formatPercent(displayProgress, displayStatus),
    [displayProgress, displayStatus]
  )

  const visibleLogs = useMemo(
    () =>
      logs.filter((line) => {
        if (line.kind === 'retry' || line.kind === 'missing') {
          if (isSensitiveAssetLabel(line.label)) {
            return false
          }
        }
        return true
      }),
    [logs]
  )

  const progressBar = useMemo(() => {
    const rawFilled = (percent / 100) * PROGRESS_BAR_UNITS
    const filledUnits = Math.floor(rawFilled)
    const hasTail = displayStatus === 'loading' && filledUnits < PROGRESS_BAR_UNITS
    const tailChar = hasTail ? '>' : filledUnits > 0 || percent === 100 ? '=' : ' '
    const remainingUnits = PROGRESS_BAR_UNITS - filledUnits - (hasTail ? 1 : 0)
    const barCore = `${'='.repeat(filledUnits)}${hasTail ? tailChar : ''}${'.'.repeat(Math.max(0, remainingUnits))}`
    return `[${barCore}]`
  }, [displayStatus, percent])

  const progressLine = useMemo(() => {
    const counts = total > 0 ? `${displayLoaded}/${total}` : `${displayLoaded}`
    if (displayStatus === 'complete') {
      return `progress ${progressBar} 100% (${counts}) [done]`
    }
    if (displayStatus === 'error') {
      return `progress ${progressBar} ${percent}% (${counts}) [halted]`
    }
    if (displayStatus === 'idle') {
      return `progress ${progressBar} ${percent}% (${counts}) [idle]`
    }
    if (displayStatus === 'loading' && percent === 100) {
      return `progress ${progressBar} 100% (${counts}) [finalizing…]`
    }
    return `progress ${progressBar} ${percent}% (${counts})`
  }, [displayLoaded, displayStatus, percent, progressBar, total])

  const footerLabel = useMemo(() => {
    if (hasMissing) {
      return {
        label: lastMissingLabel
          ? `missing: ${sanitizeAssetLabel(lastMissingLabel)}`
          : 'missing asset',
        status: '再確認が必要です',
        tone: 'error',
      } as const
    }
    if (displayStatus === 'complete') {
      return {
        label: 'all assets verified',
        status: 'ready to launch',
        tone: 'success',
      } as const
    }
    const label = sanitizeAssetLabel(currentAsset?.label ?? 'queue idle')
    const remaining = estimatedRemainingMs > 0 ? `~${formatRemaining(estimatedRemainingMs)} remaining` : 'estimating…'
    const retry = currentRetries > 0 ? `retry x${currentRetries}` : null
    return {
      label,
      status: retry ? `${remaining} · ${retry}` : remaining,
      tone: 'default',
    } as const
  }, [currentAsset?.label, currentRetries, displayStatus, estimatedRemainingMs, hasMissing])

  const terminalViewportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const viewport = terminalViewportRef.current
    if (!viewport) return
    viewport.scrollTop = viewport.scrollHeight
  }, [progressLine, visibleLogs.length])

  const handleClick = () => {
    if (displayStatus === 'complete') {
      onAdvance()
    }
  }

  useEffect(() => {
    if (displayStatus !== 'complete') return
    if (status === 'error') return
    const timer = window.setTimeout(() => {
      onAdvance()
    }, softCompleted ? 1200 : 900)
    return () => window.clearTimeout(timer)
  }, [displayStatus, onAdvance, softCompleted, status])

  return (
    <section
      className="intro-scene stage-terminal"
      role="button"
      onClick={handleClick}
      aria-disabled={displayStatus !== 'complete'}
      aria-label={
        displayStatus === 'complete'
          ? 'Tap to continue to launch screen'
          : 'Terminal boot in progress'
      }
    >
      <div className="intro-terminal" role="status" aria-live="polite">
        <div className="intro-terminal__logs">
          <div className="terminal" aria-live="polite">
            <div className="terminal__viewport" ref={terminalViewportRef}>
              {visibleLogs.map((line) => {
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

                if (line.kind === 'flavor') {
                  return (
                    <div
                      key={line.id}
                      className={`terminal__line terminal__line--flavor terminal__line--flavor-${line.tone}`}
                    >
                      {line.text}
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

                if (line.kind === 'missing') {
                  return (
                    <div key={line.id} className="terminal__line terminal__line--missing">
                      missing → {line.label}
                    </div>
                  )
                }

                return null
              })}
            </div>
            <div className="terminal__line terminal__line--progress">
              {progressLine}
            </div>
          </div>
        </div>

        <div className="intro-terminal__meter" aria-live="polite">
          <div className="intro-terminal__counts">{displayLoaded}/{total}</div>
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
    </section>
  )
}
