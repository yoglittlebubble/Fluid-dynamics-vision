import { useCallback, useMemo, useState } from 'react'
import {
  CanvasStage,
  clearStage,
  drawArrow,
  speedRgb,
} from '../components/CanvasStage'
import { Legend, PlayButton, Readouts } from '../components/VizChrome'

type Pt = { x: number; y: number; hw: number }

/** 水平来流向上转折的变径弯管。θ 为出口与水平方向的夹角。 */
export function Momentum() {
  const [playing, setPlaying] = useState(true)
  const [v1, setV1] = useState(4)
  const [thetaDeg, setThetaDeg] = useState(45)
  const [d1, setD1] = useState(0.2)
  const [d2, setD2] = useState(0.1)
  const [p1kPa, setP1kPa] = useState(98)

  const result = useMemo(() => {
    const rho = 1000
    const theta = (thetaDeg * Math.PI) / 180
    const A1 = (Math.PI / 4) * d1 * d1
    const A2 = (Math.PI / 4) * d2 * d2
    const v2 = (v1 * A1) / A2
    const Q = v1 * A1
    const p1 = p1kPa * 1000
    const p2 = p1 + 0.5 * rho * (v1 * v1 - v2 * v2)
    const Rx =
      rho * Q * (v2 * Math.cos(theta) - v1) - p1 * A1 + p2 * A2 * Math.cos(theta)
    const Ry = rho * Q * (v2 * Math.sin(theta)) + p2 * A2 * Math.sin(theta)
    const Fx = -Rx
    const Fy = -Ry
    const F = Math.hypot(Fx, Fy)
    const ang = (Math.atan2(Fy, Fx) * 180) / Math.PI
    return { v2, Q, p2, Fx, Fy, F, ang }
  }, [d1, d2, p1kPa, thetaDeg, v1])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      clearStage(ctx, w, h)
      const theta = (thetaDeg * Math.PI) / 180
      const r = 1
      const widthIn = 0.34
      const widthOut = Math.min(0.42, Math.max(0.14, widthIn * (d2 / Math.max(d1, 0.05))))
      const inletLen = 1.45
      const outletLen = 1.05

      const pts: Pt[] = []
      const nIn = 16
      for (let i = 0; i <= nIn; i++) {
        const u = i / nIn
        pts.push({ x: -inletLen + u * inletLen, y: 0, hw: widthIn / 2 })
      }
      const nArc = 40
      for (let i = 1; i <= nArc; i++) {
        const u = i / nArc
        const phi = Math.PI / 2 - u * theta
        pts.push({
          x: r * Math.cos(phi),
          y: -r + r * Math.sin(phi),
          hw: (widthIn + (widthOut - widthIn) * u) / 2,
        })
      }
      const end = pts[pts.length - 1]
      const odx = Math.cos(theta)
      const ody = -Math.sin(theta)
      const nOut = 14
      for (let i = 1; i <= nOut; i++) {
        const u = i / nOut
        pts.push({
          x: end.x + odx * outletLen * u,
          y: end.y + ody * outletLen * u,
          hw: widthOut / 2,
        })
      }

      const left: { x: number; y: number }[] = []
      const right: { x: number; y: number }[] = []
      for (let i = 0; i < pts.length; i++) {
        const prev = pts[Math.max(0, i - 1)]
        const next = pts[Math.min(pts.length - 1, i + 1)]
        let tx = next.x - prev.x
        let ty = next.y - prev.y
        const len = Math.hypot(tx, ty) || 1
        tx /= len
        ty /= len
        left.push({ x: pts[i].x + -ty * pts[i].hw, y: pts[i].y + tx * pts[i].hw })
        right.push({ x: pts[i].x - -ty * pts[i].hw, y: pts[i].y - tx * pts[i].hw })
      }

      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity
      for (const p of [...left, ...right]) {
        minX = Math.min(minX, p.x)
        maxX = Math.max(maxX, p.x)
        minY = Math.min(minY, p.y)
        maxY = Math.max(maxY, p.y)
      }
      const phiFit = Math.PI / 2 - theta / 2
      const midLocalX = Math.cos(phiFit)
      const midLocalY = -1 + Math.sin(phiFit)
      const localHw = (widthIn + widthOut) / 4
      const axL = midLocalX + Math.cos(phiFit) * (localHw + 0.04)
      const ayL = midLocalY + Math.sin(phiFit) * (localHw + 0.04)
      const fMag = Math.hypot(result.Fx, result.Fy) || 1
      const ux = result.Fx / fMag
      const uy = -result.Fy / fMag
      const arrowLocal = 0.72
      minX = Math.min(minX, axL, axL + ux * arrowLocal)
      maxX = Math.max(maxX, axL, axL + ux * arrowLocal)
      minY = Math.min(minY, ayL, ayL + uy * arrowLocal)
      maxY = Math.max(maxY, ayL, ayL + uy * arrowLocal)

      const padX = w * 0.06
      const padY = h * 0.07
      const scale = Math.min((w - padX * 2) / (maxX - minX), (h - padY * 2) / (maxY - minY))
      const ox = (w - (minX + maxX) * scale) / 2
      const oy = (h - (minY + maxY) * scale) / 2
      const map = (p: { x: number; y: number }) => ({ x: ox + p.x * scale, y: oy + p.y * scale })

      ctx.beginPath()
      left.forEach((p, i) => {
        const q = map(p)
        if (i === 0) ctx.moveTo(q.x, q.y)
        else ctx.lineTo(q.x, q.y)
      })
      for (let i = right.length - 1; i >= 0; i--) {
        const q = map(right[i])
        ctx.lineTo(q.x, q.y)
      }
      ctx.closePath()
      ctx.fillStyle = 'rgba(56,189,248,0.22)'
      ctx.fill()
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = Math.max(2.5, scale * 0.035)
      ctx.stroke()

      const vLo = Math.min(v1, result.v2)
      const vHi = Math.max(v1, result.v2)
      for (let i = 0; i < 14; i++) {
        const s = (i / 14 + t * 0.18 * Math.min(2, v1 / 4)) % 1
        const idx = Math.min(pts.length - 2, Math.floor(s * (pts.length - 1)))
        const local = s * (pts.length - 1) - idx
        const a = pts[idx]
        const b = pts[idx + 1]
        const rawX = a.x + (b.x - a.x) * local
        const rawY = a.y + (b.y - a.y) * local
        const mapped = map({ x: rawX, y: rawY })
        const px = mapped.x
        const py = mapped.y
        const speed = v1 + (result.v2 - v1) * s
        const u = (speed - vLo) / Math.max(1e-6, vHi - vLo)
        ctx.beginPath()
        ctx.arc(px, py, Math.max(4, scale * 0.045), 0, Math.PI * 2)
        ctx.fillStyle = speedRgb(u)
        ctx.fill()
      }

      const anchor = map({ x: axL, y: ayL })
      const fKN = fMag / 1000
      const arrow = scale * (0.42 + Math.min(0.28, fKN * 0.04))
      ctx.beginPath()
      ctx.arc(anchor.x, anchor.y, Math.max(6, scale * 0.05), 0, Math.PI * 2)
      ctx.fillStyle = '#f472b6'
      ctx.fill()
      drawArrow(
        ctx,
        anchor.x,
        anchor.y,
        anchor.x + ux * arrow,
        anchor.y + uy * arrow,
        '#f472b6',
        Math.max(4, scale * 0.03),
      )
    },
    [d1, d2, result.Fx, result.Fy, result.v2, thetaDeg, v1],
  )

  return (
    <div className="page">
      <h1>动量方程 · 弯管受力</h1>
      <p className="lead">
        对固定控制体，动量定理：外力合力 = 单位时间动量流出 −
        流入。水平变径弯管不计损失时，先由连续性求 v₂，再由伯努利求 p₂，最后列 x、y
        动量方程求管壁对流体的力，取反得流体对管壁作用力。
      </p>
      <div className="controls momentum-controls">
        <PlayButton playing={playing} onToggle={() => setPlaying((p) => !p)} />
        <div className="slider-grid">
          <label className="seg">
            <span>v₁ {v1.toFixed(1)} m/s</span>
            <input
              type="range"
              min={1}
              max={8}
              step={0.1}
              value={v1}
              onChange={(e) => setV1(Number(e.target.value))}
            />
          </label>
          <label className="seg">
            <span>转角 θ {thetaDeg}°</span>
            <input
              type="range"
              min={15}
              max={90}
              step={1}
              value={thetaDeg}
              onChange={(e) => setThetaDeg(Number(e.target.value))}
            />
          </label>
          <label className="seg">
            <span>d₁ {d1.toFixed(2)} m</span>
            <input
              type="range"
              min={0.1}
              max={0.3}
              step={0.01}
              value={d1}
              onChange={(e) => setD1(Number(e.target.value))}
            />
          </label>
          <label className="seg">
            <span>d₂ {d2.toFixed(2)} m</span>
            <input
              type="range"
              min={0.05}
              max={0.2}
              step={0.01}
              value={d2}
              onChange={(e) => setD2(Number(e.target.value))}
            />
          </label>
          <label className="seg">
            <span>p₁ {p1kPa} kPa</span>
            <input
              type="range"
              min={20}
              max={200}
              step={1}
              value={p1kPa}
              onChange={(e) => setP1kPa(Number(e.target.value))}
            />
          </label>
        </div>
      </div>
      <div className="viz-block">
        <div className="viz-frame">
          <CanvasStage draw={draw} playing={playing} />
        </div>
        <Legend
          items={[
            { color: '#38bdf8', label: '低速', kind: 'swatch' },
            { color: '#fbbf24', label: '高速（收缩后）', kind: 'swatch' },
            { color: '#f472b6', label: '流体对管壁作用力 R′（画在弯管外侧）' },
          ]}
        />
        <Readouts
          items={[
            { label: '入口 v₁', value: `${v1.toFixed(2)} m/s` },
            { label: '出口 v₂', value: `${result.v2.toFixed(2)} m/s`, tone: '#fbbf24' },
            { label: '流量 Q', value: `${result.Q.toFixed(3)} m³/s` },
            { label: '出口 p₂', value: `${(result.p2 / 1000).toFixed(1)} kPa` },
            { label: 'R′x', value: `${(result.Fx / 1000).toFixed(2)} kN`, tone: '#f9a8d4' },
            { label: 'R′y', value: `${(result.Fy / 1000).toFixed(2)} kN`, tone: '#f9a8d4' },
            { label: '|R′|', value: `${(result.F / 1000).toFixed(2)} kN`, tone: '#f472b6' },
            { label: 'R′ 方向角', value: `${result.ang.toFixed(1)}°` },
          ]}
        />
      </div>
      <p className="hint">
        默认接近讲义例题：v₁=4 m/s，d₁=200 mm，d₂=100 mm，θ=45°，p₁=98
        kPa（不计损失）。粉箭头从弯管外侧壁面画出，方向为流体对管壁的作用力。
      </p>
    </div>
  )
}
