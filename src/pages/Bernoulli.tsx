import { useCallback, useState } from 'react'
import { CanvasStage } from '../components/CanvasStage'

/** 简化文丘里管：沿中心线展示 z、p/γ、v²/2g 三项互换，总水头近似恒定 */
export function Bernoulli() {
  const [playing, setPlaying] = useState(true)
  const [loss, setLoss] = useState(0) // 0 = ideal
  const [Q, setQ] = useState(1)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, w, h)

      const pad = 48
      const plotW = w - pad * 2
      const plotH = h - pad * 2 - 40
      const baseY = pad + plotH

      // pipe centerline height profile (z) — slight slope + throat dip for geometry
      const zPipe = (s: number) => 0.35 - 0.08 * s // mild drop
      // diameter profile: wide - narrow - wide
      const diam = (s: number) => {
        const throat = Math.exp(-Math.pow((s - 0.5) / 0.12, 2))
        return 0.55 - 0.28 * throat
      }

      // reference scales
      const g = 9.81
      const Aref = diam(0)
      const v = (s: number) => (Q * Aref) / diam(s) // relative
      const vHead = (s: number) => (v(s) * v(s)) / (2 * g) * 8 // visual scale
      const zHead = (s: number) => zPipe(s)
      // total H0 at inlet
      const H0 = zHead(0) + 0.55 + vHead(0)
      const headLoss = (s: number) => loss * s * 0.35
      const pHead = (s: number) => H0 - zHead(s) - vHead(s) - headLoss(s)

      const sx = (s: number) => pad + s * plotW
      const sy = (val: number) => baseY - val * plotH

      // pipe walls
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 60; i++) {
        const s = i / 60
        const x = sx(s)
        const yc = sy(zPipe(s) + 0.15)
        const r = diam(s) * 55
        if (i === 0) ctx.moveTo(x, yc - r)
        else ctx.lineTo(x, yc - r)
      }
      for (let i = 60; i >= 0; i--) {
        const s = i / 60
        const x = sx(s)
        const yc = sy(zPipe(s) + 0.15)
        const r = diam(s) * 55
        ctx.lineTo(x, yc + r)
      }
      ctx.closePath()
      ctx.fillStyle = 'rgba(56,189,248,0.08)'
      ctx.fill()
      ctx.stroke()

      // flowing particles along center
      for (let i = 0; i < 16; i++) {
        const s = (i / 16 + t * 0.15 * Q) % 1
        const x = sx(s)
        const yc = sy(zPipe(s) + 0.15)
        ctx.beginPath()
        ctx.arc(x, yc, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#38bdf8'
        ctx.fill()
      }

      // head curves
      const drawCurve = (
        fn: (s: number) => number,
        color: string,
        label: string,
        ly: number,
      ) => {
        ctx.beginPath()
        for (let i = 0; i <= 60; i++) {
          const s = i / 60
          const x = sx(s)
          const y = sy(fn(s) + 0.05)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.fillStyle = color
        ctx.font = '12px system-ui'
        ctx.fillText(label, pad, ly)
      }

      drawCurve((s) => zHead(s), '#86efac', 'z 位置水头', 20)
      drawCurve(
        (s) => zHead(s) + pHead(s),
        '#fbbf24',
        'z + p/γ 测压管水头',
        38,
      )
      drawCurve(
        (s) => zHead(s) + pHead(s) + vHead(s),
        '#f472b6',
        'H = z + p/γ + v²/2g 总水头',
        56,
      )

      // marker at throat
      const st = 0.5
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '12px system-ui'
      ctx.fillText('喉部：v↑ → 压强水头↓', sx(st) - 40, sy(0.9))

      ctx.fillStyle = '#94a3b8'
      ctx.fillText(
        loss === 0
          ? '理想（无损失）：总水头近似水平'
          : '有损失：总水头沿程下降',
        pad,
        h - 14,
      )
    },
    [Q, loss],
  )

  return (
    <div className="page">
      <h1>伯努利（能量）方程</h1>
      <p className="lead">
        恒定、不可压缩、仅重力、缓变流断面、无分流汇流时，沿流线（或元流）有：
        <strong>
          z₁ + p₁/γ + v₁²/(2g) = z₂ + p₂/γ + v₂²/(2g) + h<sub>w</sub>
        </strong>
        。几何上各项都是「水头」。喉部流速大 → 流速水头大 → 压强水头变小。
      </p>
      <div className="controls">
        <button type="button" onClick={() => setPlaying((p) => !p)}>
          {playing ? '暂停' : '播放'}
        </button>
        <label className="seg">
          <span>相对流量 {Q.toFixed(2)}</span>
          <input
            type="range"
            min={0.5}
            max={1.8}
            step={0.05}
            value={Q}
            onChange={(e) => setQ(Number(e.target.value))}
          />
        </label>
        <label className="seg">
          <span>水头损失系数 {loss.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={loss}
            onChange={(e) => setLoss(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="viz-frame">
        <CanvasStage draw={draw} playing={playing} />
      </div>
      <p className="hint">
        绿：位置水头；黄：测压管水头；粉：总水头。调大流量看喉部压强水头更低。
      </p>
    </div>
  )
}
