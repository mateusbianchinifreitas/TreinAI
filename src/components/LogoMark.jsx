import { T } from '../data/constants'
import logoSrc from '/logo.png'

export const LogoMark = ({ size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.28,
    overflow: 'hidden', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: T.bg
  }}>
    <img
      src={logoSrc}
      alt="logo"
      style={{
        width: '100%', height: '100%', objectFit: 'cover',
        mixBlendMode: 'screen', display: 'block',
        filter: 'hue-rotate(5deg) saturate(1.15) brightness(1.05)'
      }}
    />
  </div>
)
