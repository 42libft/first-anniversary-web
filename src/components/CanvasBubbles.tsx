import { useEffect, useRef } from 'react'

type Bubble = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  life: number
  maxLife: number
  hue: number
}

type CanvasBubblesProps = {
  onPop?: () => void
  maxBubbles?: number
}

export const CanvasBubbles = ({ onPop, maxBubbles = 220 }: CanvasBubblesProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const bubblesRef = useRef<Bubble[]>([])
  const dprRef = useRef(1)

  const resize = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    dprRef.current = dpr
    canvas.width = Math.max(1, Math.floor(rect.width * dpr))
    canvas.height = Math.max(1, Math.floor(rect.height * dpr))
  }

  const spawnBurst = (cx: number, cy: number, n = 6) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = dprRef.current
    const x = (cx - rect.left) * dpr
    const y = (cy - rect.top) * dpr

    const arr = bubblesRef.current
    for (let i = 0; i < n; i += 1) {
      if (arr.length >= maxBubbles) arr.shift()
      const ang = Math.random() * Math.PI * 2
      const spd = 0.4 + Math.random() * 1.6
      const hue = 210 + Math.random() * 80 // blue-magenta range
      arr.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: -Math.abs(Math.sin(ang) * spd) - 0.5,
        r: 6 + Math.random() * 9,
        life: 0,
        maxLife: 36 + Math.random() * 24,
        hue,
      })
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let last = performance.now()
    const loop = (t: number) => {
      const dt = Math.min(32, t - last)
      last = t
      const dpr = dprRef.current

      // update
      const arr = bubblesRef.current
      for (let i = arr.length - 1; i >= 0; i -= 1) {
        const b = arr[i]
        // gravity-ish and drag
        b.vy += 0.008 * dt
        b.vx *= 0.996
        b.vy *= 0.996
        b.x += b.vx * dt
        b.y += b.vy * dt
        b.life += 1
        if (b.life >= b.maxLife) {
          arr.splice(i, 1)
          onPop?.()
        }
      }

      // render
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < arr.length; i += 1) {
        const b = arr[i]
        const p = b.life / b.maxLife
        const alpha = 1 - Math.min(1, Math.abs(p - 0.5) * 2)
        const r = b.r * dpr
        const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r)
        grd.addColorStop(0, `hsla(${b.hue}, 95%, 75%, ${0.6 * alpha})`)
        grd.addColorStop(1, `hsla(${b.hue + 30}, 90%, 55%, 0.0)`)
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [onPop])

  useEffect(() => {
    resize()
    const ro = new ResizeObserver(() => resize())
    if (canvasRef.current) ro.observe(canvasRef.current)
    const onResize = () => resize()
    window.addEventListener('resize', onResize)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => spawnBurst(e.clientX, e.clientY, 8 + Math.floor(Math.random() * 6))
    const node = canvasRef.current
    if (!node) return
    node.addEventListener('click', onClick)
    return () => node.removeEventListener('click', onClick)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="canvas-bubbles"
      role="img"
      aria-label="タップで泡がはじける発光演出"
    />
  )
}

