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
}

/** Responsive Canvas with world↔pixel mapping helpers exposed via draw closure */
export function CanvasStage({
  draw,
  playing = true,
  className,
  worldHalfW = 1.6,
  worldHalfH = 1.2,
  onClickWorld,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const tRef = useRef(0)
  const lastRef = useRef(0)
  const drawRef = useRef(draw)
  drawRef.current = draw

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
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [playing])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onClickWorld) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const w = canvas.clientWidth
    const h = canvas.clientHeight
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
  ctx.stroke()
}
