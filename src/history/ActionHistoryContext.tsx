import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

type HistoryUndo = () => void | Promise<void>

type HistoryEntry = {
  id: number
  label?: string
  createdAt: number
  undo: HistoryUndo
}

type RecordOptions = {
  label?: string
}

type ActionHistoryContextValue = {
  record: (undo: HistoryUndo, options?: RecordOptions) => void
  canGoBack: boolean
  goBack: () => Promise<boolean>
  entries: HistoryEntry[]
  suspendRecording: <T>(callback: () => T) => T
  getSnapshot: <T>(key: string) => T | undefined
  setSnapshot: <T>(key: string, value: T) => void
}

const MAX_HISTORY = 10

const ActionHistoryContext = createContext<ActionHistoryContextValue | null>(null)

export const ActionHistoryProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const restoringRef = useRef(false)
  const nextIdRef = useRef(1)
  const stateStoreRef = useRef(new Map<string, unknown>())

  const record = useCallback<ActionHistoryContextValue['record']>((undo, options) => {
    if (restoringRef.current) {
      return
    }
    const entry: HistoryEntry = {
      id: nextIdRef.current++,
      label: options?.label,
      createdAt: Date.now(),
      undo,
    }

    setEntries((prev) => {
      const next = [...prev, entry]
      if (next.length > MAX_HISTORY) {
        return next.slice(next.length - MAX_HISTORY)
      }
      return next
    })
  }, [])

  const suspendRecording = useCallback<ActionHistoryContextValue['suspendRecording']>((callback) => {
    restoringRef.current = true
    try {
      return callback()
    } finally {
      restoringRef.current = false
    }
  }, [])

  const goBack = useCallback<ActionHistoryContextValue['goBack']>(async () => {
    let entry: HistoryEntry | undefined
    setEntries((prev) => {
      entry = prev[prev.length - 1]
      if (!entry) {
        return prev
      }
      return prev.slice(0, prev.length - 1)
    })

    if (!entry) {
      return false
    }

    restoringRef.current = true
    try {
      const result = entry.undo()
      if (result && typeof (result as Promise<void>).then === 'function') {
        await result
      }
    } finally {
      restoringRef.current = false
    }

    return true
  }, [])

  const getSnapshot = useCallback(<T,>(key: string): T | undefined => {
    return stateStoreRef.current.get(key) as T | undefined
  }, [])

  const setSnapshot = useCallback(<T,>(key: string, value: T): void => {
    stateStoreRef.current.set(key, value)
  }, [])

  const value = useMemo<ActionHistoryContextValue>(
    () => ({
      record,
      canGoBack: entries.length > 0,
      goBack,
      entries,
      suspendRecording,
      getSnapshot,
      setSnapshot,
    }),
    [entries, getSnapshot, goBack, record, setSnapshot, suspendRecording]
  )

  return (
    <ActionHistoryContext.Provider value={value}>
      {children}
    </ActionHistoryContext.Provider>
  )
}

export const useActionHistory = () => {
  const context = useContext(ActionHistoryContext)
  if (!context) {
    throw new Error('useActionHistory must be used within ActionHistoryProvider')
  }
  return context
}

export type { HistoryEntry }
