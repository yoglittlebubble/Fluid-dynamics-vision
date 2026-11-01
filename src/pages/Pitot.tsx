import { useCallback, useState } from 'react'
import {
  CanvasStage,
  clearStage,
  drawArrow,
  stageFont,
  stageFontPx,
} from '../components/CanvasStage'
import { Legend, PlayButton, Readouts } from '../components/VizChrome'

const RHO = 1000
const G = 9.81

export function Pitot() {
  const [playing, setPlaying] = useState(true)
  const [U, setU] = useState(3.5)

  const dP = 0.5 * RHO * U * U
  const dH = dP / (RHO * G)
  const uBack = Math.sqrt((2 * dP) / RHO)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      clearStage(ctx, w, h)

      const tubeY = h * 0.5
      const noseR = Math.max(18, h * 0.072)
      const tipX = w * 0.36
      const bodyEnd = tipX + noseR + w * 0.24
      const flowLeft = w * 0.04
      const flowTop = h * 0.14
      const flowBot = h * 0.86

      const rows = 8
      const cols = 6
      const colGap = (tipX - noseR - flowLeft - 10) / cols
      for (let row = 0; row < rows; row++) {
        const y = flowTop + ((flowBot - flowTop) * row) / (rows - 1)
        for (let col = 0; col < cols; col++) {
          const x =
            flowLeft +
            col * colGap +
            ((t * 70 * (U / 3.5) + row * 14) % colGap)
          if (x > tipX - noseR - 16) continue
          const len = Math.max(18, colGap * 0.46)
          drawArrow(
            ctx,
            x,
            y,
            x + len,
            y,
            'rgba(56,189,248,0.8)',
            Math.max(1.8, h * 0.004),
          )
        }
      }

      ctx.strokeStyle = 'rgba(148,163,184,0.55)'
      ctx.lineWidth = Math.max(1.5, h * 0.0035)
      const spread = (flowBot - flowTop) / 9
      for (let i = -4; i <= 4; i++) {
        if (i === 0) continue
        ctx.beginPath()
        const steps = 80
        for (let s = 0; s <= steps; s++) {
          const x = flowLeft + ((bodyEnd - flowLeft) * s) / steps
          const bump =
            Math.sign(i) *
            spread *
            0.95 *
            Math.exp(-(((x - tipX) / (w * 0.055)) ** 2))
          const y = tubeY + i * spread + bump
          if (s === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      const noseCx = tipX + noseR
      ctx.fillStyle = '#cbd5e1'
      ctx.beginPath()
      ctx.arc(noseCx, tubeY, noseR, Math.PI / 2, Math.PI * 1.5, false)
      ctx.lineTo(bodyEnd, tubeY - noseR)
      ctx.lineTo(bodyEnd, tubeY + noseR)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.arc(tipX, tubeY, Math.max(5, noseR * 0.22), 0, Math.PI * 2)
      ctx.fill()

      ctx.font = stageFont(w, h, 0.04, 700)
      ctx.fillStyle = '#f472b6'
      ctx.textAlign = 'center'
      ctx.fillText('A', tipX, tubeY - noseR - 10)
      ctx.textAlign = 'left'

      ctx.fillStyle = '#38bdf8'
      const holeR = Math.max(3, noseR * 0.14)
      const hole0 = noseCx + noseR * 0.85
      for (let i = 0; i < 4; i++) {
        ctx.beginPath()
        ctx.arc(hole0 + i * noseR * 0.55, tubeY - noseR, holeR, 0, Math.PI * 2)
        ctx.fill()
      }

      const colW = Math.max(28, Math.min(52, w * 0.046))
      const gap = Math.max(16, w * 0.02)
      const colH = h * 0.5
      let mx = bodyEnd + w * 0.05
      if (mx + colW * 2 + gap > w * 0.96) mx = w * 0.96 - colW * 2 - gap
      const top = h * 0.16
      const norm = Math.min(1, dH / ((8 * 8) / (2 * G)))
      const delta = norm * colH * 0.34
      const mid = top + colH * 0.55
      const totalSurface = mid + delta / 2
      const staticSurface = mid - delta / 2

      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = Math.max(1.5, h * 0.003)
      ctx.strokeRect(mx, top, colW, colH)
      ctx.strokeRect(mx + colW + gap, top, colW, colH)

      ctx.beginPath()
      ctx.moveTo(bodyEnd, tubeY)
      ctx.lineTo(mx + colW / 2, tubeY)
      ctx.lineTo(mx + colW / 2, top)
      ctx.stroke()
      const staticX = hole0 + noseR * 0.55
      ctx.beginPath()
      ctx.moveTo(staticX, tubeY - noseR)
      ctx.lineTo(staticX, top - h * 0.03)
      ctx.lineTo(mx + colW + gap + colW / 2, top - h * 0.03)
      ctx.lineTo(mx + colW + gap + colW / 2, top)
      ctx.stroke()

      ctx.fillStyle = '#fbbf24'
      ctx.fillRect(mx + 3, totalSurface, colW - 6, top + colH - totalSurface)
      ctx.fillRect(
        mx + colW + gap + 3,
        staticSurface,
        colW - 6,
        top + colH - staticSurface,
      )

      const bracketX = mx + colW + gap / 2
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(bracketX, totalSurface)
      ctx.lineTo(bracketX, staticSurface)
      ctx.moveTo(bracketX - 5, totalSurface)
      ctx.lineTo(bracketX + 5, totalSurface)
      ctx.moveTo(bracketX - 5, staticSurface)
      ctx.lineTo(bracketX + 5, staticSurface)
      ctx.stroke()
      const fontPx = stageFontPx(w, h, 0.034)
      ctx.font = stageFont(w, h, 0.034, 700)
      ctx.fillStyle = '#fbbf24'
      ctx.textAlign = 'center'
      ctx.fillText('Δh', bracketX, Math.max(fontPx + 2, staticSurface - fontPx * 0.35))
      ctx.textAlign = 'left'
    },
    [U, dH],
  )

  return (
    <div className="page">
      <h1>皮托管测速</h1>
      <p className="lead">
        皮托管探头正对来流，端点 A 为驻点（速度降为 0），测得总压；侧壁静压孔测静压。由伯努利：
        <strong>U = √(2Δp/ρ)</strong>（Δp 为总压与静压差）。演示为示意比例，非真实水银柱刻度。
      </p>
      <div className="controls">
        <PlayButton playing={playing} onToggle={() => setPlaying((p) => !p)} />
        <label className="seg">
          <span>来流速度 U {U.toFixed(1)} m/s</span>
          <input
            type="range"
            min={1}
            max={8}
            step={0.1}
            value={U}
            onChange={(e) => setU(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="viz-block">
        <div className="viz-frame">
          <CanvasStage draw={draw} playing={playing} />
        </div>
        <Legend
          items={[
            { color: '#38bdf8', label: '来流', kind: 'line' },
            { color: '#f472b6', label: '驻点 A（v = 0，总压）' },
            { color: '#38bdf8', label: '静压孔' },
            { color: '#fbbf24', label: '压差水柱 Δh（静压侧更高）' },
          ]}
        />
        <Readouts
          items={[
            { label: '来流速度 U', value: `${U.toFixed(2)} m/s`, tone: '#38bdf8' },
            { label: '压差 Δp ≈ ½ρU²', value: `${dP.toFixed(0)} Pa` },
            { label: '水柱差 Δh = Δp / (ρg)', value: `${dH.toFixed(3)} m`, tone: '#fbbf24' },
            { label: '反算 U = √(2Δp/ρ)', value: `${uBack.toFixed(2)} m/s`, tone: '#86efac' },
          ]}
        />
      </div>
      <p className="hint">
        总压高于静压，液体被推向静压侧，所以右侧液柱更高。Δh 只作示意，不按水银柱刻度绘制。
      </p>
    </div>
  )
}
