import { useCallback, useState } from 'react'
import {
  CanvasStage,
  clearStage,
  drawChip,
  speedRgb,
  stageFontPx,
} from '../components/CanvasStage'
import { Legend, PlayButton, Readouts } from '../components/VizChrome'

const G = 9.81

function zPipe(s: number) {
  return 0.35 - 0.08 * s
}

function diam(s: number) {
  const throat = Math.exp(-(((s - 0.5) / 0.12) ** 2))
  return 0.55 - 0.28 * throat
}

/** 简化文丘里管：沿中心线展示 z、p/γ、v²/2g 三项互换，总水头近似恒定 */
export function Bernoulli() {
  const [playing, setPlaying] = useState(true)
  const [loss, setLoss] = useState(0)
  const [Q, setQ] = useState(1)

  const inlet = headAt(0, Q, loss)
  const throat = headAt(0.5, Q, loss)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      clearStage(ctx, w, h)

      const top = h * 0.1
      const bot = h * 0.12
      const left = w * 0.07
      const right = w * 0.05
      let minV = Infinity
      let maxV = -Infinity
      for (let i = 0; i <= 80; i++) {
        const sample = headAt(i / 80, Q, loss)
        minV = Math.min(minV, sample.z, sample.piez, sample.H)
        maxV = Math.max(maxV, sample.z, sample.piez, sample.H)
      }
      const span = Math.max(0.25, maxV - minV)
      minV -= span * 0.16
      maxV += span * 0.2
      const sy = (val: number) =>
        top + (1 - (val - minV) / (maxV - minV)) * (h - top - bot)
      const sx = (s: number) => left + s * (w - left - right)

      let rScale = Math.min(h * 0.09, 64)
      const d0 = diam(0)
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i <= 40; i++) {
          const s = i / 40
          const c = sy(zPipe(s))
          const r = rScale * (diam(s) / d0)
          const room = Math.min(c - 8, h - 8 - c)
          if (room > 6 && r > room) rScale *= room / r
        }
      }
      const radiusAt = (s: number) => rScale * (diam(s) / d0)

      ctx.beginPath()
      for (let i = 0; i <= 70; i++) {
        const s = i / 70
        const x = sx(s)
        const y = sy(zPipe(s)) - radiusAt(s)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      for (let i = 70; i >= 0; i--) {
        const s = i / 70
        ctx.lineTo(sx(s), sy(zPipe(s)) + radiusAt(s))
      }
      ctx.closePath()
      ctx.fillStyle = 'rgba(56,189,248,0.14)'
      ctx.fill()
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = Math.max(2, h * 0.004)
      ctx.stroke()

      const v0 = headAt(0, Q, loss).v
      const vT = headAt(0.5, Q, loss).v
      for (let i = 0; i < 18; i++) {
        const s = (i / 18 + t * 0.12 * Q) % 1
        const sample = headAt(s, Q, loss)
        const u = (sample.v - v0) / Math.max(1e-6, vT - v0)
        ctx.beginPath()
        ctx.arc(sx(s), sy(zPipe(s)), Math.max(3.5, h * 0.008), 0, Math.PI * 2)
        ctx.fillStyle = speedRgb(u)
        ctx.fill()
      }

      const curves: { fn: (s: number) => number; color: string; width: number }[] = [
        { fn: (s) => headAt(s, Q, loss).z, color: '#86efac', width: Math.max(2, h * 0.004) },
        { fn: (s) => headAt(s, Q, loss).piez, color: '#fbbf24', width: Math.max(2.6, h * 0.0055) },
        { fn: (s) => headAt(s, Q, loss).H, color: '#f472b6', width: Math.max(2.8, h * 0.006) },
      ]
      curves.forEach((curve) => {
        ctx.beginPath()
        for (let i = 0; i <= 80; i++) {
          const s = i / 80
          const x = sx(s)
          const y = sy(curve.fn(s))
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = curve.color
        ctx.lineWidth = curve.width
        ctx.stroke()
      })

      const tx = sx(0.5)
      const ty = sy(zPipe(0.5))
      const tr = radiusAt(0.5)
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(tx, ty - tr)
      ctx.lineTo(tx, ty + tr)
      ctx.stroke()
      ctx.setLineDash([])

      let dipY = ty + tr
      for (let i = 0; i <= 24; i++) {
        const s = 0.3 + (0.4 * i) / 24
        dipY = Math.max(dipY, sy(headAt(s, Q, loss).piez))
      }
      const fontPx = stageFontPx(w, h, 0.042)
      const labelX = Math.min(w - fontPx * 2.6, Math.max(fontPx * 2.6, tx))
      let labelY = dipY + fontPx * 1.55
      const floor = h - fontPx * 0.8
      if (labelY > floor) labelY = floor
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(tx, dipY)
      ctx.lineTo(labelX, labelY - fontPx * 0.7)
      ctx.stroke()
      drawChip(ctx, 'v↑→p↓', labelX, labelY, '#fbbf24', fontPx)
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
        <PlayButton playing={playing} onToggle={() => setPlaying((p) => !p)} />
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
      <div className="viz-block">
        <div className="viz-frame">
          <CanvasStage draw={draw} playing={playing} />
        </div>
        <Legend
          items={[
            { color: '#86efac', label: '位置水头 z', kind: 'line' },
            { color: '#fbbf24', label: '测压管水头 z + p/γ', kind: 'line' },
            { color: '#f472b6', label: '总水头 H = z + p/γ + v²/2g', kind: 'line' },
            { color: '#fbbf24', label: '喉部 v↑→p↓' },
          ]}
        />
        <Readouts
          items={[
            { label: '入口流速（相对）', value: inlet.v.toFixed(2) },
            { label: '喉部流速（相对）', value: throat.v.toFixed(2), tone: '#fbbf24' },
            { label: '入口测压管水头', value: inlet.piez.toFixed(2) },
            {
              label: '喉部测压管水头',
              value: throat.piez.toFixed(2),
              tone: '#fbbf24',
            },
            {
              label: loss === 0 ? '总水头（理想，沿程不变）' : '入口总水头',
              value: inlet.H.toFixed(2),
              tone: '#f472b6',
            },
            {
              label: '出口总水头',
              value: headAt(1, Q, loss).H.toFixed(2),
              tone: '#f472b6',
            },
          ]}
        />
      </div>
      <p className="hint">
        {loss === 0
          ? '理想（无损失）：总水头线接近水平。喉部标注 v↑→p↓：流速上升，压强水头下降。'
          : '有损失：总水头沿程下降。喉部仍是流速增大、压强水头降低（v↑→p↓）。'}
        调大流量可看到喉部测压管水头降得更低。三条水头线都留在画布内。
      </p>
    </div>
  )
}

function headAt(s: number, Q: number, loss: number) {
  const z = zPipe(s)
  const v = (Q * diam(0)) / diam(s)
  const vHead = ((v * v) / (2 * G)) * 8
  const z0 = zPipe(0)
  const v0 = (Q * diam(0)) / diam(0)
  const vHead0 = ((v0 * v0) / (2 * G)) * 8
  const H0 = z0 + 0.55 + vHead0
  const hw = loss * s * 0.35
  const pHead = H0 - z - vHead - hw
  return { z, v, vHead, piez: z + pHead, H: z + pHead + vHead }
}
