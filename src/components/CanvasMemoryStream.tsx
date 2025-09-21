import { useEffect, useMemo, useRef } from 'react'

type Trail = {
  id: number
  text: string
  x: number
  y: number
  dir: number
  speed: number
  edgeBounces: number
  ageMs: number
  maxAgeMs: number
  hue: number
  size: number
  history: Array<[number, number]>
  phase: number
  img: HTMLCanvasElement
  imgW: number
  imgH: number
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
  const HISTORY_LEN = 18

  const makeTextBitmap = (text: string, size: number, hue: number) => {
    const dpi = dprRef.current || 1
    const canv = document.createElement('canvas')
    const ctx = canv.getContext('2d')!
    ctx.font = `${size}px 'Inter', 'Noto Sans JP', sans-serif`
    const metrics = ctx.measureText(text)
    const w = Math.ceil((metrics.width + 12) * dpi)
    const h = Math.ceil((size + 12) * dpi)
    canv.width = w
    canv.height = h
    ctx.scale(dpi, dpi)
    ctx.font = `${size}px 'Inter', 'Noto Sans JP', sans-serif`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    const grad = ctx.createLinearGradient(-size, 0, size, 0)
    grad.addColorStop(0, `hsl(${hue},95%,82%)`)
    grad.addColorStop(1, `hsl(${hue + 40},95%,62%)`)
    ctx.fillStyle = grad
    ctx.shadowColor = `hsla(${hue},95%,70%,0.55)`
    ctx.shadowBlur = 12
    ctx.translate(w / (2 * dpi), h / (2 * dpi))
    ctx.fillText(text, 0, 0)
    return { canv, w, h }
  }

  const spawnTrail = (x: number, y: number, msg: string) => {
    const c = canvasRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    const d = dprRef.current
    const cx = (x - rect.left) * d
    const cy = (y - rect.top) * d

    let ang = Math.random() * Math.PI * 2
    const speed = 0.16 + Math.random() * 0.08 // px/ms（dpr適用後）

    const hue = 200 + Math.random() * 90
    const size = 16 + Math.random() * 10
    const { canv, w, h } = makeTextBitmap(msg, size, hue)

    idRef.current += 1
    const trail: Trail = {
      id: idRef.current,
      text: msg,
      x: cx,
      y: cy,
      dir: ang,
      speed,
      edgeBounces: 0,
      ageMs: 0,
      maxAgeMs: 9000 + Math.random() * 4000, // 9〜13秒
      hue,
      size,
      history: [],
      phase: Math.random() * Math.PI * 2,
      img: canv,
      imgW: w,
      imgH: h,
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

      const margin = 20 * dprRef.current
      const trails = trailsRef.current
      for (let i = trails.length - 1; i >= 0; i -= 1) {
        const tr = trails[i]
        tr.ageMs += dt
        if (tr.ageMs > tr.maxAgeMs || tr.edgeBounces >= 3) {
          trails.splice(i, 1)
          continue
        }

        // 常に前進（曲率付加：法線方向に微小ステア）
        tr.phase += dt * 0.004
        const steer = Math.sin(tr.phase) * 0.0015 * dt
        tr.dir += steer
        // 位置更新
        tr.x += Math.cos(tr.dir) * tr.speed * dt
        tr.y += Math.sin(tr.dir) * tr.speed * dt

        // 端で反射（3回で消滅）
        if (tr.x < margin) {
          tr.x = margin
          tr.dir = Math.PI - tr.dir
          tr.edgeBounces += 1
        } else if (tr.x > w - margin) {
          tr.x = w - margin
          tr.dir = Math.PI - tr.dir
          tr.edgeBounces += 1
        }
        if (tr.y < margin) {
          tr.y = margin
          tr.dir = -tr.dir
          tr.edgeBounces += 1
        } else if (tr.y > h - margin) {
          tr.y = h - margin
          tr.dir = -tr.dir
          tr.edgeBounces += 1
        }

        // 履歴（尾）
        tr.history.push([tr.x, tr.y])
        if (tr.history.length > HISTORY_LEN) tr.history.shift()

        const ang = tr.dir
        // 尾（履歴）を1本のパスで軽量描画
        if (tr.history.length > 1) {
          ctx.save()
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          const baseAlpha = Math.max(0.25, 1 - tr.ageMs / tr.maxAgeMs)
          ctx.strokeStyle = `hsla(${tr.hue + 24}, 95%, 66%, ${0.32 * baseAlpha})`
          ctx.lineWidth = Math.max(1.5, tr.size * 0.18)
          ctx.beginPath()
          for (let hsi = 0; hsi < tr.history.length; hsi += 1) {
            const [hx, hy] = tr.history[hsi]
            if (hsi === 0) ctx.moveTo(hx, hy)
            else ctx.lineTo(hx, hy)
          }
          ctx.stroke()
          ctx.restore()
        }

        // 先頭の文字はビットマップで1回だけ描画
        ctx.save()
        ctx.translate(tr.x, tr.y)
        ctx.rotate(ang)
        ctx.globalAlpha = 0.95
        ctx.drawImage(tr.img, -tr.imgW / (2 * (dprRef.current || 1)), -tr.imgH / (2 * (dprRef.current || 1)))
        ctx.restore()
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
