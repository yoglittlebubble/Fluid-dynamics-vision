type Props = { topic: string }

/** Static, lightweight card art — no animation loop. */
export function TopicPreview({ topic }: Props) {
  return (
    <div className="topic-preview">
      <svg viewBox="0 0 320 86" className="topic-svg" aria-hidden="true">
        <rect width="320" height="86" fill="#0b1220" />
        {topic === '/streamline' && <StreamArt />}
        {topic === '/euler-lagrange' && <EulerArt />}
        {topic === '/continuity' && <ContinuityArt />}
        {topic === '/bernoulli' && <BernoulliArt />}
        {topic === '/pitot' && <PitotArt />}
        {topic === '/momentum' && <MomentumArt />}
        {topic === '/headlines' && <HeadArt />}
      </svg>
    </div>
  )
}

function StreamArt() {
  return (
    <>
      <path d="M18 43 H302" stroke="#1e293b" strokeWidth="1" />
      <path d="M160 8 V78" stroke="#1e293b" strokeWidth="1" />
      <path d="M18 16 C 90 16, 130 43, 160 43 S 230 70, 302 70" fill="none" stroke="#38bdf8" strokeOpacity="0.45" strokeWidth="1.4" />
      <path d="M18 28 C 100 28, 136 43, 160 43 S 220 58, 302 58" fill="none" stroke="#38bdf8" strokeWidth="1.7" />
      <path d="M18 58 C 100 58, 136 43, 160 43 S 220 28, 302 28" fill="none" stroke="#38bdf8" strokeWidth="1.7" />
      <path d="M18 70 C 90 70, 130 43, 160 43 S 230 16, 302 16" fill="none" stroke="#38bdf8" strokeOpacity="0.45" strokeWidth="1.4" />
      <path d="M36 64 C 80 52, 120 40, 168 44 S 230 30, 276 20" fill="none" stroke="#fbbf24" strokeWidth="2.2" />
      <circle cx="276" cy="20" r="3.2" fill="#fbbf24" />
      <circle cx="124" cy="46" r="4" fill="#f472b6" />
    </>
  )
}

function EulerArt() {
  const arrows = [
    [28, 28],
    [58, 24],
    [88, 32],
    [28, 52],
    [58, 48],
    [88, 56],
  ]
  return (
    <>
      <path d="M160 10 V76" stroke="#334155" strokeWidth="1" />
      {arrows.map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={`M${x} ${y} l16 -6`}
          stroke="#38bdf8"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      ))}
      <circle cx="62" cy="40" r="4.5" fill="#f472b6" />
      <path d="M62 40 l22 -8" stroke="#fbbf24" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="196" cy="58" r="3.5" fill="#fbbf24" />
      <circle cx="228" cy="40" r="3.5" fill="#fbbf24" />
      <circle cx="262" cy="28" r="3.5" fill="#fbbf24" />
      <path d="M186 70 C 210 62, 220 50, 228 40 S 250 32, 262 28" fill="none" stroke="#fbbf24" strokeOpacity="0.7" strokeWidth="1.6" />
      <path d="M200 24 C 230 30, 248 46, 270 62" fill="none" stroke="#f472b6" strokeWidth="1.8" />
    </>
  )
}

function ContinuityArt() {
  return (
    <>
      <path d="M16 22 C 120 22, 180 34, 304 36" fill="none" stroke="#94a3b8" strokeWidth="1.6" />
      <path d="M16 64 C 120 64, 180 52, 304 50" fill="none" stroke="#94a3b8" strokeWidth="1.6" />
      <path d="M70 22 V64" stroke="#38bdf8" strokeDasharray="3 3" strokeWidth="1.2" />
      <path d="M240 36 V50" stroke="#38bdf8" strokeDasharray="3 3" strokeWidth="1.2" />
      <circle cx="48" cy="43" r="4" fill="#38bdf8" />
      <path d="M54 43 h12" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="110" cy="43" r="4" fill="#7dd3fc" />
      <path d="M116 43 h14" stroke="#7dd3fc" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="200" cy="43" r="4.5" fill="#fbbf24" />
      <path d="M207 43 h18" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <circle cx="270" cy="43" r="4.5" fill="#f59e0b" />
      <path d="M277 43 h20" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
    </>
  )
}

