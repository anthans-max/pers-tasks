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
const RECURRENCE_OPTIONS = [
  { value: "", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
];
const RL = { daily: "Daily", weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly" };
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
const fmtDateRange = (s, e) => {
  if (!s || !e) return fmtDate(e || s);
  const sd = new Date(s + "T00:00:00"), ed = new Date(e + "T00:00:00");
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (sd.getMonth() === ed.getMonth() && sd.getFullYear() === ed.getFullYear())
    return `${mo[sd.getMonth()]} ${sd.getDate()} – ${ed.getDate()}`;
  return `${mo[sd.getMonth()]} ${sd.getDate()} – ${mo[ed.getMonth()]} ${ed.getDate()}`;
};
const isOverdue = (d) => { if (!d) return false; return new Date(d + "T00:00:00") < new Date(new Date().setHours(0,0,0,0)); };
const isToday = (d) => { if (!d) return false; const n = new Date(); n.setHours(0,0,0,0); return new Date(d + "T00:00:00").getTime() === n.getTime(); };
const isActive = (s, e) => { if (!s || !e) return false; const now = new Date(); now.setHours(0,0,0,0); return new Date(s+"T00:00:00") <= now && now <= new Date(e+"T00:00:00"); };
const matchesDay = (x, day) => { if (x.startDate && x.dueDate) return x.startDate <= day && day <= x.dueDate; return x.dueDate === day; };
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const computeNextDate = (dateStr, pattern) => {
  if (!dateStr || !pattern) return "";
  const d = new Date(dateStr + "T00:00:00");
  switch (pattern) {
    case "daily":    d.setDate(d.getDate() + 1); break;
    case "weekly":   d.setDate(d.getDate() + 7); break;
    case "biweekly": d.setDate(d.getDate() + 14); break;
    case "monthly":  d.setMonth(d.getMonth() + 1); break;
  }
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

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
  chevD:"M6 9l6 6 6-6",
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

const YSS_FALLBACKS = [
  { quote: "The season of failure is the best time for sowing the seeds of success.", attribution: "Paramahansa Yogananda", topic: "Perseverance" },
  { quote: "You do not have to struggle to reach God, but you do have to struggle to tear away the self-created veil that hides him from you.", attribution: "Paramahansa Yogananda", topic: "Self-Realization" },
  { quote: "Live quietly in the moment and see the beauty of all before you. The future will take care of itself.", attribution: "Paramahansa Yogananda", topic: "Present Moment" },
  { quote: "The soul loves to meditate, for in contact with the spirit lies its greatest joy.", attribution: "Paramahansa Yogananda", topic: "Meditation" },
  { quote: "Change yourself and you have done your part in changing the world.", attribution: "Paramahansa Yogananda", topic: "Inner Change" },
  { quote: "Be a dynamo of irrepressible joy.", attribution: "Paramahansa Yogananda", topic: "Joy" },
  { quote: "The power of unfulfilled desires is the root of all man's slavery.", attribution: "Paramahansa Yogananda", topic: "Freedom" },
  { quote: "Persistence guarantees that results are inevitable.", attribution: "Paramahansa Yogananda", topic: "Discipline" },
  { quote: "Remain calm, serene, always in command of yourself. You will then find out how easy it is to get along.", attribution: "Paramahansa Yogananda", topic: "Equanimity" },
  { quote: "Do not take life's experiences too seriously. For in reality they are nothing but dream experiences.", attribution: "Paramahansa Yogananda", topic: "Perspective" },
  { quote: "Transmute yourself from a worry expert to a peace expert. Take one step at a time.", attribution: "Paramahansa Yogananda", topic: "Peace" },
  { quote: "The minutes are more important than the years. If you fill the minutes with thoughts of God, the years will take care of themselves.", attribution: "Paramahansa Yogananda", topic: "Time" },
];

const pickFallbackQuote = () => YSS_FALLBACKS[Math.floor(Math.random() * YSS_FALLBACKS.length)];

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
  const [newStartDate, setNewStartDate] = useState("");
  const [newDateRange, setNewDateRange] = useState(false);
  const [newProject, setNewProject] = useState("lotus");
  const [newRecurrence, setNewRecurrence] = useState("");
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
  const [todayEvents, setTodayEvents] = useState([]);
  const [subTasks, setSubTasks] = useState({});
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [addingSubTo, setAddingSubTo] = useState(null);
  const [newSubTitle, setNewSubTitle] = useState("");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [modalName, setModalName] = useState("");
  const [showMorning, setShowMorning] = useState(true);
  const [syncing, setSyncing] = useState(null); // "news" | "email" | "calendar" | null
  const [syncToast, setSyncToast] = useState(null); // { message, isError }
  const [yssQuote, setYssQuote] = useState(pickFallbackQuote);
  const isMobile = useIsMobile();

  useEffect(() => {
    Promise.all([
      supabase.from("tm_projects").select("*").eq("user_id", USER_ID),
      supabase.from("tm_tasks").select("*").eq("user_id", USER_ID).eq("completed", false),
      supabase.from("tm_email_tasks").select("*").eq("user_id", USER_ID),
      supabase.from("tm_news_summaries").select("*").order("story_date", { ascending: false }).limit(30),
      supabase.from("tm_sub_tasks").select("*"),
    ]).then(([p, t, e, n, s]) => {
      if (p.error) console.error("fetch tm_projects:", p.error.message);
      else setProjects(p.data.map(r => ({ id: r.id, name: r.name, color: r.color })));
      if (t.error) console.error("fetch tm_tasks:", t.error.message);
      else setTasks(t.data.map(r => ({
        id: r.id, projectId: r.project_id, title: r.title, notes: r.notes ?? "",
        priority: r.priority, dueDate: r.due_date ?? "", startDate: r.start_date ?? "", completed: r.completed,
        recurring: r.recurring ?? false, recurrence: r.recurrence ?? "", recurringParentId: r.recurring_parent_id ?? "",
        subtasks: r.subtasks ?? 0, subtasksDone: r.subtasks_done ?? 0, fromEmail: r.from_email,
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
      if (s.error) console.error("fetch tm_sub_tasks:", s.error.message);
      else {
        const grouped = {};
        s.data.forEach(r => {
          const pid = r.parent_task_id;
          if (!grouped[pid]) grouped[pid] = [];
          grouped[pid].push({ id: r.id, parentTaskId: pid, title: r.title, isComplete: r.is_complete, sortOrder: r.sort_order });
        });
        Object.values(grouped).forEach(arr => arr.sort((a, b) => a.sortOrder - b.sortOrder));
        setSubTasks(grouped);
      }
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

  // Fetch GCal events + DB calendar events for Today view (or day filter)
  useEffect(() => {
    if (view !== "today") { setTodayEvents([]); return; }
    const td = dayFilter || todayStr();
    const month = td.slice(0, 7); // YYYY-MM
    Promise.all([
      fetch(`/api/gcal/events?month=${month}`).then(r => r.json()).then(({ events = [] }) =>
        events.filter(e => e.date === td).map(e => ({ ...e, _gcal: true }))
      ).catch(() => []),
      supabase.from("tm_calendar_events")
        .select("id,gcal_event_id,title,event_type,start_date,start_time,end_time,calendar_source,location")
        .eq("start_date", td)
        .then(({ data }) => (data || []).map(e => ({ ...e, _calEvent: true })))
    ]).then(([gcal, db]) => {
      // Prefer live gcal over DB duplicates
      const gcalIds = new Set(gcal.map(e => e.id));
      const deduped = [...gcal, ...db.filter(e => !gcalIds.has(e.gcal_event_id))];
      // Sort by time (all-day first, then by start_time)
      deduped.sort((a, b) => {
        const aTime = a.allDay ? "" : (a.start_time || a.date || "");
        const bTime = b.allDay ? "" : (b.start_time || b.date || "");
        return aTime.localeCompare(bTime);
      });
      setTodayEvents(deduped);
    });
  }, [view, dayFilter]);

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
    if (view==="today") t = t.filter(x => matchesDay(x, dayFilter||TODAY));
    else if (dayFilter) t = t.filter(x => matchesDay(x, dayFilter));
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
      if (t.startDate && t.dueDate) {
        const s = new Date(t.startDate+"T00:00:00"), e = new Date(t.dueDate+"T00:00:00");
        for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) {
          if (d.getFullYear()===year&&d.getMonth()===month) {
            const k = d.getDate(); if(!byDate[k]) byDate[k]=[]; byDate[k].push(t);
          }
        }
      } else {
        const d = new Date(t.dueDate+"T00:00:00");
        if (d.getFullYear()===year&&d.getMonth()===month) {
          const k = d.getDate(); if(!byDate[k]) byDate[k]=[]; byDate[k].push(t);
        }
      }
    });
    // --- Projected recurring occurrences (display-only, no DB rows) ---
    const monthStart = `${year}-${String(month+1).padStart(2,'0')}-01`;
    const monthEnd   = `${year}-${String(month+1).padStart(2,'0')}-${String(daysInMonth).padStart(2,'0')}`;
    tasks.filter(t => t.recurrence && t.dueDate && !t.completed).forEach(t => {
      if (t.startDate && t.dueDate) {
        let nextStart = computeNextDate(t.startDate, t.recurrence);
        let nextDue = computeNextDate(t.dueDate, t.recurrence);
        let count = 0;
        while (nextDue >= monthStart && nextStart <= monthEnd && count < 31) {
          const s = new Date(nextStart+"T00:00:00"), e = new Date(nextDue+"T00:00:00");
          for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) {
            if (d.getFullYear()===year&&d.getMonth()===month) {
              const k = d.getDate();
              if (!(byDate[k]||[]).some(ex=>ex.title===t.title&&!ex._projected)) {
                if(!byDate[k]) byDate[k]=[];
                byDate[k].push({...t, startDate:nextStart, dueDate:nextDue, _projected:true, id:t.id+'_proj_'+nextStart});
              }
            }
          }
          nextStart = computeNextDate(nextStart, t.recurrence);
          nextDue = computeNextDate(nextDue, t.recurrence);
          count++;
          if (nextStart > monthEnd) break;
        }
      } else {
        let next = computeNextDate(t.dueDate, t.recurrence);
        let count = 0;
        while (next <= monthEnd && count < 31) {
          if (next >= monthStart) {
            const d = new Date(next+"T00:00:00");
            if (d.getFullYear()===year&&d.getMonth()===month) {
              const k = d.getDate();
              if (!(byDate[k]||[]).some(ex=>ex.title===t.title&&!ex._projected)) {
                if(!byDate[k]) byDate[k]=[];
                byDate[k].push({...t, dueDate:next, _projected:true, id:t.id+'_proj_'+next});
              }
            }
          }
          next = computeNextDate(next, t.recurrence);
          count++;
        }
      }
    });
    console.log(`[calData] byDate keys with events:`, Object.keys(byDate));
    return {daysInMonth,startPad,byDate};
  }, [calMonth,tasks,emailTasks,gcalEvents,gcalVisible,calendarDbEvents]);

  // Handlers
  const addTask = () => {
    if (!newTitle.trim()) return;
    const sd = newDateRange ? newStartDate : "";
    const ed = newDate;
    const rec = newRecurrence || "";
    const newTask = {id:uid(),projectId:newProject,title:newTitle.trim(),priority:newPrio,dueDate:ed,startDate:sd&&ed&&sd>ed?ed:sd,subtasks:0,subtasksDone:0,completed:false,fromEmail:false,recurring:!!rec,recurrence:rec,recurringParentId:""};
    setTasks(p=>[...p,newTask]);
    setNewTitle(""); setNewPrio(4); setNewDate(""); setNewStartDate(""); setNewDateRange(false); setNewRecurrence(""); setAddModal(false);
    supabase.from("tm_tasks").insert({
      id:newTask.id, user_id:USER_ID, project_id:newTask.projectId, title:newTask.title,
      priority:newTask.priority, due_date:newTask.dueDate||null, start_date:newTask.startDate||null, completed:false,
      recurring:!!rec, recurrence:rec||null, recurring_parent_id:null,
      subtasks:0, subtasks_done:0, from_email:false, notes:"",
    }).then(({error})=>{ if(error) console.error("addTask:", error.message); });
  };
  const toggleDone = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setTasks(p=>p.map(t=>t.id===id?{...t,completed:true}:t));
    if(selectedTask?.id===id) setSelectedTask(null);
    const {error} = await supabase.from("tm_tasks").update({completed:true}).eq("id",id);
    if (error) { console.error("toggleDone:", error.message); return; }
    // Spawn next instance only if recurring AND has a due date
    if (!task.recurrence || !task.dueDate) return;
    const nextDue = computeNextDate(task.dueDate, task.recurrence);
    const nextStart = task.startDate ? computeNextDate(task.startDate, task.recurrence) : "";
    const parentId = task.recurringParentId || task.id;
    const nextId = uid();
    const existingSubs = subTasks[id] || [];
    const clonedSubs = existingSubs.map((sub, i) => ({
      id: crypto.randomUUID(), parentTaskId: nextId, title: sub.title, isComplete: false, sortOrder: i,
    }));
    const nextTask = {
      id: nextId, projectId: task.projectId, title: task.title, priority: task.priority,
      dueDate: nextDue, startDate: nextStart, completed: false,
      recurring: true, recurrence: task.recurrence, recurringParentId: parentId,
      fromEmail: false, emailFrom: "", notes: task.notes || "",
      subtasks: clonedSubs.length, subtasksDone: 0,
    };
    setTasks(p => [...p, nextTask]);
    if (clonedSubs.length) setSubTasks(prev => ({...prev, [nextId]: clonedSubs}));
    supabase.from("tm_tasks").insert({
      id: nextId, user_id: USER_ID, project_id: nextTask.projectId, title: nextTask.title,
      priority: nextTask.priority, due_date: nextTask.dueDate || null, start_date: nextTask.startDate || null,
      completed: false, recurring: true, recurrence: nextTask.recurrence, recurring_parent_id: parentId,
      subtasks: clonedSubs.length, subtasks_done: 0, from_email: false, notes: nextTask.notes,
    }).then(({error}) => { if (error) console.error("spawn recurring task:", error.message); });
    if (clonedSubs.length) {
      supabase.from("tm_sub_tasks").insert(
        clonedSubs.map(s => ({ id: s.id, parent_task_id: nextId, user_id: USER_ID, title: s.title, is_complete: false, sort_order: s.sortOrder }))
      ).then(({error}) => { if (error) console.error("clone sub-tasks:", error.message); });
    }
  };
  const deleteTask = (id) => {
    setTasks(p=>p.filter(t=>t.id!==id));
    if(selectedTask?.id===id) setSelectedTask(null);
    setSubTasks(prev => { const next = {...prev}; delete next[id]; return next; });
    setExpandedTasks(prev => { const next = new Set(prev); next.delete(id); return next; });
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
    if(u.startDate  !== undefined) patch.start_date     = u.startDate || null;
    if(u.projectId  !== undefined) patch.project_id    = u.projectId;
    if(u.recurring  !== undefined) patch.recurring     = u.recurring;
    if(u.recurrence !== undefined) { patch.recurrence = u.recurrence || null; patch.recurring = !!u.recurrence; }
    if(u.recurringParentId !== undefined) patch.recurring_parent_id = u.recurringParentId || null;
    if(u.subtasks   !== undefined) patch.subtasks      = u.subtasks;
    if(u.subtasksDone !== undefined) patch.subtasks_done = u.subtasksDone;
    if(u.notes      !== undefined) patch.notes         = u.notes;
    if(Object.keys(patch).length)
      supabase.from("tm_tasks").update(patch).eq("id",id)
        .then(({error})=>{ if(error) console.error("updateTask:", error.message); });
  };
  const addSubTask = (parentTaskId, title) => {
    if (!title.trim()) return;
    const id = crypto.randomUUID();
    const currentSubs = subTasks[parentTaskId] || [];
    const sub = { id, parentTaskId, title: title.trim(), isComplete: false, sortOrder: currentSubs.length };
    setSubTasks(prev => ({ ...prev, [parentTaskId]: [...(prev[parentTaskId] || []), sub] }));
    const task = tasks.find(t => t.id === parentTaskId);
    if (task) updateTask(parentTaskId, { subtasks: (task.subtasks || 0) + 1 });
    setAddingSubTo(null); setNewSubTitle("");
    supabase.from("tm_sub_tasks").insert({
      id, parent_task_id: parentTaskId, user_id: USER_ID,
      title: sub.title, is_complete: false, sort_order: sub.sortOrder,
    }).then(({ error }) => { if (error) console.error("addSubTask:", error.message); });
  };
  const toggleSubTask = (parentTaskId, subTaskId) => {
    const subs = subTasks[parentTaskId] || [];
    const sub = subs.find(s => s.id === subTaskId);
    if (!sub) return;
    const newVal = !sub.isComplete;
    setSubTasks(prev => ({
      ...prev, [parentTaskId]: prev[parentTaskId].map(s => s.id === subTaskId ? { ...s, isComplete: newVal } : s),
    }));
    const task = tasks.find(t => t.id === parentTaskId);
    if (task) updateTask(parentTaskId, { subtasksDone: (task.subtasksDone || 0) + (newVal ? 1 : -1) });
    supabase.from("tm_sub_tasks").update({ is_complete: newVal }).eq("id", subTaskId)
      .then(({ error }) => { if (error) console.error("toggleSubTask:", error.message); });
  };
  const deleteSubTask = (parentTaskId, subTaskId) => {
    const subs = subTasks[parentTaskId] || [];
    const sub = subs.find(s => s.id === subTaskId);
    if (!sub) return;
    setSubTasks(prev => ({
      ...prev, [parentTaskId]: prev[parentTaskId].filter(s => s.id !== subTaskId),
    }));
    const task = tasks.find(t => t.id === parentTaskId);
    if (task) {
      const patch = { subtasks: Math.max(0, (task.subtasks || 0) - 1) };
      if (sub.isComplete) patch.subtasksDone = Math.max(0, (task.subtasksDone || 0) - 1);
      updateTask(parentTaskId, patch);
    }
    supabase.from("tm_sub_tasks").delete().eq("id", subTaskId)
      .then(({ error }) => { if (error) console.error("deleteSubTask:", error.message); });
  };
  const assignEmail = (eid,projId) => {
    const et = emailTasks.find(e=>e.id===eid); if(!et) return;
    const newTask = {id:uid(),projectId:projId,title:et.title,priority:et.priority,dueDate:et.dueDate||"",startDate:"",subtasks:0,subtasksDone:0,completed:false,fromEmail:true,emailFrom:et.emailFrom};
    setTasks(p=>[...p,newTask]);
    setEmailTasks(p=>p.filter(e=>e.id!==eid));
    setAssigningEmail(null);
    Promise.all([
      supabase.from("tm_tasks").insert({
        id:newTask.id, user_id:USER_ID, project_id:newTask.projectId, title:newTask.title,
        priority:newTask.priority, due_date:newTask.dueDate||null, start_date:null, completed:false,
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
      return {id:uid(),projectId:projId,title:et.title,priority:et.priority,dueDate:et.dueDate||"",startDate:"",subtasks:0,subtasksDone:0,completed:false,fromEmail:true,emailFrom:et.emailFrom};
    }).filter(Boolean);
    setTasks(p=>[...p,...newTasks]);
    setEmailTasks(p=>p.filter(e=>!selectedEmails.has(e.id)));
    setSelectedEmails(new Set());
    Promise.all([
      supabase.from("tm_tasks").insert(newTasks.map(t=>({
        id:t.id, user_id:USER_ID, project_id:t.projectId, title:t.title,
        priority:t.priority, due_date:t.dueDate||null, start_date:null, completed:false,
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

  const showToast = (message, isError = false) => {
    setSyncToast({ message, isError });
    setTimeout(() => setSyncToast(null), 4000);
  };

  const runSync = async (type) => {
    if (syncing) return;
    setSyncing(type);
    try {
      const endpoints = { news: "/api/news/capture", email: "/api/email/capture", calendar: "/api/calendar/sync" };
      const resp = await fetch(endpoints[type], { method: "POST" });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Sync failed");
      // Refresh data after sync
      if (type === "news") {
        const { data: rows, error } = await supabase.from("tm_news_summaries").select("*").order("story_date", { ascending: false }).limit(30);
        if (!error) setNewsSummaries(rows.map(r => ({ id: r.id, source: r.source, headline: r.headline, category: r.category, summary: r.summary, url: r.url ?? null, storyDate: r.story_date })));
        const count = data.results?.reduce((s, r) => s + (r.stories || 0), 0) || 0;
        showToast(`News synced — ${count} stories captured`);
      } else if (type === "email") {
        const { data: rows, error } = await supabase.from("tm_email_tasks").select("*").eq("user_id", USER_ID);
        if (!error) setEmailTasks(rows.map(r => ({ id: r.id, title: r.title, emailFrom: r.email_from ?? "", emailDate: r.email_date ?? "", priority: r.priority, dueDate: r.due_date ?? "", captured: r.captured_at ?? "" })));
        showToast(`Email synced — ${data.inserted || 0} new tasks`);
      } else if (type === "calendar") {
        setGcalFetchKey(k => k + 1);
        const {year, month} = calMonth;
        const startDate = `${year}-${String(month+1).padStart(2,"0")}-01`;
        const endDate = `${year}-${String(month+1).padStart(2,"0")}-${new Date(year,month+1,0).getDate()}`;
        const { data: dbRows, error: dbErr } = await supabase.from("tm_calendar_events")
          .select("id,gcal_event_id,title,event_type,start_date,calendar_source,location")
          .gte("start_date", startDate).lte("start_date", endDate);
        if (!dbErr) setCalendarDbEvents(dbRows || []);
        const total = data.results?.reduce((s, r) => s + (r.upserted || 0), 0) || 0;
        showToast(`Calendar synced — ${total} events updated`);
      }
    } catch (err) {
      console.error(`${type} sync error:`, err);
      showToast(`Sync failed: ${err.message}`, true);
    } finally {
      setSyncing(null);
    }
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
        {/* Ops — external link */}
        <a href="https://ops.getlotusai.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <TabBtn active={false}>Ops</TabBtn>
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

  const SubTaskList = ({taskId}) => {
    const subs = subTasks[taskId] || [];
    return (
      <div style={{marginLeft:40,marginRight:16,marginBottom:4}}>
        {subs.map(sub => (
          <div key={sub.id} className="subtask-row" style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${T.borderS}`}}>
            <button onClick={()=>toggleSubTask(taskId,sub.id)}
              style={{width:14,height:14,minWidth:14,borderRadius:3,border:`1.5px solid ${sub.isComplete?T.forest:T.forestMid}`,
                background:sub.isComplete?T.forest:"transparent",cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {sub.isComplete&&<svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke={T.bg} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
            </button>
            <span style={{flex:1,fontSize:12.5,color:sub.isComplete?T.textMute:T.text,textDecoration:sub.isComplete?"line-through":"none"}}>{sub.title}</span>
            <button onClick={()=>deleteSubTask(taskId,sub.id)}
              className="subtask-del"
              style={{background:"none",border:"none",cursor:"pointer",padding:2,opacity:0,transition:"opacity 0.15s"}}>
              <Ico d={I.x} size={11} color={T.red}/>
            </button>
          </div>
        ))}
        {addingSubTo===taskId ? (
          <div style={{display:"flex",gap:6,alignItems:"center",padding:"6px 0"}}>
            <input autoFocus value={newSubTitle} onChange={e=>setNewSubTitle(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")addSubTask(taskId,newSubTitle);if(e.key==="Escape"){setAddingSubTo(null);setNewSubTitle("");}}}
              placeholder="Sub-task title…"
              style={{flex:1,fontSize:12,padding:"5px 8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bg,color:T.text,outline:"none",fontFamily:"'Jost',sans-serif"}}/>
            <button onClick={()=>addSubTask(taskId,newSubTitle)}
              style={{fontSize:11,fontWeight:600,color:T.forest,background:"none",border:"none",cursor:"pointer",fontFamily:"'Syne',sans-serif"}}>Add</button>
          </div>
        ) : (
          <button onClick={(e)=>{e.stopPropagation();setAddingSubTo(taskId);setNewSubTitle("");}}
            style={{fontSize:11,color:T.gold,background:"none",border:"none",cursor:"pointer",padding:"6px 0",fontFamily:"'Syne',sans-serif",fontWeight:500}}>
            + Add sub-task
          </button>
        )}
      </div>
    );
  };

  const TaskCard = ({task}) => {
    const sel = selectedTask?.id===task.id;
    const od=isOverdue(task.dueDate), td=isToday(task.dueDate), ac=isActive(task.startDate, task.dueDate);
    const isExpanded = expandedTasks.has(task.id);
    return (
      <>
        <div onClick={()=>setSelectedTask(sel?null:task)}
          style={{display:"flex",alignItems:"flex-start",gap:12,padding:"13px 16px",borderRadius:11,
            background:sel?"rgba(61,46,30,0.10)":T.bg2,
            border:`1px solid ${sel?T.goldB:T.borderS}`,
            position:"relative",overflow:"hidden",cursor:"pointer",marginBottom:isExpanded?0:4,transition:"all 0.15s"}}
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
              {(task.startDate||task.dueDate)&&<span style={{fontSize:11,fontWeight:600,color:od?T.red:(td||ac)?T.forestMid:T.textMute,display:"flex",alignItems:"center",gap:3}}>
                📅 {task.startDate?fmtDateRange(task.startDate,task.dueDate):fmtDate(task.dueDate)}{task.recurrence&&<><Ico d={I.recur} size={10} color={T.textMute} style={{marginLeft:2}}/><span style={{fontSize:9,color:T.textMute,fontWeight:600,marginLeft:1}}>{RL[task.recurrence]}</span></>}
              </span>}
              {task.subtasks>0&&<span onClick={e=>{e.stopPropagation();setExpandedTasks(p=>{const n=new Set(p);n.has(task.id)?n.delete(task.id):n.add(task.id);return n;});}}
                style={{fontSize:11,color:T.textMute,display:"flex",alignItems:"center",gap:3,cursor:"pointer"}}>
                {task.subtasksDone}/{task.subtasks}
                <Ico d={I.chevD} size={10} color={T.textMute} style={{transform:isExpanded?"rotate(180deg)":"none",transition:"transform 0.15s"}}/>
              </span>}
            </div>
          </div>
        </div>
        {isExpanded&&<SubTaskList taskId={task.id}/>}
      </>
    );
  };

  const renderFeed = (flat=false) => {
    const isEmpty = visTasks.length===0;
    const showTodayEvents = view==="today" && todayEvents.length > 0;
    if (flat||view==="today"||dayFilter) return (
      <div style={{padding:"0 0 8px"}}>
        {showTodayEvents && (
          <div style={{marginBottom:visTasks.length?16:0}}>
            <div style={{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:1,color:T.textMute,marginBottom:8,fontFamily:"'Syne',sans-serif"}}>Calendar</div>
            {todayEvents.map((ev,i) => {
              const isAllDay = ev.allDay || ev.event_type==="all_day";
              const timeStr = isAllDay ? "All day" : (ev.start_time || (ev.date && ev.date.length > 10 ? ev.date.slice(11,16) : ""));
              const isShared = ev.calendarSource==="shared" || ev.calendar_source==="shared";
              const lower = (ev.title||"").toLowerCase();
              const isBday = lower.includes("birthday")||lower.includes("bday")||lower.includes("anniversary");
              const accent = isBday ? "#8A6310" : isShared ? "#4A3F80" : "#2A5E54";
              const bg = isBday ? "rgba(181,135,26,0.10)" : isShared ? "rgba(123,111,170,0.10)" : "rgba(74,124,111,0.10)";
              return (
                <div key={ev.id||ev.gcal_event_id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:6,borderRadius:10,background:bg,borderLeft:`3px solid ${accent}`}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</div>
                    {ev.location && <div style={{fontSize:11,color:T.textMute,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.location}</div>}
                  </div>
                  {timeStr && <div style={{fontSize:12,color:accent,fontWeight:500,whiteSpace:"nowrap",fontFamily:"'Syne',sans-serif"}}>{timeStr}</div>}
                </div>
              );
            })}
          </div>
        )}
        {visTasks.length > 0 && showTodayEvents && (
          <div style={{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:1,color:T.textMute,marginBottom:8,fontFamily:"'Syne',sans-serif"}}>Tasks</div>
        )}
        {isEmpty && !showTodayEvents?(<div style={{textAlign:"center",padding:"60px 20px",color:T.textMute}}>
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

  const renderWeekStrip = (compact=false, padH=compact?32:16) => (
    <div style={{display:"flex",gap:compact?4:2,overflowX:"auto",padding:`12px ${padH}px`,borderBottom:`1px solid ${T.borderS}`,scrollbarWidth:"none",flexShrink:0,alignItems:"center"}}>
      {weekDays.map(d=>(
        <div key={d.date} onClick={()=>{setDayFilter(dayFilter===d.date?null:d.date);if(view!=="tasks"&&view!=="today")setView("tasks");}}
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
          style={{padding:"7px 18px",borderRadius:100,fontSize:12,fontWeight:projectFilter===f.id?600:500,whiteSpace:"nowrap",cursor:"pointer",transition:"all 0.15s",fontFamily:"'Jost',sans-serif",
            background:projectFilter===f.id?T.forest:"transparent",
            border:`1px solid ${projectFilter===f.id?T.forest:"rgba(45,74,53,0.4)"}`,
            color:projectFilter===f.id?T.bg:T.forestMid,
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
            const dtRaw=day?(byDate[day]||[]):[];
            const dt=dtRaw.filter((ev,idx,self)=>idx===self.findIndex(e=>e.title===ev.title&&e.dueDate===ev.dueDate));
            const maxShow=padH>0?3:2;
            return (
              <div key={i} style={{minHeight:padH>0?88:70,background:day?"rgba(61,46,30,0.06)":"transparent",border:`1px solid ${isT?T.goldB:day?T.borderS:"transparent"}`,borderRadius:8,padding:day?"5px 6px":0,opacity:day?1:0,overflow:"hidden",cursor:day?"pointer":"default"}}
                onClick={()=>{if(!day)return;const dd=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;setDayFilter(dd);setView("today");}}>
                {day&&<>
                  <div style={{fontSize:12,fontWeight:isT?800:600,color:isT?T.gold:isPast?T.textMute:T.textSoft,marginBottom:3,display:"flex",alignItems:"center",gap:3}}>
                    {isT&&<span style={{width:5,height:5,borderRadius:"50%",background:T.gold,display:"inline-block"}}/>}{day}
                  </div>
                  {dt.slice(0,maxShow).map((t,ti)=>{
                    const p=t._gcal?gcalPill(t):t._calEvent?calEventPill(t):{bg:t._email?T.emailS:PG[t.priority]||"rgba(255,255,255,0.05)",c:t._email?T.email:PC[t.priority]||T.textMute,b:t._email?T.email:PC[t.priority]||T.textMute};
                    const proj=t._projected;
                    return (
                      <div key={ti} title={t.title+(proj?' (projected)':'')} onClick={(e)=>{if(proj){e.stopPropagation();return;}if(!t._gcal&&t.sectionId)setSelectedTask(t);}}
                        style={{fontSize:10,padding:"2px 5px",borderRadius:3,marginBottom:2,background:p.bg,color:p.c,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",borderLeft:`2px solid ${p.b}`,opacity:proj?0.5:1,borderLeftStyle:proj?'dashed':'solid',cursor:!t._gcal&&!proj&&t.sectionId?"pointer":"default"}}
                      >{proj?'↻ ':''}{t.title}</div>
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
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:T.textSoft,opacity:0.5}}>
            <span style={{width:10,height:10,borderRadius:3,background:"rgba(61,46,30,0.08)",borderLeft:"2px dashed "+T.textMute}}/>↻ Projected
          </div>
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
              style={{padding:"7px 16px",background:"#C0392B",border:"none",color:"#fff",borderRadius:100,cursor:"pointer",fontSize:12,fontWeight:400,letterSpacing:"0.05em",whiteSpace:"nowrap",fontFamily:"'Jost', sans-serif"}}>
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
            <div style={{display:"grid",gridTemplateColumns:newDateRange?"1fr 1fr":"1fr 1fr 1fr",gap:12,marginBottom:newDateRange?12:20}}>
              {[
                {label:"Priority",content:<select value={newPrio} onChange={e=>setNewPrio(Number(e.target.value))} style={inp}>{[1,2,3,4].map(p=><option key={p} value={p}>{PL[p]}</option>)}</select>},
                ...(newDateRange
                  ? [{label:"Project",content:<select value={newProject} onChange={e=>setNewProject(e.target.value)} style={inp}>{sortedProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>}]
                  : [
                    {label:"Due Date",content:<input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} style={inp}/>},
                    {label:"Project",content:<select value={newProject} onChange={e=>setNewProject(e.target.value)} style={inp}>{sortedProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>},
                  ]),
              ].map(({label,content})=>(
                <div key={label}>
                  <div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{label}</div>
                  {content}
                </div>
              ))}
            </div>
            {newDateRange&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              <div><div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Start Date</div><input type="date" value={newStartDate} onChange={e=>setNewStartDate(e.target.value)} style={inp}/></div>
              <div><div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>End Date</div><input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} style={inp}/></div>
            </div>}
            <div style={{marginBottom:20}}>
              <button onClick={()=>{setNewDateRange(!newDateRange);if(!newDateRange)setNewStartDate("");}} style={{background:"none",border:"none",cursor:"pointer",padding:0,fontSize:11,color:T.gold,fontFamily:"'Syne',sans-serif",fontWeight:500}}>
                {newDateRange?"- Single date":"+ Date range"}
              </button>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:5,fontFamily:"'Syne',sans-serif"}}>Repeat</div>
              <select value={newRecurrence} onChange={e=>setNewRecurrence(e.target.value)} disabled={!newDate} style={{...inp,opacity:newDate?1:0.4}}>
                {RECURRENCE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
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
                <button onClick={()=>setSelectedTask(null)} style={{background:"none",border:"none",cursor:"pointer",padding:6}}><Ico d={I.x} size={16} color={T.textMute}/></button>
              </div>
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:600,color:T.text,lineHeight:1.35,marginBottom:18}}>{selectedTask.title}</div>
            <div style={{display:"grid",gridTemplateColumns:selectedTask.startDate?"1fr 1fr":"1fr 1fr 1fr",gap:12,marginBottom:selectedTask.startDate?12:20}}>
              {[
                ...(selectedTask.startDate
                  ? [{label:"Start Date",content:<input type="date" value={selectedTask.startDate||""} onChange={e=>updateTask(selectedTask.id,{startDate:e.target.value})} style={{...inp,color:T.gold,fontWeight:600}}/>},
                     {label:"End Date",content:<input type="date" value={selectedTask.dueDate||""} onChange={e=>updateTask(selectedTask.id,{dueDate:e.target.value})} style={{...inp,color:isOverdue(selectedTask.dueDate)?T.red:T.gold,fontWeight:600,border:`1px solid ${isOverdue(selectedTask.dueDate)?T.red:T.border}`}}/>}]
                  : [{label:"Due Date",content:<input type="date" value={selectedTask.dueDate||""} onChange={e=>updateTask(selectedTask.id,{dueDate:e.target.value})} style={{...inp,color:isOverdue(selectedTask.dueDate)?T.red:T.gold,fontWeight:600,border:`1px solid ${isOverdue(selectedTask.dueDate)?T.red:T.border}`}}/>}]),
                {label:"Priority",content:<select value={selectedTask.priority} onChange={e=>updateTask(selectedTask.id,{priority:Number(e.target.value)})} style={inp}>{[1,2,3,4].map(p=><option key={p} value={p}>{PL[p]}</option>)}</select>},
                ...(!selectedTask.startDate?[{label:"Project",content:<select value={selectedTask.projectId} onChange={e=>updateTask(selectedTask.id,{projectId:e.target.value})} style={inp}>{sortedProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>}]:[]),
              ].map(({label,content})=>(
                <div key={label}><div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{label}</div>{content}</div>
              ))}
            </div>
            {selectedTask.startDate&&<div style={{display:"grid",gridTemplateColumns:"1fr",gap:12,marginBottom:12}}>
              <div><div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Project</div><select value={selectedTask.projectId} onChange={e=>updateTask(selectedTask.id,{projectId:e.target.value})} style={inp}>{sortedProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            </div>}
            <div style={{marginBottom:12}}>
              <button onClick={()=>{if(selectedTask.startDate){updateTask(selectedTask.id,{startDate:""});}else{updateTask(selectedTask.id,{startDate:selectedTask.dueDate||todayStr()});}}} style={{background:"none",border:"none",cursor:"pointer",padding:0,fontSize:11,color:T.gold,fontFamily:"'Syne',sans-serif",fontWeight:500}}>
                {selectedTask.startDate?"- Single date":"+ Date range"}
              </button>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:5,fontFamily:"'Syne',sans-serif"}}>Repeat</div>
              <select value={selectedTask.recurrence||""} onChange={e=>updateTask(selectedTask.id,{recurrence:e.target.value||"",recurring:!!e.target.value})} disabled={!selectedTask.dueDate} style={{...inp,opacity:selectedTask.dueDate?1:0.4}}>
                {RECURRENCE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:8,fontFamily:"'Syne',sans-serif"}}>
                Sub-tasks{selectedTask.subtasks>0&&` (${selectedTask.subtasksDone}/${selectedTask.subtasks})`}
              </div>
              {(subTasks[selectedTask.id]||[]).map(sub=>(
                <div key={sub.id} className="subtask-row" style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${T.borderS}`}}>
                  <button onClick={()=>toggleSubTask(selectedTask.id,sub.id)}
                    style={{width:14,height:14,minWidth:14,borderRadius:3,border:`1.5px solid ${sub.isComplete?T.forest:T.forestMid}`,
                      background:sub.isComplete?T.forest:"transparent",cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {sub.isComplete&&<svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke={T.bg} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
                  </button>
                  <span style={{flex:1,fontSize:13,color:sub.isComplete?T.textMute:T.text,textDecoration:sub.isComplete?"line-through":"none"}}>{sub.title}</span>
                  <button onClick={()=>deleteSubTask(selectedTask.id,sub.id)}
                    style={{background:"none",border:"none",cursor:"pointer",padding:2}}>
                    <Ico d={I.x} size={11} color={T.red}/>
                  </button>
                </div>
              ))}
              {addingSubTo===selectedTask.id ? (
                <div style={{display:"flex",gap:6,alignItems:"center",padding:"7px 0"}}>
                  <input autoFocus value={newSubTitle} onChange={e=>setNewSubTitle(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter")addSubTask(selectedTask.id,newSubTitle);if(e.key==="Escape"){setAddingSubTo(null);setNewSubTitle("");}}}
                    placeholder="Sub-task title…"
                    style={{flex:1,fontSize:12,padding:"5px 8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bg,color:T.text,outline:"none",fontFamily:"'Jost',sans-serif"}}/>
                  <button onClick={()=>addSubTask(selectedTask.id,newSubTitle)}
                    style={{fontSize:11,fontWeight:600,color:T.forest,background:"none",border:"none",cursor:"pointer",fontFamily:"'Syne',sans-serif"}}>Add</button>
                </div>
              ) : (
                <button onClick={()=>{setAddingSubTo(selectedTask.id);setNewSubTitle("");}}
                  style={{fontSize:11,color:T.gold,background:"none",border:"none",cursor:"pointer",padding:"7px 0",fontFamily:"'Syne',sans-serif",fontWeight:500}}>
                  + Add sub-task
                </button>
              )}
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
    <div style={{width:248,minWidth:248,background:T.forest,borderRight:"1px solid rgba(255,255,255,0.12)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"20px 20px 14px",borderBottom:"1px solid rgba(255,255,255,0.12)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <div style={{width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,0.15)",border:"2px solid rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:14,color:"#fff",flexShrink:0,fontFamily:"'Syne',sans-serif"}}>A</div>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#fff",fontWeight:600}}>Anthan</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:11,color:"rgba(255,255,255,0.55)",letterSpacing:"0.05em"}}>Lotus List</div>
          </div>
        </div>
        <button onClick={()=>{setNewProject(projectFilter==="all"?projects[0]?.id:projectFilter);setAddModal(true);}}
          style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 14px",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:100,color:"#fff",fontSize:13,fontWeight:400,letterSpacing:"0.12em",cursor:"pointer",fontFamily:"'Jost', sans-serif",justifyContent:"center"}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"rgba(255,255,255,0.2)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:400,flexShrink:0}}>+</div>
          Add task
        </button>
      </div>

      <div style={{padding:"12px 12px 4px",flexShrink:0}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:500,letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.55)",padding:"0 8px 8px"}}>Views</div>
        {[
          {key:"tasks",icon:I.tasks,label:"All Tasks",badge:openCount,badgeBg:"rgba(255,255,255,0.15)",badgeC:"#fff"},
          {key:"today",icon:I.today,label:"Today",badge:todayCount||null,badgeBg:T.gold,badgeC:"#fff"},
          {key:"calendar",icon:I.cal,label:"Calendar",badge:null},
          {key:"email",icon:I.mail,label:"Email Capture",badge:emailTasks.length||null,badgeBg:T.email,badgeC:"#fff"},
          {key:"news",icon:I.tasks,label:"News",badge:null},
        ].map(n=>(
          <div key={n.key} onClick={()=>{setView(n.key);setDayFilter(null);}}
            style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:9,cursor:"pointer",fontSize:13,marginBottom:1,fontWeight:view===n.key?700:400,color:view===n.key?"#fff":"rgba(255,255,255,0.65)",background:view===n.key?"rgba(255,255,255,0.15)":"transparent",border:"none",transition:"all 0.15s"}}
            onMouseEnter={e=>{if(view!==n.key){e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.color="#fff";}}}
            onMouseLeave={e=>{if(view!==n.key){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.65)";}}}
          >
            <Ico d={n.icon} size={16} color={view===n.key?"#fff":"rgba(255,255,255,0.55)"}/>
            <span style={{flex:1}}>{n.label}</span>
            {n.badge?<span style={{fontSize:11,fontWeight:700,padding:"1px 7px",borderRadius:10,background:n.badgeBg,color:n.badgeC}}>{n.badge}</span>:null}
          </div>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"8px 12px",borderTop:"1px solid rgba(255,255,255,0.12)",marginTop:6}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 8px 8px"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:500,letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.55)"}}>Projects</div>
          <button onClick={()=>{setModalName("");setShowProjectModal(true);}} style={{background:"none",border:"none",cursor:"pointer",padding:2,opacity:0.6}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.6}>
            <Ico d={I.plus} size={14} color="#fff"/>
          </button>
        </div>
        {sortedProjects.map(p=>{
          const active=projectFilter===p.id&&view==="tasks";
          return (
            <div key={p.id} onClick={()=>{setProjectFilter(p.id);setView("tasks");}}
              style={{display:"flex",alignItems:"center",gap:9,padding:"7px 10px",borderRadius:8,cursor:"pointer",fontSize:13,marginBottom:1,fontWeight:active?700:400,color:active?"#fff":"rgba(255,255,255,0.65)",background:active?"rgba(255,255,255,0.15)":"transparent",transition:"all 0.15s"}}
              onMouseEnter={e=>{if(!active){e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.color="#fff";}}}
              onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.65)";}}}
            >
              <div style={{width:8,height:8,borderRadius:"50%",background:p.color||T.gold,flexShrink:0}}/>
              <span style={{flex:1}}>{p.name}</span>
              <span style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>{tasks.filter(t=>!t.completed&&t.projectId===p.id).length}</span>
            </div>
          );
        })}
      </div>

      <div style={{padding:"10px 16px",borderTop:"1px solid rgba(255,255,255,0.12)",display:"flex",gap:8}}>
        <button title="Settings" style={{flex:1,padding:8,borderRadius:8,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Ico d={I.settings} size={15} color="rgba(255,255,255,0.55)"/>
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
            <button onClick={()=>deleteTask(task.id)} style={{background:T.red,border:"none",cursor:"pointer",padding:6,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}><Ico d={I.trash} size={15} color="#fff"/></button>
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
          {task.startDate ? (
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Start Date</div><input type="date" value={task.startDate||""} onChange={e=>updateTask(task.id,{startDate:e.target.value})} style={{...inp,color:T.gold,fontWeight:600}}/></div>
                <div><div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>End Date</div><input type="date" value={task.dueDate||""} onChange={e=>updateTask(task.id,{dueDate:e.target.value})} style={{...inp,color:od?T.red:T.gold,fontWeight:600,border:`1px solid ${od?T.red:T.border}`}}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Priority</div><select value={task.priority} onChange={e=>updateTask(task.id,{priority:Number(e.target.value)})} style={inp}>{[1,2,3,4].map(p=><option key={p} value={p}>{PL[p]}</option>)}</select></div>
                <div><div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Project</div><select value={task.projectId} onChange={e=>updateTask(task.id,{projectId:e.target.value})} style={inp}>{sortedProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              </div>
            </>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              {[
                {label:"Due Date",content:<input type="date" value={task.dueDate||""} onChange={e=>updateTask(task.id,{dueDate:e.target.value})} style={{...inp,color:od?T.red:T.gold,fontWeight:600,border:`1px solid ${od?T.red:T.border}`}}/>},
                {label:"Priority",content:<select value={task.priority} onChange={e=>updateTask(task.id,{priority:Number(e.target.value)})} style={inp}>{[1,2,3,4].map(p=><option key={p} value={p}>{PL[p]}</option>)}</select>},
                {label:"Project",content:<select value={task.projectId} onChange={e=>updateTask(task.id,{projectId:e.target.value})} style={inp}>{sortedProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>},
              ].map(({label,content})=>(
                <div key={label}><div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{label}</div>{content}</div>
              ))}
            </div>
          )}
          <button onClick={()=>{if(task.startDate){updateTask(task.id,{startDate:""});}else{updateTask(task.id,{startDate:task.dueDate||todayStr()});}}} style={{background:"none",border:"none",cursor:"pointer",padding:0,fontSize:11,color:T.gold,fontFamily:"'Syne',sans-serif",fontWeight:500}}>
            {task.startDate?"- Single date":"+ Date range"}
          </button>
          <div style={{marginTop:8}}>
            <div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:5,fontFamily:"'Syne',sans-serif"}}>Repeat</div>
            <select value={task.recurrence||""} onChange={e=>updateTask(task.id,{recurrence:e.target.value||"",recurring:!!e.target.value})} disabled={!task.dueDate} style={{...inp,opacity:task.dueDate?1:0.4}}>
              {RECURRENCE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {task.fromEmail&&<div style={{background:T.emailS,border:`1px solid ${T.emailS}`,borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:10,fontWeight:700,color:T.email,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Email Origin</div>
            <div style={{fontSize:12,color:T.textSoft}}>From: {task.emailFrom}</div>
          </div>}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:8,fontFamily:"'Syne',sans-serif"}}>
              Sub-tasks{task.subtasks>0&&` (${task.subtasksDone}/${task.subtasks})`}
            </div>
            {(subTasks[task.id]||[]).map(sub=>(
              <div key={sub.id} className="subtask-row" style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${T.borderS}`}}>
                <button onClick={()=>toggleSubTask(task.id,sub.id)}
                  style={{width:14,height:14,minWidth:14,borderRadius:3,border:`1.5px solid ${sub.isComplete?T.forest:T.forestMid}`,
                    background:sub.isComplete?T.forest:"transparent",cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {sub.isComplete&&<svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke={T.bg} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
                </button>
                <span style={{flex:1,fontSize:13,color:sub.isComplete?T.textMute:T.text,textDecoration:sub.isComplete?"line-through":"none"}}>{sub.title}</span>
                <button onClick={()=>deleteSubTask(task.id,sub.id)} className="subtask-del"
                  style={{background:"none",border:"none",cursor:"pointer",padding:2,opacity:0,transition:"opacity 0.15s"}}>
                  <Ico d={I.x} size={11} color={T.red}/>
                </button>
              </div>
            ))}
            {addingSubTo===task.id ? (
              <div style={{display:"flex",gap:6,alignItems:"center",padding:"7px 0"}}>
                <input autoFocus value={newSubTitle} onChange={e=>setNewSubTitle(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")addSubTask(task.id,newSubTitle);if(e.key==="Escape"){setAddingSubTo(null);setNewSubTitle("");}}}
                  placeholder="Sub-task title…"
                  style={{flex:1,fontSize:12,padding:"5px 8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bg,color:T.text,outline:"none",fontFamily:"'Jost',sans-serif"}}/>
                <button onClick={()=>addSubTask(task.id,newSubTitle)}
                  style={{fontSize:11,fontWeight:600,color:T.forest,background:"none",border:"none",cursor:"pointer",fontFamily:"'Syne',sans-serif"}}>Add</button>
              </div>
            ) : (
              <button onClick={()=>{setAddingSubTo(task.id);setNewSubTitle("");}}
                style={{fontSize:11,color:T.gold,background:"none",border:"none",cursor:"pointer",padding:"7px 0",fontFamily:"'Syne',sans-serif",fontWeight:500}}>
                + Add sub-task
              </button>
            )}
          </div>
        </div>
        <div style={{padding:"14px 20px 50px",borderTop:`1px solid ${T.borderS}`,flexShrink:0}}>
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
          {(view==="calendar"||view==="email"||view==="news")&&(
            <button onClick={()=>runSync(view==="email"?"email":view==="news"?"news":"calendar")} disabled={!!syncing}
              style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:syncing===view||syncing===(view==="email"?"email":view==="news"?"news":"calendar")?T.surface:T.forest,border:"none",color:syncing?T.textMute:T.bg,borderRadius:100,cursor:syncing?"not-allowed":"pointer",fontSize:12,fontWeight:400,letterSpacing:"0.05em",fontFamily:"'Jost', sans-serif",transition:"all 0.15s"}}>
              {syncing===(view==="email"?"email":view==="news"?"news":"calendar") ? (
                <><span style={{display:"inline-block",width:12,height:12,border:`2px solid ${T.textMute}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Syncing…</>
              ) : (
                <><Ico d={I.recur} size={13} color={T.bg}/>Sync Now</>
              )}
            </button>
          )}
          {(view==="tasks"||view==="today")&&(
            <div style={{display:"flex",alignItems:"center",gap:8,background:T.surface,border:`1px solid ${T.borderS}`,borderRadius:8,padding:"7px 12px",width:200}}>
              <Ico d={I.search} size={14} color={T.textMute}/>
              <span style={{fontSize:12,color:T.textMute}}>Search tasks…</span>
            </div>
          )}
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
        {(view==="calendar"||view==="email"||view==="news")&&(
          <button onClick={()=>runSync(view==="email"?"email":view==="news"?"news":"calendar")} disabled={!!syncing}
            style={{width:36,height:36,borderRadius:"50%",background:T.forest,border:`2px solid ${T.forestMid}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:syncing?"not-allowed":"pointer",padding:0}}>
            {syncing===(view==="email"?"email":view==="news"?"news":"calendar") ? (
              <span style={{display:"inline-block",width:14,height:14,border:`2px solid ${T.bg}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
            ) : (
              <Ico d={I.recur} size={16} color={T.bg}/>
            )}
          </button>
        )}
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
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:T.forest,borderTop:"1px solid rgba(255,255,255,0.15)",display:"grid",gridTemplateColumns:"repeat(5,1fr)",padding:"10px 0 22px",backdropFilter:"blur(20px)",zIndex:100}}>
      {[{key:"tasks",ico:I.tasks,label:"Tasks"},{key:"today",ico:I.today,label:"Today"},{key:"calendar",ico:I.cal,label:"Calendar"},{key:"email",ico:I.mail,label:"Email"},{key:"news",ico:I.tasks,label:"News"}].map(n=>(
        <div key={n.key} onClick={()=>{setView(n.key);setDayFilter(null);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer"}}>
          <Ico d={n.ico} size={20} color={view===n.key?"#fff":"rgba(255,255,255,0.55)"}/>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:9,fontWeight:view===n.key?700:500,letterSpacing:"0.5px",textTransform:"uppercase",color:view===n.key?"#fff":"rgba(255,255,255,0.55)"}}>{n.label}</span>
          {view===n.key&&<div style={{width:4,height:4,borderRadius:"50%",background:"#fff",marginTop:1}}/>}
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
        minHeight:"100dvh", display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"flex-start",
        padding:"16px 24px 40px", textAlign:"center", overflowY:"auto",
      }}>
        <div style={{flex:"0 0 auto",minHeight:8}}/>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%",flex:"0 0 auto"}}>
        {/* Wordmark */}
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.25rem",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",color:T.text,marginBottom:12,display:"flex",alignItems:"baseline",gap:1}}>
          Lotus<em style={{fontStyle:"italic",color:T.forestMid}}>List</em>
        </div>

        {/* Greeting */}
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:"0.6rem",fontWeight:500,letterSpacing:"0.22em",textTransform:"uppercase",color:T.textMute,marginBottom:8}}>Good Morning</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"2rem",fontWeight:600,color:T.text,marginBottom:6}}>Welcome back, Anthan</div>
        <div style={{fontSize:"0.82rem",color:T.textMute,marginBottom:40}}>{dateStr}  ·  Los Angeles</div>

        {/* YSS Quote */}
        {yssQuote.quote && (
          <div style={{maxWidth:620,width:"100%",textAlign:"left",marginBottom:48,padding:"0 8px"}}>
            {yssQuote.topic && (
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:500,letterSpacing:"0.2em",textTransform:"uppercase",color:"#B5703A",border:"1px solid #B5703A",borderRadius:20,padding:"3px 14px",display:"inline-block",marginBottom:"0.75rem"}}>{yssQuote.topic}</div>
            )}
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
        <div style={{flex:"0 0 auto",minHeight:40}}/>
      </div>
    );
  }

  // ── RENDER ───────────────────────────────────────────────────
  const base = {color:T.text,fontFamily:"'Jost', sans-serif",fontSize:14,background:T.bg};

  if (!isMobile) return (
    <div style={{...base,display:"flex",flexDirection:"column",height:"100dvh",overflow:"hidden"}}>
      <GoldBar/>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {renderSidebar()}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",borderRight:`1px solid ${T.borderS}`}}>
          {renderMainHeader()}
          {(view==="tasks"||view==="today")&&renderWeekStrip(true)}
          {(view==="tasks"||view==="today")&&renderFilterPills(32)}
          <div style={{flex:1,overflowY:"auto",padding:"0 32px 52px"}}>
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
      {syncToast&&<div style={{position:"fixed",bottom:48,left:"50%",transform:"translateX(-50%)",background:syncToast.isError?"#B94040":T.forest,color:"#fff",padding:"10px 20px",borderRadius:10,fontSize:13,fontFamily:"'Jost',sans-serif",fontWeight:500,zIndex:1100,boxShadow:"0 4px 16px rgba(0,0,0,0.2)",animation:"fadeIn 0.2s ease"}}>{syncToast.message}</div>}
    </div>
  );

  return (
    <div style={{...base,maxWidth:430,margin:"0 auto",height:"100dvh",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"stretch",justifyContent:"flex-start"}}>
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
      {syncToast&&<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:syncToast.isError?"#B94040":T.forest,color:"#fff",padding:"10px 20px",borderRadius:10,fontSize:13,fontFamily:"'Jost',sans-serif",fontWeight:500,zIndex:1100,boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>{syncToast.message}</div>}
    </div>
  );
}
