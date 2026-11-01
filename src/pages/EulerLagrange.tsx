import { useCallback, useMemo, useState } from 'react'
import {
  CanvasStage,
  clearStage,
  drawArrow,
} from '../components/CanvasStage'
import { Legend, PlayButton, Readouts, useSimTime } from '../components/VizChrome'
import {
  integratePathline,
  rk4,
  unsteadyDriftStagnation,
  type Vec2,
} from '../physics/fields'

const HALF_W = 1.6
const HALF_H = 1.2

function leftGeom(w: number, h: number) {
  const mid = w / 2
  const gutter = Math.max(16, w * 0.016)
  const panelW = mid - gutter * 2
  const top = h * 0.05
  const plotH = h * 0.68
  return { mid, gutter, panelW, top, plotH }
}

function toLeft(x: number, y: number, w: number, h: number) {
  const g = leftGeom(w, h)
  return {
    px: g.gutter + ((x / HALF_W + 1) / 2) * g.panelW,
    py: g.top + ((-y / HALF_H + 1) / 2) * g.plotH,
  }
}

function toRight(x: number, y: number, w: number, h: number) {
  const g = leftGeom(w, h)
  const top = h * 0.08
  const plotH = h * 0.84
  const halfW = 1.25
  const halfH = 0.95
  return {
    px: g.mid + g.gutter + ((x / halfW + 1) / 2) * g.panelW,
    py: top + ((-y / halfH + 1) / 2) * plotH,
  }
}

