import { useEffect, useRef } from 'react'

export type CanvasLoveBurstProps = {
  disabled?: boolean
  onPulse?: () => void
}

type HeartParticle = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  hue: number
  saturation: number
  lightness: number
  life: number
  maxLife: number
  spin: number
  spinVelocity: number
}

const HEART_COLORS: Array<[number, number, number]> = [
  [328, 86, 74],
  [343, 92, 82],
  [12, 88, 72],
  [296, 82, 78],
  [214, 88, 78],
]

const HEARTS_PER_BURST = 16
const MAX_PARTICLES = 220
const MIN_BURST_INTERVAL = 140 // ms

const drawHeart = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  hue: number,
  saturation: number,
  lightness: number,
  alpha: number
) => {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  const scale = Math.max(0.34, size / 32)
  ctx.scale(scale, scale)
  ctx.beginPath()
  ctx.moveTo(0, -0.55)
  ctx.bezierCurveTo(-0.7, -1.2, -1.5, -0.05, 0, 1)
  ctx.bezierCurveTo(1.5, -0.05, 0.7, -1.2, 0, -0.55)
  ctx.closePath()
  const fill = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
  ctx.fillStyle = fill
  ctx.shadowColor = `hsla(${hue}, ${Math.min(100, saturation + 12)}%, ${Math.min(98, lightness + 12)}%, ${alpha * 0.75})`
  ctx.shadowBlur = Math.max(6, size * 0.42)
  ctx.fill()
  ctx.restore()
}

export const CanvasLoveBurst = ({ disabled = false, onPulse }: CanvasLoveBurstProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const particlesRef = useRef<HeartParticle[]>([])
  const idRef = useRef(0)
  const dprRef = useRef(1)
  const lastBurstRef = useRef(0)

  const resize = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 1.8)
    dprRef.current = dpr
    canvas.width = Math.max(1, Math.floor(rect.width * dpr))
    canvas.height = Math.max(1, Math.floor(rect.height * dpr))
  }

  const removeParticle = (id: number) => {
    particlesRef.current = particlesRef.current.filter((particle) => particle.id !== id)
  }

  const spawnHeart = (
    cx: number,
    cy: number,
    hue: number,
    saturation: number,
    lightness: number
  ) => {
    idRef.current += 1
    const id = idRef.current
    const speed = 0.045 + Math.random() * 0.085
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.9
    const velocityScale = dprRef.current * 48
    const vx = Math.cos(angle) * speed * velocityScale
    const vy = Math.sin(angle) * speed * velocityScale
    const spinVelocity = (Math.random() - 0.5) * 0.0024

    const particle: HeartParticle = {
      id,
      x: cx,
      y: cy,
      vx,
      vy,
      size: (18 + Math.random() * 26) * dprRef.current,
      hue,
      saturation,
      lightness,
      life: 0,
      maxLife: 2600 + Math.random() * 1600,
      spin: Math.random() * Math.PI * 2,
      spinVelocity,
    }

    particlesRef.current = [...particlesRef.current.slice(-MAX_PARTICLES + 1), particle]

    setTimeout(() => removeParticle(id), particle.maxLife + 1200)
  }

  const spawnBurst = (clientX: number, clientY: number, shouldCount: boolean) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const cx = (clientX - rect.left) * dprRef.current
    const cy = (clientY - rect.top) * dprRef.current
    const [baseHue, baseSat, baseLight] = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)]

    for (let i = 0; i < HEARTS_PER_BURST; i += 1) {
      const hue = baseHue + (Math.random() - 0.5) * 16
      const sat = baseSat + (Math.random() - 0.5) * 8
      const light = baseLight + (Math.random() - 0.5) * 10
      spawnHeart(
        cx + (Math.random() - 0.5) * 90 * dprRef.current,
        cy + (Math.random() - 0.5) * 90 * dprRef.current,
        hue,
        Math.max(60, Math.min(100, sat)),
        Math.max(40, Math.min(92, light))
      )
    }

    if (shouldCount) {
      onPulse?.()
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastTime = performance.now()

    const loop = (time: number) => {
      const dt = Math.min(32, time - lastTime)
      lastTime = time
      const w = canvas.width
      const h = canvas.height

      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(12, 4, 24, 0.16)'
      ctx.fillRect(0, 0, w, h)

      ctx.globalCompositeOperation = 'lighter'

      const particles = particlesRef.current
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i]
        p.life += dt
        if (p.life >= p.maxLife) {
          particles.splice(i, 1)
          continue
        }

        p.x += p.vx * (dt / 16.6)
        p.y += p.vy * (dt / 16.6)
        p.vy -= 0.016 * dprRef.current * (dt / 1000)
        p.spin += p.spinVelocity * dt

        const progress = p.life / p.maxLife
        const alpha = Math.max(0, 0.85 - progress * 0.9)
        const size = p.size * (0.84 + Math.sin(progress * Math.PI) * 0.32)

        drawHeart(ctx, p.x, p.y, size, p.spin, p.hue, p.saturation, p.lightness, alpha)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  useEffect(() => {
    resize()
    const onResize = () => resize()
    window.addEventListener('resize', onResize)
    const observer = new ResizeObserver(() => resize())
    if (canvasRef.current) {
      observer.observe(canvasRef.current)
    }
    return () => {
      window.removeEventListener('resize', onResize)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const node = canvasRef.current
    if (!node) return

    const handlePointerDown = (event: PointerEvent) => {
      if (disabled) return
      const now = performance.now()
      if (now - lastBurstRef.current < MIN_BURST_INTERVAL) return
      lastBurstRef.current = now
      spawnBurst(event.clientX, event.clientY, true)
    }

    node.addEventListener('pointerdown', handlePointerDown)
    return () => {
      node.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [disabled])

  useEffect(() => {
    if (disabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const autoSeed = () => {
      const x = rect.left + rect.width * (0.3 + Math.random() * 0.4)
      const y = rect.top + rect.height * (0.35 + Math.random() * 0.3)
      spawnBurst(x, y, false)
    }

    const initial = setTimeout(() => autoSeed(), 240)
    const interval = setInterval(() => {
      if (!disabled) autoSeed()
    }, 3400)

    return () => {
      clearTimeout(initial)
      clearInterval(interval)
    }
  }, [disabled])

  return (
    <canvas
      ref={canvasRef}
      className="canvas-love"
      role="img"
      aria-label="タップするとハートが舞い上がる"
    />
  )
}
