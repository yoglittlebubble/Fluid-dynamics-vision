import { useCallback, useState } from 'react'
import { CanvasStage } from '../components/CanvasStage'

export function HeadLines() {
  const [playing, setPlaying] = useState(true)
  const [lossFactor, setLossFactor] = useState(0.4)
  const [vHead, setVHead] = useState(0.25)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, w, h)

      const padL = 50
      const padR = 30
      const padT = 40
      const padB = 50
      const plotW = w - padL - padR
      const plotH = h - padT - padB

      // pipe along bottom-ish
      const pipeY = padT + plotH * 0.75
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 20
      ctx.beginPath()
      ctx.moveTo(padL, pipeY)
      ctx.lineTo(padL + plotW, pipeY)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(56,189,248,0.3)'
      ctx.lineWidth = 14
      ctx.beginPath()
      ctx.moveTo(padL, pipeY)
      ctx.lineTo(padL + plotW, pipeY)
      ctx.stroke()

      // particles
      for (let i = 0; i < 12; i++) {
        const x = padL + ((i / 12 + t * 0.2) % 1) * plotW
        ctx.beginPath()
        ctx.arc(x, pipeY, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#38bdf8'
        ctx.fill()
      }

      const H0 = padT + plotH * 0.15
      const piez0 = H0 + vHead * plotH * 0.5

      // total head line (sloping if loss)
      ctx.strokeStyle = '#f472b6'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(padL, H0)
      ctx.lineTo(padL + plotW, H0 + lossFactor * plotH * 0.35)
      ctx.stroke()

      // piezometric = total - v²/2g (parallel-ish below total)
      ctx.strokeStyle = '#fbbf24'
      ctx.beginPath()
      ctx.moveTo(padL, piez0)
      ctx.lineTo(padL + plotW, piez0 + lossFactor * plotH * 0.35)
      ctx.stroke()

      // geometric height of pipe centerline ≈ constant z
      ctx.strokeStyle = '#86efac'
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(padL, pipeY - 30)
      ctx.lineTo(padL + plotW, pipeY - 30)
      ctx.stroke()
      ctx.setLineDash([])

      // manometer sticks at several stations
      for (let i = 0; i < 5; i++) {
        const s = i / 4
        const x = padL + s * plotW
        const piezY = piez0 + s * lossFactor * plotH * 0.35
        ctx.strokeStyle = 'rgba(148,163,184,0.5)'
        ctx.beginPath()
        ctx.moveTo(x, pipeY)
        ctx.lineTo(x, piezY)
        ctx.stroke()
        ctx.fillStyle = 'rgba(56,189,248,0.35)'
        ctx.fillRect(x - 4, piezY, 8, pipeY - piezY)
      }

      // velocity head bracket at inlet
      ctx.strokeStyle = '#a78bfa'
      ctx.beginPath()
      ctx.moveTo(padL + 8, H0)
      ctx.lineTo(padL + 8, piez0)
      ctx.stroke()
      ctx.fillStyle = '#a78bfa'
      ctx.font = '12px system-ui'
      ctx.fillText('v²/2g', padL + 14, (H0 + piez0) / 2)

      ctx.fillStyle = '#f472b6'
      ctx.fillText('总水头线 H', padL + plotW - 90, H0 + lossFactor * plotH * 0.35 - 8)
      ctx.fillStyle = '#fbbf24'
      ctx.fillText(
        '测压管水头线 z+p/γ',
        padL + plotW - 130,
        piez0 + lossFactor * plotH * 0.35 - 8,
      )
      ctx.fillStyle = '#86efac'
      ctx.fillText('管路高程 z', padL + 8, pipeY - 38)

      ctx.fillStyle = '#94a3b8'
      ctx.fillText(
        lossFactor < 0.05
          ? '理想无损失：总水头线水平'
          : '有沿程损失：总水头线与测压管水头线平行下降',
        padL,
        h - 16,
      )
    },
    [lossFactor, vHead],
  )

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
        <button type="button" onClick={() => setPlaying((p) => !p)}>
          {playing ? '暂停' : '播放'}
        </button>
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
      <div className="viz-frame">
        <CanvasStage draw={draw} playing={playing} />
      </div>
    </div>
  )
}