/** 欧拉：固定探针点上看速度随时间；拉格朗日：跟踪一簇质点 */
export function EulerLagrange() {
  const [playing, setPlaying] = useState(true)
  const [probe, setProbe] = useState<Vec2>({ x: 0.35, y: 0.25 })
  const [simT, onTime] = useSimTime()
  const field = useMemo(() => unsteadyDriftStagnation(0.42, 0.6, 0.9), [])

  const [particles] = useState(() => {
    const list: Vec2[] = []
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        list.push({
          x: -1.05 + col * 0.34,
          y: -0.66 + row * 0.42,
        })
      }
    }
    return list
  })
  const positionsRef = useMemo(
    () => ({ current: particles.map((p) => ({ ...p })) }),
    [particles],
  )
  const trailsRef = useMemo(
    () => ({ current: particles.map((p) => [{ ...p }] as Vec2[]) }),
    [particles],
  )
  const lastT = useMemo(() => ({ current: 0 }), [])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      const dt = lastT.current === 0 ? 0 : Math.min(0.05, t - lastT.current)
      lastT.current = t

      if (dt > 0) {
        positionsRef.current = positionsRef.current.map((p, i) => {
          const np = rk4(field, p, t - dt, dt)
          const trail = trailsRef.current[i]
          trail.push({ ...np })
          if (trail.length > 90) trail.shift()
          if (Math.abs(np.x) > 1.45 || Math.abs(np.y) > 1.05) {
            const home = particles[i]
            trailsRef.current[i] = [{ ...home }]
            return { ...home }
          }
          return np
        })
      }

      clearStage(ctx, w, h)
      const g = leftGeom(w, h)
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(g.mid, h * 0.03)
      ctx.lineTo(g.mid, h * 0.97)
      ctx.stroke()

      const origin = toLeft(0, 0, w, h)
      const step = toLeft(0.35, 0, w, h)
      const cell = Math.max(28, Math.abs(step.px - origin.px))
      const scale = (cell * 0.78) / 0.7
      const lw = Math.max(2.8, cell * 0.08)
      const capLen = (vx: number, vy: number, maxLen: number) => {
        const len = Math.hypot(vx, vy)
        if (len <= maxLen || len < 1e-6) return { x: vx, y: vy }
        return { x: (vx / len) * maxLen, y: (vy / len) * maxLen }
      }

      const sparkTop = h * 0.78
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 0, g.mid - 4, sparkTop - 6)
      ctx.clip()
      for (let ix = -4; ix <= 4; ix++) {
        for (let iy = -3; iy <= 3; iy++) {
          const x = ix * 0.32
          const y = iy * 0.28
          const v = field(x, y, t)
          const { px, py } = toLeft(x, y, w, h)
          ctx.beginPath()
          ctx.arc(px, py, Math.max(2.2, cell * 0.045), 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(148,163,184,0.45)'
          ctx.fill()
          const tip = capLen(v.x * scale, -v.y * scale, cell * 0.78)
          drawArrow(ctx, px, py, px + tip.x, py + tip.y, 'rgba(125,211,252,0.95)', lw)
        }
      }

      const pv = field(probe.x, probe.y, t)
      const pp = toLeft(probe.x, probe.y, w, h)
      ctx.beginPath()
      ctx.arc(pp.px, pp.py, Math.max(8, cell * 0.14), 0, Math.PI * 2)
      ctx.fillStyle = '#f472b6'
      ctx.fill()
      const ptip = capLen(pv.x * scale * 1.15, -pv.y * scale * 1.15, cell * 1.05)
      drawArrow(ctx, pp.px, pp.py, pp.px + ptip.x, pp.py + ptip.y, '#fbbf24', lw + 2)
      ctx.restore()

      const hist: number[] = []
      for (let i = 48; i >= 0; i--) {
        const tt = Math.max(0, t - i * 0.05)
        const vv = field(probe.x, probe.y, tt)
        hist.push(Math.hypot(vv.x, vv.y))
      }
      const maxH = Math.max(...hist, 1e-6)
      const sparkH = h * 0.16
      ctx.fillStyle = 'rgba(15,23,42,0.72)'
      ctx.beginPath()
      ctx.roundRect(g.gutter, sparkTop, g.panelW, sparkH, 8)
      ctx.fill()
      ctx.strokeStyle = '#f472b6'
      ctx.lineWidth = Math.max(2.2, Math.min(w, h) * 0.0045)
      ctx.beginPath()
      hist.forEach((val, i) => {
        const x = g.gutter + 10 + (i / 48) * (g.panelW - 20)
        const y = sparkTop + sparkH - 8 - (val / maxH) * (sparkH - 16)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      trailsRef.current.forEach((trail) => {
        if (trail.length < 2) return
        ctx.beginPath()
        trail.forEach((q, i) => {
          const { px, py } = toRight(q.x, q.y, w, h)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        })
        ctx.strokeStyle = 'rgba(251,191,36,0.55)'
        ctx.lineWidth = Math.max(1.6, cell * 0.03)
        ctx.stroke()
      })
      positionsRef.current.forEach((p) => {
        const { px, py } = toRight(p.x, p.y, w, h)
        ctx.beginPath()
        ctx.arc(px, py, Math.max(5, cell * 0.09), 0, Math.PI * 2)
        ctx.fillStyle = '#fbbf24'
        ctx.fill()
      })

      const path = integratePathline(field, probe, Math.max(0, t - 2), 100, 0.02)
      ctx.beginPath()
      path.forEach((q, i) => {
        const { px, py } = toRight(q.x, q.y, w, h)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.strokeStyle = '#f472b6'
      ctx.lineWidth = Math.max(2.4, cell * 0.045)
      ctx.stroke()
    },
    [field, lastT, particles, positionsRef, probe, trailsRef],
  )

  const pv = field(probe.x, probe.y, simT)
  const speed = Math.hypot(pv.x, pv.y)

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
        <PlayButton playing={playing} onToggle={() => setPlaying((p) => !p)} />
        <span className="muted">点击左半画布移动欧拉探针点</span>
      </div>
      <div className="viz-block wide">
        <div className="panel-captions">
          <div>欧拉法 · 固定空间点（流场法）</div>
          <div>拉格朗日法 · 跟踪质点（质点系法）</div>
        </div>
        <div className="viz-frame tall">
          <CanvasStage
            draw={draw}
            playing={playing}
            onTime={onTime}
            onClickCanvas={(px, py, w, h) => {
              const g = leftGeom(w, h)
              if (px >= g.mid) return
              if (py < g.top || py > g.top + g.plotH) return
              const x = ((px - g.gutter) / g.panelW) * 2 * HALF_W - HALF_W
              const y = -(((py - g.top) / g.plotH) * 2 - 1) * HALF_H
              if (!Number.isFinite(x) || !Number.isFinite(y)) return
              setProbe({
                x: Math.max(-HALF_W, Math.min(HALF_W, x)),
                y: Math.max(-HALF_H, Math.min(HALF_H, y)),
              })
            }}
          />
        </div>
        <Legend
          items={[
            { color: '#7dd3fc', label: '固定点速度矢量', kind: 'line' },
            { color: '#f472b6', label: '探针（欧拉）' },
            { color: '#fbbf24', label: '探针速度', kind: 'line' },
            { color: '#fbbf24', label: '被跟踪质点及其轨迹' },
            { color: '#f472b6', label: '自探针释放的迹线', kind: 'line' },
          ]}
        />
        <Readouts
          items={[
            { label: '探针位置 (x, y)', value: `${probe.x.toFixed(2)}, ${probe.y.toFixed(2)}` },
            { label: 'uₓ', value: pv.x.toFixed(2), tone: '#7dd3fc' },
            { label: 'uᵧ', value: pv.y.toFixed(2), tone: '#7dd3fc' },
            { label: '|u|（左下曲线）', value: speed.toFixed(2), tone: '#f472b6' },
          ]}
        />
      </div>
      <p className="hint">
        左：固定探针处的速度矢量，以及该点速度模随时间的曲线。右：一群质点的轨迹；粉线是从探针位置释放的质点走过的迹线。
      </p>
    </div>
  )
}
