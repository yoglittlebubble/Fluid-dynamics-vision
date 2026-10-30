/** 2D velocity field helpers for educational Canvas demos */

export type Vec2 = { x: number; y: number }

export type VelocityField = (x: number, y: number, t: number) => Vec2

/** 恒定剪切流：u = (y/H)*U, v = 0 — streamlines = pathlines */
export function steadyShear(U = 1.2, H = 1): VelocityField {
  return (_x, y) => ({ x: (y / H) * U, y: 0 })
}

/** 恒定涡旋：u = -ω y, v = ω x（流线为圆） */
export function steadyVortex(omega = 0.8): VelocityField {
  return (x, y) => ({ x: -omega * y, y: omega * x })
}

/** 恒定驻点流：u = a x, v = -a y */
export function steadyStagnation(a = 0.45): VelocityField {
  return (x, y) => ({ x: a * x, y: -a * y })
}

/**
 * 非恒定振荡剪切：u = (y/H)*(U + A sin(ωt)), v = 0
 * 流线仍水平，但迹线因时间变化与流线不完全重合（水平位移幅值不同）
 * 为了让流线与迹线明显分离，用旋转振荡场更好。
 */
export function unsteadyOscillatingVortex(omega0 = 0.55, A = 0.45, freq = 0.7): VelocityField {
  return (x, y, t) => {
    const omega = omega0 + A * Math.sin(freq * t)
    return { x: -omega * y, y: omega * x }
  }
}

/**
 * 非恒定平移振荡 + 剪切：流线瞬时为水平线，质点路径因 u(t) 变化
 * 更好对比：非恒定驻点+漂移
 */
export function unsteadyDriftStagnation(a = 0.4, driftAmp = 0.55, freq = 0.9): VelocityField {
  return (x, y, t) => {
    const drift = driftAmp * Math.sin(freq * t)
    return { x: a * x + drift, y: -a * y }
  }
}

/** 管道收缩：连续性示意 — 沿 x 加速，宽度变窄处速度增大 */
export function convergingDuct(U0 = 0.35, taper = 0.18): VelocityField {
  return (x, y) => {
    // half-height ~ 1 - taper*x (clamp)
    const half = Math.max(0.25, 1 - taper * Math.max(0, x))
    const u = (U0 * 1) / half
    // v pushes toward centerline to keep streamlines in duct
    const v = y === 0 ? 0 : -((u * taper) / half) * y * 0.5
    return { x: u, y: v }
  }
}

/** RK4 一步积分 */
export function rk4(
  field: VelocityField,
  p: Vec2,
  t: number,
  dt: number,
): Vec2 {
  const k1 = field(p.x, p.y, t)
  const k2 = field(p.x + 0.5 * dt * k1.x, p.y + 0.5 * dt * k1.y, t + 0.5 * dt)
  const k3 = field(p.x + 0.5 * dt * k2.x, p.y + 0.5 * dt * k2.y, t + 0.5 * dt)
  const k4 = field(p.x + dt * k3.x, p.y + dt * k3.y, t + dt)
  return {
    x: p.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: p.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
  }
}

/** 从种子点积分流线（固定时刻 t） */
export function integrateStreamline(
  field: VelocityField,
  seed: Vec2,
  t: number,
  steps: number,
  ds: number,
  bothWays = true,
): Vec2[] {
  const forward: Vec2[] = [seed]
  let p = { ...seed }
  for (let i = 0; i < steps; i++) {
    const v = field(p.x, p.y, t)
    const speed = Math.hypot(v.x, v.y) || 1e-9
    p = { x: p.x + (ds * v.x) / speed, y: p.y + (ds * v.y) / speed }
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) break
    if (Math.abs(p.x) > 3 || Math.abs(p.y) > 3) break
    forward.push({ ...p })
  }
  if (!bothWays) return forward
  const backward: Vec2[] = []
  p = { ...seed }
  for (let i = 0; i < steps; i++) {
    const v = field(p.x, p.y, t)
    const speed = Math.hypot(v.x, v.y) || 1e-9
    p = { x: p.x - (ds * v.x) / speed, y: p.y - (ds * v.y) / speed }
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) break
    if (Math.abs(p.x) > 3 || Math.abs(p.y) > 3) break
    backward.push({ ...p })
  }
  return [...backward.reverse(), ...forward]
}

/** 迹线：随时间推进质点 */
export function integratePathline(
  field: VelocityField,
  seed: Vec2,
  t0: number,
  steps: number,
  dt: number,
): Vec2[] {
  const pts: Vec2[] = [seed]
  let p = { ...seed }
  let t = t0
  for (let i = 0; i < steps; i++) {
    p = rk4(field, p, t, dt)
    t += dt
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) break
    if (Math.abs(p.x) > 3.5 || Math.abs(p.y) > 3.5) break
    pts.push({ ...p })
  }
  return pts
}

export function mag(v: Vec2): number {
  return Math.hypot(v.x, v.y)
}
