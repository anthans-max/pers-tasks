import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabase.js";

let _id = Date.now(); const uid = () => String(++_id);

const USER_ID = import.meta.env.VITE_USER_ID ?? "placeholder-user-id";

const T = {
  // backgrounds
  bg:         "#FAF7F2",
  bg2:        "#F5F1E8",
  navBg:      "#F5F1E8",
  navyDark:   "#C8BBA5",
  navyMid:    "#F5F1E8",
  navy:       "#D4C9B0",
  modal:      "#FAF7F2",

  // surfaces & borders
  surface:    "rgba(61,46,30,0.05)",
  border:     "#E0D8CA",
  borderS:    "rgba(61,46,30,0.10)",

  // accent — copper
  gold:  "#B5703A",
  goldS: "#FAF0E6",
  goldB: "rgba(181,112,58,0.22)",

  // text — warm brown
  text:     "#3D2E1E",
  textSoft: "#7A6045",
  textMute: "#A89070",

  // semantic
  email:  "#4A7C6F",
  emailS: "rgba(74,124,111,0.12)",
  red:    "#B94040",
  green:  "#4A7C6F",

  // Lotus forest greens
  forest:     "#2D4A35",
  forestMid:  "#3D6348",
  forestPale: "#EAF2EC",
  footerBg:   "#1A1A18",
};

const PC = { 1:"#B94040", 2:"#B5703A", 3:"#3D6348", 4:"#A89070" };
const PG = { 1:"rgba(185,64,64,0.12)", 2:"#FAF0E6", 3:"#EAF2EC", 4:"rgba(61,46,30,0.05)" };
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

/* DEFAULT_PROJECTS — seed reference (see scripts/seed.js)
const DEFAULT_PROJECTS = [
  {id:"lotus",name:"Lotus AI Lab",color:"#4A7C6F"},
  {id:"sundermed",name:"Sunder Med/Personal",color:"#B5871A"},
  {id:"personal",name:"Personal",color:"#7B6FAA"},
  {id:"aarasaan",name:"AaraSaan Consulting",color:"#8A8278"},
];
*/

