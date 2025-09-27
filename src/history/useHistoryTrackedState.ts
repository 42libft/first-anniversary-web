import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useActionHistory } from './ActionHistoryContext'

type Options = {
  label?: string
  record?: boolean
}

type SetStateAction<T> = T | ((prev: T) => T)

export const useHistoryTrackedState = <T,>(
  key: string,
  initialValue: T
): [T, (action: SetStateAction<T>, options?: Options) => void] => {
  const { record, getSnapshot, setSnapshot } = useActionHistory()

  const initial = useMemo(() => {
    const stored = getSnapshot<T>(key)
    return stored === undefined ? initialValue : stored
  }, [getSnapshot, initialValue, key])

  const [value, setValue] = useState<T>(initial)

  const mountedRef = useRef(true)
  const latestValueRef = useRef(value)

  useEffect(() => {
    latestValueRef.current = value
  }, [value])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      setSnapshot(key, latestValueRef.current)
    }
  }, [key, setSnapshot])

  useEffect(() => {
    setSnapshot(key, value)
  }, [key, setSnapshot, value])

  const setWithHistory = useCallback(
    (action: SetStateAction<T>, options?: Options) => {
      setValue((prev) => {
        const next = typeof action === 'function' ? (action as (prevValue: T) => T)(prev) : action
        if (Object.is(prev, next)) {
          return prev
        }

        const previousValue = prev
        if (options?.record === false) {
          return next
        }

        record(() => {
          setSnapshot(key, previousValue)
          if (mountedRef.current) {
            setValue(previousValue)
          }
        }, { label: options?.label })

        return next
      })
    },
    [key, record, setSnapshot]
  )

  return [value, setWithHistory]
}
