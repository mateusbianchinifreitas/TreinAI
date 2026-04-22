import { T } from '../data/constants'

export const Avatar = ({ name = '?', color = T.red, size = 44 }) => {
  const ini = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <svg width={size} height={size} viewBox="0 0 44 44">
      <rect width="44" height="44" rx="13" fill={color + '1A'} />
      <rect width="44" height="44" rx="13" fill="none" stroke={color} strokeWidth="1.5" />
      <text x="22" y="29" textAnchor="middle" fill={color} fontSize="16" fontWeight="900" fontFamily="'Barlow Condensed',sans-serif">{ini}</text>
    </svg>
  )
}
