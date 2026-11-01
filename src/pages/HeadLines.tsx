import { useCallback, useState } from 'react'
import {
  CanvasStage,
  clearStage,
  stageFont,
  stageFontPx,
} from '../components/CanvasStage'
import { Legend, PlayButton, Readouts } from '../components/VizChrome'

export function HeadLines() {
  const [playing, setPlaying] = useState(true)
  const [lossFactor, setLossFactor] = useState(0.4)
  const [vHead, setVHead] = useState(0.25)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      clearStage(ctx, w, h)

      const left = w * 0.08
      const right = w * 0.06
      const top = h * 0.1
      const bottom = h * 0.1
      const plotW = w - left - right
      const plotH = h - top - bottom
      const pipeHalf = Math.max(16, plotH * 0.055)
      const pipeY = top + plotH * 0.82
      const zY = pipeY - pipeHalf - Math.max(16, h * 0.03)
      const headTop = top + Math.max(18, h * 0.03)
      const headBottom = zY - Math.max(20, h * 0.045)
      const room = Math.max(48, headBottom - headTop)
      const vGap = (vHead / 0.5) * room * 0.42
      const drop = lossFactor * room * 0.48
      const H0 = headTop
      const piez0 = H0 + vGap

      ctx.lineCap = 'butt'
      ctx.strokeStyle = '#475569'
      ctx.lineWidth = pipeHalf * 2
      ctx.beginPath()
      ctx.moveTo(left, pipeY)
      ctx.lineTo(left + plotW, pipeY)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(56,189,248,0.38)'
      ctx.lineWidth = pipeHalf * 1.15
      ctx.beginPath()
      ctx.moveTo(left, pipeY)
      ctx.lineTo(left + plotW, pipeY)
      ctx.stroke()

      const count = 14
      for (let i = 0; i < count; i++) {
        const x = left + ((i / count + t * 0.18) % 1) * plotW
        ctx.beginPath()
        ctx.arc(x, pipeY, Math.max(3.5, pipeHalf * 0.28), 0, Math.PI * 2)
        ctx.fillStyle = '#7dd3fc'
        ctx.fill()
      }

      ctx.lineCap = 'round'
      ctx.strokeStyle = '#f472b6'
      ctx.lineWidth = Math.max(2.6, h * 0.005)
      ctx.beginPath()
      ctx.moveTo(left, H0)
      ctx.lineTo(left + plotW, H0 + drop)
      ctx.stroke()

      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = Math.max(2.4, h * 0.0045)
      ctx.beginPath()
      ctx.moveTo(left, piez0)
      ctx.lineTo(left + plotW, piez0 + drop)
      ctx.stroke()

      ctx.strokeStyle = '#86efac'
      ctx.lineWidth = Math.max(2, h * 0.004)
      ctx.setLineDash([7, 5])
      ctx.beginPath()
      ctx.moveTo(left, zY)
      ctx.lineTo(left + plotW, zY)
      ctx.stroke()
      ctx.setLineDash([])

      for (let i = 0; i < 6; i++) {
        const s = i / 5
        const x = left + s * plotW
        const piezY = piez0 + s * drop
        ctx.strokeStyle = 'rgba(148,163,184,0.45)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(x, pipeY - pipeHalf)
        ctx.lineTo(x, piezY)
        ctx.stroke()
        ctx.fillStyle = 'rgba(56,189,248,0.38)'
        ctx.fillRect(x - 5, piezY, 10, pipeY - pipeHalf - piezY)
      }

      ctx.strokeStyle = '#a78bfa'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(left + 14, H0)
      ctx.lineTo(left + 14, piez0)
      ctx.moveTo(left + 8, H0)
      ctx.lineTo(left + 20, H0)
      ctx.moveTo(left + 8, piez0)
      ctx.lineTo(left + 20, piez0)
      ctx.stroke()
      const fontPx = stageFontPx(w, h, 0.034)
      ctx.font = stageFont(w, h, 0.034, 650)
      ctx.fillStyle = '#a78bfa'
      ctx.fillText('v²/2g', left + 24, (H0 + piez0) / 2 + fontPx * 0.35)
    },
    [lossFactor, vHead],
  )

  const ideal = lossFactor < 0.05

  return (
    <div className="page">
      <h1>总水头线与测压管水头线</h1>
      <p className="lead">
        <strong>总水头线</strong>：沿流程各断面总水头 H = z + p/γ +
        v²/(2g) 的连线。
        <strong>测压管水头线</strong>：z + p/γ
        的连线。二者竖距为流速水头。有损失时总水头沿程下降；等径管中测压管水头线与总水头线大致平行。
      </p>
      <div className="controls">
        <PlayButton playing={playing} onToggle={() => setPlaying((p) => !p)} />
        <label className="seg">
          <span>损失强度 {lossFactor.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={lossFactor}
            onChange={(e) => setLossFactor(Number(e.target.value))}
          />
        </label>
        <label className="seg">
          <span>流速水头比例 {vHead.toFixed(2)}</span>
          <input
            type="range"
            min={0.1}
            max={0.5}
            step={0.02}
            value={vHead}
            onChange={(e) => setVHead(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="viz-block">
        <div className="viz-frame">
          <CanvasStage draw={draw} playing={playing} />
        </div>
        <Legend
          items={[
            { color: '#f472b6', label: '总水头线 H', kind: 'line' },
            { color: '#fbbf24', label: '测压管水头线 z + p/γ', kind: 'line' },
            { color: '#86efac', label: '管路高程 z', kind: 'dashed' },
            { color: '#a78bfa', label: '流速水头 v²/2g', kind: 'line' },
          ]}
        />
        <Readouts
          items={[
            {
              label: '沿程损失',
              value: ideal ? '理想，总水头水平' : '总水头沿程下降',
              tone: '#f472b6',
            },
            {
              label: '流速水头比例',
              value: vHead.toFixed(2),
              tone: '#a78bfa',
            },
            {
              label: '两线关系',
              value: '竖距 = v²/2g，等径时平行',
            },
          ]}
        />
      </div>
      <p className="hint">
        {ideal
          ? '理想无损失：总水头线保持水平，测压管水头线在其下方，间距为流速水头。'
          : '有沿程损失：总水头线与测压管水头线一起下降，等径管中二者仍大致平行。'}
      </p>
    </div>
  )
}
