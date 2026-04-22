import { useState, useEffect } from 'react'
import { T } from '../data/constants'

export const Timer = ({ secs, onClose }) => {
  const [rem, setRem] = useState(secs)
  const [run, setRun] = useState(true)
  useEffect(() => {
    if (!run || rem <= 0) return
    const t = setTimeout(() => setRem(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [rem, run])
  const pct = (secs - rem) / secs, r = 42, circ = 2 * Math.PI * r, done = rem === 0
  return (
    <div style={{ position:'fixed',bottom:92,left:'50%',transform:'translateX(-50%)',zIndex:999,background:T.card,border:`1px solid ${done?T.green:T.red}`,borderRadius:20,padding:'16px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:10,boxShadow:`0 8px 40px ${done?T.green+'33':T.redGlow}`,minWidth:196 }}>
      <div style={{ fontSize:9,color:T.textSub,letterSpacing:3,textTransform:'uppercase' }}>Descanso</div>
      <div style={{ position:'relative',width:96,height:96 }}>
        <svg width="96" height="96" style={{ transform:'rotate(-90deg)' }}>
          <circle cx="48" cy="48" r={r} fill="none" stroke={T.border} strokeWidth="5" />
          <circle cx="48" cy="48" r={r} fill="none" stroke={done?T.green:T.red} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={circ-(pct*circ)}
            style={{ transition:'stroke-dashoffset 1s linear,stroke .3s' }} />
        </svg>
        <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <div style={{ fontSize:done?12:26,fontWeight:900,color:done?T.green:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:2 }}>
            {done ? 'PRONTO!' : `${Math.floor(rem/60)}:${String(rem%60).padStart(2,'0')}`}
          </div>
        </div>
      </div>
      <div style={{ display:'flex',gap:8 }}>
        <button onClick={() => setRun(r => !r)} style={{ background:T.red,color:'#fff',border:'none',borderRadius:9,padding:'6px 13px',fontSize:11,fontWeight:700,cursor:'pointer' }}>{run ? '⏸' : '▶'}</button>
        <button onClick={onClose} style={{ background:T.border,color:T.textSub,border:'none',borderRadius:9,padding:'6px 13px',fontSize:11,cursor:'pointer' }}>Fechar</button>
      </div>
    </div>
  )
}
