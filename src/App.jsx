import { useState, useEffect, useMemo } from "react";

const load = (k, fb) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : fb; } catch { return fb; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
let _id = Date.now(); const uid = () => String(++_id);

const DATA_VERSION = "v2";
if (localStorage.getItem("tm_version") !== DATA_VERSION) {
  ["tm_projects","tm_tasks","tm_sections","tm_email"].forEach(k => localStorage.removeItem(k));
  localStorage.setItem("tm_version", DATA_VERSION);
}

const T = {
  navy:"#003262", navyDark:"#001f3f", navyMid:"#002855",
  gold:"#FDB515", goldS:"rgba(253,181,21,0.12)", goldB:"rgba(253,181,21,0.28)",
  bg:"#00132a", bg2:"#000e1f",
  surface:"rgba(255,255,255,0.04)", border:"rgba(253,181,21,0.1)", borderS:"rgba(255,255,255,0.06)",
  text:"#f0f4ff", textSoft:"rgba(240,244,255,0.5)", textMute:"rgba(240,244,255,0.26)",
  navBg:"rgba(0,14,31,0.98)", email:"#7eb3ff", emailS:"rgba(126,179,255,0.12)",
  red:"#ef4444", green:"#34d399", modal:"#001830",
};

const PC = { 1:"#ef4444", 2:T.gold, 3:"#60a5fa", 4:"rgba(255,255,255,0.18)" };
const PG = { 1:"rgba(239,68,68,0.18)", 2:"rgba(253,181,21,0.14)", 3:"rgba(96,165,250,0.12)", 4:"transparent" };
const PL = { 1:"Urgent", 2:"High", 3:"Medium", 4:"None" };
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00"), now = new Date(); now.setHours(0,0,0,0);
  const diff = Math.round((dt - now) / 86400000);
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (diff === 0) return "Today"; if (diff === 1) return "Tomorrow"; if (diff === -1) return "Yesterday";
  if (diff > 1 && diff <= 7) return DAYS[dt.getDay()];
  return `${mo[dt.getMonth()]} ${dt.getDate()}${dt.getFullYear() !== now.getFullYear() ? " " + dt.getFullYear() : ""}`;
};
const isOverdue = (d) => { if (!d) return false; return new Date(d + "T00:00:00") < new Date(new Date().setHours(0,0,0,0)); };
const isToday = (d) => { if (!d) return false; const n = new Date(); n.setHours(0,0,0,0); return new Date(d + "T00:00:00").getTime() === n.getTime(); };
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

const I = {
  tasks:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  today:"M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  cal:"M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  mail:"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  plus:"M12 5v14M5 12h14", x:"M18 6L6 18M6 6l12 12",
  trash:"M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2",
  arrow:"M5 12h14M12 5l7 7-7 7", search:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  chevL:"M15 18l-6-6 6-6", chevR:"M9 18l6-6-6-6",
  recur:"M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  folder:"M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z",
  settings:"M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
};

const Ico = ({ d, size=16, color=T.textSoft, style={} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,...style}}>
    <path d={d}/>
  </svg>
);

