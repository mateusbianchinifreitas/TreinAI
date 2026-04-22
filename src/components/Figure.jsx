import { T, MCOL } from '../data/constants'

export const Figure = ({ highlighted = [] }) => (
  <svg viewBox="0 0 36 58" width="64" height="104" style={{ display: 'block', flexShrink: 0 }}>
    <circle cx="18" cy="6" r="4" fill="none" stroke={T.borderHi} strokeWidth="1" />
    <line x1="18" y1="10" x2="18" y2="30" stroke={T.borderHi} strokeWidth="1" />
    <line x1="10" y1="14" x2="26" y2="14" stroke={T.borderHi} strokeWidth="1" />
    <line x1="10" y1="14" x2="7" y2="28" stroke={T.borderHi} strokeWidth="1" />
    <line x1="26" y1="14" x2="29" y2="28" stroke={T.borderHi} strokeWidth="1" />
    <line x1="18" y1="30" x2="14" y2="46" stroke={T.borderHi} strokeWidth="1" />
    <line x1="18" y1="30" x2="22" y2="46" stroke={T.borderHi} strokeWidth="1" />
    {[
      ['Peito',18,19,5,3.5],['Costas',18,23,4,3],
      ['Ombro-L',10,14,2.8,2],['Ombro-R',26,14,2.8,2],
      ['Bíceps-L',8,20,2,3.5],['Bíceps-R',28,20,2,3.5],
      ['Tríceps-L',7.5,24,1.8,3],['Tríceps-R',28.5,24,1.8,3],
      ['Abdômen',18,27,3.5,2.5],['Glúteo',18,31,4,2],
      ['Perna-L',14.5,40,3,6],['Perna-R',21.5,40,3,6],
    ].map(([id,cx,cy,rx,ry]) => {
      const mu = id.replace(/-[LR]$/, '')
      const hi = highlighted.includes(mu)
      return <ellipse key={id} cx={cx} cy={cy} rx={rx} ry={ry} fill={hi ? (MCOL[mu]||T.red) : T.borderHi} fillOpacity={hi ? 0.7 : 0.2} />
    })}
  </svg>
)
