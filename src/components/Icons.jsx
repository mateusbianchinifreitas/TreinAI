export const Ic = ({ n, s = 20, c = 'currentColor', sw = 1.6 }) => {
  const paths = {
    home:     'M3 10.5L12 3l9 7.5V21H15v-5h-6v5H3z',
    dumbbell: 'M6.5 5.5v13 M17.5 5.5v13 M9 5.5H4v4h5z M9 14.5H4v4h5z M20 5.5h-5v4h5z M20 14.5h-5v4h5z M9 9.5h6 M9 14.5h6',
    chart:    'M3 3v18h18 M7 16l4-5 4 3 4-6',
    trophy:   'M8 21h8 M12 17v4 M4 5h16v7a8 8 0 01-16 0V5z M4 5H2v3a3 3 0 003 3 M20 5h2v3a3 3 0 01-3 3',
    users:    'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75 M9 7a4 4 0 100 8',
    check:    'M20 6L9 17l-5-5',
    timer:    'M12 2a10 10 0 100 20 M12 6v6l4 2',
    fire:     'M12 2c-1.5 3-4 5-4 9a4 4 0 008 0c0-2-.5-3-1-4-1 2-2 3-3 3s-2-1-1.5-3',
    plus:     'M12 5v14 M5 12h14',
    x:        'M18 6L6 18 M6 6l12 12',
    edit:     'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
    play:     'M5 3l14 9-14 9V3z',
    arrow:    'M5 12h14 M12 5l7 7-7 7',
    bolt:     'M13 2L3 14h9l-1 8 10-12h-9z',
    brain:    'M9 3a4 4 0 00-4 4v1H4a2 2 0 000 4h1v2a4 4 0 004 4h6a4 4 0 004-4v-2h1a2 2 0 000-4h-1V7a4 4 0 00-4-4',
    person:   'M12 12a5 5 0 100-10 5 5 0 000 10z M3 21a9 9 0 0118 0',
    trash:    'M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2',
  }
  const segs = (paths[n] || '').split(' M ').map((s, i) => i === 0 ? s : 'M ' + s)
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {segs.map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}
