import { useCallback, useMemo, useState } from 'react'
import { CanvasStage, worldToPixel } from '../components/CanvasStage'
import { convergingDuct, rk4, type Vec2 } from '../physics/fields'

export function Continuity() {
  const [playing, setPlaying] = useState(true)
  const [taper, setTaper] = useState(0.22)
  const [U0, setU0] = useState(0.4)
  const field = useMemo(() => convergingDuct(U0, taper), [U0, taper])

  const particlesRef = useMemo(() => {
    const list: Vec2[] = []
    for (let i = 0; i < 30; i++) {
      list.push({
        x: -1.5 + Math.random() * 0.4,
        y: (Math.random() - 0.5) * 1.4,
      })
    }
    return { current: list }
  }, [])
  const lastT = useMemo(() => ({ current: 0 }), [])

  const halfAt = (x: number) => Math.max(0.25, 1 - taper * Math.max(0, x))

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      const dt = lastT.current === 0 ? 0 : Math.min(0.05, t - lastT.current)
      lastT.current = t

      if (dt > 0) {
        particlesRef.current = particlesRef.current.map((p) => {
          let np = rk4(field, p, t - dt, dt)
          const half = halfAt(np.x)
          if (Math.abs(np.y) > half * 0.95) np.y *= 0.9
          if (np.x > 1.6 || np.x < -1.7) {
            return {
              x: -1.55,
              y: (Math.random() - 0.5) * 2 * halfAt(-1.55) * 0.85,
            }
          }
          return np
        })
      }

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, w, h)

      // duct walls
      const wallPtsTop: { x: number; y: number }[] = []
      const wallPtsBot: { x: number; y: number }[] = []
      for (let i = 0; i <= 40; i++) {
        const x = -1.6 + (3.2 * i) / 40
        const half = halfAt(x)
        wallPtsTop.push({ x, y: half })
        wallPtsBot.push({ x, y: -half })
      }
      ctx.beginPath()
      wallPtsTop.forEach((p, i) => {
        const { px, py } = worldToPixel(p.x, p.y, w, h)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.beginPath()
      wallPtsBot.forEach((p, i) => {
        const { px, py } = worldToPixel(p.x, p.y, w, h)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.stroke()

      // sections A1 A2
      const x1 = -1.0
      const x2 = 0.9
      const h1 = halfAt(x1)
      const h2 = halfAt(x2)
      const drawSection = (x: number, half: number, label: string) => {
        const a = worldToPixel(x, half, w, h)
        const b = worldToPixel(x, -half, w, h)
        ctx.strokeStyle = '#38bdf8'
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(a.px, a.py)
        ctx.lineTo(b.px, b.py)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = '#38bdf8'
        ctx.font = '13px system-ui'
        ctx.fillText(label, a.px + 6, a.py - 6)
      }
      drawSection(x1, h1, '断面 1')
      drawSection(x2, h2, '断面 2')

      // particles
      particlesRef.current.forEach((p) => {
        const { px, py } = worldToPixel(p.x, p.y, w, h)
        ctx.beginPath()
        ctx.arc(px, py, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = '#fbbf24'
        ctx.fill()
      })

      // continuity numbers (2D "area" ~ height)
      const A1 = 2 * h1
      const A2 = 2 * h2
      const v1 = U0 / h1 // consistent with field scaling roughly
      const v2 = U0 / h2
      const Q1 = v1 * A1
      const Q2 = v2 * A2

      ctx.fillStyle = '#e2e8f0'
      ctx.font = '13px system-ui'
      ctx.fillText(
        `示意：A₁≈${A1.toFixed(2)}  v₁≈${v1.toFixed(2)}  Q₁=v₁A₁≈${Q1.toFixed(2)}`,
        16,
        28,
      )
      ctx.fillText(
        `　　　A₂≈${A2.toFixed(2)}  v₂≈${v2.toFixed(2)}  Q₂=v₂A₂≈${Q2.toFixed(2)}`,
        16,
        48,
      )
      ctx.fillStyle = '#86efac'
      ctx.fillText('不可压缩：Q₁ = Q₂（流量守恒）→ 断面越小，流速越大', 16, h - 16)
    },
    [U0, field, halfAt, lastT, particlesRef],
  )

  return (
    <div className="page">
      <h1>连续性方程</h1>
      <p className="lead">
        对不可压缩流体，恒定流一维连续性方程为 <strong>Q = v₁A₁ = v₂A₂</strong>
        。管道收缩时断面面积减小，平均流速增大。下方用「管道高度」模拟面积变化。
      </p>
      <div className="controls">
        <button type="button" onClick={() => setPlaying((p) => !p)}>
          {playing ? '暂停' : '播放'}
        </button>
        <label className="seg">
          <span>收缩强度 {taper.toFixed(2)}</span>
          <input
            type="range"
            min={0.05}
            max={0.35}
            step={0.01}
            value={taper}
            onChange={(e) => setTaper(Number(e.target.value))}
          />
        </label>
        <label className="seg">
          <span>来流 U₀ {U0.toFixed(2)}</span>
          <input
            type="range"
            min={0.2}
            max={0.8}
            step={0.02}
            value={U0}
            onChange={(e) => setU0(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="viz-frame">
        <CanvasStage draw={draw} playing={playing} />
      </div>
      <p className="hint">观察收缩段粒子间距被拉开（速度增大），流量示意保持相等。</p>
    </div>
  )
}
