import { useEffect, useMemo, useRef } from 'react'
import { curatedShortMessages } from '../data/messages-curated'

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
  // arc-length sampling for pixel-accurate placement
  samplesT: number[]
  samplesX: number[]
  samplesY: number[]
  samplesS: number[]
  totalLen: number
  baseS: number
  speedPx: number
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

export const CanvasMemoryStream = ({ messages: _messages, onReveal }: MemoryStreamProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const dprRef = useRef(1)
  const strokeTickRef = useRef(0)
  const trailsRef = useRef<Trail[]>([])
  const idRef = useRef(0)
  const glyphCache = useRef<Map<string, HTMLCanvasElement>>(new Map())
  // leftover cache removed (not used)

  const pool = useMemo(() => curatedShortMessages, [])

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
  const MAX_CHARS = 12

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
      -220 * d, // ヘッドが天井に達するまでの距離を延ばして可視文字数を確保
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
    const chars = [...msg].slice(0, MAX_CHARS)
    // ストリーム内は統一感を持たせる（同一サイズ・色相）
    for (let i = 0; i < chars.length; i += 1) {
      letters.push({
        ch: chars[i],
        t: 0,
        speed: 0,
        dir: 1,
        bounces: 0,
        edgeBounces: 0,
        size: baseSize,
        hue: baseHue,
        ageMs: 0,
        maxAgeMs: 12000 + Math.random() * 5000,
      })
    }

    // arc-length sampling
    const samples = 64
    const samplesT: number[] = []
    const samplesX: number[] = []
    const samplesY: number[] = []
    const samplesS: number[] = []
    let totalLen = 0
    let prevX = cubic(0, p0[0], p1[0], p2[0], p3[0])
    let prevY = cubic(0, p0[1], p1[1], p2[1], p3[1])
    for (let k = 0; k <= samples; k += 1) {
      const t = k / samples
      const x = cubic(t, p0[0], p1[0], p2[0], p3[0])
      const y = cubic(t, p0[1], p1[1], p2[1], p3[1])
      if (k > 0) {
        const dx = x - prevX
        const dy = y - prevY
        totalLen += Math.hypot(dx, dy)
      }
      samplesT.push(t)
      samplesX.push(x)
      samplesY.push(y)
      samplesS.push(totalLen)
      prevX = x
      prevY = y
    }

    idRef.current += 1
    const arr = trailsRef.current
    if (arr.length >= MAX_TRAILS) arr.splice(0, arr.length - MAX_TRAILS + 1)
    const speedPx = 24 + Math.random() * 10 // px/sec? our dt is ms, so px/ms ~ 0.024–0.034
    arr.push({
      id: idRef.current,
      p0, p1, p2, p3,
      letters,
      samplesT, samplesX, samplesY, samplesS,
      totalLen,
      baseS: 0,
      speedPx: speedPx / 1000, // convert to px/ms
    })
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
        let collidedHead = false
        // ヘッド進行（画素距離で進む）
        tr.baseS += tr.speedPx * dt
        const GAP_PX = 28 // 文字間隔(px)
        const mapStoIdx = (s: number) => {
          if (s <= 0) return 0
          if (s >= tr.totalLen) return tr.samplesS.length - 1
          // 二分探索
          let lo = 0, hi = tr.samplesS.length - 1
          while (lo < hi) {
            const mid = (lo + hi) >> 1
            if (tr.samplesS[mid] < s) lo = mid + 1
            else hi = mid
          }
          return lo
        }
        for (let li = 0; li < tr.letters.length; li += 1) {
          const L = tr.letters[li]
          const sTarget = tr.baseS - li * GAP_PX
          if (sTarget < 0) continue
          L.ageMs += dt
          aliveLetters += 1

          const idx = mapStoIdx(sTarget)
          const x = tr.samplesX[idx]
          const y = tr.samplesY[idx]
          // const dx = dcubic(t1, tr.p0[0], tr.p1[0], tr.p2[0], tr.p3[0])
          // const dy = dcubic(t1, tr.p0[1], tr.p1[1], tr.p2[1], tr.p3[1])

          // 天井や左右端に到達したら衝突消失（スネーク全体を除去）
          const margin = 8 * dprRef.current
          if (li === 0 && (y < margin || x < margin || x > w - margin)) {
            collidedHead = true
          }

          // 寿命フェード係数
          const lifeFade = Math.max(0.5, 1 - (tr.baseS / (tr.totalLen * 1.1)))

          // ヘッドだけ曲線ストローク（曲線の存在感を1回で強調）
          // 高負荷時はストロークを抑制（本数>8 もしくはフレーム遅延が大）
          const heavy = trails.length > 8 || dt > 26
          const doStroke = !heavy && (strokeTickRef.current % 2 === 0)
          if (li === 0 && doStroke) {
            const steps = dt > 26 ? 10 : 16
            ctx.save()
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.beginPath()
            for (let s = 0; s <= steps; s += 1) {
              const f = s / steps
              const sStroke = Math.max(0, tr.baseS - f * (GAP_PX * 1.2))
              const idx2 = mapStoIdx(sStroke)
              const xx = tr.samplesX[idx2]
              const yy = tr.samplesY[idx2]
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

          // 文字ビットマップをキャッシュして軽量描画
          ctx.save()
          ctx.translate(x, y)
          ctx.globalCompositeOperation = 'source-over'
          const bmp = getGlyphBitmap(L.ch, L.size, L.hue, dprRef.current)
          const scale = 1 / (dprRef.current || 1)
          ctx.scale(scale, scale)
          ctx.globalAlpha = lifeFade
          ctx.drawImage(bmp, -bmp.width / 2, -bmp.height / 2)
          // ヘッドのみ淡いグローを重ねる
          if (li === 0) {
            ctx.globalCompositeOperation = 'lighter'
            ctx.globalAlpha = 0.15 * lifeFade
            ctx.drawImage(bmp, -bmp.width / 2, -bmp.height / 2)
          }
          ctx.restore()
        }
        // ヘッドが天井到達かつ末尾も可視域に入ってから全体を消滅
        if (collidedHead) {
          const last = tr.letters[tr.letters.length - 1]
          if (last.t >= 0) {
            trails.splice(ti, 1)
            continue
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

  const getGlyphBitmap = (
    ch: string,
    size: number,
    hue: number,
    dpr: number
  ) => {
    const hueKey = Math.round(hue / 12) * 12 // ヒューを丸めてキャッシュ効率化
    const key = `${ch}|${Math.round(size)}|${hueKey}|${Math.round((dpr || 1) * 10)}`
    const cached = glyphCache.current.get(key)
    if (cached) return cached

    const dpi = Math.max(1, Math.min(2, dpr || 1))
    const canvas = document.createElement('canvas')
    const gctx = canvas.getContext('2d')!
    gctx.font = `${size}px 'Inter', 'Noto Sans JP', sans-serif`
    const m = gctx.measureText(ch)
    const pad = Math.ceil(size * 0.6)
    const w = Math.ceil((m.width + pad) * dpi)
    const h = Math.ceil((size + pad) * dpi)
    canvas.width = w
    canvas.height = h
    gctx.scale(dpi, dpi)
    gctx.textBaseline = 'middle'
    gctx.textAlign = 'center'
    gctx.font = `${size}px 'Inter', 'Noto Sans JP', sans-serif`

    // 薄いダーク縁取り
    gctx.lineWidth = 1.2
    gctx.strokeStyle = `hsla(${hueKey}, 30%, 12%, 0.65)`
    gctx.strokeText(ch, w / (2 * dpi), h / (2 * dpi))
    // カラーグラデ本体
    const grad = gctx.createLinearGradient(-size, 0, size, 0)
    grad.addColorStop(0, `hsla(${hueKey}, 95%, 85%, 0.98)`)
    grad.addColorStop(1, `hsla(${hueKey + 36}, 95%, 70%, 0.98)`)
    gctx.fillStyle = grad
    gctx.fillText(ch, w / (2 * dpi), h / (2 * dpi))

    glyphCache.current.set(key, canvas)
    return canvas
  }

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
    // 連打対策：一定間隔内はスロットル。上限到達時は無視。
    let lastSpawn = 0
    const MIN_INTERVAL = 140 // ms
    const onPointerDown = (e: PointerEvent) => {
      const now = performance.now()
      if (now - lastSpawn < MIN_INTERVAL) return
      if (trailsRef.current.length >= MAX_TRAILS) return
      lastSpawn = now
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
