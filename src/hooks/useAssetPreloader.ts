import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { PreloadAsset } from '../data/preloadManifest'

export type PreloadRunStatus = 'idle' | 'loading' | 'complete' | 'error'

type CategoryLine = {
  kind: 'category'
  id: string
  label: string
  loaded: number
  total: number
  status: 'pending' | 'loading' | 'complete' | 'error'
  priority: number
}

type RetryLine = {
  kind: 'retry'
  id: string
  label: string
  attempt: number
}

type MissingLine = {
  kind: 'missing'
  id: string
  label: string
}

type FlavorTone = 'neutral' | 'glitch' | 'hint'

type FlavorLine = {
  kind: 'flavor'
  id: string
  text: string
  tone: FlavorTone
}

export type TerminalLogLine = CategoryLine | RetryLine | MissingLine | FlavorLine

type FlavorScriptEvent = {
  id: string
  ratio: number
  text: string
  tone: FlavorTone
}

type PlannedFlavorEvent = FlavorScriptEvent & {
  triggerCount: number
}

const FLAVOR_EVENTS: FlavorScriptEvent[] = [
  {
    id: 'handshake',
    ratio: 0.04,
    text: 'boot/init › uplink handshake … OK',
    tone: 'neutral',
  },
  {
    id: 'checksum',
    ratio: 0.12,
    text: 'checksum(seed=Y1) → 0x1FADCE // verified',
    tone: 'neutral',
  },
  {
    id: 'memo',
    ratio: 0.22,
    text: 'memo// keep spectators distracted — stage 2 requires surprise',
    tone: 'hint',
  },
  {
    id: 'anomaly',
    ratio: 0.33,
    text: 'anomaly › intercepted packet stamped «tomorrow»',
    tone: 'glitch',
  },
  {
    id: 'confetti',
    ratio: 0.47,
    text: 'preloading celebration.confetti() assets… prepping sparkle buffers',
    tone: 'neutral',
  },
  {
    id: 'whisper',
    ratio: 0.61,
    text: 'whisper> “they still remember year one” // logging suppressed',
    tone: 'glitch',
  },
  {
    id: 'override',
    ratio: 0.75,
    text: 'observer override: report 100% once buffers stable',
    tone: 'hint',
  },
  {
    id: 'doors',
    ratio: 0.88,
    text: 'memo// once lights dim → proceed to celebration stage',
    tone: 'hint',
  },
]

const HEARTBEAT_INTERVAL_MS = 1100
const HEARTBEAT_POLL_MS = 180

const HEARTBEAT_MESSAGES: FlavorScriptEvent[] = [
  {
    id: 'heartbeat:verifying',
    ratio: 0,
    text: 'status// verifying cached payloads…',
    tone: 'neutral',
  },
  {
    id: 'heartbeat:compress',
    ratio: 0,
    text: 'ops> compressing spritesheets for faster decode…',
    tone: 'neutral',
  },
  {
    id: 'heartbeat:uplink',
    ratio: 0,
    text: 'telemetry// uplink stable · monitoring buffer health',
    tone: 'hint',
  },
]

const SOFT_COMPLETE_MIN_PROGRESS = 0.62
const SOFT_COMPLETE_MIN_ELAPSED_MS = 9000

const planFlavorEvents = (total: number): PlannedFlavorEvent[] => {
  if (total <= 0) return []
  const planned: PlannedFlavorEvent[] = []
  let lastCount = 0
  FLAVOR_EVENTS.forEach((event) => {
    const target = Math.min(total, Math.max(lastCount + 1, Math.ceil(event.ratio * total)))
    if (target > lastCount && target <= total) {
      planned.push({ ...event, triggerCount: target })
      lastCount = target
    }
  })
  return planned
}

export interface AssetPreloaderState {
  total: number
  loaded: number
  failed: number
  progress: number
  status: PreloadRunStatus
  logs: TerminalLogLine[]
  currentAsset: PreloadAsset | null
  currentRetries: number
  estimatedRemainingMs: number
  hasMissing: boolean
  displayStatus: PreloadRunStatus
  displayProgress: number
  displayLoaded: number
  softCompleted: boolean
}

