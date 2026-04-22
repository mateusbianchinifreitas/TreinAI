import { T } from '../data/constants'

export const Spark = ({ data, color = T.red, w = 60, h = 26 }) => {
  if (!data?.length) return null
  const vals = data.map(d => d.kg)
  const mn = Math.min(...vals), mx = Math.max(...vals), rng = mx - mn || 1
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - mn) / rng) * (h - 4) - 2}`).join(' ')
  const lp = pts.split(' ').pop().split(',')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lp[0]} cy={lp[1]} r="2.5" fill={color} />
    </svg>
  )
}

export const LineChart = ({ data, color = T.red }) => {
  if (!data?.length) return <div style={{ textAlign: 'center', padding: '20px 0', color: T.textDim, fontSize: 12 }}>Sem dados</div>
  const W = 300, H = 100, PL = 28, PR = 8, PT = 6, PB = 20
  const IW = W - PL - PR, IH = H - PT - PB
  const vals = data.map(d => d.kg), mn = Math.min(...vals), mx = Math.max(...vals), rng = mx - mn || 1
  const pts = data.map((d, i) => ({ x: PL + (i / (data.length - 1)) * IW, y: PT + IH - ((d.kg - mn) / rng) * IH, ...d }))
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')
  const area = `${path}L${pts[pts.length - 1].x},${PT + IH}L${pts[0].x},${PT + IH}Z`
  const gradId = `lg${color.replace('#', '')}`
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[mn, (mn + mx) / 2, mx].map((t, i) => {
        const y = PT + IH - ((t - mn) / rng) * IH
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke={T.border} strokeWidth="1" strokeDasharray="3,4" />
            <text x={PL - 3} y={y + 4} textAnchor="end" fill={T.textSub} fontSize="7">{Math.round(t)}</text>
          </g>
        )
      })}
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.8" fill={color} stroke={T.card} strokeWidth="1.5" />)}
      {data.length <= 8 && pts.map((p, i) => (
        <text key={i} x={p.x} y={H - 3} textAnchor="middle" fill={T.textDim} fontSize="7">{p.date?.slice(5)}</text>
      ))}
    </svg>
  )
}
