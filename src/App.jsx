import { useState, useEffect } from 'react'
import { T, MUSCLES, MCOL, EXERCISE_DB, genHistory } from './data/constants'
import { Ic } from './components/Icons'
import { Avatar } from './components/Avatar'
import { LogoMark } from './components/LogoMark'
import { Spark, LineChart } from './components/Charts'
import { Figure } from './components/Figure'
import { Timer } from './components/Timer'

export default function TreinAI() {
  /* ── global state ──────────────────────────────────────────────────────── */
  const [tab, setTab] = useState("home");
  const [profiles, setProfiles] = useState([
    {id:1,name:"Lucas",color:T.red,weight:[{date:"2025-01-10",kg:82},{date:"2025-02-15",kg:80.5},{date:"2025-03-20",kg:79}]},
    {id:2,name:"Pedro",color:"#4A9EFF",weight:[{date:"2025-01-10",kg:90},{date:"2025-02-15",kg:88}]},
  ]);
  const [activeProfile, setActiveProfile] = useState(1);
  const [workoutPlans, setWorkoutPlans] = useState([
    {id:1,name:"Peito + Tríceps",muscles:["Peito","Tríceps"],exercises:EXERCISE_DB["Peito"].concat(EXERCISE_DB["Tríceps"]).slice(0,8)},
    {id:2,name:"Costas + Bíceps",muscles:["Costas","Bíceps"],exercises:EXERCISE_DB["Costas"].concat(EXERCISE_DB["Bíceps"]).slice(0,8)},
    {id:3,name:"Perna + Glúteo",muscles:["Perna","Glúteo"],exercises:EXERCISE_DB["Perna"].concat(EXERCISE_DB["Glúteo"]).slice(0,8)},
  ]);
  // Per-profile data: each profile has its own logs and exercise history
  const [profileData, setProfileData] = useState(()=>{
    const d1 = genHistory();
    const d2 = genHistory(); // different random seed since genHistory uses Math.random
    return {
      1: { workoutLogs: d1.days, exerciseHistory: d1.exerciseHistory },
      2: { workoutLogs: d2.days, exerciseHistory: d2.exerciseHistory },
    };
  });
  // Custom exercises added by user per muscle group
  const [customExercises, setCustomExercises] = useState({});
  // Helper: get all exercises for a muscle (DB + custom)
  const getExercisesForMuscle = (muscle) => [
    ...(EXERCISE_DB[muscle]||[]),
    ...((customExercises[muscle]||[]).map(name=>({name,sets:3,reps:12,rest:90,custom:true}))),
  ];

  // Convenience: current profile's data
  const workoutLogs = profileData[activeProfile]?.workoutLogs || [];
  const exerciseHistory = profileData[activeProfile]?.exerciseHistory || {};
  const setWorkoutLogs = (updater) => setProfileData(pd=>{
    const cur = pd[activeProfile]||{workoutLogs:[],exerciseHistory:{}};
    const newLogs = typeof updater==="function" ? updater(cur.workoutLogs) : updater;
    return {...pd, [activeProfile]:{...cur, workoutLogs:newLogs}};
  });
  const setExerciseHistory = (updater) => setProfileData(pd=>{
    const cur = pd[activeProfile]||{workoutLogs:[],exerciseHistory:{}};
    const newHist = typeof updater==="function" ? updater(cur.exerciseHistory) : updater;
    return {...pd, [activeProfile]:{...cur, exerciseHistory:newHist}};
  });
  const [timer, setTimer] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  /* ── modal/overlay state ───────────────────────────────────────────────── */
  const [modal, setModal] = useState(null);
  // modal types: "start-workout", "log-detail", "profile-switch", "plan-edit", "new-plan", "active-workout"

  const profile = profiles.find(p=>p.id===activeProfile);

  /* ── auto AI on home ───────────────────────────────────────────────────── */
  useEffect(()=>{
    if(tab!=="home") return;
    // re-fetch whenever profile changes or first load
    const timer = setTimeout(()=>fetchAI(), 800);
    return ()=>clearTimeout(timer);
  },[tab, activeProfile]);

  const fetchAI = async ()=>{
    if(loadingAI) return;
    setLoadingAI(true);
    const summary = Object.entries(exerciseHistory).slice(0,6).map(([ex,logs])=>
      `${ex}(${logs[0]?.muscle}):${logs.slice(-3).map(l=>`${l.kg}×${l.reps}`).join(",")}`
    ).join(";");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,
          messages:[{role:"user",content:`Personal trainer. APENAS JSON puro sem markdown:\n{"insights":[{"type":"success|warning|tip","muscle":"nome","text":"frase curta pt-BR"}],"suggestion":{"exercise":"nome","text":"sugestão curta"}}\nDados:${summary}`}]
        })
      });
      const d = await res.json();
      setAiInsights(JSON.parse(d.content[0].text.replace(/```json|```/g,"").trim()));
    } catch {
      setAiInsights({
        insights:[
          {type:"success",muscle:"Peito",text:"Carga cresceu +5kg nas últimas 3 sessões"},
          {type:"warning",muscle:"Perna",text:"Volume caiu 28% esta semana — priorize!"},
          {type:"tip",muscle:"Costas",text:"Aumente o descanso para 2min entre séries"},
        ],
        suggestion:{exercise:"Supino Reto",text:"Tente 67.5kg hoje — você está pronto!"}
      });
    }
    setLoadingAI(false);
  };

  /* ── shared styles ─────────────────────────────────────────────────────── */
  const card = {background:T.card,borderRadius:16,padding:"15px",border:`1px solid ${T.border}`};
  const lbl = {fontSize:9,color:T.textSub,letterSpacing:2.5,textTransform:"uppercase",marginBottom:10,display:"block"};
  const pill = (active,color)=>({background:active?color+"18":"transparent",border:`1.5px solid ${active?color:T.border}`,borderRadius:20,padding:"6px 13px",color:active?color:T.textSub,fontSize:11,fontWeight:active?700:400,cursor:"pointer",transition:"all .2s"});

  /* ══════════════════════════════════════════════════════════════════════ */
  /* SPLASH */
  /* ══════════════════════════════════════════════════════════════════════ */

  /* ══════════════════════════════════════════════════════════════════════ */
  /* HOME SCREEN                                                             */
  /* ══════════════════════════════════════════════════════════════════════ */
  const HomeScreen = () => {
    const avgExPerDay = workoutLogs.length > 0
      ? Math.round(workoutLogs.reduce((s,d)=>s+d.exercises.length,0)/workoutLogs.length)
      : 0;
    // Real streak: max consecutive training days
    const streak = (() => {
      if(!workoutLogs.length) return 0;
      const dates = [...new Set(workoutLogs.map(l=>l.date))].sort().reverse();
      let count=0, prev=null;
      for(const d of dates){
        const cur=new Date(d);
        if(!prev){ count=1; prev=cur; continue; }
        const diff=(prev-cur)/(1000*60*60*24);
        if(diff<=1){ count++; prev=cur; }
        else break;
      }
      return count;
    })();



    return (
      <div style={{padding:"0 18px 110px"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:20,marginBottom:20}}>
          <button onClick={()=>setModal("profile-switch")} style={{background:"none",border:"none",cursor:"pointer",padding:0,textAlign:"left"}}>
            <div style={{fontSize:11,color:T.textSub,letterSpacing:2,textTransform:"uppercase",marginBottom:1}}>Atleta</div>
            <div style={{fontSize:28,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,lineHeight:1,display:"flex",alignItems:"center",gap:8}}>
              {profile?.name}
              <span style={{fontSize:10,color:T.red,marginTop:4}}>▾</span>
            </div>
          </button>

        </div>



        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
          {[[T.yellow,"🔥",`${streak}d`,"Streak"],[T.red,"⚡",`${avgExPerDay}`,"Exerc/Dia"],[T.green,"✓",workoutLogs.length,"Treinos"]].map(([c,e,v,l])=>(
            <div key={l} style={{...card,textAlign:"center",padding:"13px 8px"}}>
              <div style={{fontSize:16,marginBottom:3}}>{e}</div>
              <div style={{fontSize:22,fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{v}</div>
              <div style={{fontSize:8,color:"#9A9AAA",textTransform:"uppercase",letterSpacing:1,marginTop:1}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Figure + volume */}
        <div style={{...card,display:"flex",gap:14,alignItems:"flex-start",marginBottom:14}}>
          <Figure highlighted={[...new Set(workoutLogs.slice(-3).flatMap(d=>d.muscles))]}/>
          <div style={{flex:1,minWidth:0}}>
            <span style={lbl}>Volume / Músculo</span>
            {MUSCLES.map(m=>{
              const vol=(EXERCISE_DB[m]||[]).flatMap(e=>(exerciseHistory[e.name]||[]).slice(-2)).reduce((s,l)=>s+l.kg*l.reps*l.sets,0);
              const pct=Math.min((vol/7000)*100,100);
              return(
                <div key={m} style={{marginBottom:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontSize:10,color:T.textSub}}>{m}</span>
                    <span style={{fontSize:10,color:MCOL[m],fontWeight:700}}>{Math.round(vol)}</span>
                  </div>
                  <div style={{height:3,background:T.border,borderRadius:2}}>
                    <div style={{height:"100%",width:`${pct}%`,background:MCOL[m],borderRadius:2}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workout history */}
        <div style={{marginTop:18}}>
          <span style={lbl}>Histórico de Treinos</span>
          {workoutLogs.length === 0 && (
            <div style={{...card,textAlign:"center",padding:"20px",color:T.textDim,fontSize:12}}>
              Nenhum treino realizado ainda
            </div>
          )}
          {workoutLogs.slice().reverse().slice(0,8).map((log,i)=>{
            const totalVol = log.exercises.flatMap(e=>e.sets.filter(s=>s.done).map(s=>(+s.kg||0)*(+s.reps||0))).reduce((a,b)=>a+b,0);
            return(
              <div key={i} onClick={()=>setModal({type:"log-detail",log})}
                style={{...card,marginBottom:8,padding:"12px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:3}}>
                    {log.muscles.length>0 ? log.muscles.join(" + ") : "Treino"}
                  </div>
                  <div style={{fontSize:10,color:T.textSub}}>{log.date} · {log.exercises.length} exercícios</div>
                  {totalVol>0 && <div style={{fontSize:10,color:T.textDim,marginTop:1}}>Volume: {Math.round(totalVol).toLocaleString()} kg</div>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {log.muscles.slice(0,3).map(m=><div key={m} style={{width:7,height:7,borderRadius:"50%",background:MCOL[m]||T.red}}/>)}
                  <Ic n="arrow" s={14} c={T.textSub}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════ */
  /* TREINO SCREEN                                                           */
  /* ══════════════════════════════════════════════════════════════════════ */
  const TreinoScreen = () => {
    const [viewPlan, setViewPlan] = useState(null); // viewing a plan detail
    const [editPlan, setEditPlan] = useState(null); // editing a plan

    return (
      <div style={{padding:"0 18px 110px"}}>
        <div style={{paddingTop:20,marginBottom:20}}>
          <div style={{fontSize:30,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>Treinos</div>
        </div>

        {/* Quick muscle selector — auto builds plan */}
        <div style={{...card,marginBottom:14}}>
          <span style={lbl}>Treino Rápido por Grupo Muscular</span>
          <div style={{fontSize:11,color:T.textSub,marginBottom:12}}>Selecione os músculos — o treino é montado automaticamente</div>
          <QuickPlanBuilder workoutPlans={workoutPlans} setWorkoutPlans={setWorkoutPlans}/>
        </div>

        {/* Saved plans */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{...lbl,marginBottom:0}}>Treinos Salvos</span>
          <button onClick={()=>setModal("new-plan")} style={{background:T.red,color:"#fff",border:"none",borderRadius:9,padding:"5px 12px",fontSize:10,fontWeight:800,cursor:"pointer",letterSpacing:1}}>+ NOVO</button>
        </div>
        {workoutPlans.map(plan=>(
          <div key={plan.id} style={{...card,marginBottom:10,padding:"13px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.text}}>{plan.name}</div>
                <div style={{display:"flex",gap:5,marginTop:4}}>
                  {plan.muscles.map(m=><span key={m} style={{fontSize:8,color:MCOL[m],border:`1px solid ${MCOL[m]}44`,borderRadius:20,padding:"1px 7px",textTransform:"uppercase",letterSpacing:1}}>{m}</span>)}
                </div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setModal({type:"plan-edit",plan})} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 9px",color:T.textSub,fontSize:10,cursor:"pointer"}}><Ic n="edit" s={13} c={T.textSub}/></button>
                <button onClick={()=>setModal({type:"active-workout",plan})} style={{background:T.red,border:"none",borderRadius:8,padding:"5px 11px",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer"}}>Iniciar</button>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {plan.exercises.slice(0,3).map((ex,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<2?`1px solid ${T.border}22`:"none"}}>
                  <span style={{fontSize:11,color:T.textSub}}>{ex.name}</span>
                  <span style={{fontSize:11,color:T.textDim}}>{ex.sets}×{ex.reps} · {ex.rest}s</span>
                </div>
              ))}
              {plan.exercises.length>3&&<div style={{fontSize:10,color:T.textDim}}>+{plan.exercises.length-3} exercícios</div>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /* ── Add custom exercise component ─────────────────────────────────────── */
  const AddCustomExercise = ({muscles}) => {
    const [selMuscle, setSelMuscle] = useState(muscles[0]||"Peito");
    const [name, setName] = useState("");
    const [open, setOpen] = useState(false);

    const save = () => {
      if(!name.trim()) return;
      setCustomExercises(prev=>({
        ...prev,
        [selMuscle]: [...(prev[selMuscle]||[]), name.trim()]
      }));
      setName(""); setOpen(false);
    };

    return (
      <div style={{marginBottom:12}}>
        {!open ? (
          <button onClick={()=>setOpen(true)}
            style={{background:"transparent",border:`1px dashed ${T.border}`,borderRadius:10,padding:"7px 14px",color:T.textSub,fontSize:11,cursor:"pointer",width:"100%",textAlign:"center"}}>
            + Adicionar exercício personalizado
          </button>
        ) : (
          <div style={{background:T.surface,borderRadius:12,padding:"12px",border:`1px solid ${T.border}`}}>
            <div style={{fontSize:9,color:T.textSub,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Grupo muscular</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
              {muscles.map(m=>(
                <button key={m} onClick={()=>setSelMuscle(m)}
                  style={{background:selMuscle===m?MCOL[m]+"22":"transparent",border:`1.5px solid ${selMuscle===m?MCOL[m]:T.border}`,borderRadius:16,padding:"4px 10px",color:selMuscle===m?MCOL[m]:T.textSub,fontSize:11,fontWeight:selMuscle===m?700:400,cursor:"pointer"}}>
                  {m}
                </button>
              ))}
            </div>
            <div style={{fontSize:9,color:T.textSub,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Nome do exercício</div>
            <div style={{display:"flex",gap:8}}>
              <input placeholder="Ex: Crossover invertido" value={name} onChange={e=>setName(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&save()}
                style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:"9px 11px",color:T.text,fontSize:12,outline:"none"}}/>
              <button onClick={save} style={{background:T.red,color:"#fff",border:"none",borderRadius:9,padding:"9px 14px",fontSize:11,fontWeight:800,cursor:"pointer"}}>OK</button>
              <button onClick={()=>setOpen(false)} style={{background:T.border,color:T.textSub,border:"none",borderRadius:9,padding:"9px 11px",fontSize:11,cursor:"pointer"}}>✕</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── Quick plan builder component ──────────────────────────────────────── */
  const QuickPlanBuilder = ({workoutPlans,setWorkoutPlans}) => {
    const [selMuscles, setSelMuscles] = useState([]);
    const [preview, setPreview] = useState(null);

    const buildPlan = (muscles) => {
      const exs = muscles.flatMap(m=>getExercisesForMuscle(m));
      return {muscles, exercises:exs};
    };

    useEffect(()=>{
      if(selMuscles.length>0) setPreview(buildPlan(selMuscles));
      else setPreview(null);
    },[selMuscles]);

    return (
      <div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:12}}>
          {MUSCLES.map(m=>{const sel=selMuscles.includes(m);return(
            <button key={m} onClick={()=>setSelMuscles(p=>sel?p.filter(x=>x!==m):[...p,m])}
              style={pill(sel,MCOL[m])}>
              {m}
            </button>
          );})}
        </div>
        {/* Add custom exercise to a muscle group */}
        {selMuscles.length>0&&<AddCustomExercise muscles={selMuscles}/>}
        {preview && preview.exercises.length>0 && (
          <div style={{background:T.surface,borderRadius:12,padding:12,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:10,color:T.textSub,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{preview.exercises.length} exercícios gerados</div>
            {preview.exercises.slice(0,4).map((ex,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<3?`1px solid ${T.border}22`:"none"}}>
                <span style={{fontSize:11,color:T.text}}>{ex.name}</span>
                <span style={{fontSize:11,color:T.textDim}}>{ex.sets}×{ex.reps} · {ex.rest}s</span>
              </div>
            ))}
            {preview.exercises.length>4&&<div style={{fontSize:10,color:T.textDim,marginTop:4}}>+{preview.exercises.length-4} exercícios</div>}
            <button onClick={()=>{
              const name=selMuscles.join(" + ");
              const newPlan={id:Date.now(),name,muscles:selMuscles,exercises:preview.exercises};
              setWorkoutPlans(p=>[...p,newPlan]);
              setSelMuscles([]);
            }} style={{width:"100%",background:T.red,color:"#fff",border:"none",borderRadius:10,padding:"11px",fontSize:12,fontWeight:900,cursor:"pointer",marginTop:10,letterSpacing:2,fontFamily:"'Barlow Condensed',sans-serif"}}>
              SALVAR TREINO
            </button>
          </div>
        )}
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════ */
  /* EVOLUÇÃO SCREEN                                                         */
  /* ══════════════════════════════════════════════════════════════════════ */
  const EvolucaoScreen = () => {
    const [viewMode, setViewMode] = useState("muscle"); // muscle | exercise
    const [selMuscle, setSelMuscle] = useState("Peito");
    const [selExercise, setSelExercise] = useState(null);

    const lastWeekLogs = workoutLogs.filter(d=>{const diff=(Date.now()-new Date(d.date))/(1000*60*60*24);return diff<=7;});
    const prevWeekLogs = workoutLogs.filter(d=>{const diff=(Date.now()-new Date(d.date))/(1000*60*60*24);return diff>7&&diff<=14;});
    const calcVol = (logs)=>logs.flatMap(d=>d.exercises.flatMap(e=>e.sets.filter(s=>s.done).map(s=>s.kg*s.reps))).reduce((a,b)=>a+b,0);
    const thisVol=calcVol(lastWeekLogs), prevVol=calcVol(prevWeekLogs);
    const diff=(thisVol-prevVol).toFixed(0), pct=prevVol>0?Math.round((thisVol-prevVol)/prevVol*100):0;

    // Get exercise history for selected muscle
    const muscleExercises = Object.entries(exerciseHistory).filter(([,logs])=>logs[0]?.muscle===selMuscle);

    return (
      <div style={{padding:"0 18px 110px"}}>
        <div style={{paddingTop:20,marginBottom:20}}>
          <div style={{fontSize:30,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>Evolução</div>
        </div>

        {/* Week comparison */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
          {[
            ["Exercícios",lastWeekLogs.reduce((s,d)=>s+d.exercises.length,0),prevWeekLogs.reduce((s,d)=>s+d.exercises.length,0),T.blue],
            ["Dias",lastWeekLogs.length,prevWeekLogs.length,T.green],
            ["Peso Total",`${Math.round(thisVol/1000)}k`,`${Math.round(prevVol/1000)}k`,T.yellow],
          ].map(([l,curr,prev,c])=>{
            const up = typeof curr==="number"?curr>prev:parseInt(curr)>parseInt(prev||0);
            return(
              <div key={l} style={{...card,textAlign:"center",padding:"12px 8px"}}>
                <div style={{fontSize:18,fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{curr}</div>
                <div style={{fontSize:8,color:"#9A9AAA",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{l}</div>
                <div style={{fontSize:9,color:up?T.green:T.red,fontWeight:700}}>{up?"↑":"↓"} vs semana ant.</div>
              </div>
            );
          })}
        </div>

        {/* AI analysis — automatic */}
        <div style={{...card,marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{width:26,height:26,borderRadius:8,background:T.redDim,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Ic n="brain" s={13} c={T.red}/>
            </div>
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>Análise IA</span>
            {loadingAI && <div style={{marginLeft:"auto",fontSize:10,color:T.textSub}}>Analisando...</div>}
          </div>
          {aiInsights ? (
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {aiInsights.insights.slice(0,3).map((ins,i)=>(
                <div key={i} style={{display:"flex",gap:10,padding:"8px 10px",borderRadius:10,
                  background:ins.type==="success"?T.greenDim:ins.type==="warning"?T.redDim:T.yellowDim,
                  borderLeft:`2px solid ${ins.type==="success"?T.green:ins.type==="warning"?T.red:T.yellow}`}}>
                  <span style={{fontSize:9,fontWeight:800,color:ins.type==="success"?T.green:ins.type==="warning"?T.red:T.yellow,textTransform:"uppercase",letterSpacing:1,minWidth:36,paddingTop:1}}>{ins.muscle}</span>
                  <span style={{fontSize:11,color:T.textSub}}>{ins.text}</span>
                </div>
              ))}
              {aiInsights.suggestion && (
                <div style={{background:T.redDim,borderRadius:10,padding:"8px 10px",borderLeft:`2px solid ${T.red}`,marginTop:2}}>
                  <div style={{fontSize:8,color:T.red,fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginBottom:2}}>Sugestão de hoje</div>
                  <div style={{fontSize:12,color:T.text}}><b>{aiInsights.suggestion.exercise}:</b> {aiInsights.suggestion.text}</div>
                </div>
              )}
            </div>
          ) : !loadingAI && (
            <div style={{textAlign:"center",padding:"10px 0",color:T.textDim,fontSize:11}}>Carregando análise...</div>
          )}
        </div>

        {/* PRs per muscle group */}
        <div style={{marginBottom:14}}>
          <span style={lbl}>Records por Grupo Muscular</span>
          {MUSCLES.map(mu=>{
            const exsForMu = Object.entries(exerciseHistory).filter(([,logs])=>logs[0]?.muscle===mu);
            if(!exsForMu.length) return null;
            const best = exsForMu.reduce((b,[ex,logs])=>{
              const mk=Math.max(...logs.map(l=>l.kg));
              return mk>(b?Math.max(...b[1].map(l=>l.kg)):0)?[ex,logs]:b;
            },null);
            if(!best) return null;
            const [ex,logs]=best;
            const pr=Math.max(...logs.map(l=>l.kg));
            return(
              <div key={mu} style={{...card,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7,padding:"10px 13px"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:T.text}}>{ex}</div>
                  <div style={{fontSize:9,color:MCOL[mu],textTransform:"uppercase",letterSpacing:1}}>{mu}</div>
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{fontSize:18,fontWeight:900,color:T.yellow,fontFamily:"'Barlow Condensed',sans-serif"}}>{pr}kg</div>
                  <Spark data={logs} color={MCOL[mu]||T.red} w={46} h={20}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Muscle view */}
        <div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:14}}>
              {MUSCLES.map(m=>(
                <button key={m} onClick={()=>setSelMuscle(m)} style={pill(selMuscle===m,MCOL[m]||T.red)}>{m}</button>
              ))}
            </div>
            <div style={{...card,marginBottom:10}}>
              <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:4}}>{selMuscle}</div>
              <div style={{fontSize:10,color:T.textSub,marginBottom:12}}>{muscleExercises.length} exercícios registrados</div>
              {muscleExercises.length>0 ? (
                muscleExercises.map(([ex,logs])=>(
                  <div key={ex} style={{marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:700,color:T.text}}>{ex}</span>
                      <div style={{textAlign:"right"}}>
                        <span style={{fontSize:13,fontWeight:900,color:T.yellow,fontFamily:"'Barlow Condensed',sans-serif"}}>{Math.max(...logs.map(l=>l.kg))}kg</span>
                        {(()=>{
                          const last5avg=logs.slice(-5).reduce((s,l)=>s+l.kg,0)/Math.min(logs.length,5);
                          const prev5avg=logs.slice(-10,-5).length?logs.slice(-10,-5).reduce((s,l)=>s+l.kg,0)/logs.slice(-10,-5).length:null;
                          if(!prev5avg) return null;
                          const delta=+(last5avg-prev5avg).toFixed(1);
                          return <div style={{fontSize:10,color:delta>=0?T.green:T.red,fontWeight:700}}>{delta>=0?"+":""}{delta}kg ↕</div>;
                        })()}
                      </div>
                    </div>
                    <LineChart data={logs} color={MCOL[selMuscle]||T.red}/>
                  </div>
                ))
              ):(
                <div style={{textAlign:"center",padding:"16px",color:T.textDim,fontSize:11}}>Sem dados para este grupo muscular</div>
              )}
            </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════ */
  /* RANKING SCREEN                                                          */
  /* ══════════════════════════════════════════════════════════════════════ */
  const RankingScreen = () => {
    const medals = ["🥇","🥈","🥉"];
    const [openGroups, setOpenGroups] = useState(()=>Object.fromEntries(MUSCLES.map(m=>[m,true])));

    // Collect every exercise done by at least one profile, grouped by muscle
    const byMuscle = {};
    MUSCLES.forEach(m => { byMuscle[m] = {}; });

    profiles.forEach(p => {
      const hist = profileData[p.id]?.exerciseHistory || {};
      Object.entries(hist).forEach(([ex, logs]) => {
        if (!logs?.length) return;
        const maxKg = Math.max(...logs.map(l=>l.kg).filter(k=>k>0));
        if (!isFinite(maxKg)) return;
        const muscle = logs[0]?.muscle || "";
        if (!byMuscle[muscle]) byMuscle[muscle] = {};
        if (!byMuscle[muscle][ex]) byMuscle[muscle][ex] = [];
        byMuscle[muscle][ex].push({ profile: p, kg: maxKg });
      });
    });

    // Only keep muscle groups that have at least one exercise done
    const activeGroups = MUSCLES.filter(m => Object.keys(byMuscle[m]||{}).length > 0);
    const hasAny = activeGroups.length > 0;

    const toggleGroup = (m) => setOpenGroups(prev=>({...prev,[m]:!prev[m]}));

    return(
      <div style={{padding:"0 18px 110px"}}>
        <div style={{paddingTop:20,marginBottom:20}}>
          <div style={{fontSize:30,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>Ranking</div>
          <div style={{fontSize:11,color:T.textSub}}>Por grupo muscular · atletas que realizaram</div>
        </div>

        {!hasAny && (
          <div style={{...card,textAlign:"center",padding:"32px 16px"}}>
            <div style={{fontSize:32,marginBottom:12}}>🏆</div>
            <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:6}}>Nenhum treino registrado ainda</div>
            <div style={{fontSize:11,color:T.textSub}}>Realize treinos na aba Treino para aparecer aqui</div>
          </div>
        )}

        {activeGroups.map(muscle => {
          const color = MCOL[muscle] || T.red;
          const exercises = byMuscle[muscle];
          const isOpen = openGroups[muscle];
          return (
            <div key={muscle} style={{marginBottom:10}}>
              {/* Muscle group header — collapsible */}
              <button onClick={()=>toggleGroup(muscle)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:12,background:"transparent",border:"none",cursor:"pointer",padding:"10px 0",textAlign:"left"}}>
                <div style={{width:3,height:20,borderRadius:2,background:color,flexShrink:0}}/>
                <div style={{flex:1,fontSize:16,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{muscle}</div>
                <div style={{fontSize:11,color:T.textSub,marginRight:4}}>{Object.keys(exercises).length} exercício{Object.keys(exercises).length!==1?"s":""}</div>
                <div style={{color:T.textSub,fontSize:12,transition:"transform .2s",transform:isOpen?"rotate(180deg)":"rotate(0deg)"}}>▾</div>
              </button>

              {/* Exercises inside this group */}
              {isOpen && (
                <div style={{display:"flex",flexDirection:"column",gap:8,paddingLeft:0}}>
                  {Object.entries(exercises).sort((a,b)=>a[0].localeCompare(b[0])).map(([ex, entries]) => {
                    const sorted = [...entries].sort((a,b)=>b.kg-a.kg);
                    return (
                      <div key={ex} style={{...card,padding:"12px 14px",borderLeft:`3px solid ${color}33`}}>
                        <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8}}>{ex}</div>
                        {sorted.map((entry, i) => (
                          <div key={entry.profile.id} style={{display:"flex",alignItems:"center",gap:9,padding:"5px 0",borderBottom:i<sorted.length-1?`1px solid ${T.border}22`:"none"}}>
                            <div style={{fontSize:14,width:22,textAlign:"center"}}>
                              {i<3 ? medals[i] : <span style={{fontSize:11,fontWeight:700,color:T.textSub}}>{i+1}</span>}
                            </div>
                            <Avatar name={entry.profile.name} color={entry.profile.color} size={26}/>
                            <div style={{flex:1,fontSize:12,fontWeight:700,color:T.text}}>{entry.profile.name}</div>
                            <div style={{fontSize:17,fontWeight:900,color:i===0?T.yellow:T.textSub,fontFamily:"'Barlow Condensed',sans-serif"}}>{entry.kg.toFixed(1)} kg</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

    /* ══════════════════════════════════════════════════════════════════════ */
  /* PERFIL SCREEN                                                           */
  /* ══════════════════════════════════════════════════════════════════════ */
  const PerfilScreen = () => {
    const [expandedProfile, setExpandedProfile] = useState(activeProfile);
    const [newWeight, setNewWeight] = useState("");
    const [newDate, setNewDate] = useState(new Date().toISOString().slice(0,10));
    const [showAddWeight, setShowAddWeight] = useState(null); // profile id or null

    const addWeight = (profileId) => {
      if(!newWeight) return;
      setProfiles(ps=>ps.map(p=>p.id===profileId?{...p,weight:[...(p.weight||[]),{date:newDate,kg:+newWeight}].sort((a,b)=>a.date.localeCompare(b.date))}:p));
      setNewWeight(""); setShowAddWeight(null);
    };

    return(
      <div style={{padding:"0 18px 110px"}}>
        <div style={{paddingTop:20,marginBottom:20}}>
          <div style={{fontSize:30,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>Perfil</div>
        </div>

        {profiles.map(p=>{
          const weightData=(p.weight||[]).map(w=>({date:w.date,kg:w.kg}));
          const isExpanded=expandedProfile===p.id;
          const isActive=activeProfile===p.id;
          const lastKg=weightData.length>0?weightData[weightData.length-1].kg:null;
          return(
            <div key={p.id} style={{...card,marginBottom:12,border:`1.5px solid ${isActive?p.color:T.border}`,background:isActive?p.color+"08":T.card}}>
              {/* Name row — clickable to expand weight chart */}
              <div style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer"}}
                onClick={()=>{setExpandedProfile(isExpanded?null:p.id);setActiveProfile(p.id);setAiInsights(null);}}>
                <Avatar name={p.name} color={p.color} size={48}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:18,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:0.5}}>{p.name}</div>
                  {lastKg && <div style={{fontSize:11,color:T.yellow,fontWeight:700,marginTop:2}}>{lastKg} kg atual</div>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {isActive&&<div style={{background:p.color,borderRadius:6,padding:"2px 8px",fontSize:8,color:"#fff",fontWeight:800,letterSpacing:1}}>ATIVO</div>}
                  <div style={{color:T.textSub,fontSize:14,transition:"transform .2s",transform:isExpanded?"rotate(180deg)":"rotate(0deg)"}}>▾</div>
                </div>
              </div>

              {/* Expanded: weight evolution */}
              {isExpanded && (
                <div style={{marginTop:16,borderTop:`1px solid ${T.border}`,paddingTop:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <span style={{fontSize:12,fontWeight:700,color:T.text}}>Evolução do Peso Corporal</span>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={e=>{e.stopPropagation();setShowAddWeight(showAddWeight===p.id?null:p.id);}}
                        style={{background:T.red,color:"#fff",border:"none",borderRadius:8,padding:"4px 10px",fontSize:10,fontWeight:800,cursor:"pointer",letterSpacing:1}}>
                        + REGISTRAR
                      </button>
                      {profiles.length>1&&<button onClick={e=>{e.stopPropagation();setModal({type:"confirm-delete",profileId:p.id,profileName:p.name});}}
                        style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,padding:"4px 9px",color:T.textSub,fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                        <Ic n="trash" s={12} c={T.textSub}/> Excluir
                      </button>}
                    </div>
                  </div>

                  {showAddWeight===p.id && (
                    <div style={{background:T.surface,borderRadius:12,padding:12,marginBottom:12,border:`1px solid ${T.border}`}} onClick={e=>e.stopPropagation()}>
                      <div style={{display:"flex",gap:8,marginBottom:8}}>
                        <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)}
                          style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:"9px",color:T.text,fontSize:12,outline:"none"}}/>
                        <input type="number" placeholder="kg" value={newWeight} onChange={e=>setNewWeight(e.target.value)}
                          style={{width:70,background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:"9px",color:T.text,fontSize:12,textAlign:"center",outline:"none"}}/>
                      </div>
                      <button onClick={e=>{e.stopPropagation();addWeight(p.id);}}
                        style={{width:"100%",background:T.red,color:"#fff",border:"none",borderRadius:9,padding:"10px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                        Salvar
                      </button>
                    </div>
                  )}

                  {weightData.length>=2 ? (
                    <LineChart data={weightData} color={p.color}/>
                  ):(
                    <div style={{textAlign:"center",padding:"12px 0",color:T.textDim,fontSize:11}}>
                      {weightData.length===1?"Registre mais uma medição para ver o gráfico":"Nenhum registro de peso ainda"}
                    </div>
                  )}

                  {weightData.length>0 && (
                    <div style={{marginTop:12}}>
                      {weightData.slice().reverse().slice(0,6).map((w,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<Math.min(weightData.length-1,5)?`1px solid ${T.border}22`:"none"}}>
                          <span style={{fontSize:11,color:T.textSub}}>{w.date}</span>
                          <span style={{fontSize:13,fontWeight:700,color:T.text}}>{w.kg} kg</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button onClick={()=>setModal("new-profile")} style={{width:"100%",background:"transparent",border:`1.5px dashed ${T.border}`,borderRadius:14,padding:"13px",color:T.textSub,fontSize:11,cursor:"pointer",marginTop:4}}>
          + Adicionar Perfil
        </button>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════ */
  /* MODALS                                                                  */
  /* ══════════════════════════════════════════════════════════════════════ */
  const ModalOverlay = ({children, onClose}) => (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:T.surface,borderRadius:"20px 20px 0 0",padding:"20px 18px 40px",maxHeight:"85vh",overflowY:"auto",border:`1px solid ${T.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div/>
          <button onClick={onClose} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 10px",color:T.textSub,cursor:"pointer"}}><Ic n="x" s={14} c={T.textSub}/></button>
        </div>
        {children}
      </div>
    </div>
  );

  /* Start workout modal */
  const StartWorkoutModal = () => (
    <ModalOverlay onClose={()=>setModal(null)}>
      <div style={{fontSize:20,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,marginBottom:4}}>Iniciar Treino</div>
      <div style={{fontSize:11,color:T.textSub,marginBottom:16}}>Selecione um treino salvo ou inicie livremente</div>

      {/* Free workout option */}
      <button onClick={()=>setModal("free-workout")}
        style={{width:"100%",background:T.redDim,border:`1.5px solid ${T.red}`,borderRadius:14,padding:"14px 16px",marginBottom:14,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:14,fontWeight:900,color:T.red,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,marginBottom:2}}>TREINO LIVRE</div>
          <div style={{fontSize:11,color:T.textSub}}>Escolha músculos e exercícios na hora</div>
        </div>
        <Ic n="plus" s={18} c={T.red}/>
      </button>

      <div style={{fontSize:9,color:T.textSub,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Treinos Salvos</div>
      {workoutPlans.map(plan=>(
        <button key={plan.id} onClick={()=>setModal({type:"active-workout",plan})}
          style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 16px",marginBottom:10,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:3}}>{plan.name}</div>
            <div style={{display:"flex",gap:5}}>
              {plan.muscles.map(m=><span key={m} style={{fontSize:8,color:MCOL[m],border:`1px solid ${MCOL[m]}44`,borderRadius:20,padding:"1px 6px",textTransform:"uppercase",letterSpacing:1}}>{m}</span>)}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:10,color:T.textSub}}>{plan.exercises.length} exerc.</span>
            <Ic n="arrow" s={14} c={T.red}/>
          </div>
        </button>
      ))}
    </ModalOverlay>
  );

  /* Free workout modal */
  const FreeWorkoutModal = () => {
    const [selMuscles, setSelMuscles] = useState([]);
    const [entries, setEntries] = useState([]); // {muscle, exercise, sets:[{kg,reps,done}], rest:90}
    const [timerSecs, setTimerSecs] = useState(null);

    const addExercise = (muscle, exName) => {
      if(entries.find(e=>e.exercise===exName&&e.muscle===muscle)) return;
      setEntries(prev=>[...prev, {muscle, exercise:exName, sets:[{kg:"",reps:12,done:false}], rest:90}]);
    };

    const toggleSet = (exIdx, si) => {
      setEntries(prev=>{
        const n=[...prev]; n[exIdx]={...n[exIdx],sets:[...n[exIdx].sets]};
        n[exIdx].sets[si]={...n[exIdx].sets[si],done:!n[exIdx].sets[si].done};
        if(!n[exIdx].sets[si].done) setTimerSecs(n[exIdx].rest);
        return n;
      });
    };

    const finish = () => {
      if(!entries.length){setModal(null);return;}
      const log={
        date:new Date().toISOString().slice(0,10),
        muscles:[...new Set(entries.map(e=>e.muscle))],
        exercises:entries.map(e=>({...e})),
        skipped:false,
      };
      setWorkoutLogs(prev=>[...prev,log]);
      entries.forEach(ex=>{
        const done=ex.sets.filter(s=>s.done&&s.kg);
        if(!done.length) return;
        const entry={date:log.date,kg:Math.max(...done.map(s=>+s.kg)),reps:+done[0].reps,sets:done.length,muscle:ex.muscle};
        setExerciseHistory(h=>({...h,[ex.exercise]:[...(h[ex.exercise]||[]),entry]}));
      });
      setModal(null);
    };

    return(
      <ModalOverlay onClose={()=>setModal(null)}>
        {timerSecs!==null&&<Timer secs={timerSecs} onClose={()=>setTimerSecs(null)}/>}
        <div style={{fontSize:20,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,marginBottom:14}}>Treino Livre</div>

        {/* Muscle selector */}
        <div style={{fontSize:9,color:T.textSub,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Grupo Muscular</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
          {MUSCLES.map(m=>{const sel=selMuscles.includes(m);return(
            <button key={m} onClick={()=>setSelMuscles(p=>sel?p.filter(x=>x!==m):[...p,m])}
              style={{background:sel?MCOL[m]+"18":"transparent",border:`1.5px solid ${sel?MCOL[m]:T.border}`,borderRadius:20,padding:"5px 12px",color:sel?MCOL[m]:T.textSub,fontSize:11,fontWeight:sel?700:400,cursor:"pointer"}}>
              {m}
            </button>
          );})}
        </div>

        {/* Exercise picker per selected muscle */}
        {selMuscles.map(m=>(
          <div key={m} style={{marginBottom:12}}>
            <div style={{fontSize:9,color:MCOL[m],letterSpacing:2,textTransform:"uppercase",marginBottom:7,fontWeight:700}}>{m}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {getExercisesForMuscle(m).map(ex=>{
                const added=entries.find(e=>e.exercise===ex.name);
                return(
                  <button key={ex.name} onClick={()=>added?null:addExercise(m,ex.name)}
                    style={{background:added?MCOL[m]+"22":"transparent",border:`1px solid ${added?MCOL[m]:T.border}`,borderRadius:16,padding:"5px 11px",color:added?MCOL[m]:T.textSub,fontSize:11,cursor:added?"default":"pointer",opacity:added?1:0.85}}>
                    {ex.name}{added?" ✓":""}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Active exercises */}
        {entries.length>0&&(
          <div style={{marginTop:8}}>
            <div style={{fontSize:9,color:T.textSub,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Exercícios adicionados</div>
            {entries.map((ex,exIdx)=>{
              const lastPerf=(exerciseHistory[ex.exercise]||[]).slice(-1)[0];
              return(
                <div key={exIdx} style={{background:T.card,borderRadius:12,padding:"11px 13px",marginBottom:10,border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:T.text}}>{ex.exercise}</div>
                      <div style={{fontSize:9,color:MCOL[ex.muscle]||T.textSub,textTransform:"uppercase"}}>{ex.muscle}</div>
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      {lastPerf&&<div style={{fontSize:10,color:T.textSub}}>Último: {lastPerf.kg}kg</div>}
                      <button onClick={()=>setEntries(p=>p.map((e,i)=>i===exIdx?{...e,sets:[...e.sets,{kg:"",reps:12,done:false}]}:e))}
                        style={{background:T.border,border:"none",borderRadius:7,padding:"3px 8px",color:T.textSub,fontSize:10,cursor:"pointer"}}>+s</button>
                    </div>
                  </div>
                  {ex.sets.map((set,si)=>(
                    <div key={si} style={{display:"grid",gridTemplateColumns:"18px 1fr 1fr 34px",gap:7,marginBottom:6,alignItems:"center"}}>
                      <div style={{fontSize:10,color:set.done?T.green:T.textDim,textAlign:"center",fontWeight:700}}>{si+1}</div>
                      <input type="number" placeholder={lastPerf?.kg||"kg"} value={set.kg}
                        onChange={e=>{setEntries(p=>{const n=[...p];n[exIdx]={...n[exIdx],sets:[...n[exIdx].sets]};n[exIdx].sets[si]={...n[exIdx].sets[si],kg:e.target.value};return n;});}}
                        style={{background:T.surface,border:`1px solid ${T.borderHi}`,borderRadius:9,padding:"9px 0",color:T.text,fontSize:14,fontWeight:700,textAlign:"center",outline:"none",width:"100%"}}/>
                      <input type="number" value={set.reps}
                        onChange={e=>{setEntries(p=>{const n=[...p];n[exIdx]={...n[exIdx],sets:[...n[exIdx].sets]};n[exIdx].sets[si]={...n[exIdx].sets[si],reps:e.target.value};return n;});}}
                        style={{background:T.surface,border:`1px solid ${T.borderHi}`,borderRadius:9,padding:"9px 0",color:T.text,fontSize:14,fontWeight:700,textAlign:"center",outline:"none",width:"100%"}}/>
                      <button onClick={()=>toggleSet(exIdx,si)} style={{background:set.done?T.green:T.border,border:"none",borderRadius:9,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                        <Ic n="check" s={13} c={set.done?"#fff":T.textDim}/>
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
            <button onClick={finish} style={{width:"100%",background:T.red,border:"none",borderRadius:13,padding:"14px",color:"#fff",fontSize:14,fontWeight:900,cursor:"pointer",marginTop:4,letterSpacing:2,fontFamily:"'Barlow Condensed',sans-serif"}}>
              FINALIZAR TREINO
            </button>
          </div>
        )}
      </ModalOverlay>
    );
  };

  /* Active workout modal */
  const ActiveWorkoutModal = ({plan}) => {
    const [sets, setSets] = useState(
      plan.exercises.map(ex=>({...ex, sets: Array(ex.sets).fill(null).map(()=>({kg:"",reps:ex.reps,done:false}))}))
    );
    const [timerSecs, setTimerSecs] = useState(null);

    const toggleSet = (exIdx, setIdx) => {
      setSets(prev=>{const n=[...prev]; n[exIdx]={...n[exIdx],sets:[...n[exIdx].sets]};n[exIdx].sets[setIdx]={...n[exIdx].sets[setIdx],done:!n[exIdx].sets[setIdx].done};
        if(!n[exIdx].sets[setIdx].done) setTimerSecs(n[exIdx].rest);
        return n;
      });
    };

    const finishWorkout = () => {
      const log = {
        date:new Date().toISOString().slice(0,10),
        muscles:[...new Set(plan.exercises.map(e=>e.muscle))].filter(Boolean),
        exercises:sets.map(ex=>({...ex})),
        skipped:sets.some(ex=>ex.sets.some(s=>!s.done)),
      };
      setWorkoutLogs(prev=>[...prev,log]);
      // update exercise history
      sets.forEach(ex=>{
        const doneSets=ex.sets.filter(s=>s.done&&s.kg);
        if(!doneSets.length) return;
        const entry={date:log.date,kg:Math.max(...doneSets.map(s=>+s.kg)),reps:+doneSets[0].reps,sets:doneSets.length,muscle:ex.muscle||plan.muscles[0]};
        setExerciseHistory(h=>({...h,[ex.name]:[...(h[ex.name]||[]),entry]}));
      });
      setModal(null);
    };

    const doneCount=sets.flatMap(e=>e.sets).filter(s=>s.done).length;
    const totalCount=sets.flatMap(e=>e.sets).length;

    return(
      <ModalOverlay onClose={()=>setModal(null)}>
        {timerSecs!==null && <Timer secs={timerSecs} onClose={()=>setTimerSecs(null)}/>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <div style={{fontSize:20,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>{plan.name}</div>
            <div style={{fontSize:10,color:T.textSub}}>{doneCount}/{totalCount} séries concluídas</div>
          </div>
          <div style={{background:T.redDim,borderRadius:10,padding:"4px 10px",fontSize:11,color:T.red,fontWeight:700}}>{Math.round(doneCount/totalCount*100)||0}%</div>
        </div>
        {/* Progress bar */}
        <div style={{height:3,background:T.border,borderRadius:2,marginBottom:16}}>
          <div style={{height:"100%",width:`${(doneCount/totalCount)*100}%`,background:T.red,borderRadius:2,transition:"width .3s"}}/>
        </div>

        {sets.map((ex,exIdx)=>{
          const lastPerf=(exerciseHistory[ex.name]||[]).slice(-1)[0];
          return(
            <div key={exIdx} style={{...{background:T.card,borderRadius:14,padding:"12px 14px",border:`1px solid ${T.border}`},marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text}}>{ex.name}</div>
                {lastPerf&&<div style={{fontSize:10,color:T.textSub}}>Último: {lastPerf.kg}kg × {lastPerf.reps}</div>}
              </div>
              {ex.sets.map((set,si)=>(
                <div key={si} style={{display:"grid",gridTemplateColumns:"20px 1fr 1fr 36px",gap:8,marginBottom:6,alignItems:"center"}}>
                  <div style={{fontSize:10,color:set.done?T.green:T.textDim,textAlign:"center",fontWeight:700}}>{si+1}</div>
                  <input type="number" placeholder={lastPerf?.kg||"kg"} value={set.kg}
                    onChange={e=>{setSets(prev=>{const n=[...prev];n[exIdx]={...n[exIdx],sets:[...n[exIdx].sets]};n[exIdx].sets[si]={...n[exIdx].sets[si],kg:e.target.value};return n;});}}
                    style={{background:T.surface,border:`1px solid ${T.borderHi}`,borderRadius:9,padding:"10px 0",color:T.text,fontSize:15,fontWeight:700,textAlign:"center",outline:"none",width:"100%"}}/>
                  <input type="number" value={set.reps}
                    onChange={e=>{setSets(prev=>{const n=[...prev];n[exIdx]={...n[exIdx],sets:[...n[exIdx].sets]};n[exIdx].sets[si]={...n[exIdx].sets[si],reps:e.target.value};return n;});}}
                    style={{background:T.surface,border:`1px solid ${T.borderHi}`,borderRadius:9,padding:"10px 0",color:T.text,fontSize:15,fontWeight:700,textAlign:"center",outline:"none",width:"100%"}}/>
                  <button onClick={()=>toggleSet(exIdx,si)} style={{background:set.done?T.green:T.border,border:"none",borderRadius:9,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                    <Ic n="check" s={13} c={set.done?"#fff":T.textDim}/>
                  </button>
                </div>
              ))}
            </div>
          );
        })}

        <button onClick={finishWorkout} style={{width:"100%",background:T.red,border:"none",borderRadius:14,padding:"15px",color:"#fff",fontSize:14,fontWeight:900,cursor:"pointer",marginTop:8,letterSpacing:2,fontFamily:"'Barlow Condensed',sans-serif"}}>
          FINALIZAR TREINO
        </button>
      </ModalOverlay>
    );
  };

  /* Log detail modal */
  const LogDetailModal = ({log}) => {
    const totalVol = log.exercises.flatMap(e=>e.sets.filter(s=>s.done).map(s=>(+s.kg||0)*(+s.reps||0))).reduce((a,b)=>a+b,0);
    return(
      <ModalOverlay onClose={()=>setModal(null)}>
        <div style={{fontSize:20,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,marginBottom:2}}>{log.muscles.length>0?log.muscles.join(" + "):"Treino"}</div>
        <div style={{fontSize:11,color:T.textSub,marginBottom:4}}>{log.date} · {log.exercises.length} exercícios</div>
        {totalVol>0&&<div style={{fontSize:12,color:T.yellow,fontWeight:700,marginBottom:14}}>Volume total: {Math.round(totalVol).toLocaleString()} kg</div>}
        {log.exercises.map((ex,i)=>{
          const doneS=ex.sets.filter(s=>s.done&&s.kg);
          const maxKg=doneS.length?Math.max(...doneS.map(s=>+s.kg)):0;
          return(
            <div key={i} style={{background:T.card,borderRadius:12,padding:"11px 13px",marginBottom:8,border:`1px solid ${T.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text}}>{ex.name}</div>
                {maxKg>0&&<div style={{fontSize:11,color:T.yellow,fontWeight:700}}>{maxKg}kg max</div>}
              </div>
              {ex.sets.filter(s=>s.done).map((set,si)=>(
                <div key={si} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:si<ex.sets.filter(s=>s.done).length-1?`1px solid ${T.border}22`:"none"}}>
                  <span style={{fontSize:10,color:T.textSub}}>Série {si+1}</span>
                  <span style={{fontSize:12,fontWeight:700,color:T.text}}>{set.kg||"—"}kg × {set.reps} reps</span>
                </div>
              ))}
            </div>
          );
        })}
      </ModalOverlay>
    );
  };

  /* Profile switch modal */
  const ProfileSwitchModal = () => (
    <ModalOverlay onClose={()=>setModal(null)}>
      <div style={{fontSize:20,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,marginBottom:16}}>Trocar Atleta</div>
      {profiles.map(p=>(
        <button key={p.id} onClick={()=>{setActiveProfile(p.id);setAiInsights(null);setModal(null);}}
          style={{width:"100%",background:activeProfile===p.id?p.color+"18":T.card,border:`1.5px solid ${activeProfile===p.id?p.color:T.border}`,borderRadius:14,padding:"14px 16px",marginBottom:10,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
          <Avatar name={p.name} color={p.color} size={44}/>
          <div style={{flex:1,textAlign:"left"}}>
            <div style={{fontSize:16,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif"}}>{p.name}</div>
          </div>
          {activeProfile===p.id&&<div style={{background:p.color,borderRadius:6,padding:"2px 8px",fontSize:8,color:"#fff",fontWeight:800}}>ATIVO</div>}
        </button>
      ))}
    </ModalOverlay>
  );

  /* New plan modal */
  const NewPlanModal = () => {
    const [name, setName] = useState("");
    const [planExs, setPlanExs] = useState([{muscle:"",exercise:"",sets:3,reps:12,rest:90}]);
    // per-exercise-slot: track whether we are creating a new custom exercise
    const [newExName, setNewExName] = useState({}); // {slotIndex: ""}
    const [showNewEx, setShowNewEx] = useState({}); // {slotIndex: bool}

    const addSlot = () => setPlanExs(p=>[...p,{muscle:"",exercise:"",sets:3,reps:12,rest:90}]);

    const saveCustomEx = (slotIdx) => {
      const n = newExName[slotIdx]?.trim();
      const muscle = planExs[slotIdx].muscle;
      if(!n || !muscle) return;
      // persist to global customExercises
      setCustomExercises(prev=>({
        ...prev,
        [muscle]: [...(prev[muscle]||[]), n]
      }));
      // auto-select it in this slot
      setPlanExs(p=>{ const arr=[...p]; arr[slotIdx]={...arr[slotIdx],exercise:n}; return arr; });
      setNewExName(prev=>({...prev,[slotIdx]:""}));
      setShowNewEx(prev=>({...prev,[slotIdx]:false}));
    };

    const save = () => {
      if(!name.trim()) return;
      const exs = planExs.filter(e=>e.exercise).map(e=>({name:e.exercise,sets:e.sets,reps:e.reps,rest:e.rest,muscle:e.muscle}));
      if(!exs.length) return;
      setWorkoutPlans(p=>[...p,{id:Date.now(),name,muscles:[...new Set(exs.map(e=>e.muscle).filter(Boolean))],exercises:exs}]);
      setModal(null);
    };

    return(
      <ModalOverlay onClose={()=>setModal(null)}>
        <div style={{fontSize:20,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,marginBottom:16}}>Novo Treino Personalizado</div>
        <input placeholder="Nome do treino" value={name} onChange={e=>setName(e.target.value)}
          style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 13px",color:T.text,fontSize:13,outline:"none",marginBottom:14,boxSizing:"border-box"}}/>

        {planExs.map((ex,i)=>(
          <div key={i} style={{background:T.card,borderRadius:12,padding:"12px",marginBottom:10,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:9,color:T.textSub,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Exercício {i+1}</div>

            {/* Muscle selector */}
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
              {MUSCLES.map(m=>(
                <button key={m} onClick={()=>{const n=[...planExs];n[i]={...n[i],muscle:m,exercise:""};setPlanExs(n);}}
                  style={{background:ex.muscle===m?MCOL[m]+"22":"transparent",border:`1px solid ${ex.muscle===m?MCOL[m]:T.border}`,borderRadius:14,padding:"4px 10px",color:ex.muscle===m?MCOL[m]:T.textSub,fontSize:10,cursor:"pointer"}}>
                  {m}
                </button>
              ))}
            </div>

            {/* Exercise picker — includes DB + custom exercises */}
            {ex.muscle && (
              <>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                  {getExercisesForMuscle(ex.muscle).map(e=>(
                    <button key={e.name} onClick={()=>{const n=[...planExs];n[i]={...n[i],exercise:e.name,sets:e.sets||3,reps:e.reps||12,rest:e.rest||90};setPlanExs(n);}}
                      style={{background:ex.exercise===e.name?T.red+"22":"transparent",border:`1px solid ${ex.exercise===e.name?T.red:T.border}`,borderRadius:14,padding:"4px 10px",color:ex.exercise===e.name?T.red:T.textSub,fontSize:10,cursor:"pointer"}}>
                      {e.name}
                    </button>
                  ))}
                </div>

                {/* Create new custom exercise inline */}
                {!showNewEx[i] ? (
                  <button onClick={()=>setShowNewEx(prev=>({...prev,[i]:true}))}
                    style={{background:"transparent",border:`1px dashed ${T.borderHi}`,borderRadius:10,padding:"5px 10px",color:T.textSub,fontSize:10,cursor:"pointer",marginBottom:8}}>
                    + Criar exercício personalizado
                  </button>
                ) : (
                  <div style={{display:"flex",gap:6,marginBottom:8,alignItems:"center"}}>
                    <input placeholder="Nome do novo exercício" value={newExName[i]||""} 
                      onChange={e=>setNewExName(prev=>({...prev,[i]:e.target.value}))}
                      onKeyDown={e=>e.key==="Enter"&&saveCustomEx(i)}
                      style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:9,padding:"7px 10px",color:T.text,fontSize:11,outline:"none"}}/>
                    <button onClick={()=>saveCustomEx(i)} style={{background:T.red,color:"#fff",border:"none",borderRadius:8,padding:"7px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>OK</button>
                    <button onClick={()=>setShowNewEx(prev=>({...prev,[i]:false}))} style={{background:T.border,color:T.textSub,border:"none",borderRadius:8,padding:"7px 10px",fontSize:11,cursor:"pointer"}}>✕</button>
                  </div>
                )}
              </>
            )}

            {/* Sets / Reps / Rest */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[["Séries","sets"],["Reps","reps"],["Descanso","rest"]].map(([lbl,key])=>(
                <div key={key}>
                  <div style={{fontSize:8,color:"#9A9AAA",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{lbl}</div>
                  <input type="number" value={ex[key]} onChange={e=>{const n=[...planExs];n[i]={...n[i],[key]:+e.target.value};setPlanExs(n);}}
                    style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 0",color:T.text,fontSize:13,fontWeight:700,textAlign:"center",outline:"none"}}/>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button onClick={addSlot} style={{width:"100%",background:"transparent",border:`1px dashed ${T.border}`,borderRadius:10,padding:"11px",color:T.textSub,fontSize:11,cursor:"pointer",marginBottom:14}}>+ Adicionar Exercício</button>
        <button onClick={save} style={{width:"100%",background:T.red,color:"#fff",border:"none",borderRadius:13,padding:"14px",fontSize:14,fontWeight:900,cursor:"pointer",letterSpacing:2,fontFamily:"'Barlow Condensed',sans-serif"}}>SALVAR TREINO</button>
      </ModalOverlay>
    );
  };

  /* Plan edit modal */
  const PlanEditModal = ({plan}) => {
    const [exs,setExs]=useState(plan.exercises.map(e=>({...e})));
    const save=()=>{setWorkoutPlans(ps=>ps.map(p=>p.id===plan.id?{...p,exercises:exs}:p));setModal(null);};
    return(
      <ModalOverlay onClose={()=>setModal(null)}>
        <div style={{fontSize:20,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,marginBottom:16}}>Editar: {plan.name}</div>
        {exs.map((ex,i)=>(
          <div key={i} style={{background:T.card,borderRadius:12,padding:"11px 12px",marginBottom:8,border:`1px solid ${T.border}`}}>
            <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:8}}>{ex.name}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[["Séries","sets"],["Reps","reps"],["Descanso","rest"]].map(([lbl,key])=>(
                <div key={key}>
                  <div style={{fontSize:8,color:T.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{lbl}</div>
                  <input type="number" value={ex[key]} onChange={e=>{const n=[...exs];n[i]={...n[i],[key]:+e.target.value};setExs(n);}}
                    style={{width:"100%",background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 0",color:T.text,fontSize:13,fontWeight:700,textAlign:"center",outline:"none"}}/>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={save} style={{width:"100%",background:T.red,color:"#fff",border:"none",borderRadius:13,padding:"14px",fontSize:14,fontWeight:900,cursor:"pointer",letterSpacing:2,fontFamily:"'Barlow Condensed',sans-serif",marginTop:4}}>SALVAR</button>
      </ModalOverlay>
    );
  };

  /* New profile modal */
  const NewProfileModal = () => {
    const [n,setN]=useState("");
    const colors=[T.red,"#4A9EFF",T.green,T.yellow,"#B06EFF","#FF6B6B"];
    return(
      <ModalOverlay onClose={()=>setModal(null)}>
        <div style={{fontSize:20,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,marginBottom:16}}>Novo Perfil</div>
        <input placeholder="Nome do atleta" value={n} onChange={e=>setN(e.target.value)}
          style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 13px",color:T.text,fontSize:13,outline:"none",marginBottom:10,boxSizing:"border-box"}}/>
        <button onClick={()=>{if(!n.trim())return;const newId=Date.now();setProfiles(p=>[...p,{id:newId,name:n,color:colors[p.length%colors.length],weight:[]}]);setProfileData(pd=>({...pd,[newId]:{workoutLogs:[],exerciseHistory:{}}}));setModal(null);}}
          style={{width:"100%",background:T.red,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:13,fontWeight:800,cursor:"pointer"}}>
          Criar Perfil
        </button>
      </ModalOverlay>
    );
  };

  /* Confirm Delete Profile Modal */
  const ConfirmDeleteModal = ({profileId, profileName}) => {
    const doDelete = () => {
      // Remove profile
      const remaining = profiles.filter(p=>p.id!==profileId);
      setProfiles(remaining);
      // Remove profile data
      setProfileData(pd=>{ const n={...pd}; delete n[profileId]; return n; });
      // If deleted profile was active, switch to first remaining
      if(activeProfile===profileId && remaining.length>0){
        setActiveProfile(remaining[0].id);
        setAiInsights(null);
      }
      setModal(null);
    };
    return(
      <ModalOverlay onClose={()=>setModal(null)}>
        <div style={{textAlign:"center",padding:"8px 0 4px"}}>
          <div style={{fontSize:36,marginBottom:14}}>⚠️</div>
          <div style={{fontSize:18,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,marginBottom:8}}>
            Excluir perfil?
          </div>
          <div style={{fontSize:13,color:T.textSub,marginBottom:6}}>
            Você está prestes a excluir o perfil de
          </div>
          <div style={{fontSize:16,fontWeight:900,color:T.red,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:12}}>
            {profileName}
          </div>
          <div style={{background:T.redDim,borderRadius:10,padding:"10px 14px",marginBottom:20,border:`1px solid ${T.red}33`}}>
            <div style={{fontSize:11,color:T.red,fontWeight:700}}>
              Esta ação não poderá ser revertida.
            </div>
            <div style={{fontSize:11,color:T.textSub,marginTop:3}}>
              Todo o histórico de treinos, evolução, peso corporal e rankings deste perfil serão apagados permanentemente.
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setModal(null)}
              style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"13px",fontSize:13,fontWeight:700,color:T.text,cursor:"pointer"}}>
              Cancelar
            </button>
            <button onClick={doDelete}
              style={{flex:1,background:T.red,border:"none",borderRadius:12,padding:"13px",fontSize:13,fontWeight:900,color:"#fff",cursor:"pointer",letterSpacing:1,fontFamily:"'Barlow Condensed',sans-serif"}}>
              EXCLUIR
            </button>
          </div>
        </div>
      </ModalOverlay>
    );
  };

  /* ── NAV ──────────────────────────────────────────────────────────────── */
  const TABS=[{id:"home",icon:"home",label:"HOME"},{id:"treino",icon:"dumbbell",label:"TREINO"},{id:"evolution",icon:"chart",label:"EVOLUÇÃO"},{id:"ranking",icon:"trophy",label:"RANKING"},{id:"perfil",icon:"person",label:"PERFIL"}];

  return(
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:"'Barlow',system-ui,sans-serif",color:T.text,maxWidth:430,margin:"0 auto",position:"relative"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600;700&display=swap');input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5)}*{box-sizing:border-box}::-webkit-scrollbar{width:0}button:active{opacity:.78}`}</style>

      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:50,background:T.bg+"F4",backdropFilter:"blur(18px)",borderBottom:`1px solid ${T.border}`,padding:"10px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <LogoMark size={42}/>
          <div style={{fontSize:20,fontWeight:900,color:T.text,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:3,lineHeight:1}}>
            TreinAI
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <button onClick={()=>setModal("start-workout")} style={{background:T.red,color:"#fff",border:"none",borderRadius:9,padding:"5px 12px",fontSize:10,fontWeight:800,cursor:"pointer",letterSpacing:1,display:"flex",alignItems:"center",gap:5}}>
            <Ic n="play" s={11} c="white" sw={2}/> TREINAR
          </button>

        </div>
      </div>

      {/* Screen */}
      <div style={{overflowY:"auto",minHeight:"calc(100vh - 113px)"}}>
        {tab==="home"&&<HomeScreen/>}
        {tab==="treino"&&<TreinoScreen/>}
        {tab==="evolution"&&<EvolucaoScreen/>}
        {tab==="ranking"&&<RankingScreen/>}
        {tab==="perfil"&&<PerfilScreen/>}
      </div>

      {/* Rest timer */}
      {timer!==null&&<Timer secs={timer} onClose={()=>setTimer(null)}/>}

      {/* Modals */}
      {modal?.type==="confirm-delete"&&<ConfirmDeleteModal profileId={modal.profileId} profileName={modal.profileName}/>}
      {modal==="start-workout"&&<StartWorkoutModal/>}
      {modal==="free-workout"&&<FreeWorkoutModal/>}
      {modal?.type==="active-workout"&&<ActiveWorkoutModal plan={modal.plan}/>}
      {modal?.type==="log-detail"&&<LogDetailModal log={modal.log}/>}
      {modal==="profile-switch"&&<ProfileSwitchModal/>}
      {modal==="new-plan"&&<NewPlanModal/>}
      {modal?.type==="plan-edit"&&<PlanEditModal plan={modal.plan}/>}
      {modal==="new-profile"&&<NewProfileModal/>}

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:T.surface+"F8",backdropFilter:"blur(20px)",borderTop:`1px solid ${T.border}`,display:"flex",padding:"10px 0 18px"}}>
        {TABS.map(t=>{
          const active=tab===t.id;
          return(
            <button key={t.id} onClick={()=>{setTab(t.id);if(t.id==="home"&&!aiInsights)fetchAI();}} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"4px 0",color:active?T.red:T.textSub,position:"relative"}}>
              {active&&<div style={{position:"absolute",top:-10,width:18,height:2,background:T.red,borderRadius:1,boxShadow:`0 0 8px ${T.red}`}}/>}
              <Ic n={t.icon} s={19} c={active?T.red:T.textSub} sw={active?2:1.4}/>
              <span style={{fontSize:7,fontWeight:active?900:400,letterSpacing:active?1.5:0.5,fontFamily:active?"'Barlow Condensed',sans-serif":"inherit"}}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
