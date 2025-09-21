import { useEffect, useMemo, useRef } from 'react'

type Letter = {
  ch: string
  t: number
  speed: number
  size: number
  hue: number
}

type Trail = {
  id: number
  p0: [number, number]
  p1: [number, number]
  p2: [number, number]
  p3: [number, number]
  letters: Letter[]
}

export type MemoryStreamProps = {
  messages: string[]
  onReveal?: (text: string) => void
}

const cubic = (t: number, a: number, b: number, c: number, d: number) =>
  ((1 - t) ** 3) * a + 3 * ((1 - t) ** 2) * t * b + 3 * (1 - t) * (t ** 2) * c + (t ** 3) * d

const dcubic = (t: number, a: number, b: number, c: number, d: number) =>
  3 * ((1 - t) ** 2) * (b - a) + 6 * (1 - t) * t * (c - b) + 3 * (t ** 2) * (d - c)

export const CanvasMemoryStream = ({ messages, onReveal }: MemoryStreamProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const dprRef = useRef(1)
  const trailsRef = useRef<Trail[]>([])
  const idRef = useRef(0)

  const pool = useMemo(() => (messages && messages.length ? messages : [
    '今日はありがとう',
    '次は海に行こう',
    '3240kmの言葉',
    '同じ夜をもう一度',
  ]), [messages])

  const resize = () => {
    const c = canvasRef.current
    if (!c) return
    const r = c.getBoundingClientRect()
    const d = Math.min(window.devicePixelRatio || 1, 2)
    dprRef.current = d
    c.width = Math.max(1, Math.floor(r.width * d))
    c.height = Math.max(1, Math.floor(r.height * d))
  }

  const spawnTrail = (x: number, y: number, msg: string) => {
    const c = canvasRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    const d = dprRef.current
    const cx = (x - rect.left) * d
    const cy = (y - rect.top) * d

    // randomized flowing bezier upwards with curve
    const p0: [number, number] = [cx, cy]
    const p3: [number, number] = [cx + (Math.random() - 0.5) * 150 * d, cy - (100 + Math.random() * 220) * d]
    const p1: [number, number] = [p0[0] + (Math.random() - 0.5) * 200 * d, p0[1] - (40 + Math.random() * 80) * d]
    const p2: [number, number] = [p3[0] + (Math.random() - 0.5) * 200 * d, p3[1] + (40 + Math.random() * 120) * d]

    const letters: Letter[] = []
    const baseHue = 200 + Math.random() * 90
    const baseSize = 10 + Math.random() * 10
    const chars = [...msg]
    for (let i = 0; i < chars.length; i += 1) {
      letters.push({
        ch: chars[i],
        t: Math.max(0, -i * 0.04),
        speed: 0.006 + Math.random() * 0.004,
        size: baseSize * (0.85 + Math.random() * 0.3),
        hue: baseHue + (Math.random() - 0.5) * 30,
      })
    }

    idRef.current += 1
    trailsRef.current.push({ id: idRef.current, p0, p1, p2, p3, letters })
    onReveal?.(msg)
  }

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    let last = performance.now()
    const loop = (t: number) => {
      const dt = Math.min(32, t - last)
      last = t
      const w = c.width
      const h = c.height

      // clear with slight fade for trails
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(5,8,22,0.35)'
      ctx.fillRect(0, 0, w, h)

      ctx.globalCompositeOperation = 'lighter'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'

      const trails = trailsRef.current
      for (let ti = trails.length - 1; ti >= 0; ti -= 1) {
        const tr = trails[ti]
        let aliveLetters = 0
        for (let li = 0; li < tr.letters.length; li += 1) {
          const L = tr.letters[li]
          L.t += L.speed * dt
          if (L.t > 1.15) continue
          aliveLetters += 1
          const t1 = Math.max(0, Math.min(1, L.t))
          const x = cubic(t1, tr.p0[0], tr.p1[0], tr.p2[0], tr.p3[0])
          const y = cubic(t1, tr.p0[1], tr.p1[1], tr.p2[1], tr.p3[1])
          const dx = dcubic(t1, tr.p0[0], tr.p1[0], tr.p2[0], tr.p3[0])
          const dy = dcubic(t1, tr.p0[1], tr.p1[1], tr.p2[1], tr.p3[1])
          const ang = Math.atan2(dy, dx)

          const alpha = Math.min(1, Math.max(0, 1 - Math.abs(L.t - 0.5) * 1.7))
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(ang)
          ctx.font = `${L.size}px 'Inter', 'Noto Sans JP', sans-serif`
          const grad = ctx.createLinearGradient(-L.size, 0, L.size, 0)
          grad.addColorStop(0, `hsla(${L.hue}, 95%, 80%, ${0.35 * alpha})`)
          grad.addColorStop(1, `hsla(${L.hue + 40}, 95%, 60%, ${0.55 * alpha})`)
          ctx.fillStyle = grad
          ctx.shadowColor = `hsla(${L.hue}, 95%, 70%, ${0.55 * alpha})`
          ctx.shadowBlur = 12
          ctx.fillText(L.ch, 0, 0)
          ctx.restore()
        }
        if (aliveLetters === 0) {
          trails.splice(ti, 1)
        }
      }

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    resize()
    const onResize = () => resize()
    window.addEventListener('resize', onResize)
    const ro = new ResizeObserver(() => resize())
    if (canvasRef.current) ro.observe(canvasRef.current)
    return () => {
      window.removeEventListener('resize', onResize)
      ro.disconnect()
    }
  }, [])

  useEffect(() => {
    const node = canvasRef.current
    if (!node) return
    const onClick = (e: MouseEvent) => {
      const idx = Math.floor(Math.random() * pool.length)
      spawnTrail(e.clientX, e.clientY, pool[idx])
    }
    node.addEventListener('click', onClick)
    return () => node.removeEventListener('click', onClick)
  }, [pool])

  return (
    <canvas
      ref={canvasRef}
      className="canvas-bubbles"
      role="img"
      aria-label="タップすると文字が軌跡を描きながら流れる"
    />
  )
}

