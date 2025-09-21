import { useEffect, useMemo, useRef } from 'react'

type Letter = {
  ch: string
  t: number
  speed: number
  dir: number
  bounces: number
  edgeBounces: number
  size: number
  hue: number
  ageMs: number
  maxAgeMs: number
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
    const d = Math.min(window.devicePixelRatio || 1, 1.6)
    dprRef.current = d
    c.width = Math.max(1, Math.floor(r.width * d))
    c.height = Math.max(1, Math.floor(r.height * d))
  }

  const MAX_TRAILS = 24

  const spawnTrail = (x: number, y: number, msg: string) => {
    const c = canvasRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    const d = dprRef.current
    const cx = (x - rect.left) * d
    const cy = (y - rect.top) * d

    // flowing bezier upwards (広がりを持たせて縁まで届くレンジ)
    const p0: [number, number] = [cx, cy]
    const p3: [number, number] = [
      cx + (Math.random() - 0.5) * 320 * d,
      cy - (220 + Math.random() * 260) * d,
    ]
    const p1: [number, number] = [
      p0[0] + (Math.random() - 0.5) * 280 * d,
      p0[1] - (60 + Math.random() * 160) * d,
    ]
    const p2: [number, number] = [
      p3[0] + (Math.random() - 0.5) * 260 * d,
      p3[1] + (60 + Math.random() * 200) * d,
    ]

    const letters: Letter[] = []
    const baseHue = 200 + Math.random() * 90
    const baseSize = 12 + Math.random() * 12
    // 軽量化：テキスト全体を1要素として扱い、スタンプ回数を抑制
    const chars = [msg]
    for (let i = 0; i < chars.length; i += 1) {
      letters.push({
        ch: chars[i],
        t: Math.max(0, -i * 0.06),
        // 止まらず進むレンジ（軽量寄り）
        speed: 0.0014 + Math.random() * 0.0010,
        dir: 1,
        bounces: 0,
        edgeBounces: 0,
        size: baseSize * (0.85 + Math.random() * 0.3),
        hue: baseHue + (Math.random() - 0.5) * 30,
        ageMs: 0,
        maxAgeMs: 12000 + Math.random() * 5000,
      })
    }

    idRef.current += 1
    const arr = trailsRef.current
    if (arr.length >= MAX_TRAILS) arr.splice(0, arr.length - MAX_TRAILS + 1)
    arr.push({ id: idRef.current, p0, p1, p2, p3, letters })
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

      // 残像を程よく残す
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(5,8,22,0.14)'
      ctx.fillRect(0, 0, w, h)

      ctx.globalCompositeOperation = 'lighter'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'

      const margin = 20 * dprRef.current
      const trails = trailsRef.current
      for (let ti = trails.length - 1; ti >= 0; ti -= 1) {
        const tr = trails[ti]
        let aliveLetters = 0
        for (let li = 0; li < tr.letters.length; li += 1) {
          const L = tr.letters[li]
          // advance
          L.t += L.dir * L.speed * dt
          if (L.t > 1) {
            L.t = 2 - L.t
            L.dir *= -1
            L.bounces += 1
          } else if (L.t < 0) {
            L.t = -L.t
            L.dir *= -1
            L.bounces += 1
          }
          if (L.edgeBounces >= 3) continue
          L.ageMs += dt
          if (L.ageMs > L.maxAgeMs) continue
          aliveLetters += 1

          const t1 = Math.max(0, Math.min(1, L.t))
          let x = cubic(t1, tr.p0[0], tr.p1[0], tr.p2[0], tr.p3[0])
          let y = cubic(t1, tr.p0[1], tr.p1[1], tr.p2[1], tr.p3[1])
          const dx = dcubic(t1, tr.p0[0], tr.p1[0], tr.p2[0], tr.p3[0])
          const dy = dcubic(t1, tr.p0[1], tr.p1[1], tr.p2[1], tr.p3[1])
          const ang = Math.atan2(dy, dx)

          // 画面端で反射（3回で消滅）
          if ((x < margin || x > w - margin || y < margin || y > h - margin) && L.bounces <= 12) {
            L.dir *= -1
            L.speed = Math.max(0.0013, L.speed * 0.95)
            L.bounces += 1
            L.edgeBounces += 1
          }

          // 寿命フェード係数
          const lifeFade = Math.max(0.45, 1 - (L.ageMs / L.maxAgeMs) * 0.6)

          // 尾（分割数を抑えて軽量化）フレーム時間に応じて自動降格
          const TAIL_SPAN = 0.16
          const steps = (dt > 26 ? 4 : 8)
          for (let s = 0; s <= steps; s += 1) {
            const f = s / steps
            const tt = Math.max(0, Math.min(1, t1 - L.dir * f * TAIL_SPAN))
            const xx = cubic(tt, tr.p0[0], tr.p1[0], tr.p2[0], tr.p3[0])
            const yy = cubic(tt, tr.p0[1], tr.p1[1], tr.p2[1], tr.p3[1])
            const segAlpha = lifeFade * (1 - f) * (1 - f)
            const sizeScale = 0.85 + 0.15 * (1 - f)
            ctx.save()
            ctx.translate(xx, yy)
            ctx.rotate(ang)
            ctx.font = `${L.size * sizeScale}px 'Inter', 'Noto Sans JP', sans-serif`
            const grad = ctx.createLinearGradient(-L.size, 0, L.size, 0)
            grad.addColorStop(0, `hsla(${L.hue}, 95%, 80%, ${0.22 * segAlpha})`)
            grad.addColorStop(1, `hsla(${L.hue + 40}, 95%, 60%, ${0.38 * segAlpha})`)
            ctx.fillStyle = grad
            ctx.shadowColor = `hsla(${L.hue}, 95%, 70%, ${0.45 * segAlpha})`
            ctx.shadowBlur = 8
            ctx.fillText(L.ch, 0, 0)
            ctx.restore()
          }
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
    const onPointerDown = (e: PointerEvent) => {
      const idx = Math.floor(Math.random() * pool.length)
      spawnTrail(e.clientX, e.clientY, pool[idx])
    }
    node.addEventListener('pointerdown', onPointerDown)
    return () => node.removeEventListener('pointerdown', onPointerDown)
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