function BernoulliArt() {
  return (
    <>
      <path d="M16 20 H300" fill="none" stroke="#f472b6" strokeWidth="2" />
      <path d="M16 34 C 110 36, 150 58, 168 62 S 210 40, 304 36" fill="none" stroke="#fbbf24" strokeWidth="2" />
      <path d="M16 58 H304" fill="none" stroke="#86efac" strokeWidth="1.6" strokeDasharray="5 3" />
      <path
        d="M20 70 C 80 70, 120 74, 160 78 C 200 74, 240 70, 300 70 L300 84 L20 84 Z"
        fill="rgba(56,189,248,0.18)"
        stroke="#64748b"
        strokeWidth="1.4"
      />
      <circle cx="168" cy="78" r="2.4" fill="#fbbf24" />
    </>
  )
}

function PitotArt() {
  return (
    <>
      <path d="M16 30 h28 M16 43 h36 M16 56 h28" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M78 43 h70 a10 10 0 0 0 0 -0.1" fill="#cbd5e1" />
      <path d="M86 32 H168 V54 H96 a12 12 0 0 1 0 -22 Z" fill="#cbd5e1" />
      <circle cx="90" cy="43" r="3.5" fill="#f472b6" />
      <circle cx="118" cy="32" r="2" fill="#38bdf8" />
      <circle cx="128" cy="32" r="2" fill="#38bdf8" />
      <circle cx="138" cy="32" r="2" fill="#38bdf8" />
      <rect x="196" y="18" width="22" height="52" fill="none" stroke="#94a3b8" />
      <rect x="232" y="18" width="22" height="52" fill="none" stroke="#94a3b8" />
      <rect x="198" y="40" width="18" height="28" fill="#fbbf24" />
      <rect x="234" y="28" width="18" height="40" fill="#fbbf24" />
    </>
  )
}

function MomentumArt() {
  return (
    <>
      <path
        d="M16 58 H120 A 36 36 0 0 0 156 22"
        fill="none"
        stroke="#334155"
        strokeWidth="22"
        strokeLinecap="butt"
      />
      <path
        d="M16 58 H120 A 36 36 0 0 0 156 22"
        fill="none"
        stroke="rgba(56,189,248,0.45)"
        strokeWidth="12"
        strokeLinecap="butt"
      />
      <path d="M156 22 L188 8" stroke="#64748b" strokeWidth="16" strokeLinecap="butt" />
      <path d="M156 22 L188 8" stroke="rgba(56,189,248,0.45)" strokeWidth="8" />
      <circle cx="132" cy="36" r="4" fill="#f472b6" />
      <path d="M132 36 l36 22" stroke="#f472b6" strokeWidth="3" strokeLinecap="round" />
      <path d="M160 52 l8 6 -10 1 z" fill="#f472b6" />
    </>
  )
}

function HeadArt() {
  return (
    <>
      <path d="M24 70 H296" stroke="#334155" strokeWidth="10" strokeLinecap="butt" />
      <path d="M24 70 H296" stroke="rgba(56,189,248,0.4)" strokeWidth="5" />
      <path d="M28 18 L292 40" stroke="#f472b6" strokeWidth="2" />
      <path d="M28 36 L292 58" stroke="#fbbf24" strokeWidth="2" />
      <path d="M28 62 H292" stroke="#86efac" strokeWidth="1.6" strokeDasharray="5 3" />
      <path d="M36 18 V36" stroke="#a78bfa" strokeWidth="1.6" />
    </>
  )
}
