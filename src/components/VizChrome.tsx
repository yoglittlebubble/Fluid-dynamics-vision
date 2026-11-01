import { useCallback, useRef, useState } from 'react'

export function PlayButton({
  playing,
  onToggle,
}: {
  playing: boolean
  onToggle: () => void
}) {
  return (
    <button type="button" className="btn-primary" onClick={onToggle}>
      {playing ? '暂停' : '播放'}
    </button>
  )
}

export type LegendKind = 'swatch' | 'line' | 'dashed' | 'speed'

export function Legend({
  items,
}: {
  items: { color: string; label: string; kind?: LegendKind }[]
}) {
  return (
    <div className="legend-row" role="list">
      {items.map((it) => (
        <span key={it.label} className="legend-chip" role="listitem">
          <i
            className={
              it.kind === 'speed'
                ? 'legend-swatch speed'
                : it.kind === 'dashed'
                  ? 'legend-swatch line dashed'
                  : it.kind === 'line'
                    ? 'legend-swatch line'
                    : 'legend-swatch'
            }
            style={
              it.kind === 'speed'
                ? undefined
                : it.kind === 'line' || it.kind === 'dashed'
                  ? { borderTopColor: it.color }
                  : { background: it.color }
            }
          />
          {it.label}
        </span>
      ))}
    </div>
  )
}

export function Readouts({
  items,
}: {
  items: { label: string; value: string; tone?: string }[]
}) {
  return (
    <div className="readout-row">
      {items.map((it) => (
        <div key={it.label} className="readout-card">
          <div className="k">{it.label}</div>
          <div className="v" style={it.tone ? { color: it.tone } : undefined}>
            {it.value}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Throttled simulation clock for DOM readouts. Geometry stays on the canvas. */
export function useSimTime() {
  const [t, setT] = useState(0)
  const last = useRef(-1)
  const onTime = useCallback((now: number) => {
    if (now - last.current < 0.12) return
    last.current = now
    setT(now)
  }, [])
  return [t, onTime] as const
}