const loadImage = (url: string) =>
  new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`image load failed: ${url}`))
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.src = url
  })

const loadJson = async (url: string) => {
  const res = await fetch(url, { cache: 'force-cache' })
  if (!res.ok) {
    throw new Error(`json load failed: ${url}`)
  }
  // consume body to ensure it is cached
  await res.text()
}

const loadAudio = (url: string) =>
  new Promise<void>((resolve, reject) => {
    const audio = new Audio()
    const cleanup = () => {
      audio.removeEventListener('canplaythrough', handleLoaded)
      audio.removeEventListener('error', handleError)
    }
    const handleLoaded = () => {
      cleanup()
      resolve()
    }
    const handleError = () => {
      cleanup()
      reject(new Error(`audio load failed: ${url}`))
    }
    audio.addEventListener('canplaythrough', handleLoaded, { once: true })
    audio.addEventListener('error', handleError, { once: true })
    audio.preload = 'auto'
    audio.src = url
    // trigger load
    audio.load()
  })

const delay = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms)
})

export const useAssetPreloader = (
  assets: PreloadAsset[],
  options?: {
    maxRetries?: number
  }
): AssetPreloaderState => {
  const sortedAssets = useMemo(() => {
    const next = [...assets]
    next.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    return next
  }, [assets])

  const categoryLines = useMemo(() => {
    const map = new Map<string, CategoryLine>()
    sortedAssets.forEach((asset) => {
      const entry = map.get(asset.category)
      if (entry) {
        entry.total += 1
        entry.priority = Math.max(entry.priority, asset.priority ?? 0)
      } else {
        map.set(asset.category, {
          kind: 'category',
          id: asset.category,
          label: asset.category,
          loaded: 0,
          total: 1,
          status: 'pending',
          priority: asset.priority ?? 0,
        })
      }
    })
    return [...map.values()].sort((a, b) => b.priority - a.priority || a.label.localeCompare(b.label))
  }, [sortedAssets])

  const [logs, setLogs] = useState<TerminalLogLine[]>(categoryLines)

  useEffect(() => {
    setLogs(categoryLines)
  }, [categoryLines])

  const total = sortedAssets.length

  const flavorPlan = useMemo(() => planFlavorEvents(total), [total])
  const flavorPlanRef = useRef(flavorPlan)
  useEffect(() => {
    flavorPlanRef.current = flavorPlan
  }, [flavorPlan])
  const flavorIndexRef = useRef(0)

  const heartbeatMessagesRef = useRef(HEARTBEAT_MESSAGES)
  const heartbeatIndexRef = useRef(0)

  const lastLogAtRef = useRef(performance.now())
  const startTimeRef = useRef<number | null>(null)

  const [loaded, setLoaded] = useState(0)
  const [failed, setFailed] = useState(0)
  const [status, setStatus] = useState<PreloadRunStatus>(total === 0 ? 'complete' : 'idle')
  const [currentAsset, setCurrentAsset] = useState<PreloadAsset | null>(null)
  const [currentRetries, setCurrentRetries] = useState(0)
  const [hasMissing, setHasMissing] = useState(false)
  const [averageDurationMs, setAverageDurationMs] = useState(0)

  const [displayStatus, setDisplayStatus] = useState<PreloadRunStatus>(
    total === 0 ? 'complete' : 'idle'
  )
  const [displayProgress, setDisplayProgress] = useState(total === 0 ? 1 : 0)
  const [displayLoaded, setDisplayLoaded] = useState(total === 0 ? total : 0)
  const [softCompleted, setSoftCompleted] = useState(total === 0)

  const durationsRef = useRef<number[]>([])

  const maxRetries = options?.maxRetries ?? 2

  const updateCategory = useCallback((categoryId: string, updater: (line: CategoryLine) => CategoryLine) => {
    setLogs((prev) =>
      prev.map((line) => {
        if (line.kind === 'category' && line.id === categoryId) {
          return updater(line)
        }
        return line
      })
    )
    lastLogAtRef.current = performance.now()
  }, [])

  const appendLogLine = useCallback((entry: TerminalLogLine) => {
    setLogs((prev) => [...prev, entry])
    lastLogAtRef.current = performance.now()
  }, [])

  useEffect(() => {
    if (!total) {
      setStatus('complete')
      setDisplayStatus('complete')
      setDisplayProgress(1)
      setDisplayLoaded(0)
      setSoftCompleted(true)
      return
    }

    let cancelled = false
    let loadedCount = 0
    let failedCount = 0

    flavorIndexRef.current = 0
    heartbeatIndexRef.current = 0

    setLoaded(0)
    setFailed(0)
    setStatus('loading')
    setDisplayStatus('loading')
    setDisplayProgress(0)
    setDisplayLoaded(0)
    setSoftCompleted(false)
    setCurrentAsset(null)
    setCurrentRetries(0)
    setHasMissing(false)
    durationsRef.current = []
    setAverageDurationMs(0)
    startTimeRef.current = performance.now()
    lastLogAtRef.current = performance.now()

    const timers: ReturnType<typeof setTimeout>[] = []

    const queueStartupFlavor = (event: FlavorLine, delay: number) => {
      const timer = setTimeout(() => {
        if (cancelled) return
        appendLogLine(event)
      }, delay)
      timers.push(timer)
    }

    queueStartupFlavor(
      {
        kind: 'flavor',
        id: 'startup:uplink',
        text: 'boot/init >>> requesting uplink credentials…',
        tone: 'neutral',
      },
      160
    )

    queueStartupFlavor(
      {
        kind: 'flavor',
        id: 'startup:response',
        text: 'response<ai-core> // access granted · watchers=present',
        tone: 'hint',
      },
      620
    )

    sortedAssets.forEach((asset) => {
      updateCategory(asset.category, (line) => ({ ...line, loaded: 0, status: 'pending' }))
    })

    const recordDuration = (value: number) => {
      durationsRef.current.push(value)
      const arr = durationsRef.current
      const avg = arr.reduce((sum, entry) => sum + entry, 0) / arr.length
      setAverageDurationMs(avg)
    }

    const loadAssetWithRetry = async (asset: PreloadAsset) => {
      let attempt = 0
      let lastError: unknown = null
      while (!cancelled && attempt <= maxRetries) {
        const started = performance.now()
        try {
          if (asset.type === 'image') {
            await loadImage(asset.url)
          } else if (asset.type === 'json') {
            await loadJson(asset.url)
          } else {
            await loadAudio(asset.url)
          }
          if (!cancelled) {
            recordDuration(performance.now() - started)
          }
          return true
        } catch (error) {
          lastError = error
          attempt += 1
          if (attempt <= maxRetries && !cancelled) {
            setCurrentRetries(attempt)
            appendLogLine({
              kind: 'retry',
              id: `${asset.id}:retry:${attempt}`,
              label: asset.label,
              attempt,
            })
            await delay(Math.min(1200, 280 * attempt))
            continue
          }
          break
        }
      }
      if (!cancelled) {
        console.warn('preload failed', asset.url, lastError)
      }
      return false
    }

    const maybeEmitFlavor = (completed: number) => {
      if (cancelled) return
      const plan = flavorPlanRef.current
      while (flavorIndexRef.current < plan.length) {
        const next = plan[flavorIndexRef.current]
        if (completed >= next.triggerCount) {
          appendLogLine({
            kind: 'flavor',
            id: `flavor:${next.id}`,
            text: next.text,
            tone: next.tone,
          })
          flavorIndexRef.current += 1
          continue
        }
        break
      }
    }

    const run = async () => {
      for (const asset of sortedAssets) {
        if (cancelled) break
        setCurrentAsset(asset)
        setCurrentRetries(0)
        updateCategory(asset.category, (line) => ({
          ...line,
          status: line.status === 'complete' ? 'complete' : 'loading',
        }))

        const success = await loadAssetWithRetry(asset)
        if (cancelled) break

        if (success) {
          loadedCount += 1
          setLoaded(loadedCount)
          updateCategory(asset.category, (line) => {
            const nextLoaded = Math.min(line.loaded + 1, line.total)
            const nextStatus = nextLoaded >= line.total ? 'complete' : 'loading'
            return {
              ...line,
              loaded: nextLoaded,
              status: nextStatus,
            }
          })
        } else {
          failedCount += 1
          setFailed(failedCount)
          setHasMissing(true)
          updateCategory(asset.category, (line) => ({
            ...line,
            status: 'error',
          }))
          appendLogLine({
            kind: 'missing',
            id: `${asset.id}:missing`,
            label: asset.label,
          })
        }

        maybeEmitFlavor(loadedCount + failedCount)
      }

      if (!cancelled) {
        setCurrentAsset(null)
        setCurrentRetries(0)
        maybeEmitFlavor(total)
        if (failedCount > 0) {
          setStatus('error')
        } else {
          setStatus('complete')
        }
      }
    }

    run()

    return () => {
      cancelled = true
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [appendLogLine, flavorPlan, maxRetries, sortedAssets, total, updateCategory])

  const progress = total === 0 ? 1 : loaded / total

  const pending = Math.max(0, total - loaded - failed)
  const estimatedRemainingMs = averageDurationMs * pending

  useEffect(() => {
    if (status === 'complete') {
      setDisplayStatus('complete')
      setDisplayProgress(1)
      setDisplayLoaded(total)
      return
    }
    if (status === 'error') {
      setDisplayStatus('error')
      setDisplayProgress(progress)
      setDisplayLoaded(loaded)
      return
    }
    if (!softCompleted) {
      setDisplayStatus(status)
      setDisplayProgress(progress)
      setDisplayLoaded(loaded)
    }
  }, [loaded, progress, softCompleted, status, total])

  useEffect(() => {
    if (softCompleted) {
      setLogs((prev) =>
        prev.map((line) => {
          if (line.kind === 'category') {
            return { ...line, loaded: line.total, status: 'complete' }
          }
          return line
        })
      )
      lastLogAtRef.current = performance.now()
    }
  }, [softCompleted])

  useEffect(() => {
    if (status !== 'loading') return
    if (softCompleted) return
    const checkSoftComplete = () => {
      if (softCompleted) return
      if (failed > 0 || hasMissing) return
      const start = startTimeRef.current
      if (start == null) return
      const elapsed = performance.now() - start
      if (elapsed < SOFT_COMPLETE_MIN_ELAPSED_MS) return
      if (progress < SOFT_COMPLETE_MIN_PROGRESS) return
      setSoftCompleted(true)
      setDisplayStatus('complete')
      setDisplayProgress(1)
      setDisplayLoaded(total)
      appendLogLine({
        kind: 'flavor',
        id: 'soft-complete:stabilize',
        text: 'observer override › buffers stabilized — preparing handoff',
        tone: 'hint',
      })
      appendLogLine({
        kind: 'flavor',
        id: 'soft-complete:handoff',
        text: 'handoff sequence initiated · forwarding to start scene',
        tone: 'neutral',
      })
    }

    const interval = setInterval(checkSoftComplete, 240)
    return () => clearInterval(interval)
  }, [appendLogLine, failed, hasMissing, progress, softCompleted, status, total])

  useEffect(() => {
    if (status !== 'loading') return
    if (softCompleted) return
    const interval = setInterval(() => {
      const now = performance.now()
      if (now - lastLogAtRef.current < HEARTBEAT_INTERVAL_MS) {
        return
      }
      const messages = heartbeatMessagesRef.current
      if (!messages.length) return
      const index = heartbeatIndexRef.current % messages.length
      heartbeatIndexRef.current += 1
      const message = messages[index]
      appendLogLine({
        kind: 'flavor',
        id: `heartbeat:${message.id}:${heartbeatIndexRef.current}`,
        text: message.text,
        tone: message.tone,
      })
    }, HEARTBEAT_POLL_MS)

    return () => clearInterval(interval)
  }, [appendLogLine, softCompleted, status])

  return {
    total,
    loaded,
    failed,
    progress,
    status,
    logs,
    currentAsset,
    currentRetries,
    estimatedRemainingMs,
    hasMissing,
    displayStatus,
    displayProgress,
    displayLoaded,
    softCompleted,
  }
}
