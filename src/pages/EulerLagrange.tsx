import { useCallback, useMemo, useState } from 'react'
import {
  CanvasStage,
  worldToPixel,
} from '../components/CanvasStage'
import {
  integratePathline,
  rk4,
  unsteadyDriftStagnation,
  type Vec2,
} from '../physics/fields'

/** 欧拉：固定探针点上看速度随时间；拉格朗日：跟踪一簇质点 */
export function EulerLagrange() {
  const [playing, setPlaying] = useState(true)
  const [probe, setProbe] = useState<Vec2>({ x: 0.35, y: 0.25 })
  const field = useMemo(() => unsteadyDriftStagnation(0.42, 0.6, 0.9), [])

  // Lagrangian particles seeded once
  const [particles] = useState(() => {
    const list: Vec2[] = []
    for (let i = 0; i < 12; i++) {
      list.push({ x: -1.1 + (i % 4) * 0.25, y: -0.5 + Math.floor(i / 4) * 0.35 })
    }
    return list
  })
  const positionsRef = useMemo(() => ({ current: particles.map((p) => ({ ...p })) }), [particles])
  const trailsRef = useMemo(
    () => ({ current: particles.map((p) => [{ ...p }] as Vec2[]) }),
    [particles],
  )
  const lastT = useMemo(() => ({ current: 0 }), [])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      const dt = lastT.current === 0 ? 0 : Math.min(0.05, t - lastT.current)
      lastT.current = t

      // advance Lagrangian particles
      if (dt > 0) {
        positionsRef.current = positionsRef.current.map((p, i) => {
          const np = rk4(field, p, t - dt, dt)
          const trail = trailsRef.current[i]
          trail.push({ ...np })
          if (trail.length > 80) trail.shift()
          // wrap soft reset if out of bounds
          if (Math.abs(np.x) > 1.7 || Math.abs(np.y) > 1.3) {
            const home = particles[i]
            trailsRef.current[i] = [{ ...home }]
            return { ...home }
          }
          return np
        })
      }

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, w, h)

      // split panels
      const mid = w / 2
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'
      ctx.beginPath()
      ctx.moveTo(mid, 0)
      ctx.lineTo(mid, h)
      ctx.stroke()

      const drawPanelBg = (x0: number, title: string) => {
        ctx.fillStyle = '#e2e8f0'
        ctx.font = 'bold 14px system-ui'
        ctx.fillText(title, x0 + 14, 22)
      }
      drawPanelBg(0, '欧拉法 · 固定空间点（流场法）')
      drawPanelBg(mid, '拉格朗日法 · 跟踪质点（质点系法）')

      // --- Euler panel: grid of arrows at fixed points, highlight probe ---
      const halfW = 1.6
      const halfH = 1.2
      const toPxLeft = (x: number, y: number) => {
        const { px, py } = worldToPixel(x, y, mid - 8, h, halfW, halfH)
        return { px: px + 4, py }
      }
      const toPxRight = (x: number, y: number) => {
        const { px, py } = worldToPixel(x, y, mid - 8, h, halfW, halfH)
        return { px: px + mid + 4, py }
      }

      for (let ix = -3; ix <= 3; ix++) {
        for (let iy = -2; iy <= 2; iy++) {
          const x = ix * 0.35
          const y = iy * 0.35
          const v = field(x, y, t)
          const { px, py } = toPxLeft(x, y)
          const scale = 18
          ctx.strokeStyle = 'rgba(56,189,248,0.7)'
          ctx.beginPath()
          ctx.moveTo(px, py)
          ctx.lineTo(px + v.x * scale, py - v.y * scale)
          ctx.stroke()
        }
      }

      // probe
      const pv = field(probe.x, probe.y, t)
      const pp = toPxLeft(probe.x, probe.y)
      ctx.beginPath()
      ctx.arc(pp.px, pp.py, 7, 0, Math.PI * 2)
      ctx.fillStyle = '#f472b6'
      ctx.fill()
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(pp.px, pp.py)
      ctx.lineTo(pp.px + pv.x * 40, pp.py - pv.y * 40)
      ctx.stroke()
      ctx.fillStyle = '#94a3b8'
      ctx.font = '12px system-ui'
      ctx.fillText(
        `探针处 u=(${pv.x.toFixed(2)}, ${pv.y.toFixed(2)}) 随 t 变化`,
        14,
        h - 16,
      )

      // velocity history sparkline for probe (recompute short history)
      const hist: number[] = []
      for (let i = 40; i >= 0; i--) {
        const tt = t - i * 0.05
        const vv = field(probe.x, probe.y, Math.max(0, tt))
        hist.push(Math.hypot(vv.x, vv.y))
      }
      const maxH = Math.max(...hist, 1e-6)
      ctx.strokeStyle = '#f472b6'
      ctx.beginPath()
      hist.forEach((val, i) => {
        const x = 14 + (i / 40) * (mid - 40)
        const y = h - 40 - (val / maxH) * 36
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.fillStyle = '#64748b'
      ctx.fillText('|u| 随时间（固定点）', 14, h - 48)

      // --- Lagrange panel ---
      trailsRef.current.forEach((trail) => {
        if (trail.length < 2) return
        ctx.beginPath()
        trail.forEach((q, i) => {
          const { px, py } = toPxRight(q.x, q.y)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        })
        ctx.strokeStyle = 'rgba(251,191,36,0.5)'
        ctx.lineWidth = 1.2
        ctx.stroke()
      })
      positionsRef.current.forEach((p) => {
        const { px, py } = toPxRight(p.x, p.y)
        ctx.beginPath()
        ctx.arc(px, py, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#fbbf24'
        ctx.fill()
      })

      // also show one pathline from probe for comparison
      const path = integratePathline(field, probe, Math.max(0, t - 2), 100, 0.02)
      ctx.beginPath()
      path.forEach((q, i) => {
        const { px, py } = toPxRight(q.x, q.y)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.strokeStyle = '#f472b6'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#94a3b8'
      ctx.font = '12px system-ui'
      ctx.fillText('黄点：被跟踪的质点及其轨迹', mid + 14, h - 16)
    },
    [field, lastT, particles, positionsRef, probe, trailsRef],
  )

  return (
    <div className="page">
      <h1>欧拉法 vs 拉格朗日法</h1>
      <p className="lead">
        <strong>拉格朗日法（质点系法）</strong>
        ：以流场中每一流体质点为对象，跟踪质点随时间的运动，综合足够多质点得到整体流动。
        <strong>欧拉法（流场法）</strong>
        ：以空间点为对象，研究流体质点流经各空间点时的运动要素。工程中多用欧拉描述。
      </p>
      <div className="controls">
        <button type="button" onClick={() => setPlaying((p) => !p)}>
          {playing ? '暂停' : '播放'}
        </button>
        <span className="muted">点击左半画布移动欧拉探针点</span>
      </div>
      <div className="viz-frame tall">
        <CanvasStage
          draw={draw}
          playing={playing}
          onClickWorld={(x, y) => {
            // map click: only left half meaningfully — CanvasStage maps full canvas
            // If click is in left world, set probe
            setProbe({ x, y })
          }}
        />
      </div>
      <p className="hint">
        左：固定探针处速度矢量与 |u|(t) 曲线（欧拉）。右：一群质点轨迹（拉格朗日）；粉线为探针释放质点的迹线。
      </p>
    </div>
  )
}
