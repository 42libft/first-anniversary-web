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

export type TerminalLogLine = CategoryLine | RetryLine | MissingLine

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

  const [loaded, setLoaded] = useState(0)
  const [failed, setFailed] = useState(0)
  const [status, setStatus] = useState<PreloadRunStatus>(total === 0 ? 'complete' : 'idle')
  const [currentAsset, setCurrentAsset] = useState<PreloadAsset | null>(null)
  const [currentRetries, setCurrentRetries] = useState(0)
  const [hasMissing, setHasMissing] = useState(false)
  const [averageDurationMs, setAverageDurationMs] = useState(0)

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
  }, [])

  const appendLogLine = useCallback((entry: TerminalLogLine) => {
    setLogs((prev) => [...prev, entry])
  }, [])

  useEffect(() => {
    if (!total) {
      setStatus('complete')
      return
    }

    let cancelled = false
    let loadedCount = 0
    let failedCount = 0

    setLoaded(0)
    setFailed(0)
    setStatus('loading')
    setCurrentAsset(null)
    setCurrentRetries(0)
    setHasMissing(false)
    durationsRef.current = []
    setAverageDurationMs(0)

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
      }

      if (!cancelled) {
        setCurrentAsset(null)
        setCurrentRetries(0)
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
    }
  }, [appendLogLine, maxRetries, sortedAssets, total, updateCategory])

  const progress = total === 0 ? 1 : loaded / total

  const pending = Math.max(0, total - loaded - failed)
  const estimatedRemainingMs = averageDurationMs * pending

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
  }
}
