// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
export const T = {
  bg: '#080809', surface: '#0F0F11', card: '#141416', card2: '#1A1A1E',
  border: '#1E1E24', borderHi: '#2A2A34',
  red: '#E8322A', redDim: 'rgba(232,50,42,0.1)', redGlow: 'rgba(232,50,42,0.22)',
  green: '#1DB954', greenDim: 'rgba(29,185,84,0.1)',
  yellow: '#F5A623', yellowDim: 'rgba(245,166,35,0.1)',
  blue: '#4A9EFF', blueDim: 'rgba(74,158,255,0.1)',
  text: '#F5F5F5', textSub: '#5A5A6A', textDim: '#2E2E3A',
}

// ─── MUSCLES ─────────────────────────────────────────────────────────────────
export const MUSCLES = ['Peito','Costas','Ombro','Bíceps','Tríceps','Perna','Glúteo','Abdômen']

export const MCOL = {
  'Peito': T.red, 'Costas': '#4A9EFF', 'Ombro': '#F5A623',
  'Bíceps': '#1DB954', 'Tríceps': '#B06EFF', 'Perna': '#FF6B6B',
  'Glúteo': '#FF8FAB', 'Abdômen': '#4CC9F0',
}

// ─── EXERCISE DATABASE ───────────────────────────────────────────────────────
export const EXERCISE_DB = {
  'Peito':   [{name:'Supino Reto',sets:4,reps:10,rest:90},{name:'Supino Inclinado',sets:3,reps:12,rest:90},{name:'Crucifixo',sets:3,reps:12,rest:60},{name:'Peck Deck',sets:3,reps:15,rest:60},{name:'Cross Over',sets:3,reps:15,rest:60}],
  'Costas':  [{name:'Puxada Frontal',sets:4,reps:10,rest:90},{name:'Remada Curvada',sets:4,reps:10,rest:90},{name:'Remada Unilateral',sets:3,reps:12,rest:60},{name:'Barra Fixa',sets:3,reps:8,rest:120},{name:'Remada Cavalinho',sets:3,reps:12,rest:60}],
  'Ombro':   [{name:'Desenvolvimento',sets:4,reps:10,rest:90},{name:'Elevação Lateral',sets:3,reps:15,rest:60},{name:'Elevação Frontal',sets:3,reps:12,rest:60},{name:'Dev. Arnold',sets:3,reps:12,rest:90},{name:'Encolhimento',sets:3,reps:15,rest:60}],
  'Bíceps':  [{name:'Rosca Direta',sets:4,reps:12,rest:60},{name:'Rosca Alternada',sets:3,reps:12,rest:60},{name:'Rosca Martelo',sets:3,reps:12,rest:60},{name:'Rosca Scott',sets:3,reps:10,rest:90}],
  'Tríceps': [{name:'Tríceps Corda',sets:4,reps:12,rest:60},{name:'Tríceps Testa',sets:3,reps:12,rest:60},{name:'Tríceps Coice',sets:3,reps:15,rest:60},{name:'Tríceps Francês',sets:3,reps:12,rest:90}],
  'Perna':   [{name:'Agachamento',sets:4,reps:10,rest:120},{name:'Leg Press',sets:4,reps:12,rest:90},{name:'Cadeira Extensora',sets:3,reps:15,rest:60},{name:'Cadeira Flexora',sets:3,reps:12,rest:60},{name:'Stiff',sets:3,reps:12,rest:90}],
  'Glúteo':  [{name:'Hip Thrust',sets:4,reps:12,rest:90},{name:'Glúteo no Cabo',sets:3,reps:15,rest:60},{name:'Passada',sets:3,reps:12,rest:60},{name:'Agach. Sumo',sets:3,reps:12,rest:90}],
  'Abdômen': [{name:'Abdominal Crunch',sets:3,reps:20,rest:45},{name:'Prancha',sets:3,reps:1,rest:60},{name:'Elevação de Perna',sets:3,reps:15,rest:45},{name:'Russian Twist',sets:3,reps:20,rest:45}],
}

// ─── SEED HISTORY ────────────────────────────────────────────────────────────
export function genHistory() {
  const h = {}
  const today = new Date()
  const seeds = [
    ['Supino Reto','Peito',60],['Puxada Frontal','Costas',55],
    ['Agachamento','Perna',90],['Rosca Direta','Bíceps',28],
    ['Tríceps Corda','Tríceps',32],['Desenvolvimento','Ombro',36],
  ]
  const days = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const ds = d.toISOString().slice(0,10)
    if (i % 2 !== 0) continue
    const muscleGroups = i%6===0?['Peito','Tríceps']:i%4===0?['Costas','Bíceps']:['Perna','Glúteo']
    const exercises = muscleGroups.flatMap(m =>
      (EXERCISE_DB[m]||[]).slice(0,3).map(ex => ({
        ...ex, muscle: m,
        sets: Array(ex.sets).fill(null).map(() => ({
          kg: Math.round((20+Math.random()*60)*2)/2,
          reps: ex.reps + Math.floor(Math.random()*3-1),
          done: Math.random() > 0.1
        }))
      }))
    )
    days.push({ date: ds, muscles: muscleGroups, exercises, skipped: exercises.some(e=>e.sets.some(s=>!s.done)) })
    exercises.forEach(ex => {
      if (!h[ex.name]) h[ex.name] = []
      const maxKg = Math.max(...ex.sets.filter(s=>s.done).map(s=>s.kg))
      if (isFinite(maxKg)) h[ex.name].push({ date:ds, kg:maxKg, reps:ex.reps, sets:ex.sets.filter(s=>s.done).length, muscle:ex.muscle })
    })
  }
  seeds.forEach(([ex,mu,base]) => {
    if (h[ex]) return
    h[ex] = []
    let kg = base
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate()-i*3)
      kg += Math.random()>.35 ? +(Math.random()*2.5).toFixed(1) : -(Math.random()).toFixed(1)
      h[ex].push({ date:d.toISOString().slice(0,10), kg:Math.round(kg*2)/2, reps:6+Math.floor(Math.random()*6), sets:3, muscle:mu })
    }
  })
  return { days, exerciseHistory: h }
}
