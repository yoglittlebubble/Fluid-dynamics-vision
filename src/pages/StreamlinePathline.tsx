import { useCallback, useMemo, useRef, useState } from 'react'
import {
  CanvasStage,
  clearStage,
  drawPolyline,
  worldToPixel,
} from '../components/CanvasStage'
import { Legend, PlayButton, Readouts } from '../components/VizChrome'
import {
  integratePathline,
  integrateStreamline,
  steadyStagnation,
  unsteadyDriftStagnation,
  type Vec2,
} from '../physics/fields'

type Mode = 'steady' | 'unsteady'

export function StreamlinePathline() {
  const [playing, setPlaying] = useState(true)
  const [mode, setMode] = useState<Mode>('steady')
  const [showStream, setShowStream] = useState(true)
  const [showPath, setShowPath] = useState(true)
  const [seed, setSeed] = useState<Vec2>({ x: -0.7, y: 0.45 })
  const pathStartRef = useRef(0)
  const pendingCapture = useRef(true)
  const [, bump] = useState(0)

  const field = useMemo(
    () =>
      mode === 'steady'
        ? steadyStagnation(0.45)
        : unsteadyDriftStagnation(0.4, 0.55, 0.85),
    [mode],
  )

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      if (pendingCapture.current) {
        pathStartRef.current = t
        pendingCapture.current = false
      }

      clearStage(ctx, w, h)
      const lw = Math.max(1.15, Math.min(w, h) * 0.0026)
      ctx.strokeStyle = 'rgba(148,163,184,0.14)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 8; i++) {
        const x = (i / 8) * w
        const y = (i / 8) * h
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      const o = worldToPixel(0, 0, w, h)
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'
      ctx.lineWidth = lw
      ctx.beginPath()
      ctx.moveTo(0, o.py)
      ctx.lineTo(w, o.py)
      ctx.moveTo(o.px, 0)
      ctx.lineTo(o.px, h)
      ctx.stroke()

      if (showStream) {
        const seeds: Vec2[] = []
        for (let i = -4; i <= 4; i++) {
          if (i === 0) continue
          seeds.push({ x: -1.4, y: i * 0.22 })
          seeds.push({ x: 1.4, y: i * 0.22 })
          seeds.push({ x: i * 0.28, y: -1.0 })
          seeds.push({ x: i * 0.28, y: 1.0 })
        }
        seeds.forEach((s) => {
          const line = integrateStreamline(field, s, t, 80, 0.04)
          drawPolyline(ctx, line, w, h, 'rgba(56,189,248,0.55)', lw)
        })
        const hi = integrateStreamline(field, seed, t, 120, 0.035)
        drawPolyline(ctx, hi, w, h, '#38bdf8', Math.max(2.6, lw * 2.1))
      }

      if (showPath) {
        const startT = pathStartRef.current
        const elapsed = Math.max(0, t - startT)
        const steps = Math.min(450, Math.floor(elapsed / 0.02) + 1)
        const path = integratePathline(field, seed, startT, steps, 0.02)
        drawPolyline(ctx, path, w, h, '#fbbf24', Math.max(2.4, lw * 2))
        if (path.length) {
          const tip = path[path.length - 1]
          const { px, py } = worldToPixel(tip.x, tip.y, w, h)
          ctx.beginPath()
          ctx.arc(px, py, Math.max(5, Math.min(w, h) * 0.012), 0, Math.PI * 2)
          ctx.fillStyle = '#fbbf24'
          ctx.fill()
        }
      }

      const { px, py } = worldToPixel(seed.x, seed.y, w, h)
      ctx.beginPath()
      ctx.arc(px, py, Math.max(7, Math.min(w, h) * 0.014), 0, Math.PI * 2)
      ctx.fillStyle = '#f472b6'
      ctx.fill()
    },
    [field, seed, showPath, showStream],
  )

  const handleClick = useCallback((x: number, y: number) => {
    setSeed({ x, y })
    pendingCapture.current = true
    bump((n) => n + 1)
  }, [])

  return (
    <div className="page">
      <h1>流线 · 迹线 · 恒定与非恒定</h1>
      <p className="lead">
        <strong>流线</strong>
        ：某一瞬时，曲线上任一点的切线与该点速度方向重合。同一时刻不同流线
        <strong>不能相交</strong>，且为光滑曲线；疏密反映速度大小。
        <strong>迹线</strong>
        ：同一流体质点在一段时间里走过的路径。恒定流中流线不随时间变，且与迹线重合；非恒定流中流线随时间变，二者一般不重合。
      </p>

      <div className="controls">
        <PlayButton playing={playing} onToggle={() => setPlaying((p) => !p)} />
        <label className="seg">
          <span>流场</span>
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as Mode)
              pendingCapture.current = true
              bump((n) => n + 1)
            }}
          >
            <option value="steady">恒定 · 驻点流</option>
            <option value="unsteady">非恒定 · 漂移驻点流</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={showStream}
            onChange={(e) => setShowStream(e.target.checked)}
          />
          显示流线
        </label>
        <label>
          <input
            type="checkbox"
            checked={showPath}
            onChange={(e) => setShowPath(e.target.checked)}
          />
          显示迹线
        </label>
        <button
          type="button"
          onClick={() => {
            setSeed({ x: -0.7, y: 0.45 })
            pendingCapture.current = true
            bump((n) => n + 1)
          }}
        >
          重置种子点
        </button>
      </div>

      <div className="viz-block">
        <div className="viz-frame">
          <CanvasStage draw={draw} playing={playing} onClickWorld={handleClick} />
        </div>
        <Legend
          items={[
            { color: '#38bdf8', label: '流线（同一瞬时）', kind: 'line' },
            { color: '#fbbf24', label: '迹线（质点路径）', kind: 'line' },
            { color: '#f472b6', label: '种子点' },
          ]}
        />
        <Readouts
          items={[
            {
              label: '流场',
              value: mode === 'steady' ? '恒定' : '非恒定',
            },
            { label: '种子点 x', value: seed.x.toFixed(2) },
            { label: '种子点 y', value: seed.y.toFixed(2), tone: '#f472b6' },
          ]}
        />
      </div>
      <p className="hint">
        {mode === 'steady'
          ? '恒定流：流线不随时间移动，并与迹线重合。同一时刻的流线彼此不相交。'
          : '非恒定流：同一瞬时的流线仍互不相交，但形状会随时间改变，因而与迹线分开。'}
        点击画布可改种子点。
      </p>
    </div>
  )
}