/* DEFAULT_TASKS — seed reference (see scripts/seed.js)
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
*/

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
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [emailTasks, setEmailTasks] = useState([]);
  const [newsSummaries, setNewsSummaries] = useState([]);
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
  const [gcalEvents, setGcalEvents] = useState([]);
  const [calendarDbEvents, setCalendarDbEvents] = useState([]);
  const [gcalVisible, setGcalVisible] = useState(true);
  const [gcalLastSync, setGcalLastSync] = useState(null);
  const [gcalFetchKey, setGcalFetchKey] = useState(0);
  const [gcalLoading, setGcalLoading] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [modalName, setModalName] = useState("");
  const [showMorning, setShowMorning] = useState(true);
  const [yssQuote, setYssQuote] = useState({ quote: "", attribution: "", topic: "" });
  const isMobile = useIsMobile();

  useEffect(() => {
    Promise.all([
      supabase.from("tm_projects").select("*").eq("user_id", USER_ID),
      supabase.from("tm_tasks").select("*").eq("user_id", USER_ID).eq("completed", false),
      supabase.from("tm_email_tasks").select("*").eq("user_id", USER_ID),
      supabase.from("tm_news_summaries").select("*").order("story_date", { ascending: false }).limit(30),
    ]).then(([p, t, e, n]) => {
      if (p.error) console.error("fetch tm_projects:", p.error.message);
      else setProjects(p.data.map(r => ({ id: r.id, name: r.name, color: r.color })));
      if (t.error) console.error("fetch tm_tasks:", t.error.message);
      else setTasks(t.data.map(r => ({
        id: r.id, projectId: r.project_id, title: r.title, notes: r.notes ?? "",
        priority: r.priority, dueDate: r.due_date ?? "", completed: r.completed,
        recurring: r.recurring ?? false, subtasks: r.subtasks ?? 0,
        subtasksDone: r.subtasks_done ?? 0, fromEmail: r.from_email,
        emailFrom: r.email_from ?? "",
      })));
      if (e.error) console.error("fetch tm_email_tasks:", e.error.message);
      else setEmailTasks(e.data.map(r => ({
        id: r.id, title: r.title, emailFrom: r.email_from ?? "",
        emailDate: r.email_date ?? "", priority: r.priority,
        dueDate: r.due_date ?? "", captured: r.captured_at ?? "",
      })));
      if (n.error) console.error("fetch tm_news_summaries:", n.error.message);
      else setNewsSummaries(n.data.map(r => ({
        id: r.id, source: r.source, headline: r.headline,
        category: r.category, summary: r.summary,
        url: r.url ?? null, storyDate: r.story_date,
      })));
    });
  }, []);

  useEffect(() => {
    if (!showMorning) return;
    fetch("/api/yss-quote")
      .then(r => r.json())
      .then(data => { if (data.quote) setYssQuote(data); })
      .catch(err => console.error("[yss] fetch error:", err));
  }, [showMorning]);

  useEffect(() => {
    if (view !== "calendar") return;
    const month = `${calMonth.year}-${String(calMonth.month+1).padStart(2,"0")}`;
    const url = gcalFetchKey > 0
      ? `/api/gcal/events?month=${month}&bust=1`
      : `/api/gcal/events?month=${month}`;
    console.log("[gcal] fetching", url);
    setGcalLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(({ events=[], lastFetch, warning, cached, debug }) => {
        if (warning) console.warn("[gcal] warning:", warning);
        console.log(`[gcal] response: ${events.length} events, cached=${cached}, lastFetch=${lastFetch ? new Date(lastFetch).toLocaleTimeString() : null}`);
        if (debug) { console.log("[gcal] debug:", JSON.stringify(debug, null, 2)); }
        if (events.length) console.log("[gcal] first 5 events:", events.slice(0,5));
        setGcalEvents(events);
        if (lastFetch) setGcalLastSync(lastFetch);
      })
      .catch(err => { console.error("[gcal] fetch error:", err); setGcalEvents([]); })
      .finally(() => setGcalLoading(false));
  }, [view, calMonth, gcalFetchKey]);

  useEffect(() => {
    if (view !== "calendar") return;
    const {year, month} = calMonth;
    const startDate = `${year}-${String(month+1).padStart(2,"0")}-01`;
    const endDate = `${year}-${String(month+1).padStart(2,"0")}-${new Date(year,month+1,0).getDate()}`;
    supabase.from("tm_calendar_events")
      .select("id,gcal_event_id,title,event_type,start_date,calendar_source,location")
      .gte("start_date", startDate)
      .lte("start_date", endDate)
      .then(({data, error}) => {
        if (error) console.error("fetch tm_calendar_events:", error.message);
        else setCalendarDbEvents(data || []);
      });
  }, [view, calMonth]);

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
    const gcalMapped = gcalVisible ? gcalEvents.filter(e=>e.date).map(e=>({...e,_gcal:true,dueDate:e.date})) : [];
    console.log(`[calData] year=${year} month=${month}(0-idx) gcalEvents=${gcalEvents.length} gcalMapped=${gcalMapped.length} gcalVisible=${gcalVisible}`);
    if (gcalMapped.length) console.log("[calData] gcal sample:", gcalMapped.slice(0,3).map(e=>({title:e.title,dueDate:e.dueDate})));
    const calDbMapped = calendarDbEvents.map(e=>({...e,_calEvent:true,dueDate:e.start_date}));
    const all = [
      ...tasks.filter(t=>!t.completed&&t.dueDate),
      ...emailTasks.filter(e=>e.dueDate).map(e=>({...e,_email:true})),
      ...gcalMapped,
      ...calDbMapped,
    ];
    const byDate = {};
    all.forEach(t => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate+"T00:00:00");
      if (d.getFullYear()===year&&d.getMonth()===month) {
        const k = d.getDate(); if(!byDate[k]) byDate[k]=[]; byDate[k].push(t);
      }
    });
    console.log(`[calData] byDate keys with events:`, Object.keys(byDate));
    return {daysInMonth,startPad,byDate};
  }, [calMonth,tasks,emailTasks,gcalEvents,gcalVisible,calendarDbEvents]);

  // Handlers
  const addTask = () => {
    if (!newTitle.trim()) return;
    const newTask = {id:uid(),projectId:newProject,title:newTitle.trim(),priority:newPrio,dueDate:newDate,subtasks:0,subtasksDone:0,completed:false,fromEmail:false};
    setTasks(p=>[...p,newTask]);
    setNewTitle(""); setNewPrio(4); setNewDate(""); setAddModal(false);
    supabase.from("tm_tasks").insert({
      id:newTask.id, user_id:USER_ID, project_id:newTask.projectId, title:newTask.title,
      priority:newTask.priority, due_date:newTask.dueDate||null, completed:false,
      recurring:false, subtasks:0, subtasks_done:0, from_email:false, notes:"",
    }).then(({error})=>{ if(error) console.error("addTask:", error.message); });
  };
  const toggleDone = (id) => {
    setTasks(p=>p.map(t=>t.id===id?{...t,completed:true}:t));
    if(selectedTask?.id===id) setSelectedTask(null);
    supabase.from("tm_tasks").update({completed:true}).eq("id",id)
      .then(({error})=>{ if(error) console.error("toggleDone:", error.message); });
  };
  const deleteTask = (id) => {
    setTasks(p=>p.filter(t=>t.id!==id));
    if(selectedTask?.id===id) setSelectedTask(null);
    supabase.from("tm_tasks").delete().eq("id",id)
      .then(({error})=>{ if(error) console.error("deleteTask:", error.message); });
  };
  const updateTask = (id,u) => {
    setTasks(p=>p.map(t=>t.id===id?{...t,...u}:t));
    if(selectedTask?.id===id) setSelectedTask(p=>({...p,...u}));
    const patch = {};
    if(u.title      !== undefined) patch.title         = u.title;
    if(u.priority   !== undefined) patch.priority      = u.priority;
    if(u.dueDate    !== undefined) patch.due_date       = u.dueDate || null;
    if(u.projectId  !== undefined) patch.project_id    = u.projectId;
    if(u.recurring  !== undefined) patch.recurring     = u.recurring;
    if(u.subtasks   !== undefined) patch.subtasks      = u.subtasks;
    if(u.subtasksDone !== undefined) patch.subtasks_done = u.subtasksDone;
    if(u.notes      !== undefined) patch.notes         = u.notes;
    if(Object.keys(patch).length)
      supabase.from("tm_tasks").update(patch).eq("id",id)
        .then(({error})=>{ if(error) console.error("updateTask:", error.message); });
  };
  const assignEmail = (eid,projId) => {
    const et = emailTasks.find(e=>e.id===eid); if(!et) return;
    const newTask = {id:uid(),projectId:projId,title:et.title,priority:et.priority,dueDate:et.dueDate||"",subtasks:0,subtasksDone:0,completed:false,fromEmail:true,emailFrom:et.emailFrom};
    setTasks(p=>[...p,newTask]);
    setEmailTasks(p=>p.filter(e=>e.id!==eid));
    setAssigningEmail(null);
    Promise.all([
      supabase.from("tm_tasks").insert({
        id:newTask.id, user_id:USER_ID, project_id:newTask.projectId, title:newTask.title,
        priority:newTask.priority, due_date:newTask.dueDate||null, completed:false,
        recurring:false, subtasks:0, subtasks_done:0, from_email:true,
        email_from:newTask.emailFrom, notes:"",
      }),
      supabase.from("tm_email_tasks").delete().eq("id",eid),
    ]).then(([ins,del])=>{
      if(ins.error) console.error("assignEmail insert:", ins.error.message);
      if(del.error) console.error("assignEmail delete:", del.error.message);
    });
  };
  const toggleEmailSelect = (id) => setSelectedEmails(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const batchAssign = (projId) => {
    const ids = [...selectedEmails];
    const newTasks = ids.map(eid => {
      const et = emailTasks.find(e=>e.id===eid); if(!et) return null;
      return {id:uid(),projectId:projId,title:et.title,priority:et.priority,dueDate:et.dueDate||"",subtasks:0,subtasksDone:0,completed:false,fromEmail:true,emailFrom:et.emailFrom};
    }).filter(Boolean);
    setTasks(p=>[...p,...newTasks]);
    setEmailTasks(p=>p.filter(e=>!selectedEmails.has(e.id)));
    setSelectedEmails(new Set());
    Promise.all([
      supabase.from("tm_tasks").insert(newTasks.map(t=>({
        id:t.id, user_id:USER_ID, project_id:t.projectId, title:t.title,
        priority:t.priority, due_date:t.dueDate||null, completed:false,
        recurring:false, subtasks:0, subtasks_done:0, from_email:true,
        email_from:t.emailFrom, notes:"",
      }))),
      supabase.from("tm_email_tasks").delete().in("id",ids),
    ]).then(([ins,del])=>{
      if(ins.error) console.error("batchAssign insert:", ins.error.message);
      if(del.error) console.error("batchAssign delete:", del.error.message);
    });
  };
  const batchDismiss = () => {
    const ids = [...selectedEmails];
    setEmailTasks(p=>p.filter(e=>!selectedEmails.has(e.id)));
    setSelectedEmails(new Set());
    supabase.from("tm_email_tasks").delete().in("id",ids)
      .then(({error})=>{ if(error) console.error("batchDismiss:", error.message); });
  };
  const addProject = () => {
    if(!modalName.trim()) return;
    const id=uid();
    setProjects(p=>[...p,{id,name:modalName.trim(),color:T.gold}]);
    setModalName(""); setShowProjectModal(false);
    supabase.from("tm_projects").insert({id, user_id:USER_ID, name:modalName.trim(), color:T.gold})
      .then(({error})=>{ if(error) console.error("addProject:", error.message); });
  };

  // ── Shared Components ────────────────────────────────────────

  // Tab button for header navigation
  const TabBtn = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{
      background: active ? "#2d4a35" : "transparent",
      border: "none",
      borderRadius: 100,
      color: active ? "#faf7f2" : "#a89070",
      padding: "7px 18px",
      fontSize: "0.62rem",
      fontWeight: 500,
      fontFamily: "'Syne', sans-serif",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      cursor: "pointer",
      transition: "all 0.15s",
    }}>{children}</button>
  );

  // Desktop app header — "LotusList" branding with tab navigation
  const GoldBar = () => (
    <div style={{
      background: "#faf7f2",
      borderBottom: "1px solid #e0d8ca",
      padding: "14px 28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* Brand */}
      <div>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "1.25rem",
          fontWeight: 600,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#3d2e1e",
        }}>
          Lotus<em style={{ fontStyle: "italic", fontWeight: 400 }}>List</em>
        </div>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "0.6rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#a89070",
          marginTop: 2,
        }}>Task Manager · 2026</div>
      </div>

      {/* Tab navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {[{label:"Tasks",key:"tasks"},{label:"Calendar",key:"calendar"},{label:"Emails",key:"email"},{label:"News",key:"news"}].map(({label,key}) => (
          <TabBtn
            key={key}
            active={view === key}
            onClick={() => setView(key)}
          >
            {label}
          </TabBtn>
        ))}
        {/* Finance — external link */}
        <a href="https://ledger.getlotusai.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <TabBtn active={false}>Finance</TabBtn>
        </a>
      </div>
    </div>
  );

  // Footer bar — "Powered by Lotus AI" with logo
  const PoweredFooter = () => (
    <div style={{position:"fixed",bottom:0,left:0,right:0,height:36,zIndex:490,background:T.footerBg,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
      <img src="/lotus-logo.png" alt="Lotus" style={{height:20,width:"auto"}}/>
      <a href="https://getlotusai.com" target="_blank" rel="noopener noreferrer" style={{fontFamily:"'Syne',sans-serif",fontSize:"0.6rem",fontWeight:500,letterSpacing:"0.28em",textTransform:"uppercase",color:"rgba(255,255,255,0.45)",textDecoration:"none"}}>Powered by Lotus AI</a>
    </div>
  );

  const inp = {background:"rgba(44,40,32,0.06)",border:`1px solid ${T.border}`,color:T.text,borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"};

  const TaskCard = ({task}) => {
    const sel = selectedTask?.id===task.id;
    const od=isOverdue(task.dueDate), td=isToday(task.dueDate);
    return (
      <div onClick={()=>setSelectedTask(sel?null:task)}
        style={{display:"flex",alignItems:"flex-start",gap:12,padding:"13px 16px",borderRadius:11,
          background:sel?"rgba(61,46,30,0.10)":T.bg2,
          border:`1px solid ${sel?T.goldB:T.borderS}`,
          position:"relative",overflow:"hidden",cursor:"pointer",marginBottom:4,transition:"all 0.15s"}}
        onMouseEnter={e=>{e.currentTarget.style.background="#EDE9DF";e.currentTarget.style.borderColor=T.navyDark;}}
        onMouseLeave={e=>{e.currentTarget.style.background=sel?"rgba(61,46,30,0.10)":T.bg2;e.currentTarget.style.borderColor=sel?T.goldB:T.borderS;}}
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
            {task.dueDate&&<span style={{fontSize:11,fontWeight:600,color:od?T.red:td?T.forestMid:T.textMute,display:"flex",alignItems:"center",gap:3}}>
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
                  <span style={{fontFamily:"'Syne',sans-serif",fontSize:9,fontWeight:500,letterSpacing:"1.8px",textTransform:"uppercase",color:T.textMute}}>{proj.name}</span>
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
            background:dayFilter===d.date?T.forestPale:"transparent",
            border:`1px solid ${dayFilter===d.date?"rgba(45,74,53,0.3)":"transparent"}`,
          }}
        >
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:9,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.6px",color:(dayFilter===d.date||d.isToday)?T.forest:T.textMute}}>{d.name}</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:(dayFilter===d.date||d.isToday)?T.gold:T.textMute}}>{d.num}</div>
          {d.hasTasks?<div style={{width:4,height:4,borderRadius:"50%",background:T.gold}}/>:<div style={{width:4,height:4}}/>}
        </div>
      ))}
      {compact&&<>
        <div style={{flex:1}}/>
        <div style={{display:"flex",gap:20,alignItems:"center",padding:"0 4px"}}>
          {[{n:todayCount,l:"Today",c:T.gold},{n:openCount,l:"Open",c:T.textSoft},{n:emailTasks.length,l:"Emails",c:T.email}].map(({n,l,c},i)=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:c,fontWeight:600,lineHeight:1}}>{n}</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:9,color:T.textMute,textTransform:"uppercase",letterSpacing:"0.8px",marginTop:2}}>{l}</div>
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
          style={{padding:"7px 18px",borderRadius:100,fontSize:12,fontWeight:500,whiteSpace:"nowrap",cursor:"pointer",transition:"all 0.15s",fontFamily:"'Jost',sans-serif",
            background:projectFilter===f.id?T.forest:T.bg,
            border:`1px solid ${projectFilter===f.id?T.forest:T.border}`,
            color:projectFilter===f.id?T.bg:T.textSoft,
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
    const gcalPill = (t) => {
      const lower=(t.title||"").toLowerCase();
      if(lower.includes("birthday")||lower.includes("bday")||lower.includes("anniversary")||lower.includes("anniv")) return {bg:"rgba(181,135,26,0.15)",c:"#8A6310",b:"rgba(181,135,26,0.5)"};
      if(t.calendarSource==="shared") return {bg:"rgba(123,111,170,0.15)",c:"#4A3F80",b:"rgba(123,111,170,0.5)"};
      return {bg:"rgba(74,124,111,0.15)",c:"#2A5E54",b:"rgba(74,124,111,0.5)"};
    };
    const calEventPill = (t) => {
      if(t.event_type==="birthday"||t.event_type==="anniversary") return {bg:"rgba(181,135,26,0.15)",c:"#8A6310",b:"rgba(181,135,26,0.5)"};
      if(t.event_type==="appointment") return {bg:"rgba(74,124,111,0.15)",c:"#2A5E54",b:"rgba(74,124,111,0.5)"};
      if(t.event_type==="reminder") return {bg:"rgba(185,64,64,0.10)",c:"#B94040",b:"rgba(185,64,64,0.4)"};
      if(t.calendar_source==="shared") return {bg:"rgba(123,111,170,0.15)",c:"#4A3F80",b:"rgba(123,111,170,0.5)"};
      return {bg:"rgba(74,124,111,0.10)",c:"#2A5E54",b:"rgba(74,124,111,0.35)"};
    };
    return (
      <div style={{padding:`16px ${padH}px`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:gcalVisible&&gcalLastSync?8:16,flexWrap:"wrap"}}>
          <button onClick={()=>setCalMonth(p=>p.month===0?{year:p.year-1,month:11}:{...p,month:p.month-1})} style={{background:"rgba(44,40,32,0.06)",border:`1px solid ${T.borderS}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center"}}><Ico d={I.chevL} size={16} color={T.textSoft}/></button>
          <div style={{flex:1,textAlign:"center",fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:400,color:T.gold}}>{MONTHS[month]} {year}</div>
          <button onClick={()=>setCalMonth(p=>p.month===11?{year:p.year+1,month:0}:{...p,month:p.month+1})} style={{background:"rgba(44,40,32,0.06)",border:`1px solid ${T.borderS}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center"}}><Ico d={I.chevR} size={16} color={T.textSoft}/></button>
          <button onClick={()=>setCalMonth({year:tY,month:tM})} style={{padding:"6px 12px",background:"rgba(44,40,32,0.06)",border:`1px solid ${T.borderS}`,color:T.textSoft,borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:400}}>Today</button>
          <button onClick={()=>setGcalVisible(p=>!p)} title={gcalVisible?"Hide Google Calendar events":"Show Google Calendar events"}
            style={{padding:"6px 10px",background:gcalVisible?"rgba(74,124,111,0.15)":"rgba(44,40,32,0.06)",border:`1px solid ${gcalVisible?"rgba(74,124,111,0.45)":T.borderS}`,color:gcalVisible?"#2A5E54":T.textMute,borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:400,display:"flex",alignItems:"center",gap:5}}>
            <Ico d={I.recur} size={12} color={gcalVisible?"#2A5E54":T.textMute}/>
            GCal
          </button>
          <button onClick={()=>setGcalFetchKey(k=>k+1)} disabled={gcalLoading} title="Force-refresh Google Calendar"
            style={{padding:"6px 8px",background:"rgba(44,40,32,0.06)",border:`1px solid ${T.borderS}`,borderRadius:8,cursor:gcalLoading?"not-allowed":"pointer",display:"flex",alignItems:"center",opacity:gcalLoading?0.5:1}}>
            <Ico d={I.recur} size={13} color={T.textSoft} style={gcalLoading?{animation:"spin 1s linear infinite"}:{}}/>
          </button>
        </div>
        {gcalVisible&&gcalLastSync&&(
          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:10,fontSize:10,color:T.textMute}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:"#4A7C6F",display:"inline-block",flexShrink:0}}/>
            Synced {new Date(gcalLastSync).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
          </div>
        )}
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
              <div key={i} style={{minHeight:padH>0?88:70,background:day?"rgba(61,46,30,0.06)":"transparent",border:`1px solid ${isT?T.goldB:day?T.borderS:"transparent"}`,borderRadius:8,padding:day?"5px 6px":0,opacity:day?1:0,overflow:"hidden"}}>
                {day&&<>
                  <div style={{fontSize:12,fontWeight:isT?800:600,color:isT?T.gold:isPast?T.textMute:T.textSoft,marginBottom:3,display:"flex",alignItems:"center",gap:3}}>
                    {isT&&<span style={{width:5,height:5,borderRadius:"50%",background:T.gold,display:"inline-block"}}/>}{day}
                  </div>
                  {dt.slice(0,maxShow).map((t,ti)=>{
                    const p=t._gcal?gcalPill(t):t._calEvent?calEventPill(t):{bg:t._email?T.emailS:PG[t.priority]||"rgba(255,255,255,0.05)",c:t._email?T.email:PC[t.priority]||T.textMute,b:t._email?T.email:PC[t.priority]||T.textMute};
                    return (
                      <div key={ti} title={t.title} onClick={()=>!t._gcal&&t.sectionId&&setSelectedTask(t)}
                        style={{fontSize:10,padding:"2px 5px",borderRadius:3,marginBottom:2,background:p.bg,color:p.c,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",borderLeft:`2px solid ${p.b}`,cursor:!t._gcal&&t.sectionId?"pointer":"default"}}
                      >{t.title}</div>
                    );
                  })}
                  {dt.length>maxShow&&<div style={{fontSize:9,color:T.textMute,padding:"1px 5px"}}>+{dt.length-maxShow} more</div>}
                </>}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:12,marginTop:14,paddingTop:12,borderTop:`1px solid ${T.borderS}`,flexWrap:"wrap"}}>
          {[
            {l:"Urgent",c:PC[1],b:PG[1]},{l:"High",c:PC[2],b:PG[2]},{l:"Medium",c:PC[3],b:PG[3]},{l:"Email",c:T.email,b:T.emailS},
            ...(gcalVisible?[{l:"GCal",c:"#2A5E54",b:"rgba(74,124,111,0.15)"},{l:"Shared",c:"#4A3F80",b:"rgba(123,111,170,0.15)"},{l:"Birthday",c:"#8A6310",b:"rgba(181,135,26,0.15)"}]:[]),
          ].map(x=>(
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
                <div key={et.id} style={{background:T.bg2,border:`1px solid ${checked?T.goldB:T.emailS}`,borderLeft:`3px solid ${checked?T.gold:T.email}`,borderRadius:12,padding:"14px 16px",transition:"border-color 0.15s"}}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <button onClick={()=>toggleEmailSelect(et.id)}
                      style={{width:20,height:20,minWidth:20,borderRadius:5,border:`2px solid ${checked?T.gold:T.borderS}`,background:checked?T.gold:"transparent",cursor:"pointer",padding:0,flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}
                    >
                      {checked&&<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                    <div style={{width:36,height:36,borderRadius:10,background:T.emailS,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18}}>✉️</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:6}}>{et.title}</div>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:11,background:T.emailS,color:T.email,padding:"2px 8px",borderRadius:8,fontWeight:600}}>From: {et.emailFrom}</span>
                        <span style={{fontSize:11,background:PG[et.priority],color:PC[et.priority],padding:"2px 8px",borderRadius:8,fontWeight:600}}>{PL[et.priority]}</span>
                        {et.dueDate&&<span style={{fontSize:11,color:isOverdue(et.dueDate)?T.red:T.textMute,fontWeight:600}}>📅 {fmtDate(et.dueDate)}</span>}
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
              style={{flex:1,minWidth:140,background:"rgba(44,40,32,0.06)",border:`1px solid ${T.goldB}`,color:T.text,borderRadius:8,padding:"7px 10px",fontSize:12,outline:"none"}}>
              {sortedProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={()=>batchAssign(batchProject)}
              style={{padding:"7px 16px",background:T.forest,border:"none",color:T.bg,borderRadius:100,cursor:"pointer",fontSize:12,fontWeight:400,letterSpacing:"0.05em",whiteSpace:"nowrap",fontFamily:"'Jost', sans-serif"}}>
              Assign
            </button>
            <button onClick={batchDismiss}
              style={{padding:"7px 12px",background:T.surface,border:`1px solid ${T.borderS}`,color:T.textMute,borderRadius:6,cursor:"pointer",fontSize:12,whiteSpace:"nowrap"}}>
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── News View ───────────────────────────────────────────────
  const renderNewsView = (padH=16) => {
    const sourceColors = {
      "The Rundown AI": { bg: "rgba(181,112,58,0.10)", color: T.gold },
      "Superhuman AI": { bg: "rgba(74,124,111,0.10)", color: T.email },
      "TLDR Founders": { bg: "rgba(61,46,30,0.08)", color: T.textSoft },
    };
    // Group stories by date
    const byDate = {};
    newsSummaries.forEach(s => {
      if (!byDate[s.storyDate]) byDate[s.storyDate] = [];
      byDate[s.storyDate].push(s);
    });
    const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

    return (
      <div style={{padding:`16px ${padH}px`}}>
        {newsSummaries.length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 20px",color:T.textMute}}>
            <div style={{fontSize:40,marginBottom:12}}>📰</div>
            <div style={{fontSize:15,fontWeight:600,color:T.textSoft}}>No news yet</div>
            <div style={{fontSize:13,marginTop:6}}>Stories from your newsletters will appear here</div>
          </div>
        ) : dates.map(date => (
          <div key={date} style={{marginBottom:28}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:500,letterSpacing:"1.5px",textTransform:"uppercase",color:T.textMute,marginBottom:10}}>
              {new Date(date + "T00:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {byDate[date].map(story => {
                const sc = sourceColors[story.source] || { bg: T.surface, color: T.textSoft };
                return (
                  <div key={story.id} style={{background:T.bg2,border:`1px solid ${T.borderS}`,borderRadius:12,padding:"14px 16px",transition:"all 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=T.navyDark;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(61,46,30,0.10)";}}
                  >
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                      <span style={{fontSize:11,background:sc.bg,color:sc.color,padding:"2px 8px",borderRadius:8,fontWeight:600}}>{story.source}</span>
                      <span style={{fontSize:11,background:T.forestPale,color:T.forest,padding:"2px 8px",borderRadius:8,fontWeight:600}}>{story.category}</span>
                    </div>
                    {story.url ? (
                      <a href={story.url} target="_blank" rel="noopener noreferrer" style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:6,lineHeight:1.4,display:"block",textDecoration:"none",borderBottom:`1px solid ${T.border}`}}
                        onMouseEnter={e=>{e.currentTarget.style.color=T.forest;e.currentTarget.style.borderBottomColor=T.forest;}}
                        onMouseLeave={e=>{e.currentTarget.style.color=T.text;e.currentTarget.style.borderBottomColor=T.border;}}
                      >{story.headline}</a>
                    ) : (
                      <div style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:6,lineHeight:1.4}}>{story.headline}</div>
                    )}
                    <div style={{fontSize:13,color:T.textSoft,lineHeight:1.5}}>{story.summary}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
          <button onClick={onSave} style={{padding:"10px 24px",background:T.forest,border:"none",color:T.bg,borderRadius:100,cursor:"pointer",fontWeight:400,fontSize:14,letterSpacing:"0.05em",fontFamily:"'Jost', sans-serif"}}>Create</button>
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
              <button onClick={addTask} style={{padding:"10px 28px",background:T.forest,border:"none",color:T.bg,borderRadius:100,cursor:"pointer",fontWeight:400,fontSize:14,letterSpacing:"0.05em",fontFamily:"'Jost', sans-serif"}}>Add Task</button>
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
            <button onClick={()=>toggleDone(selectedTask.id)} style={{width:"100%",padding:13,background:T.forest,border:"none",color:T.bg,borderRadius:100,cursor:"pointer",fontWeight:400,fontSize:15,letterSpacing:"0.05em",fontFamily:"'Jost', sans-serif"}}>✓ Mark Complete</button>
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
                onMouseEnter={e=>e.currentTarget.style.background="rgba(44,40,32,0.06)"}
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
          <div style={{width:38,height:38,borderRadius:"50%",background:T.forest,border:`2px solid ${T.forestMid}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:14,color:T.bg,flexShrink:0,fontFamily:"'Syne',sans-serif"}}>A</div>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:T.text,fontWeight:600}}>Anthan</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:11,color:T.textMute,letterSpacing:"0.05em"}}>Lotus List</div>
          </div>
        </div>
        <button onClick={()=>{setNewProject(projectFilter==="all"?projects[0]?.id:projectFilter);setAddModal(true);}}
          style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",background:T.forest,border:"none",borderRadius:100,color:T.bg,fontSize:13,fontWeight:400,letterSpacing:"0.12em",cursor:"pointer",fontFamily:"'Jost', sans-serif",justifyContent:"center"}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"rgba(250,247,242,0.18)",color:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:400,flexShrink:0}}>+</div>
          Add task
        </button>
      </div>

      <div style={{padding:"12px 12px 4px",flexShrink:0}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:500,letterSpacing:"1.5px",textTransform:"uppercase",color:T.textMute,padding:"0 8px 8px"}}>Views</div>
        {[
          {key:"tasks",icon:I.tasks,label:"All Tasks",badge:openCount,badgeBg:T.surface,badgeC:T.textMute},
          {key:"today",icon:I.today,label:"Today",badge:todayCount||null,badgeBg:T.forest,badgeC:T.bg},
          {key:"calendar",icon:I.cal,label:"Calendar",badge:null},
          {key:"email",icon:I.mail,label:"Email Capture",badge:emailTasks.length||null,badgeBg:T.email,badgeC:T.bg},
          {key:"news",icon:I.tasks,label:"News",badge:null},
        ].map(n=>(
          <div key={n.key} onClick={()=>{setView(n.key);setDayFilter(null);}}
            style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:9,cursor:"pointer",fontSize:13,marginBottom:1,color:view===n.key?T.forest:T.textSoft,background:view===n.key?T.forestPale:"transparent",borderLeft:`3px solid ${view===n.key?T.forest:"transparent"}`,transition:"all 0.15s"}}
            onMouseEnter={e=>{if(view!==n.key){e.currentTarget.style.background="rgba(61,46,30,0.05)";e.currentTarget.style.color=T.text;}}}
            onMouseLeave={e=>{if(view!==n.key){e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.textSoft;}}}
          >
            <Ico d={n.icon} size={16} color={view===n.key?T.forest:T.textMute}/>
            <span style={{flex:1}}>{n.label}</span>
            {n.badge?<span style={{fontSize:11,fontWeight:700,padding:"1px 7px",borderRadius:10,background:n.badgeBg,color:n.badgeC}}>{n.badge}</span>:null}
          </div>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"8px 12px",borderTop:`1px solid ${T.borderS}`,marginTop:6}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 8px 8px"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:500,letterSpacing:"1.5px",textTransform:"uppercase",color:T.textMute}}>Projects</div>
          <button onClick={()=>{setModalName("");setShowProjectModal(true);}} style={{background:"none",border:"none",cursor:"pointer",padding:2,opacity:0.5}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.5}>
            <Ico d={I.plus} size={14} color={T.textSoft}/>
          </button>
        </div>
        {sortedProjects.map(p=>{
          const active=projectFilter===p.id&&view==="tasks";
          return (
            <div key={p.id} onClick={()=>{setProjectFilter(p.id);setView("tasks");}}
              style={{display:"flex",alignItems:"center",gap:9,padding:"7px 10px",borderRadius:8,cursor:"pointer",fontSize:13,marginBottom:1,color:active?T.text:T.textSoft,background:active?"rgba(44,40,32,0.08)":"transparent",transition:"all 0.15s"}}
              onMouseEnter={e=>{if(!active){e.currentTarget.style.background="rgba(44,40,32,0.04)";e.currentTarget.style.color=T.text;}}}
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
        <button title="Settings" style={{flex:1,padding:8,borderRadius:8,background:T.surface,border:`1px solid ${T.borderS}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
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
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:500,color:T.textMute,textTransform:"uppercase",letterSpacing:"0.15em"}}>Task Detail</div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>deleteTask(task.id)} style={{background:"none",border:"none",cursor:"pointer",padding:6,borderRadius:6}} onMouseEnter={e=>e.currentTarget.style.background="rgba(185,64,64,0.10)"} onMouseLeave={e=>e.currentTarget.style.background="none"}><Ico d={I.trash} size={15} color={T.red}/></button>
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
          {task.fromEmail&&<div style={{background:T.emailS,border:`1px solid ${T.emailS}`,borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:10,fontWeight:700,color:T.email,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Email Origin</div>
            <div style={{fontSize:12,color:T.textSoft}}>From: {task.emailFrom}</div>
          </div>}
        </div>
        <div style={{padding:"14px 20px",borderTop:`1px solid ${T.borderS}`,flexShrink:0}}>
          <button onClick={()=>toggleDone(task.id)} style={{width:"100%",padding:11,background:T.forest,border:"none",color:T.bg,borderRadius:100,cursor:"pointer",fontWeight:400,fontSize:13,letterSpacing:"0.05em",fontFamily:"'Jost', sans-serif"}}>✓ Mark Complete</button>
        </div>
      </div>
    );
  };

  // ── Desktop Main Header ──────────────────────────────────────
  const renderMainHeader = () => {
    const titles={tasks:"All Tasks",today:"Today",calendar:"Calendar",email:"Email Capture",news:"News"};
    return (
      <div style={{padding:"18px 28px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.borderS}`,flexShrink:0}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:T.text}}>{titles[view]||"Tasks"}</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:11,color:T.textMute,marginTop:2,textTransform:"uppercase",letterSpacing:"0.3px"}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:T.surface,border:`1px solid ${T.borderS}`,borderRadius:8,padding:"7px 12px",width:200}}>
            <Ico d={I.search} size={14} color={T.textMute}/>
            <span style={{fontSize:12,color:T.textMute}}>Search tasks…</span>
          </div>
        </div>
      </div>
    );
  };

  // ── Mobile Top Bar ───────────────────────────────────────────
  const renderTopBar = () => (
    <div style={{padding:"0 20px",height:54,background:T.bg,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.25rem",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",color:T.text,display:"flex",alignItems:"baseline",gap:1}}>
        Lotus<em style={{fontStyle:"italic",color:T.forestMid}}>List</em>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <button onClick={()=>setView("email")} style={{position:"relative",width:36,height:36,borderRadius:"50%",background:T.forestPale,border:`1px solid rgba(45,74,53,0.25)`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:15}}>
          ✉️
          {emailTasks.length>0&&<span style={{position:"absolute",top:-3,right:-3,background:T.red,color:"#fff",fontSize:9,fontWeight:700,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{emailTasks.length}</span>}
        </button>
        <button onClick={()=>setAddModal(true)} style={{width:36,height:36,borderRadius:"50%",background:T.forest,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:20,color:T.bg,fontWeight:700,lineHeight:1}}>+</button>
        <div style={{width:36,height:36,borderRadius:"50%",background:T.forest,border:`2px solid ${T.forestMid}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:13,color:T.bg,fontFamily:"'Syne',sans-serif"}}>A</div>
      </div>
    </div>
  );

  const renderSummaryCard = () => (
    <div style={{margin:"14px 16px 0",background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,border:`1px solid ${T.border}`,borderRadius:14,padding:16,display:"flex",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${T.gold},transparent)`}}/>
      {[{n:todayCount,l:"Due Today",c:T.gold},{n:openCount,l:"Open",c:T.textSoft},{n:emailTasks.length,l:"Emails",c:T.email}].map(({n,l,c},i,arr)=>(
        <div key={l} style={{flex:1,textAlign:"center",borderRight:i<arr.length-1?`1px solid ${T.goldB}`:"none"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:c,fontWeight:600,lineHeight:1}}>{n}</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:10,color:T.textMute,textTransform:"uppercase",letterSpacing:"0.8px",marginTop:4,fontWeight:500}}>{l}</div>
        </div>
      ))}
    </div>
  );

  const renderBottomNav = () => (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:T.navBg,borderTop:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:"repeat(5,1fr)",padding:"10px 0 22px",backdropFilter:"blur(20px)",zIndex:100}}>
      {[{key:"tasks",ico:I.tasks,label:"Tasks"},{key:"today",ico:I.today,label:"Today"},{key:"calendar",ico:I.cal,label:"Calendar"},{key:"email",ico:I.mail,label:"Email"},{key:"news",ico:I.tasks,label:"News"}].map(n=>(
        <div key={n.key} onClick={()=>{setView(n.key);setDayFilter(null);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}>
          <Ico d={n.ico} size={20} color={view===n.key?T.forest:T.textMute}/>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:9,fontWeight:500,letterSpacing:"0.5px",textTransform:"uppercase",color:view===n.key?T.forest:T.textMute}}>{n.label}</span>
          {view===n.key&&<div style={{width:4,height:4,borderRadius:"50%",background:T.forest,marginTop:1}}/>}
        </div>
      ))}
    </div>
  );

  // ── MORNING SPLASH ─────────────────────────────────────────
  if (showMorning) {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    return (
      <div style={{
        background:T.bg, color:T.text, fontFamily:"'Jost', sans-serif",
        minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center",
        padding:"40px 24px", textAlign:"center", overflowY:"auto",
      }}>
        <div style={{flex:1}}/>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%"}}>
        {/* Wordmark */}
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.25rem",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",color:T.text,marginBottom:12,display:"flex",alignItems:"baseline",gap:1}}>
          Lotus<em style={{fontStyle:"italic",color:T.forestMid}}>List</em>
        </div>

        {/* Lotus SVG */}
        <svg width="56" height="56" viewBox="0 0 64 64" fill="none" style={{marginBottom:14}}>
          <path d="M32 12C32 12 20 24 20 36C20 44 25.4 50 32 52C38.6 50 44 44 44 36C44 24 32 12 32 12Z" fill={T.forestMid} opacity="0.18"/>
          <path d="M32 18C32 18 24 28 24 37C24 43 27.6 47.5 32 49C36.4 47.5 40 43 40 37C40 28 32 18 32 18Z" fill={T.forestMid} opacity="0.35"/>
          <path d="M32 24C32 24 28 30 28 36C28 40.5 29.8 43.5 32 45C34.2 43.5 36 40.5 36 36C36 30 32 24 32 24Z" fill={T.forestMid} opacity="0.6"/>
          <path d="M14 38C14 38 22 32 32 36C42 32 50 38 50 38C50 38 44 46 32 46C20 46 14 38 14 38Z" fill={T.forestMid} opacity="0.22"/>
        </svg>

        {/* Greeting */}
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:"0.6rem",fontWeight:500,letterSpacing:"0.22em",textTransform:"uppercase",color:T.textMute,marginBottom:8}}>Good Morning</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"2rem",fontWeight:600,color:T.text,marginBottom:6}}>Welcome back, Anthan</div>
        <div style={{fontSize:"0.82rem",color:T.textMute,marginBottom:40}}>{dateStr}  ·  Los Angeles</div>

        {/* YSS Quote */}
        {yssQuote.quote && (
          <div style={{maxWidth:620,width:"100%",textAlign:"left",marginBottom:48,padding:"0 8px"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              {/* Small lotus icon */}
              <svg width="36" height="36" viewBox="0 0 64 64" fill="none" style={{flexShrink:0}}>
                <path d="M32 18C32 18 24 28 24 37C24 43 27.6 47.5 32 49C36.4 47.5 40 43 40 37C40 28 32 18 32 18Z" fill={T.gold} opacity="0.5"/>
                <path d="M14 38C14 38 22 32 32 36C42 32 50 38 50 38C50 38 44 46 32 46C20 46 14 38 14 38Z" fill={T.gold} opacity="0.35"/>
              </svg>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:"0.6rem",fontWeight:600,letterSpacing:"0.18em",textTransform:"uppercase",color:T.gold}}>Spiritual Thought of the Day</div>
                {yssQuote.topic && (
                  <span style={{fontSize:"0.6rem",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",border:`1.5px solid ${T.text}`,borderRadius:4,padding:"2px 8px",color:T.text}}>{yssQuote.topic}</span>
                )}
              </div>
            </div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.2rem",fontStyle:"italic",lineHeight:1.7,color:T.text,marginBottom:14}}>
              "{yssQuote.quote}"
            </div>
            <div style={{fontSize:"0.78rem",color:T.textMute,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontWeight:600,color:T.textSoft}}>{yssQuote.attribution}</span>
              <span>·</span>
              <a href="https://yssofindia.org/quote" target="_blank" rel="noopener noreferrer" style={{color:T.textMute,textDecoration:"none",fontSize:"0.72rem"}}>
                yssofindia.org ↗
              </a>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={() => setShowMorning(false)}
          style={{
            fontFamily:"'Syne',sans-serif",fontSize:"0.72rem",fontWeight:600,
            letterSpacing:"0.12em",textTransform:"uppercase",
            background:T.forest,color:"#fff",
            border:"none",borderRadius:24,padding:"12px 36px",
            cursor:"pointer",transition:"background 0.2s",
          }}
          onMouseEnter={e=>e.currentTarget.style.background=T.forestMid}
          onMouseLeave={e=>e.currentTarget.style.background=T.forest}
        >
          Let's start our day
        </button>
        </div>
        <div style={{flex:1}}/>
      </div>
    );
  }

  // ── RENDER ───────────────────────────────────────────────────
  const base = {color:T.text,fontFamily:"'Jost', sans-serif",fontSize:14,background:T.bg};

  if (!isMobile) return (
    <div style={{...base,display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
      <GoldBar/>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {renderSidebar()}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",borderRight:`1px solid ${T.borderS}`}}>
          {renderMainHeader()}
          {(view==="tasks"||view==="today")&&renderWeekStrip(true)}
          {(view==="tasks"||view==="today")&&renderFilterPills(28)}
          <div style={{flex:1,overflowY:"auto",padding:"0 28px 52px"}}>
            {view==="tasks"&&renderFeed(false)}
            {view==="today"&&renderFeed(true)}
            {view==="calendar"&&renderCalendar(0)}
            {view==="email"&&renderEmailView(0)}
            {view==="news"&&renderNewsView(0)}
          </div>
        </div>
        {selectedTask&&renderDetailPanel()}
      </div>
      <PoweredFooter/>
      {renderModals()}
    </div>
  );

  return (
    <div style={{...base,maxWidth:430,margin:"0 auto",height:"100vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>
      {renderTopBar()}
      {(view==="tasks"||view==="today")&&renderWeekStrip(false)}
      <div style={{flex:1,overflowY:"auto",paddingBottom:80}}>
        {(view==="tasks"||view==="today")&&renderSummaryCard()}
        {(view==="tasks"||view==="today")&&renderFilterPills(16)}
        {view==="tasks"&&<div style={{padding:"0 16px"}}>{renderFeed(false)}</div>}
        {view==="today"&&<div style={{padding:"0 16px"}}>{renderFeed(true)}</div>}
        {view==="calendar"&&renderCalendar(16)}
        {view==="email"&&renderEmailView(16)}
        {view==="news"&&renderNewsView(16)}
      </div>
      {renderBottomNav()}
      {renderModals()}
    </div>
  );
}
