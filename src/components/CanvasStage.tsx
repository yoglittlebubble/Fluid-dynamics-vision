import { useEffect, useRef } from 'react'

export type DrawFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) => void

type Props = {
  draw: DrawFn
  playing?: boolean
  className?: string
  /** world coords: x in [-worldHalfW, worldHalfW], y similarly */
  worldHalfW?: number
  worldHalfH?: number
  onClickWorld?: (x: number, y: number) => void
  /** Pixel click, for pages whose world mapping is not the full canvas. */
  onClickCanvas?: (px: number, py: number, w: number, h: number) => void
  /** Simulation time, every frame. Callers should throttle setState. */
  onTime?: (t: number) => void
}

/** Responsive Canvas with world↔pixel mapping helpers exposed via draw closure */
export function CanvasStage({
  draw,
  playing = true,
  className,
  worldHalfW = 1.6,
  worldHalfH = 1.2,
  onClickWorld,
  onClickCanvas,
  onTime,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const tRef = useRef(0)
  const lastRef = useRef(0)
  const drawRef = useRef(draw)
  const onTimeRef = useRef(onTime)
  drawRef.current = draw
  onTimeRef.current = onTime

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = parent.getBoundingClientRect()
      const w = Math.max(320, Math.floor(rect.width))
      const h = Math.max(240, Math.floor(rect.height))
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    const loop = (now: number) => {
      if (!lastRef.current) lastRef.current = now
      const dt = Math.min(0.05, (now - lastRef.current) / 1000)
      lastRef.current = now
      if (playing) tRef.current += dt
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const w = canvas.clientWidth
        const h = canvas.clientHeight
        drawRef.current(ctx, w, h, tRef.current)
      }
      onTimeRef.current?.(tRef.current)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [playing])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (onClickCanvas) {
      onClickCanvas(px, py, w, h)
      return
    }
    if (!onClickWorld) return
    const x = ((px / w) * 2 - 1) * worldHalfW
    const y = -((py / h) * 2 - 1) * worldHalfH
    onClickWorld(x, y)
  }

  return (
    <canvas
      ref={canvasRef}
      className={className ?? 'viz-canvas'}
      onClick={handleClick}
    />
  )
}

export function worldToPixel(
  x: number,
  y: number,
  w: number,
  h: number,
  halfW = 1.6,
  halfH = 1.2,
): { px: number; py: number } {
  return {
    px: ((x / halfW + 1) / 2) * w,
    py: ((-y / halfH + 1) / 2) * h,
  }
}

/** Annotation size that tracks the shorter side of the stage. */
export function stageFontPx(w: number, h: number, ratio = 0.038): number {
  return Math.round(Math.min(22, Math.max(14, Math.min(w, h) * ratio)))
}

export function stageFont(
  w: number,
  h: number,
  ratio = 0.038,
  weight = 600,
): string {
  return `${weight} ${stageFontPx(w, h, ratio)}px "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`
}

export function clearStage(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  ctx.setLineDash([])
  ctx.lineWidth = 1
  ctx.globalAlpha = 1
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#0b1220'
  ctx.fillRect(0, 0, w, h)
}

/** 0 = slow (cyan), 1 = fast (amber). */
export function speedRgb(t: number): string {
  const u = Math.max(0, Math.min(1, t))
  const r = Math.round(56 + (251 - 56) * u)
  const g = Math.round(189 + (191 - 189) * u)
  const b = Math.round(248 + (36 - 248) * u)
  return `rgb(${r}, ${g}, ${b})`
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  lineWidth = 2,
) {
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy)
  if (len < 1.5) return
  const ang = Math.atan2(dy, dx)
  const head = Math.min(len * 0.42, Math.max(7, lineWidth * 3.2))
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - head * Math.cos(ang - 0.38), y1 - head * Math.sin(ang - 0.38))
  ctx.lineTo(x1 - head * Math.cos(ang + 0.38), y1 - head * Math.sin(ang + 0.38))
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** Short geometric callout. Legends and live numbers belong in the DOM. */
export function drawChip(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  fontPx: number,
) {
  ctx.save()
  ctx.font = `700 ${fontPx}px "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`
  const padX = fontPx * 0.55
  const padY = fontPx * 0.32
  const tw = ctx.measureText(text).width
  const bw = tw + padX * 2
  const bh = fontPx + padY * 2
  const left = x - bw / 2
  const top = y - bh / 2
  ctx.beginPath()
  ctx.roundRect(left, top, bw, bh, Math.min(10, bh / 2))
  ctx.fillStyle = 'rgba(7, 11, 20, 0.9)'
  ctx.fill()
  ctx.lineWidth = 1.5
  ctx.strokeStyle = color
  ctx.stroke()
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y + fontPx * 0.04)
  ctx.restore()
}

export function drawPolyline(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  w: number,
  h: number,
  color: string,
  lineWidth = 1.5,
  halfW = 1.6,
  halfH = 1.2,
) {
  if (pts.length < 2) return
  ctx.beginPath()
  pts.forEach((p, i) => {
    const { px, py } = worldToPixel(p.x, p.y, w, h, halfW, halfH)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()
}
