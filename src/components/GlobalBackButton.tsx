import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useActionHistory } from '../history/ActionHistoryContext'
import './GlobalBackButton.css'

const LONG_PRESS_DURATION = 1000
const PRESS_FEEDBACK_DURATION = 220
const SWIPE_ACTIVATE_DISTANCE = 32
const EDGE_THRESHOLD = 24
const DEBOUNCE_INTERVAL = 200

const interactiveRoles = new Set([
  'button',
  'link',
  'checkbox',
  'switch',
  'menuitem',
  'option',
  'radio',
  'tab',
])

const isInteractiveElement = (element: Element) => {
  if (element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement) {
    return true
  }

  const role = element.getAttribute('role')
  if (role && interactiveRoles.has(role)) {
    return true
  }

  const tabIndex = element.getAttribute('tabindex')
  if (tabIndex && Number.parseInt(tabIndex, 10) >= 0) {
    return true
  }

  return false
}

const checkOverlap = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  const points: Array<[number, number]> = [
    [rect.left + rect.width / 2, rect.top + rect.height / 2],
    [rect.left + rect.width / 2, rect.bottom - 4],
    [rect.left + 4, rect.top + rect.height / 2],
  ]

  for (const [x, y] of points) {
    const elements = document.elementsFromPoint(x, y)
    for (const el of elements) {
      if (el === element || element.contains(el)) {
        continue
      }
      if (isInteractiveElement(el)) {
        return true
      }
    }
  }

  return false
}

export const GlobalBackButton = () => {
  const { canGoBack, goBack, entries } = useActionHistory()
  const [isPressed, setIsPressed] = useState(false)
  const [isEmphasized, setIsEmphasized] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [overlapOffset, setOverlapOffset] = useState(0)
  const longPressTimer = useRef<number | null>(null)
  const pressTimer = useRef<number | null>(null)
  const lastPressRef = useRef(0)
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const skipTouchRef = useRef(false)

  const hasHistory = canGoBack

  const triggerBack = useCallback(async () => {
    if (!hasHistory) {
      setShowTooltip(true)
      window.setTimeout(() => setShowTooltip(false), 1500)
      return
    }

    const now = Date.now()
    if (now - lastPressRef.current < DEBOUNCE_INTERVAL) {
      return
    }
    lastPressRef.current = now

    setIsPressed(true)
    pressTimer.current = window.setTimeout(() => {
      setIsPressed(false)
    }, PRESS_FEEDBACK_DURATION)

    await goBack()
  }, [goBack, hasHistory])

  useEffect(() => {
    if (!buttonRef.current) {
      return
    }

    const button = buttonRef.current

    const updateOverlap = () => {
      const shouldOffset = checkOverlap(button)
      setOverlapOffset(shouldOffset ? -3 : 0)
    }

    updateOverlap()

    const resizeObserver = new ResizeObserver(updateOverlap)
    resizeObserver.observe(button)

    window.addEventListener('resize', updateOverlap)
    window.addEventListener('scroll', updateOverlap, true)

    const intervalId = window.setInterval(updateOverlap, 1000)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateOverlap)
      window.removeEventListener('scroll', updateOverlap, true)
      window.clearInterval(intervalId)
    }
  }, [entries])

  useEffect(() => {
    if (!buttonRef.current) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'Left')) {
        event.preventDefault()
        triggerBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [triggerBack])

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        return
      }
      const touch = event.touches[0]
      if (touch.clientX > EDGE_THRESHOLD) {
        return
      }
      swipeStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!swipeStartRef.current) {
        return
      }
      const touch = event.touches[0]
      const deltaX = touch.clientX - swipeStartRef.current.x
      const deltaY = Math.abs(touch.clientY - swipeStartRef.current.y)
      if (deltaX > SWIPE_ACTIVATE_DISTANCE && deltaY < 60) {
        setIsEmphasized(true)
        window.setTimeout(() => setIsEmphasized(false), 1600)
        swipeStartRef.current = null
      }
    }

    const handleTouchEnd = () => {
      swipeStartRef.current = null
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  const clearTimers = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = (event) => {
    if (event.pointerType === 'touch') {
      const element = event.currentTarget
      const rect = element.getBoundingClientRect()
      const inset = 2
      const withinInset =
        event.clientX - rect.left < inset ||
        rect.right - event.clientX < inset ||
        event.clientY - rect.top < inset ||
        rect.bottom - event.clientY < inset
      if (withinInset) {
        skipTouchRef.current = true
        return
      }

      skipTouchRef.current = false
      longPressTimer.current = window.setTimeout(() => {
        setIsEmphasized(true)
      }, LONG_PRESS_DURATION)
      event.currentTarget.setPointerCapture(event.pointerId)
    } else {
      skipTouchRef.current = false
    }
  }

  const handlePointerUp: React.PointerEventHandler<HTMLButtonElement> = (event) => {
    if (event.pointerType === 'touch') {
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      if (isEmphasized) {
        window.setTimeout(() => setIsEmphasized(false), 1000)
      }
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    }

    if (skipTouchRef.current) {
      skipTouchRef.current = false
    }
  }

  const handlePointerCancel: React.PointerEventHandler<HTMLButtonElement> = () => {
    clearTimers()
    skipTouchRef.current = false
  }

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    if (skipTouchRef.current) {
      event.preventDefault()
      event.stopPropagation()
      skipTouchRef.current = false
      return
    }
    triggerBack()
  }

  useEffect(() => clearTimers, [])

  useEffect(() => {
    if (!hasHistory) {
      setShowTooltip(true)
      const timeout = window.setTimeout(() => setShowTooltip(false), 2000)
      return () => {
        window.clearTimeout(timeout)
      }
    }
    setShowTooltip(false)
    return undefined
  }, [hasHistory])

  const tooltipId = useMemo(() => 'global-back-tooltip', [])

  return (
    <div
      className="global-back-button"
      data-emphasized={isEmphasized || undefined}
      style={{ transform: `translateY(${overlapOffset}px)` }}
      onPointerEnter={() => {
        if (!hasHistory) {
          setShowTooltip(true)
        }
      }}
      onPointerLeave={() => setShowTooltip(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        role="button"
        className={`global-back-button__control${isPressed ? ' is-pressed' : ''}`}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onBlur={() => setIsEmphasized(false)}
        aria-label="Go back to the previous state"
        aria-describedby={(!hasHistory && showTooltip) ? tooltipId : undefined}
        aria-disabled={!hasHistory}
        disabled={!hasHistory}
      >
        <span aria-hidden="true" className="global-back-button__icon">↺</span>
      </button>
      <div
        id={tooltipId}
        role="tooltip"
        className={`global-back-button__tooltip${!hasHistory && showTooltip ? ' is-visible' : ''}`}
      >
        No history to go back
      </div>
    </div>
  )
}
