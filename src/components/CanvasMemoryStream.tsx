import { useEffect, useMemo, useRef } from 'react'

type Trail = {
  id: number
  text: string
  x: number
  y: number
  vx: number
  vy: number
  edgeBounces: number
  ageMs: number
  maxAgeMs: number
  hue: number
  size: number
  history: Array<[number, number]>
}

export type MemoryStreamProps = {
  messages: string[]
  onReveal?: (text: string) => void
}

export const CanvasMemoryStream = ({ messages, onReveal }: MemoryStreamProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const dprRef = useRef(1)
  const trailsRef = useRef<Trail[]>([])
  const idRef = useRef(0)

  const pool = useMemo(
    () => (messages && messages.length ? messages : ['今日はありがとう', '次は海に行こう', '3240kmの言葉', '同じ夜をもう一度']),
    [messages]
  )

  const resize = () => {
    const c = canvasRef.current
    if (!c) return
    const r = c.getBoundingClientRect()
    const d = Math.min(window.devicePixelRatio || 1, 1.5)
    dprRef.current = d
    c.width = Math.max(1, Math.floor(r.width * d))
    c.height = Math.max(1, Math.floor(r.height * d))
  }

  const MAX_TRAILS = 28
  const HISTORY_LEN = 14

  const spawnTrail = (x: number, y: number, msg: string) => {
    const c = canvasRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    const d = dprRef.current
    const cx = (x - rect.left) * d
    const cy = (y - rect.top) * d

    let ang = Math.random() * Math.PI * 2
    const speed = 0.14 + Math.random() * 0.08 // px/ms（dpr適用後）
    const vx = Math.cos(ang) * speed
    const vy = -Math.abs(Math.sin(ang)) * speed // 上方向ベース

    const hue = 200 + Math.random() * 90
    const size = 14 + Math.random() * 10

    idRef.current += 1
    const trail: Trail = {
      id: idRef.current,
      text: msg,
      x: cx,
      y: cy,
      vx,
      vy,
      edgeBounces: 0,
      ageMs: 0,
      maxAgeMs: 9000 + Math.random() * 4000, // 9〜13秒
      hue,
      size,
      history: [],
    }

    const arr = trailsRef.current
    if (arr.length >= MAX_TRAILS) arr.splice(0, arr.length - MAX_TRAILS + 1)
    arr.push(trail)
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

      // 軽量クリア＋残像少し
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(5,8,22,0.18)'
      ctx.fillRect(0, 0, w, h)

      ctx.globalCompositeOperation = 'lighter'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'

      const margin = 18 * dprRef.current
      const trails = trailsRef.current
      for (let i = trails.length - 1; i >= 0; i -= 1) {
        const tr = trails[i]
        tr.ageMs += dt
        if (tr.ageMs > tr.maxAgeMs || tr.edgeBounces >= 3) {
          trails.splice(i, 1)
          continue
        }

        // 常に前進
        tr.x += tr.vx * dt
        tr.y += tr.vy * dt

        // 端で反射（3回で消滅）
        if (tr.x < margin) {
          tr.x = margin
          tr.vx = Math.abs(tr.vx)
          tr.edgeBounces += 1
        } else if (tr.x > w - margin) {
          tr.x = w - margin
          tr.vx = -Math.abs(tr.vx)
          tr.edgeBounces += 1
        }
        if (tr.y < margin) {
          tr.y = margin
          tr.vy = Math.abs(tr.vy)
          tr.edgeBounces += 1
        } else if (tr.y > h - margin) {
          tr.y = h - margin
          tr.vy = -Math.abs(tr.vy)
          tr.edgeBounces += 1
        }

        // 履歴（尾）
        tr.history.push([tr.x, tr.y])
        if (tr.history.length > HISTORY_LEN) tr.history.shift()

        const ang = Math.atan2(tr.vy, tr.vx)
        // 尾を描画（履歴に沿って、後方ほど薄く小さく）
        for (let hsi = 0; hsi < tr.history.length; hsi += 1) {
          const [hx, hy] = tr.history[hsi]
          const f = hsi / tr.history.length
          const alpha = Math.max(0, 1 - f * 1.2) * Math.max(0.35, 1 - tr.ageMs / tr.maxAgeMs)
          const sizeScale = 0.85 + 0.15 * (1 - f)
          ctx.save()
          ctx.translate(hx, hy)
          ctx.rotate(ang)
          ctx.font = `${tr.size * sizeScale}px 'Inter', 'Noto Sans JP', sans-serif`
          const grad = ctx.createLinearGradient(-tr.size, 0, tr.size, 0)
          grad.addColorStop(0, `hsla(${tr.hue}, 95%, 80%, ${0.22 * alpha})`)
          grad.addColorStop(1, `hsla(${tr.hue + 40}, 95%, 60%, ${0.38 * alpha})`)
          ctx.fillStyle = grad
          ctx.shadowColor = `hsla(${tr.hue}, 95%, 70%, ${0.45 * alpha})`
          ctx.shadowBlur = 10
          ctx.fillText(tr.text, 0, 0)
          ctx.restore()
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
