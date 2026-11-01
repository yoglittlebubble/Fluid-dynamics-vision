import { useCallback, useMemo, useState } from 'react'
import {
  CanvasStage,
  clearStage,
  drawArrow,
  speedRgb,
  stageFont,
  stageFontPx,
  worldToPixel,
} from '../components/CanvasStage'
import { Legend, PlayButton, Readouts } from '../components/VizChrome'
import { convergingDuct, rk4, type Vec2 } from '../physics/fields'

export function Continuity() {
  const [playing, setPlaying] = useState(true)
  const [taper, setTaper] = useState(0.22)
  const [U0, setU0] = useState(0.4)
  const field = useMemo(() => convergingDuct(U0, taper), [U0, taper])

  const particlesRef = useMemo(() => {
    const list: Vec2[] = []
    for (let i = 0; i < 42; i++) {
      const x = -1.5 + (i / 41) * 3.05
      const half = Math.max(0.25, 1 - 0.22 * Math.max(0, x))
      list.push({
        x,
        y: (Math.random() - 0.5) * 2 * half * 0.82,
      })
    }
    return { current: list }
  }, [])
  const lastT = useMemo(() => ({ current: 0 }), [])

  const halfAt = useCallback(
    (x: number) => Math.max(0.25, 1 - taper * Math.max(0, x)),
    [taper],
  )

  const sections = useMemo(() => {
    const x1 = -1.0
    const x2 = 0.9
    const h1 = halfAt(x1)
    const h2 = halfAt(x2)
    const A1 = 2 * h1
    const A2 = 2 * h2
    const v1 = U0 / h1
    const v2 = U0 / h2
    return { x1, x2, h1, h2, A1, A2, v1, v2, Q: v1 * A1 }
  }, [U0, halfAt])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      const dt = lastT.current === 0 ? 0 : Math.min(0.05, t - lastT.current)
      lastT.current = t

      if (dt > 0) {
        particlesRef.current = particlesRef.current.map((p) => {
          let np = rk4(field, p, t - dt, dt)
          const half = halfAt(np.x)
          if (Math.abs(np.y) > half * 0.92) np = { ...np, y: np.y * 0.88 }
          if (np.x > 1.55 || np.x < -1.65) {
            return {
              x: -1.55,
              y: (Math.random() - 0.5) * 2 * halfAt(-1.55) * 0.8,
            }
          }
          return np
        })
      }

      clearStage(ctx, w, h)

      const wall = (ySign: number) => {
        ctx.beginPath()
        for (let i = 0; i <= 48; i++) {
          const x = -1.6 + (3.2 * i) / 48
          const { px, py } = worldToPixel(x, ySign * halfAt(x), w, h)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = Math.max(2.2, Math.min(w, h) * 0.005)
        ctx.stroke()
      }
      wall(1)
      wall(-1)

      const mark = (x: number, half: number, label: string) => {
        const a = worldToPixel(x, half, w, h)
        const b = worldToPixel(x, -half, w, h)
        ctx.strokeStyle = '#38bdf8'
        ctx.lineWidth = Math.max(1.6, Math.min(w, h) * 0.003)
        ctx.setLineDash([6, 5])
        ctx.beginPath()
        ctx.moveTo(a.px, a.py)
        ctx.lineTo(b.px, b.py)
        ctx.stroke()
        ctx.setLineDash([])
        const fontPx = stageFontPx(w, h, 0.04)
        ctx.font = stageFont(w, h, 0.04, 700)
        ctx.fillStyle = '#38bdf8'
        ctx.fillText(label, a.px + 8, Math.max(fontPx + 4, a.py - 6))
      }
      mark(sections.x1, sections.h1, '1')
      mark(sections.x2, sections.h2, '2')

      const sMin = U0 / halfAt(-1.4)
      const sMax = U0 / halfAt(1.3)
      const k = Math.min(w, h) / 520
      particlesRef.current.forEach((p) => {
        const v = field(p.x, p.y, t)
        const speed = Math.hypot(v.x, v.y)
        const u = (speed - sMin) / Math.max(1e-6, sMax - sMin)
        const color = speedRgb(u)
        const { px, py } = worldToPixel(p.x, p.y, w, h)
        const ahead = worldToPixel(p.x + v.x, p.y + v.y, w, h)
        const dx = ahead.px - px
        const dy = ahead.py - py
        const plen = Math.hypot(dx, dy) || 1
        const r = (4.2 + Math.max(0, Math.min(1, u)) * 2.4) * Math.max(0.85, k)
        const len = (16 + Math.max(0, Math.min(1, u)) * 18) * Math.max(0.9, k)
        const ux = dx / plen
        const uy = dy / plen
        drawArrow(
          ctx,
          px + ux * r,
          py + uy * r,
          px + ux * (r + len),
          py + uy * (r + len),
          color,
          Math.max(2.2, 2.6 * k),
        )
        ctx.beginPath()
        ctx.arc(px, py, r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      })

      const sectionArrow = (x: number, speed: number) => {
        const u = (speed - sMin) / Math.max(1e-6, sMax - sMin)
        const p = worldToPixel(x, 0, w, h)
        const len = (36 + Math.max(0, Math.min(1, u)) * 48) * Math.max(0.9, k)
        drawArrow(ctx, p.px - len * 0.15, p.py, p.px + len, p.py, speedRgb(u), Math.max(3, 3.4 * k))
      }
      sectionArrow(sections.x1, sections.v1)
      sectionArrow(sections.x2, sections.v2)
    },
    [U0, field, halfAt, lastT, particlesRef, sections.h1, sections.h2, sections.x1, sections.x2],
  )

  return (
    <div className="page">
      <h1>连续性方程</h1>
      <p className="lead">
        对不可压缩流体，恒定流一维连续性方程为 <strong>Q = v₁A₁ = v₂A₂</strong>
        。管道收缩时断面面积减小，平均流速增大。下方用「管道高度」模拟面积变化。
      </p>
      <div className="controls">
        <PlayButton playing={playing} onToggle={() => setPlaying((p) => !p)} />
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
      <div className="viz-block">
        <div className="viz-frame">
          <CanvasStage draw={draw} playing={playing} />
        </div>
        <Legend
          items={[
            { color: '#38bdf8', label: '低速 → 高速', kind: 'speed' },
            { color: '#fbbf24', label: '箭头表示流向', kind: 'line' },
            { color: '#38bdf8', label: '断面 1 / 断面 2', kind: 'dashed' },
          ]}
        />
        <Readouts
          items={[
            { label: '断面 1 面积 A₁', value: sections.A1.toFixed(2) },
            { label: '断面 1 流速 v₁', value: sections.v1.toFixed(2), tone: '#38bdf8' },
            { label: '断面 2 面积 A₂', value: sections.A2.toFixed(2) },
            { label: '断面 2 流速 v₂', value: sections.v2.toFixed(2), tone: '#fbbf24' },
            { label: '流量 Q = vA（两断面相同）', value: sections.Q.toFixed(2), tone: '#86efac' },
          ]}
        />
      </div>
      <p className="hint">
        粒子颜色随速率由青变黄，箭头沿当地速度方向。收缩段粒子被拉开，表示流速增大，流量仍守恒。
      </p>
    </div>
  )
}
