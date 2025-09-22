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

// derivative unused in the current upright-rendering mode
// const dcubic = (t: number, a: number, b: number, c: number, d: number) =>
//   3 * ((1 - t) ** 2) * (b - a) + 6 * (1 - t) * t * (c - b) + 3 * (t ** 2) * (d - c)

export const CanvasMemoryStream = ({ messages, onReveal }: MemoryStreamProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const dprRef = useRef(1)
  const strokeTickRef = useRef(0)
  const trailsRef = useRef<Trail[]>([])
  const idRef = useRef(0)
  // leftover cache removed (not used)

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
    const d = Math.min(window.devicePixelRatio || 1, 1.4)
    dprRef.current = d
    c.width = Math.max(1, Math.floor(r.width * d))
    c.height = Math.max(1, Math.floor(r.height * d))
  }

  const MAX_TRAILS = 12
  const MAX_CHARS = 48

  const spawnTrail = (x: number, y: number, msg: string) => {
    const c = canvasRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    const d = dprRef.current
    const cx = (x - rect.left) * d
    const cy = (y - rect.top) * d

    // flowing bezier upwards (広がりを持たせて縁まで届くレンジ)
    const p0: [number, number] = [cx, cy]
    // ensure the head always reaches above the top edge to collide and vanish
    const p3: [number, number] = [
      cx + (Math.random() - 0.5) * 260 * d,
      -80 * d,
    ]
    const p1: [number, number] = [
      p0[0] + (Math.random() - 0.5) * 260 * d,
      p0[1] - (60 + Math.random() * 140) * d,
    ]
    const p2: [number, number] = [
      p3[0] + (Math.random() - 0.5) * 220 * d,
      p3[1] + (80 + Math.random() * 160) * d,
    ]

    const letters: Letter[] = []
    const baseHue = 200 + Math.random() * 90
    const baseSize = 15 + Math.random() * 9
    // 文字の蛇：一つの光＝一つの文章（最大48文字）
    const chars = [...msg].slice(0, MAX_CHARS)
    for (let i = 0; i < chars.length; i += 1) {
      letters.push({
        ch: chars[i],
        // widen spacing so glyphs are more legible along the curve
        t: Math.max(0, -i * 0.12),
        // さらに約50%減速（可読性優先・負荷は上限本数で制御）
        speed: 0.00045 + Math.random() * 0.0003,
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
      strokeTickRef.current += 1
      const w = c.width
      const h = c.height

      // 残像を程よく残す
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(5,8,22,0.14)'
      ctx.fillRect(0, 0, w, h)

      ctx.globalCompositeOperation = 'lighter'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'

      const trails = trailsRef.current
      for (let ti = trails.length - 1; ti >= 0; ti -= 1) {
        const tr = trails[ti]
        let aliveLetters = 0
        let collided = false
        for (let li = 0; li < tr.letters.length; li += 1) {
          const L = tr.letters[li]
          // advance upward (no reflection)
          L.t += L.speed * dt
          if (L.t < 0) continue
          L.ageMs += dt
          aliveLetters += 1

          const t1 = Math.max(0, Math.min(1, L.t))
          let x = cubic(t1, tr.p0[0], tr.p1[0], tr.p2[0], tr.p3[0])
          let y = cubic(t1, tr.p0[1], tr.p1[1], tr.p2[1], tr.p3[1])
          // const dx = dcubic(t1, tr.p0[0], tr.p1[0], tr.p2[0], tr.p3[0])
          // const dy = dcubic(t1, tr.p0[1], tr.p1[1], tr.p2[1], tr.p3[1])

          // 天井や左右端に到達したら衝突消失（スネーク全体を除去）
          const margin = 8 * dprRef.current
          if (li === 0 && (y < margin || x < margin || x > w - margin)) {
            collided = true
            break
          }

          // 寿命フェード係数
          const lifeFade = Math.max(0.5, 1 - (L.ageMs / L.maxAgeMs) * 0.6)

          // ヘッドだけ曲線ストローク（曲線の存在感を1回で強調）
          const doStroke = (strokeTickRef.current % 2) === 0
          if (li === 0 && doStroke) {
            const span = 0.24
            const steps = dt > 26 ? 10 : 16
            ctx.save()
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.beginPath()
            for (let s = 0; s <= steps; s += 1) {
              const f = s / steps
              const tt = Math.max(0, Math.min(1, t1 - f * span))
              const xx = cubic(tt, tr.p0[0], tr.p1[0], tr.p2[0], tr.p3[0])
              const yy = cubic(tt, tr.p0[1], tr.p1[1], tr.p2[1], tr.p3[1])
              if (s === 0) ctx.moveTo(xx, yy)
              else ctx.lineTo(xx, yy)
            }
            const baseAlpha = 0.24 * lifeFade
            ctx.strokeStyle = `hsla(${L.hue + 24}, 95%, 66%, ${baseAlpha})`
            ctx.lineWidth = Math.max(1.1, L.size * 0.16)
            ctx.shadowColor = `hsla(${L.hue},95%,70%,${baseAlpha * 0.8})`
            ctx.shadowBlur = 8
            ctx.stroke()
            ctx.restore()
          }

          // 文字を直立で描画（美しさ優先のカラーグラデ＋細い縁）
          ctx.save()
          ctx.translate(x, y)
          ctx.font = `${L.size}px 'Inter', 'Noto Sans JP', sans-serif`
          // 薄いダーク縁取り（黒ではなく色味を残したダーク）
          ctx.globalCompositeOperation = 'source-over'
          ctx.lineWidth = 1.2
          ctx.strokeStyle = `hsla(${L.hue}, 30%, 12%, ${0.55 * lifeFade})`
          ctx.strokeText(L.ch, 0, 0)
          // カラーグラデで本体
          const grad2 = ctx.createLinearGradient(-L.size, 0, L.size, 0)
          grad2.addColorStop(0, `hsla(${L.hue}, 95%, 85%, ${0.92})`)
          grad2.addColorStop(1, `hsla(${L.hue + 38}, 95%, 68%, ${0.92})`)
          ctx.fillStyle = grad2
          ctx.fillText(L.ch, 0, 0)
          // 控えめなグロー
          ctx.globalCompositeOperation = 'lighter'
          ctx.shadowColor = `hsla(${L.hue + 20}, 95%, 70%, ${0.28 * lifeFade})`
          ctx.shadowBlur = 6
          ctx.fillText(L.ch, 0, 0)
          ctx.restore()
        }
        if (collided) {
          trails.splice(ti, 1)
          continue
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
