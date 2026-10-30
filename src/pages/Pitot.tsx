import { useCallback, useState } from 'react'
import { CanvasStage } from '../components/CanvasStage'

export function Pitot() {
  const [playing, setPlaying] = useState(true)
  const [U, setU] = useState(3.5) // m/s free stream
  const rho = 1000
  const g = 9.81

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, w, h)

      const tubeX = w * 0.45
      const tubeY = h * 0.42
      const tipX = tubeX - 70

      // free stream arrows
      for (let row = 0; row < 6; row++) {
        const y = h * 0.2 + row * 28
        for (let col = 0; col < 5; col++) {
          const x = 30 + col * 40 + ((t * 40 * U) / 3.5 + row * 10) % 40
          if (x > tipX - 20) continue
          ctx.strokeStyle = 'rgba(56,189,248,0.55)'
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + 16, y)
          ctx.stroke()
        }
      }

      // streamlines bending around tip (schematic)
      ctx.strokeStyle = 'rgba(148,163,184,0.45)'
      for (let i = -3; i <= 3; i++) {
        if (i === 0) continue
        ctx.beginPath()
        for (let s = 0; s < 80; s++) {
          const x = 20 + s * 3
          const y =
            tubeY +
            i * 18 +
            (i > 0 ? 1 : -1) * 25 * Math.exp(-Math.pow((x - tipX) / 40, 2))
          if (s === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      // pitot body
      ctx.fillStyle = '#cbd5e1'
      ctx.beginPath()
      ctx.moveTo(tipX, tubeY)
      ctx.arc(tipX + 12, tubeY, 12, Math.PI * 0.5, Math.PI * 1.5, true)
      ctx.lineTo(tubeX + 90, tubeY - 12)
      ctx.lineTo(tubeX + 90, tubeY + 12)
      ctx.closePath()
      ctx.fill()

      // stagnation hole
      ctx.fillStyle = '#f472b6'
      ctx.beginPath()
      ctx.arc(tipX, tubeY, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f472b6'
      ctx.font = '12px system-ui'
      ctx.fillText('A 驻点 (v=0)', tipX - 30, tubeY - 22)

      // static holes
      ctx.fillStyle = '#38bdf8'
      for (let i = 0; i < 4; i++) {
        ctx.beginPath()
        ctx.arc(tubeX + 10 + i * 14, tubeY - 12, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillText('静压孔', tubeX + 10, tubeY - 28)

      // manometer
      const dP = 0.5 * rho * U * U
      const dH = dP / (rho * g) // water column equivalent simplified
      const maxH = 80
      const hPix = Math.min(maxH, dH * 40)

      const mx = tubeX + 130
      const my = tubeY + 40
      ctx.strokeStyle = '#94a3b8'
      ctx.strokeRect(mx, my, 36, 100)
      ctx.strokeRect(mx + 50, my, 36, 100)
      // connecting
      ctx.beginPath()
      ctx.moveTo(tubeX + 90, tubeY)
      ctx.lineTo(mx + 18, tubeY)
      ctx.lineTo(mx + 18, my)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(tubeX + 40, tubeY - 12)
      ctx.lineTo(tubeX + 40, my - 20)
      ctx.lineTo(mx + 68, my - 20)
      ctx.lineTo(mx + 68, my)
      ctx.stroke()

      ctx.fillStyle = '#fbbf24'
      ctx.fillRect(mx + 2, my + 100 - 40 - hPix / 2, 32, 40 + hPix / 2)
      ctx.fillRect(mx + 52, my + 100 - 40 + hPix / 2, 32, 40 - hPix / 2)

      ctx.fillStyle = '#e2e8f0'
      ctx.font = '13px system-ui'
      ctx.fillText(`Δh 示意`, mx, my + 120)
      ctx.fillText(`来流 U = ${U.toFixed(2)} m/s`, 20, 28)
      ctx.fillText(
        `Δp ≈ ½ρU² = ${dP.toFixed(0)} Pa  →  U = √(2Δp/ρ)`,
        20,
        48,
      )
      ctx.fillStyle = '#86efac'
      ctx.fillText('探头正对来流；端点滞止，侧孔测静压', 20, h - 16)
    },
    [U],
  )

  return (
    <div className="page">
      <h1>皮托管测速</h1>
      <p className="lead">
        皮托管探头正对来流，端点 A 为驻点（速度降为 0），测得总压；侧壁静压孔测静压。由伯努利：
        <strong>U = √(2Δp/ρ)</strong>（Δp 为总压与静压差）。演示为示意比例，非真实水银柱刻度。
      </p>
      <div className="controls">
        <button type="button" onClick={() => setPlaying((p) => !p)}>
          {playing ? '暂停' : '播放'}
        </button>
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
      <div className="viz-frame">
        <CanvasStage draw={draw} playing={playing} />
      </div>
    </div>
  )
}