const DEFAULT_PROJECTS = [
  {id:"lotus",name:"Lotus AI Lab",color:"#60a5fa"},
  {id:"sundermed",name:"Sunder Med/Personal",color:"#f59e0b"},
  {id:"personal",name:"Personal",color:"#34d399"},
  {id:"aarasaan",name:"AaraSaan Consulting",color:"#a78bfa"},
];
const DEFAULT_TASKS = [
  {id:"t1",projectId:"personal",title:"Karla bills",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t2",projectId:"sundermed",title:"Reset ADP payroll",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t3",projectId:"personal",title:"Personal taxes",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t4",projectId:"lotus",title:"Business development",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t5",projectId:"lotus",title:"Print certificate for wish raffle",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t6",projectId:"lotus",title:"Networking opportunities",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t7",projectId:"lotus",title:"Headhunter",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t8",projectId:"lotus",title:"Lead generation app",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t9",projectId:"lotus",title:"Mark Howarth",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t10",projectId:"lotus",title:"Disc profile assessment",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t11",projectId:"lotus",title:"Open claw",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t12",projectId:"lotus",title:"Wayne Garb",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t13",projectId:"lotus",title:"Lotus Links backlog",priority:4,dueDate:"",subtasks:1,subtasksDone:0,completed:false,fromEmail:false},
  {id:"t14",projectId:"lotus",title:"Cursor",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t15",projectId:"sundermed",title:"Cancel LinkedIn Premium",priority:1,dueDate:"2026-04-23",completed:false,fromEmail:false},
  {id:"t16",projectId:"sundermed",title:"Call DEA",priority:1,dueDate:"",subtasks:1,subtasksDone:0,completed:false,fromEmail:false},
  {id:"t17",projectId:"sundermed",title:"Transfer funds from pension to IRA",priority:1,dueDate:"2025-08-31",completed:false,fromEmail:false},
  {id:"t18",projectId:"sundermed",title:"LCMG statement of info",priority:2,dueDate:"2026-03-31",recurring:true,completed:false,fromEmail:false},
  {id:"t19",projectId:"sundermed",title:"Sunder Med statement of info",priority:2,dueDate:"2026-10-31",recurring:true,completed:false,fromEmail:false},
  {id:"t20",projectId:"sundermed",title:"Peacock statement of information",priority:2,dueDate:"2027-05-31",completed:false,fromEmail:false},
  {id:"t21",projectId:"sundermed",title:"Website for peacock",priority:1,dueDate:"",completed:false,fromEmail:false},
  {id:"t22",projectId:"sundermed",title:"Sunder Medical Month-end",priority:4,dueDate:"2026-04-01",recurring:true,subtasks:5,subtasksDone:5,completed:false,fromEmail:false},
  {id:"t23",projectId:"sundermed",title:"Southwest refund for mom",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t24",projectId:"personal",title:"Call SRF re app",priority:2,dueDate:"",completed:false,fromEmail:false},
  {id:"t25",projectId:"personal",title:"SimpliSafe - reduce plan",priority:4,dueDate:"2026-09-06",completed:false,fromEmail:false},
  {id:"t26",projectId:"personal",title:"Refinance auto loan",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t27",projectId:"personal",title:"Create social security account on ssa.gov",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t28",projectId:"personal",title:"Lincoln Roadside Assistance",priority:4,dueDate:"",completed:false,fromEmail:false},
  {id:"t29",projectId:"aarasaan",title:"Amazon jobs site",priority:1,dueDate:"",completed:false,fromEmail:false},
  {id:"t30",projectId:"aarasaan",title:"Statement of incorporation for AaraSaan",priority:2,dueDate:"2026-11-30",recurring:true,completed:false,fromEmail:false},
];
const DEFAULT_EMAIL_TASKS = [
  {id:"e1",title:"Check First American Title questionnaire from akay@firstam.com",emailFrom:"Kavitha Pathmarajah",emailDate:"2026-03-28",priority:2,dueDate:"2026-04-02",captured:"2026-03-29"},
  {id:"e2",title:"Send property tax check to Kav before April 10th deadline",emailFrom:"Kavitha Pathmarajah",emailDate:"2026-03-28",priority:1,dueDate:"2026-04-10",captured:"2026-03-29"},
  {id:"e3",title:"Decide signing authority: new Board Resolution or have Shun sign",emailFrom:"Kavitha Pathmarajah",emailDate:"2026-03-28",priority:1,dueDate:"2026-04-02",captured:"2026-03-29"},
  {id:"e4",title:"Finalize CA Attorney General letter and send via certified mail",emailFrom:"Kavitha Pathmarajah",emailDate:"2026-03-28",priority:1,dueDate:"2026-04-02",captured:"2026-03-29"},
  {id:"e5",title:"Locate TRRO Bylaws or remove from AG letter enclosures",emailFrom:"Kavitha Pathmarajah",emailDate:"2026-03-28",priority:2,dueDate:"2026-04-01",captured:"2026-03-29"},
  {id:"e6",title:"Review Articles of Incorporation and Purchase Agreement",emailFrom:"Kavitha Pathmarajah",emailDate:"2026-03-28",priority:3,dueDate:"2026-04-01",captured:"2026-03-29"},
];

const useIsMobile = () => {
  const [mob, setMob] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return mob;
};

// ─────────────────────────────────────────────────────────────
export default function App() {
  const [projects, setProjects] = useState(() => load("tm_projects", DEFAULT_PROJECTS));
  const [tasks, setTasks] = useState(() => load("tm_tasks", DEFAULT_TASKS));
  const [emailTasks, setEmailTasks] = useState(() => load("tm_email", DEFAULT_EMAIL_TASKS));
  const [view, setView] = useState("tasks");
  const [dayFilter, setDayFilter] = useState(null);
  const [projectFilter, setProjectFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrio, setNewPrio] = useState(4);
  const [newDate, setNewDate] = useState("");
  const [newProject, setNewProject] = useState("lotus");
  const [assigningEmail, setAssigningEmail] = useState(null);
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [batchProject, setBatchProject] = useState("lotus");
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return {year:d.getFullYear(), month:d.getMonth()}; });
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [modalName, setModalName] = useState("");
  const isMobile = useIsMobile();

  useEffect(() => { save("tm_projects", projects); }, [projects]);
  useEffect(() => { save("tm_tasks", tasks); }, [tasks]);
  useEffect(() => { save("tm_email", emailTasks); }, [emailTasks]);

  const TODAY = useMemo(() => todayStr(), []);

  const weekDays = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return Array.from({length:7}, (_,i) => {
      const d = new Date(today); d.setDate(d.getDate() + i - 3);
      const str = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return { date:str, name:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()], num:d.getDate(), isToday:str===TODAY, hasTasks:tasks.some(t=>!t.completed&&t.dueDate===str) };
    });
  }, [tasks, TODAY]);

  const sortedProjects = useMemo(() => {
    const gen = projects.find(p => p.name === "General");
    return gen ? [gen, ...projects.filter(p => p.id !== gen.id)] : projects;
  }, [projects]);

  const visTasks = useMemo(() => {
    let t = tasks.filter(x => !x.completed);
    if (view==="today") t = t.filter(x => x.dueDate===TODAY);
    if (dayFilter) t = t.filter(x => x.dueDate===dayFilter);
    if (projectFilter!=="all") t = t.filter(x => x.projectId===projectFilter);
    return t;
  }, [tasks, view, dayFilter, projectFilter, TODAY]);

  const openCount = useMemo(() => tasks.filter(t=>!t.completed).length, [tasks]);
  const todayCount = useMemo(() => tasks.filter(t=>!t.completed&&t.dueDate===TODAY).length, [tasks, TODAY]);

  const calData = useMemo(() => {
    const {year,month} = calMonth;
    const daysInMonth = new Date(year,month+1,0).getDate();
    const startPad = new Date(year,month,1).getDay();
    const all = [...tasks.filter(t=>!t.completed&&t.dueDate), ...emailTasks.filter(e=>e.dueDate).map(e=>({...e,_email:true}))];
    const byDate = {};
    all.forEach(t => {
      const d = new Date(t.dueDate+"T00:00:00");
      if (d.getFullYear()===year&&d.getMonth()===month) {
        const k = d.getDate(); if(!byDate[k]) byDate[k]=[]; byDate[k].push(t);
      }
    });
    return {daysInMonth,startPad,byDate};
  }, [calMonth,tasks,emailTasks]);

  // Handlers
  const addTask = () => {
    if (!newTitle.trim()) return;
    setTasks(p=>[...p,{id:uid(),projectId:newProject,title:newTitle.trim(),priority:newPrio,dueDate:newDate,subtasks:0,subtasksDone:0,completed:false,fromEmail:false}]);
    setNewTitle(""); setNewPrio(4); setNewDate(""); setAddModal(false);
  };
  const toggleDone = (id) => { setTasks(p=>p.map(t=>t.id===id?{...t,completed:!t.completed}:t)); if(selectedTask?.id===id) setSelectedTask(null); };
  const deleteTask = (id) => { setTasks(p=>p.filter(t=>t.id!==id)); if(selectedTask?.id===id) setSelectedTask(null); };
  const updateTask = (id,u) => { setTasks(p=>p.map(t=>t.id===id?{...t,...u}:t)); if(selectedTask?.id===id) setSelectedTask(p=>({...p,...u})); };
  const assignEmail = (eid,projId) => {
    const et = emailTasks.find(e=>e.id===eid); if(!et) return;
    setTasks(p=>[...p,{id:uid(),projectId:projId,title:et.title,priority:et.priority,dueDate:et.dueDate||"",subtasks:0,subtasksDone:0,completed:false,fromEmail:true,emailFrom:et.emailFrom}]);
    setEmailTasks(p=>p.filter(e=>e.id!==eid)); setAssigningEmail(null);
  };
  const toggleEmailSelect = (id) => setSelectedEmails(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const batchAssign = (projId) => { selectedEmails.forEach(eid=>assignEmail(eid,projId)); setSelectedEmails(new Set()); };
  const batchDismiss = () => { setEmailTasks(p=>p.filter(e=>!selectedEmails.has(e.id))); setSelectedEmails(new Set()); };
  const addProject = () => {
    if(!modalName.trim()) return;
    const id=uid();
    setProjects(p=>[...p,{id,name:modalName.trim(),color:T.gold}]);
    setModalName(""); setShowProjectModal(false);
  };

  // ── Shared Components ────────────────────────────────────────

  const GoldBar = () => (
    <div style={{height:3,background:`linear-gradient(90deg,${T.navyDark},${T.gold} 40%,${T.gold} 60%,${T.navyDark})`,flexShrink:0}} />
  );

  const inp = {background:"rgba(0,50,98,0.4)",border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"};

  const TaskCard = ({task}) => {
    const sel = selectedTask?.id===task.id;
    const od=isOverdue(task.dueDate), td=isToday(task.dueDate);
    return (
      <div onClick={()=>setSelectedTask(sel?null:task)}
        style={{display:"flex",alignItems:"flex-start",gap:12,padding:"13px 16px",borderRadius:11,
          background:sel?"rgba(0,50,98,0.5)":"rgba(0,50,98,0.22)",
          border:`1px solid ${sel?T.goldB:"rgba(253,181,21,0.07)"}`,
          position:"relative",overflow:"hidden",cursor:"pointer",marginBottom:4,transition:"all 0.15s"}}
        onMouseEnter={e=>{e.currentTarget.style.background="rgba(0,50,98,0.38)";e.currentTarget.style.borderColor="rgba(253,181,21,0.18)";}}
        onMouseLeave={e=>{e.currentTarget.style.background=sel?"rgba(0,50,98,0.5)":"rgba(0,50,98,0.22)";e.currentTarget.style.borderColor=sel?T.goldB:"rgba(253,181,21,0.07)";}}
      >
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:PC[task.priority],borderRadius:"3px 0 0 3px"}} />
        <button onClick={e=>{e.stopPropagation();toggleDone(task.id);}}
          style={{width:19,height:19,minWidth:19,borderRadius:"50%",marginTop:2,border:`2px solid ${PC[task.priority]}`,background:"transparent",cursor:"pointer",padding:0,flexShrink:0,transition:"all 0.2s"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
        />
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13.5,fontWeight:500,lineHeight:1.4,color:T.text}}>{task.title}</div>
          <div style={{display:"flex",gap:8,marginTop:4,alignItems:"center",flexWrap:"wrap"}}>
            {task.fromEmail&&<span style={{fontSize:10,background:T.emailS,color:T.email,padding:"2px 7px",borderRadius:6,fontWeight:700}}>email</span>}
            {task.dueDate&&<span style={{fontSize:11,fontWeight:600,color:od?T.red:td?T.green:"rgba(253,181,21,0.7)",display:"flex",alignItems:"center",gap:3}}>
              📅 {fmtDate(task.dueDate)}{task.recurring&&<Ico d={I.recur} size={10} color={T.textMute} style={{marginLeft:2}}/>}
            </span>}
            {task.subtasks>0&&<span style={{fontSize:11,color:T.textMute}}>{task.subtasksDone}/{task.subtasks}</span>}
          </div>
        </div>
      </div>
    );
  };

  const renderFeed = (flat=false) => {
    const isEmpty = visTasks.length===0;
    if (flat||view==="today"||dayFilter) return (
      <div style={{padding:"0 0 8px"}}>
        {isEmpty?(<div style={{textAlign:"center",padding:"60px 20px",color:T.textMute}}>
          <div style={{fontSize:32,marginBottom:12}}>✓</div>
          <div style={{fontSize:15,fontWeight:600,color:T.textSoft}}>All clear</div>
          <div style={{fontSize:13,marginTop:4}}>No tasks {view==="today"?"due today":"for this day"}</div>
        </div>):visTasks.map(t=><TaskCard key={t.id} task={t}/>)}
      </div>
    );
    if (projectFilter !== "all") return (
      <div style={{padding:"0 0 8px"}}>
        {isEmpty?(<div style={{textAlign:"center",padding:"60px 20px",color:T.textMute}}>
          <div style={{fontSize:32,marginBottom:12}}>✓</div>
          <div style={{fontSize:15,fontWeight:600,color:T.textSoft}}>All clear</div>
          <div style={{fontSize:13,marginTop:4}}>No tasks in this project</div>
        </div>):visTasks.map(t=><TaskCard key={t.id} task={t}/>)}
      </div>
    );
    return (
      <div>
        {sortedProjects.map(proj=>{
          const projTasks=visTasks.filter(t=>t.projectId===proj.id);
          if (!projTasks.length) return null;
          return (
            <div key={proj.id}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0 6px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:proj.color||T.gold}}/>
                  <span style={{fontSize:10,fontWeight:700,letterSpacing:"1.8px",textTransform:"uppercase",color:"rgba(253,181,21,0.38)"}}>{proj.name}</span>
                </div>
                <span style={{fontSize:11,color:T.textMute,background:"rgba(255,255,255,0.05)",padding:"1px 8px",borderRadius:8}}>{projTasks.length}</span>
              </div>
              {projTasks.map(t=><TaskCard key={t.id} task={t}/>)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekStrip = (compact=false, padH=compact?28:16) => (
    <div style={{display:"flex",gap:compact?4:2,overflowX:"auto",padding:`12px ${padH}px`,borderBottom:`1px solid ${T.borderS}`,scrollbarWidth:"none",flexShrink:0,alignItems:"center"}}>
      {weekDays.map(d=>(
        <div key={d.date} onClick={()=>{setDayFilter(dayFilter===d.date?null:d.date);if(view!=="tasks")setView("tasks");}}
          style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:compact?56:46,padding:compact?"8px 12px":"8px 6px",borderRadius:10,cursor:"pointer",transition:"all 0.15s",
            background:dayFilter===d.date?`linear-gradient(180deg,${T.navy},rgba(0,50,98,0.6))`:"transparent",
            border:`1px solid ${dayFilter===d.date?T.goldB:"transparent"}`,
          }}
        >
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.6px",color:(dayFilter===d.date||d.isToday)?"rgba(253,181,21,0.7)":T.textMute}}>{d.name}</div>
          <div style={{fontSize:18,fontWeight:700,color:(dayFilter===d.date||d.isToday)?T.gold:T.textMute}}>{d.num}</div>
          {d.hasTasks?<div style={{width:4,height:4,borderRadius:"50%",background:T.gold}}/>:<div style={{width:4,height:4}}/>}
        </div>
      ))}
      {compact&&<>
        <div style={{flex:1}}/>
        <div style={{display:"flex",gap:20,alignItems:"center",padding:"0 4px"}}>
          {[{n:todayCount,l:"Today",c:T.gold},{n:openCount,l:"Open",c:T.textSoft},{n:emailTasks.length,l:"Emails",c:T.email}].map(({n,l,c},i)=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:c,fontWeight:700,lineHeight:1}}>{n}</div>
              <div style={{fontSize:9,color:"rgba(253,181,21,0.4)",textTransform:"uppercase",letterSpacing:"0.8px",marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      </>}
    </div>
  );

  const renderFilterPills = (padH=16) => (
    <div style={{display:"flex",gap:6,padding:`12px ${padH}px 0`,overflowX:"auto",scrollbarWidth:"none",flexShrink:0}}>
      {[{id:"all",name:"All"},...sortedProjects.map(p=>({id:p.id,name:p.name}))].map(f=>(
        <div key={f.id} onClick={()=>setProjectFilter(f.id)}
          style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,whiteSpace:"nowrap",cursor:"pointer",transition:"all 0.15s",
            background:projectFilter===f.id?T.goldS:"rgba(255,255,255,0.04)",
            border:`1px solid ${projectFilter===f.id?T.goldB:T.borderS}`,
            color:projectFilter===f.id?T.gold:T.textMute,
          }}
        >{f.name}</div>
      ))}
    </div>
  );

  const renderCalendar = (padH=16) => {
    const {daysInMonth,startPad,byDate}=calData, {year,month}=calMonth;
    const now=new Date(); now.setHours(0,0,0,0);
    const tD=now.getDate(),tM=now.getMonth(),tY=now.getFullYear();
    const cells=[...Array(startPad).fill(null),...Array.from({length:daysInMonth},(_,i)=>i+1)];
    while(cells.length%7!==0) cells.push(null);
    return (
      <div style={{padding:`16px ${padH}px`}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <button onClick={()=>setCalMonth(p=>p.month===0?{year:p.year-1,month:11}:{...p,month:p.month-1})} style={{background:"rgba(0,50,98,0.4)",border:`1px solid ${T.borderS}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center"}}><Ico d={I.chevL} size={16} color={T.textSoft}/></button>
          <div style={{flex:1,textAlign:"center",fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:600,color:T.gold}}>{MONTHS[month]} {year}</div>
          <button onClick={()=>setCalMonth(p=>p.month===11?{year:p.year+1,month:0}:{...p,month:p.month+1})} style={{background:"rgba(0,50,98,0.4)",border:`1px solid ${T.borderS}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center"}}><Ico d={I.chevR} size={16} color={T.textSoft}/></button>
          <button onClick={()=>setCalMonth({year:tY,month:tM})} style={{padding:"6px 12px",background:"rgba(0,50,98,0.4)",border:`1px solid ${T.borderS}`,color:T.textSoft,borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>Today</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:2}}>
          {DAYS.map(d=><div key={d} style={{padding:"6px 0",fontSize:10,fontWeight:700,color:T.textMute,textAlign:"center",textTransform:"uppercase",letterSpacing:"0.5px"}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {cells.map((day,i)=>{
            const isT=day&&year===tY&&month===tM&&day===tD;
            const isPast=day&&new Date(year,month,day)<now;
            const dt=day?(byDate[day]||[]):[];
            const maxShow=padH>0?3:2;
            return (
              <div key={i} style={{minHeight:padH>0?88:70,background:day?"rgba(0,50,98,0.2)":"transparent",border:`1px solid ${isT?T.goldB:day?"rgba(253,181,21,0.07)":"transparent"}`,borderRadius:8,padding:day?"5px 6px":0,opacity:day?1:0}}>
                {day&&<>
                  <div style={{fontSize:12,fontWeight:isT?800:600,color:isT?T.gold:isPast?T.textMute:T.textSoft,marginBottom:3,display:"flex",alignItems:"center",gap:3}}>
                    {isT&&<span style={{width:5,height:5,borderRadius:"50%",background:T.gold,display:"inline-block"}}/>}{day}
                  </div>
                  {dt.slice(0,maxShow).map((t,ti)=>(
                    <div key={ti} title={t.title} onClick={()=>t.sectionId&&setSelectedTask(t)}
                      style={{fontSize:10,padding:"2px 5px",borderRadius:3,marginBottom:2,background:t._email?T.emailS:PG[t.priority]||"rgba(255,255,255,0.05)",color:t._email?T.email:PC[t.priority]||T.textMute,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",borderLeft:`2px solid ${t._email?T.email:PC[t.priority]||T.textMute}`,cursor:t.sectionId?"pointer":"default"}}
                    >{t.title}</div>
                  ))}
                  {dt.length>maxShow&&<div style={{fontSize:9,color:T.textMute,padding:"1px 5px"}}>+{dt.length-maxShow} more</div>}
                </>}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:16,marginTop:14,paddingTop:12,borderTop:`1px solid ${T.borderS}`,flexWrap:"wrap"}}>
          {[{l:"Urgent",c:PC[1],b:PG[1]},{l:"High",c:PC[2],b:PG[2]},{l:"Medium",c:PC[3],b:PG[3]},{l:"Email",c:T.email,b:T.emailS}].map(x=>(
            <div key={x.l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:T.textSoft}}>
              <span style={{width:10,height:10,borderRadius:3,background:x.b,border:`2px solid ${x.c}`}}/>{x.l}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEmailView = (padH=16) => {
    const hasSel = selectedEmails.size > 0;
    return (
      <div style={{padding:`16px ${padH}px`,paddingBottom: hasSel ? `${16+72}px` : 16}}>
        {emailTasks.length===0?(
          <div style={{textAlign:"center",padding:"60px 20px",color:T.textMute}}>
            <div style={{fontSize:40,marginBottom:12}}>✉️</div>
            <div style={{fontSize:15,fontWeight:600,color:T.textSoft}}>All caught up</div>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {emailTasks.map(et=>{
              const checked = selectedEmails.has(et.id);
              return (
                <div key={et.id} style={{background:"rgba(0,50,98,0.25)",border:`1px solid ${checked?T.goldB:"rgba(126,179,255,0.15)"}`,borderLeft:`3px solid ${checked?T.gold:T.email}`,borderRadius:12,padding:"14px 16px",transition:"border-color 0.15s"}}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <button onClick={()=>toggleEmailSelect(et.id)}
                      style={{width:20,height:20,minWidth:20,borderRadius:5,border:`2px solid ${checked?T.gold:"rgba(253,181,21,0.3)"}`,background:checked?T.gold:"transparent",cursor:"pointer",padding:0,flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}
                    >
                      {checked&&<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={T.bg2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                    <div style={{width:36,height:36,borderRadius:10,background:T.emailS,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18}}>✉️</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:6}}>{et.title}</div>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:11,background:T.emailS,color:T.email,padding:"2px 8px",borderRadius:8,fontWeight:600}}>From: {et.emailFrom}</span>
                        <span style={{fontSize:11,background:PG[et.priority],color:PC[et.priority],padding:"2px 8px",borderRadius:8,fontWeight:600}}>{PL[et.priority]}</span>
                        {et.dueDate&&<span style={{fontSize:11,color:isOverdue(et.dueDate)?T.red:"rgba(253,181,21,0.7)",fontWeight:600}}>📅 {fmtDate(et.dueDate)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {hasSel&&(
          <div style={{position:"sticky",bottom:0,marginLeft:`-${padH}px`,marginRight:`-${padH}px`,background:`linear-gradient(0deg,${T.bg2} 85%,transparent)`,padding:`12px ${padH+4}px 16px`,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{fontSize:13,fontWeight:700,color:T.gold,whiteSpace:"nowrap"}}>{selectedEmails.size} selected</span>
            <select value={batchProject} onChange={e=>setBatchProject(e.target.value)}
              style={{flex:1,minWidth:140,background:"rgba(0,50,98,0.6)",border:`1px solid ${T.goldB}`,color:T.text,borderRadius:8,padding:"7px 10px",fontSize:12,outline:"none"}}>
              {sortedProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={()=>batchAssign(batchProject)}
              style={{padding:"7px 16px",background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,border:`1px solid ${T.goldB}`,color:T.gold,borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>
              Assign
            </button>
            <button onClick={batchDismiss}
              style={{padding:"7px 12px",background:"rgba(255,255,255,0.04)",border:`1px solid ${T.borderS}`,color:T.textMute,borderRadius:8,cursor:"pointer",fontSize:12,whiteSpace:"nowrap"}}>
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── Modals ───────────────────────────────────────────────────
  const NameModal = ({title,onSave,onClose}) => (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={onClose}>
      <div style={{background:T.modal,borderRadius:16,border:`1px solid ${T.goldB}`,padding:24,width:380,maxWidth:"90vw"}} onClick={e=>e.stopPropagation()}>
        <h3 style={{margin:"0 0 16px",fontSize:17,fontWeight:700,fontFamily:"'Playfair Display',serif",color:T.gold}}>{title}</h3>
        <input autoFocus value={modalName} onChange={e=>setModalName(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter")onSave();if(e.key==="Escape")onClose();}}
          placeholder="Name..." style={{...inp,fontSize:14,padding:"12px 16px",marginBottom:16}}
        />
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"8px 16px",background:"none",border:"none",color:T.textMute,cursor:"pointer",fontSize:14}}>Cancel</button>
          <button onClick={onSave} style={{padding:"10px 24px",background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,border:`1px solid ${T.goldB}`,color:T.gold,borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:14}}>Create</button>
        </div>
      </div>
    </div>
  );

  const renderModals = () => (
    <>
      {addModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(6px)",display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",zIndex:1000}} onClick={()=>setAddModal(false)}>
          <div style={{background:T.modal,borderRadius:isMobile?"16px 16px 0 0":16,border:`1px solid ${T.goldB}`,padding:24,width:"100%",maxWidth:440,boxShadow:"0 24px 48px rgba(0,0,0,0.5)"}} onClick={e=>e.stopPropagation()}>
            {isMobile&&<div style={{width:36,height:4,borderRadius:2,background:T.borderS,margin:"0 auto 20px"}}/>}
            <h3 style={{margin:"0 0 20px",fontSize:18,fontWeight:700,fontFamily:"'Playfair Display',serif",color:T.gold}}>New Task</h3>
            <input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTask();if(e.key==="Escape")setAddModal(false);}} placeholder="Task name..." style={{...inp,fontSize:15,padding:"12px 16px",marginBottom:14}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
              {[
                {label:"Priority",content:<select value={newPrio} onChange={e=>setNewPrio(Number(e.target.value))} style={inp}>{[1,2,3,4].map(p=><option key={p} value={p}>{PL[p]}</option>)}</select>},
                {label:"Due Date",content:<input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} style={inp}/>},
                {label:"Project",content:<select value={newProject} onChange={e=>setNewProject(e.target.value)} style={inp}>{sortedProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>},
              ].map(({label,content})=>(
                <div key={label}>
                  <div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{label}</div>
                  {content}
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setAddModal(false)} style={{padding:"10px 20px",background:"none",border:"none",color:T.textMute,cursor:"pointer",fontSize:14}}>Cancel</button>
              <button onClick={addTask} style={{padding:"10px 28px",background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,border:`1px solid ${T.goldB}`,color:T.gold,borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:14}}>Add Task</button>
            </div>
          </div>
        </div>
      )}

      {selectedTask&&isMobile&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:1000}} onClick={()=>setSelectedTask(null)}>
          <div style={{background:T.modal,borderRadius:"16px 16px 0 0",border:`1px solid ${T.goldB}`,padding:24,width:"100%",maxWidth:430,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:36,height:4,borderRadius:2,background:T.borderS,margin:"0 auto 20px"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 12px",borderRadius:20,background:PG[selectedTask.priority],border:`1px solid ${PC[selectedTask.priority]}44`,fontSize:11,fontWeight:700,color:PC[selectedTask.priority],textTransform:"uppercase",letterSpacing:"0.8px"}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:"currentColor",display:"inline-block"}}/>{PL[selectedTask.priority]}
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>deleteTask(selectedTask.id)} style={{background:"none",border:"none",cursor:"pointer",padding:6}}><Ico d={I.trash} size={16} color={T.red}/></button>
                <button onClick={()=>setSelectedTask(null)} style={{background:"none",border:"none",cursor:"pointer",padding:6}}><Ico d={I.x} size={16} color={T.textMute}/></button>
              </div>
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:600,color:T.text,lineHeight:1.35,marginBottom:18}}>{selectedTask.title}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
              {[
                {label:"Due Date",content:<input type="date" value={selectedTask.dueDate||""} onChange={e=>updateTask(selectedTask.id,{dueDate:e.target.value})} style={{...inp,color:isOverdue(selectedTask.dueDate)?T.red:T.gold,fontWeight:600,border:`1px solid ${isOverdue(selectedTask.dueDate)?T.red:T.border}`}}/>},
                {label:"Priority",content:<select value={selectedTask.priority} onChange={e=>updateTask(selectedTask.id,{priority:Number(e.target.value)})} style={inp}>{[1,2,3,4].map(p=><option key={p} value={p}>{PL[p]}</option>)}</select>},
                {label:"Project",content:<select value={selectedTask.projectId} onChange={e=>updateTask(selectedTask.id,{projectId:e.target.value})} style={inp}>{sortedProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>},
              ].map(({label,content})=>(
                <div key={label}><div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{label}</div>{content}</div>
              ))}
            </div>
            <button onClick={()=>toggleDone(selectedTask.id)} style={{width:"100%",padding:13,background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,border:`1px solid ${T.goldB}`,color:T.gold,borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif"}}>✓ Mark Complete</button>
          </div>
        </div>
      )}

      {assigningEmail&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setAssigningEmail(null)}>
          <div style={{background:T.modal,borderRadius:16,border:`1px solid ${T.goldB}`,padding:24,width:400,maxWidth:"90vw",maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <h3 style={{margin:"0 0 6px",fontSize:17,fontWeight:700,fontFamily:"'Playfair Display',serif",color:T.gold}}>Assign to Project</h3>
            <p style={{margin:"0 0 16px",fontSize:13,color:T.textMute}}>Choose where to move this task</p>
            {sortedProjects.map(proj=>(
              <button key={proj.id} onClick={()=>assignEmail(assigningEmail,proj.id)}
                style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",background:"transparent",border:"none",color:T.text,cursor:"pointer",borderRadius:8,fontSize:13,textAlign:"left"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(0,50,98,0.4)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <div style={{width:8,height:8,borderRadius:"50%",background:proj.color||T.gold,flexShrink:0}}/>
                {proj.name}
              </button>
            ))}
            <div style={{marginTop:14,display:"flex",justifyContent:"flex-end"}}><button onClick={()=>setAssigningEmail(null)} style={{padding:"8px 16px",background:"none",border:"none",color:T.textMute,cursor:"pointer",fontSize:13}}>Cancel</button></div>
          </div>
        </div>
      )}

      {showProjectModal&&<NameModal title="New Project" onSave={addProject} onClose={()=>setShowProjectModal(false)}/>}
    </>
  );

  // ── Desktop Sidebar ──────────────────────────────────────────
  const renderSidebar = () => (
    <div style={{width:248,minWidth:248,background:T.bg2,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"20px 20px 14px",borderBottom:`1px solid ${T.borderS}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <div style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,border:`2px solid ${T.gold}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:T.gold,flexShrink:0}}>A</div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:T.gold,fontWeight:600}}>Anthan</div>
            <div style={{fontSize:11,color:T.textMute}}>Task Manager</div>
          </div>
        </div>
        <button onClick={()=>{setNewProject(projectFilter==="all"?projects[0]?.id:projectFilter);setAddModal(true);}}
          style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 14px",background:T.goldS,border:`1px solid ${T.goldB}`,borderRadius:10,color:T.gold,fontSize:13,fontWeight:600,cursor:"pointer"}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:T.gold,color:T.bg2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,flexShrink:0}}>+</div>
          Add task
        </button>
      </div>

      <div style={{padding:"12px 12px 4px",flexShrink:0}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",color:T.textMute,padding:"0 8px 8px"}}>Views</div>
        {[
          {key:"tasks",icon:I.tasks,label:"All Tasks",badge:openCount,badgeBg:"rgba(255,255,255,0.08)",badgeC:T.textMute},
          {key:"today",icon:I.today,label:"Today",badge:todayCount||null,badgeBg:T.gold,badgeC:T.bg2},
          {key:"calendar",icon:I.cal,label:"Calendar",badge:null},
          {key:"email",icon:I.mail,label:"Email Capture",badge:emailTasks.length||null,badgeBg:T.email,badgeC:T.bg2},
        ].map(n=>(
          <div key={n.key} onClick={()=>{setView(n.key);setDayFilter(null);}}
            style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:9,cursor:"pointer",fontSize:13,marginBottom:1,color:view===n.key?T.gold:T.textSoft,background:view===n.key?T.goldS:"transparent",borderLeft:`3px solid ${view===n.key?T.gold:"transparent"}`,transition:"all 0.15s"}}
            onMouseEnter={e=>{if(view!==n.key){e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color=T.text;}}}
            onMouseLeave={e=>{if(view!==n.key){e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.textSoft;}}}
          >
            <Ico d={n.icon} size={16} color={view===n.key?T.gold:T.textMute}/>
            <span style={{flex:1}}>{n.label}</span>
            {n.badge?<span style={{fontSize:11,fontWeight:700,padding:"1px 7px",borderRadius:10,background:n.badgeBg,color:n.badgeC}}>{n.badge}</span>:null}
          </div>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"8px 12px",borderTop:`1px solid ${T.borderS}`,marginTop:6}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 8px 8px"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",color:T.textMute}}>Projects</div>
          <button onClick={()=>{setModalName("");setShowProjectModal(true);}} style={{background:"none",border:"none",cursor:"pointer",padding:2,opacity:0.5}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.5}>
            <Ico d={I.plus} size={14} color={T.textSoft}/>
          </button>
        </div>
        {sortedProjects.map(p=>{
          const active=projectFilter===p.id&&view==="tasks";
          return (
            <div key={p.id} onClick={()=>{setProjectFilter(p.id);setView("tasks");}}
              style={{display:"flex",alignItems:"center",gap:9,padding:"7px 10px",borderRadius:8,cursor:"pointer",fontSize:13,marginBottom:1,color:active?T.text:T.textSoft,background:active?"rgba(255,255,255,0.06)":"transparent",transition:"all 0.15s"}}
              onMouseEnter={e=>{if(!active){e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color=T.text;}}}
              onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.textSoft;}}}
            >
              <div style={{width:8,height:8,borderRadius:"50%",background:p.color||T.gold,flexShrink:0}}/>
              <span style={{flex:1}}>{p.name}</span>
              <span style={{fontSize:11,color:T.textMute}}>{tasks.filter(t=>!t.completed&&t.projectId===p.id).length}</span>
            </div>
          );
        })}
      </div>

      <div style={{padding:"10px 16px",borderTop:`1px solid ${T.borderS}`,display:"flex",gap:8}}>
        <button title="Settings" style={{flex:1,padding:8,borderRadius:8,background:"rgba(255,255,255,0.04)",border:`1px solid ${T.borderS}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Ico d={I.settings} size={15} color={T.textMute}/>
        </button>
      </div>
    </div>
  );

  // ── Desktop Detail Panel ─────────────────────────────────────
  const renderDetailPanel = () => {
    const task=selectedTask; if(!task) return null;
    const od=isOverdue(task.dueDate);
    return (
      <div style={{width:320,minWidth:320,background:T.bg2,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"18px 20px 14px",borderBottom:`1px solid ${T.borderS}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{fontSize:11,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1}}>Task Detail</div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>deleteTask(task.id)} style={{background:"none",border:"none",cursor:"pointer",padding:6,borderRadius:6}} onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="none"}><Ico d={I.trash} size={15} color={T.red}/></button>
            <button onClick={()=>setSelectedTask(null)} style={{background:"none",border:"none",cursor:"pointer",padding:6}}><Ico d={I.x} size={15} color={T.textMute}/></button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 12px",borderRadius:20,background:PG[task.priority],border:`1px solid ${PC[task.priority]}44`,fontSize:11,fontWeight:700,color:PC[task.priority],textTransform:"uppercase",letterSpacing:"0.8px"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"currentColor",display:"inline-block"}}/>{PL[task.priority]}
          </div>
          <input value={task.title} onChange={e=>updateTask(task.id,{title:e.target.value})}
            style={{width:"100%",background:"transparent",border:"none",color:T.text,fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:600,outline:"none",lineHeight:1.35,padding:0}}
          />
          {[
            {label:"Due Date",content:<input type="date" value={task.dueDate||""} onChange={e=>updateTask(task.id,{dueDate:e.target.value})} style={{...inp,color:od?T.red:T.gold,fontWeight:600,border:`1px solid ${od?T.red:T.border}`}}/>},
            {label:"Priority",content:<select value={task.priority} onChange={e=>updateTask(task.id,{priority:Number(e.target.value)})} style={inp}>{[1,2,3,4].map(p=><option key={p} value={p}>{PL[p]}</option>)}</select>},
            {label:"Project",content:<select value={task.projectId} onChange={e=>updateTask(task.id,{projectId:e.target.value})} style={inp}>{sortedProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>},
          ].map(({label,content})=>(
            <div key={label}><div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{label}</div>{content}</div>
          ))}
          {task.fromEmail&&<div style={{background:T.emailS,border:`1px solid rgba(126,179,255,0.2)`,borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:10,fontWeight:700,color:T.email,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Email Origin</div>
            <div style={{fontSize:12,color:T.textSoft}}>From: {task.emailFrom}</div>
          </div>}
        </div>
        <div style={{padding:"14px 20px",borderTop:`1px solid ${T.borderS}`,flexShrink:0}}>
          <button onClick={()=>toggleDone(task.id)} style={{width:"100%",padding:11,background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,border:`1px solid ${T.goldB}`,color:T.gold,borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"'Playfair Display',serif"}}>✓ Mark Complete</button>
        </div>
      </div>
    );
  };

  // ── Desktop Main Header ──────────────────────────────────────
  const renderMainHeader = () => {
    const titles={tasks:"All Tasks",today:"Today",calendar:"Calendar",email:"Email Capture"};
    return (
      <div style={{padding:"18px 28px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.borderS}`,flexShrink:0}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:600,color:T.gold}}>{titles[view]||"Tasks"}</div>
          <div style={{fontSize:12,color:T.textMute,marginTop:2,textTransform:"uppercase",letterSpacing:"0.3px"}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.04)",border:`1px solid ${T.borderS}`,borderRadius:8,padding:"7px 12px",width:200}}>
            <Ico d={I.search} size={14} color={T.textMute}/>
            <span style={{fontSize:12,color:T.textMute}}>Search tasks…</span>
          </div>
        </div>
      </div>
    );
  };

  // ── Mobile Top Bar ───────────────────────────────────────────
  const renderTopBar = () => (
    <div style={{padding:"16px 20px 12px",background:`linear-gradient(180deg,${T.bg2},${T.bg})`,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
      <div>
        <div style={{fontSize:11,color:"rgba(253,181,21,0.55)",letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:2}}>Good morning</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.gold,fontWeight:600,letterSpacing:"-0.3px"}}>Anthan</div>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <button onClick={()=>setView("email")} style={{position:"relative",width:36,height:36,borderRadius:"50%",background:T.goldS,border:`1px solid ${T.goldB}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:15}}>
          ✉️
          {emailTasks.length>0&&<span style={{position:"absolute",top:-3,right:-3,background:T.red,color:"#fff",fontSize:9,fontWeight:700,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{emailTasks.length}</span>}
        </button>
        <button onClick={()=>setAddModal(true)} style={{width:36,height:36,borderRadius:"50%",background:T.goldS,border:`1px solid ${T.goldB}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:20,color:T.gold,fontWeight:700,lineHeight:1}}>+</button>
        <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,border:`2px solid ${T.gold}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:T.gold}}>A</div>
      </div>
    </div>
  );

  const renderSummaryCard = () => (
    <div style={{margin:"14px 16px 0",background:`linear-gradient(135deg,${T.navy},rgba(0,50,98,0.5))`,border:`1px solid ${T.goldB}`,borderRadius:14,padding:16,display:"flex",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${T.gold},transparent)`}}/>
      {[{n:todayCount,l:"Due Today",c:T.gold},{n:openCount,l:"Open",c:T.textSoft},{n:emailTasks.length,l:"Emails",c:T.email}].map(({n,l,c},i,arr)=>(
        <div key={l} style={{flex:1,textAlign:"center",borderRight:i<arr.length-1?`1px solid ${T.goldB}`:"none"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,color:c,fontWeight:700,lineHeight:1}}>{n}</div>
          <div style={{fontSize:10,color:"rgba(253,181,21,0.45)",textTransform:"uppercase",letterSpacing:"0.8px",marginTop:4,fontWeight:600}}>{l}</div>
        </div>
      ))}
    </div>
  );

  const renderBottomNav = () => (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:T.navBg,borderTop:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:"repeat(4,1fr)",padding:"10px 0 22px",backdropFilter:"blur(20px)",zIndex:100}}>
      {[{key:"tasks",ico:I.tasks,label:"Tasks"},{key:"today",ico:I.today,label:"Today"},{key:"calendar",ico:I.cal,label:"Calendar"},{key:"email",ico:I.mail,label:"Email"}].map(n=>(
        <div key={n.key} onClick={()=>{setView(n.key);setDayFilter(null);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}>
          <Ico d={n.ico} size={20} color={view===n.key?T.gold:T.textMute}/>
          <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.5px",textTransform:"uppercase",color:view===n.key?T.gold:T.textMute}}>{n.label}</span>
          {view===n.key&&<div style={{width:4,height:4,borderRadius:"50%",background:T.gold,marginTop:1}}/>}
        </div>
      ))}
    </div>
  );

  // ── RENDER ───────────────────────────────────────────────────
  const base = {color:T.text,fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",fontSize:14,background:T.bg};

  if (!isMobile) return (
    <div style={{...base,display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
      <GoldBar/>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {renderSidebar()}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",borderRight:`1px solid ${T.borderS}`}}>
          {renderMainHeader()}
          {(view==="tasks"||view==="today")&&renderWeekStrip(true)}
          {(view==="tasks"||view==="today")&&renderFilterPills(28)}
          <div style={{flex:1,overflowY:"auto",padding:"0 28px"}}>
            {view==="tasks"&&renderFeed(false)}
            {view==="today"&&renderFeed(true)}
            {view==="calendar"&&renderCalendar(0)}
            {view==="email"&&renderEmailView(0)}
          </div>
        </div>
        {selectedTask&&renderDetailPanel()}
      </div>
      {renderModals()}
    </div>
  );

  return (
    <div style={{...base,maxWidth:430,margin:"0 auto",minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <GoldBar/>
      {renderTopBar()}
      {(view==="tasks"||view==="today")&&renderWeekStrip(false)}
      <div style={{flex:1,overflowY:"auto",paddingBottom:80}}>
        {(view==="tasks"||view==="today")&&renderSummaryCard()}
        {(view==="tasks"||view==="today")&&renderFilterPills(16)}
        {view==="tasks"&&<div style={{padding:"0 16px"}}>{renderFeed(false)}</div>}
        {view==="today"&&<div style={{padding:"0 16px"}}>{renderFeed(true)}</div>}
        {view==="calendar"&&renderCalendar(16)}
        {view==="email"&&renderEmailView(16)}
      </div>
      {renderBottomNav()}
      {renderModals()}
    </div>
  );
}
