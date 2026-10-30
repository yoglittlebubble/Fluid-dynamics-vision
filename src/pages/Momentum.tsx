import { useCallback, useMemo, useState } from 'react'
import { CanvasStage } from '../components/CanvasStage'

/** 水平弯管动量方程示意 */
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
    // Bernoulli, z1=z2, no loss
    const p2 = p1 + 0.5 * rho * (v1 * v1 - v2 * v2)
    // Momentum: Rx, Ry on fluid from wall
    // p1 A1 - p2 A2 cosθ + Rx = ρ Q (v2 cosθ - v1)
    const Rx = rho * Q * (v2 * Math.cos(theta) - v1) - p1 * A1 + p2 * A2 * Math.cos(theta)
    const Ry = rho * Q * (v2 * Math.sin(theta)) + p2 * A2 * Math.sin(theta)
    // force of fluid on pipe = -R
    const Fx = -Rx
    const Fy = -Ry
    const F = Math.hypot(Fx, Fy)
    const ang = (Math.atan2(Fy, Fx) * 180) / Math.PI
    return { v2, Q, p2, Fx, Fy, F, ang }
  }, [d1, d2, p1kPa, thetaDeg, v1])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, w, h)

      const cx = w * 0.38
      const cy = h * 0.55
      const theta = (thetaDeg * Math.PI) / 180
      const r = Math.min(w, h) * 0.22

      // bend centerline
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 36
      ctx.lineCap = 'butt'
      ctx.beginPath()
      ctx.moveTo(cx - 120, cy)
      ctx.lineTo(cx, cy)
      ctx.arc(cx, cy, r, -Math.PI, -Math.PI + theta, false)
      const ex = cx + r * Math.cos(-Math.PI + theta)
      const ey = cy + r * Math.sin(-Math.PI + theta)
      // extend outlet
      const ox = Math.cos(theta)
      const oy = Math.sin(theta)
      ctx.lineTo(ex + ox * 90, ey + oy * 90)
      ctx.stroke()

      // inner fill to look like pipe
      ctx.strokeStyle = 'rgba(56,189,248,0.25)'
      ctx.lineWidth = 28
      ctx.beginPath()
      ctx.moveTo(cx - 120, cy)
      ctx.lineTo(cx, cy)
      ctx.arc(cx, cy, r, -Math.PI, -Math.PI + theta, false)
      ctx.lineTo(ex + ox * 90, ey + oy * 90)
      ctx.stroke()

      // flow particles
      for (let i = 0; i < 10; i++) {
        const s = (i / 10 + t * 0.25) % 1
        let px: number
        let py: number
        if (s < 0.35) {
          const u = s / 0.35
          px = cx - 120 + u * 120
          py = cy
        } else if (s < 0.7) {
          const u = (s - 0.35) / 0.35
          const ang = -Math.PI + u * theta
          px = cx + r * Math.cos(ang)
          py = cy + r * Math.sin(ang)
        } else {
          const u = (s - 0.7) / 0.3
          px = ex + ox * 90 * u
          py = ey + oy * 90 * u
        }
        ctx.beginPath()
        ctx.arc(px, py, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#fbbf24'
        ctx.fill()
      }

      // force arrow on pipe
      const scale = 18
      const fx = result.Fx // kN-ish display — actually N, scale down
      const fy = result.Fy
      const ax0 = w * 0.72
      const ay0 = h * 0.45
      ctx.strokeStyle = '#f472b6'
      ctx.fillStyle = '#f472b6'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(ax0, ay0)
      ctx.lineTo(ax0 + (fx / 1000) * scale, ay0 - (fy / 1000) * scale)
      ctx.stroke()
      // arrow head rough
      ctx.beginPath()
      ctx.arc(ax0 + (fx / 1000) * scale, ay0 - (fy / 1000) * scale, 5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#e2e8f0'
      ctx.font = '13px system-ui'
      ctx.fillText('流体对管壁作用力 R′', ax0 - 20, ay0 - 16)

      ctx.fillStyle = '#94a3b8'
      ctx.fillText(`v₁=${v1.toFixed(1)} m/s  →  v₂=${result.v2.toFixed(1)} m/s`, 16, 28)
      ctx.fillText(
        `p₂=${(result.p2 / 1000).toFixed(1)} kPa  Q=${result.Q.toFixed(3)} m³/s`,
        16,
        48,
      )
      ctx.fillStyle = '#f9a8d4'
      ctx.fillText(
        `R′x=${(result.Fx / 1000).toFixed(2)} kN  R′y=${(result.Fy / 1000).toFixed(2)} kN  |R′|=${(result.F / 1000).toFixed(2)} kN  ∠${result.ang.toFixed(1)}°`,
        16,
        h - 16,
      )
    },
    [result, thetaDeg, v1],
  )

  return (
    <div className="page">
      <h1>动量方程 · 弯管受力</h1>
      <p className="lead">
        对固定控制体，动量定理：外力合力 = 单位时间动量流出 −
        流入。水平变径弯管不计损失时，先由连续性求 v₂，再由伯努利求 p₂，最后列 x、y
        动量方程求管壁对流体的力，取反得流体对管壁作用力。
      </p>
      <div className="controls">
        <button type="button" onClick={() => setPlaying((p) => !p)}>
          {playing ? '暂停' : '播放'}
        </button>
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
      <div className="viz-frame">
        <CanvasStage draw={draw} playing={playing} />
      </div>
      <p className="hint">
        默认接近讲义例题：v₁=4 m/s，d₁=200 mm，d₂=100 mm，θ=45°，p₁=98
        kPa（不计损失）。粉箭头为流体对管壁作用力示意。
      </p>
    </div>
  )
}
