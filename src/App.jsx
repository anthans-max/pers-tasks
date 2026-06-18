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
const addDaysStr = (n) => { const d = new Date(); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const fmtSlash = (s) => { if (!s) return ""; const [y,m,d] = s.split("-"); return `${m} / ${d} / ${y}`; };
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

const Ico = ({ d, size=16, color="currentColor", style={} }) => (
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

// ── Theme token layer (CSS custom properties, applied on the root) ──
const THEMES = {
  light: {
    '--canvas':'#f6f3ec','--sidebar':'#11201a','--card':'#ffffff',
    '--hair':'rgba(0,0,0,0.06)','--hair2':'rgba(0,0,0,0.11)',
    '--ink':'#22241b','--title':'#1f2118',
    '--muted':'#8a8f80','--muted2':'#6b6f63',
    '--accent':'#c4902a','--soft':'#ece9e0',
    '--pill':'#11201a','--pillfg':'#f0ede6',
  },
  dark: {
    '--canvas':'#0f140f','--sidebar':'#0a120c','--card':'#161c15',
    '--hair':'rgba(255,255,255,0.07)','--hair2':'rgba(255,255,255,0.13)',
    '--ink':'#e2dfd5','--title':'#f0ede6',
    '--muted':'rgba(240,237,230,0.5)','--muted2':'rgba(240,237,230,0.64)',
    '--accent':'#daa84a','--soft':'#20251e',
    '--pill':'#27392e','--pillfg':'#f0ede6',
  },
};
const getThemeVars = (t) => THEMES[t] || THEMES.light;

// Sidebar project dot colors by name (falls back to the project's own color)
const PROJECT_COLORS = {
  'General': '#c4902a',
  'Lotus AI': '#4a6fa5',
  'Sunder Med/Personal': '#c97a3a',
  'Personal': '#2d5a38',
  'AaraSaan Consulting': '#7a5a9a',
  'COEO': '#a8843a',
};

// Calendar event → semantic family (Health / Finance / Shared / Urgent)
const getEventFamily = (eventType = '', calendarSource = '') => {
  const t = eventType.toLowerCase();
  const s = calendarSource.toLowerCase();
  if (t.includes('birthday') || t.includes('anniversary') || t.includes('payday') ||
      t.includes('payment') || t.includes('projected'))          return 'gold';
  if (t.includes('therapy') || t.includes('dental') || t.includes('appointment') ||
      t.includes('camp') || t.includes('health') || t.includes('piano') ||
      t.includes('ymca') || t.includes('medical') || t.includes('mammogram') ||
      t.includes('mixer') || t.includes('outing') || t.includes('reminder'))
                                                                  return 'green';
  if (s === 'shared' || t.includes('flight') || t.includes('class') ||
      t.includes('cleaning') || t.includes('land') || t.includes('foundations'))
                                                                  return 'slate';
  if (t === 'urgent')                                             return 'urgent';
  return 'slate';
};

const CHIP_COLORS = {
  light: {
    green:  { bg:'#e4ece2', border:'#3f7d5a', color:'#2f5a40' },
    gold:   { bg:'#f3ead3', border:'#c4902a', color:'#8a6312' },
    slate:  { bg:'#e6e8ea', border:'#6b7785', color:'#46505c' },
    urgent: { bg:'#f3e0da', border:'#b04a34', color:'#8a3422' },
  },
  dark: {
    green:  { bg:'#1a2a20', border:'#4f8d6a', color:'#9cc4ac' },
    gold:   { bg:'#2a2417', border:'#c4902a', color:'#d8b471' },
    slate:  { bg:'#20242a', border:'#7b889a', color:'#aeb6c2' },
    urgent: { bg:'#2e1d18', border:'#c46a52', color:'#d99b86' },
  },
};
const getChipColors = (family, theme) => CHIP_COLORS[theme]?.[family] ?? CHIP_COLORS.light.slate;

// News source → tag variant
const getNewsSourceVariant = (source = '') => {
  const s = source.toLowerCase();
  if (s.includes('rundown'))    return 'gold';
  if (s.includes('superhuman')) return 'green';
  return 'neutral';
};
const NEWS_TAG_COLORS = {
  light:  { gold:{bg:'#f3ead3',color:'#a8843a'}, green:{bg:'#e4ece2',color:'#2f5a40'}, neutral:{bg:'#ebe9e2',color:'#5a5d52'} },
  dark:   { gold:{bg:'#2a2417',color:'#d8b471'}, green:{bg:'#1a2a20',color:'#9cc4ac'}, neutral:{bg:'#24251f',color:'#b6b3a6'} },
};

// ─────────────────────────────────────────────────────────────
export default function App() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [emailTasks, setEmailTasks] = useState([]);
  const [newsSummaries, setNewsSummaries] = useState([]);
  const [view, setView] = useState("tasks");
  const [theme, setTheme] = useState(() => localStorage.getItem('lotus-theme') || 'light');
  useEffect(() => {
    localStorage.setItem('lotus-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  const isDark = theme === 'dark';
  // Add-task entry point: focus the inline quick-add bar (Phase 2) when present,
  // otherwise fall back to the existing add modal so adding still works.
  const goAdd = () => {
    const focusQa = () => { const el = document.getElementById('ls-qa-input'); if (el) el.focus(); else setAddModal(true); };
    if (view !== 'tasks') { setView('tasks'); setDayFilter(null); setTimeout(focusQa, 60); }
    else focusQa();
  };
  const [dayFilter, setDayFilter] = useState(null);
  const [projectFilter, setProjectFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrio, setNewPrio] = useState(4);
  const [newDate, setNewDate] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newDateRange, setNewDateRange] = useState(false);
  const [newProject, setNewProject] = useState("general");
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
  const [showCompleted, setShowCompleted] = useState(false);
  const [addingSubTo, setAddingSubTo] = useState(null);
  const [newSubTitle, setNewSubTitle] = useState("");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [modalName, setModalName] = useState("");
  const [showMorning, setShowMorning] = useState(true);
  const [quickAddDone, setQuickAddDone] = useState(false);
  const isQuickAdd = typeof window !== "undefined" && window.location.pathname === "/quick-add";
  const [syncing, setSyncing] = useState(null); // "news" | "email" | "calendar" | null
  const [syncToast, setSyncToast] = useState(null); // { message, isError }
  const [yssQuote, setYssQuote] = useState(pickFallbackQuote);
  const isMobile = useIsMobile();

  useEffect(() => {
    Promise.all([
      supabase.from("tm_projects").select("*").eq("user_id", USER_ID),
      supabase.from("tm_tasks").select("*").eq("user_id", USER_ID),
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

  // Quick-add (/quick-add): skip splash, seed defaults (Medium priority, due today+3).
  useEffect(() => {
    if (!isQuickAdd) return;
    setShowMorning(false);
    setNewPrio(3);
    setNewDate(addDaysStr(3));
  }, [isQuickAdd]);

  // Default the new-task project to "General" once projects load
  // (both the standalone /quick-add page and the inline tasks quick-add bar).
  useEffect(() => {
    const gen = projects.find(p => p.name === "General");
    if (gen) setNewProject(gen.id);
  }, [projects]);

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
    if (showCompleted && view==="tasks") {
      let done = tasks.filter(x => x.completed);
      if (projectFilter!=="all") done = done.filter(x => x.projectId===projectFilter);
      if (dayFilter) done = done.filter(x => matchesDay(x, dayFilter));
      t = [...t, ...done];
    }
    return t;
  }, [tasks, view, dayFilter, projectFilter, TODAY, showCompleted]);

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
  // Quick-add submit — reuses the exact addTask logic, then re-seeds defaults for rapid repeated adds.
  const handleQuickAdd = () => {
    if (!newTitle.trim()) return;
    addTask();                       // identical insert into tm_tasks as the main New Task modal
    setNewPrio(3);                   // addTask resets priority→None; restore Medium default
    setNewDate(addDaysStr(3));       // addTask clears the date; restore today+3 default
    setQuickAddDone(true);
    setTimeout(() => setQuickAddDone(false), 1600);
  };
  const toggleDone = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newVal = !task.completed;
    setTasks(p=>p.map(t=>t.id===id?{...t,completed:newVal}:t));
    if(selectedTask?.id===id) { if(newVal) setSelectedTask(null); else setSelectedTask({...task, completed:false}); }
    const {error} = await supabase.from("tm_tasks").update({completed:newVal}).eq("id",id);
    if (error) { console.error("toggleDone:", error.message); return; }
    if (!newVal) return; // un-completing — no recurring spawn
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
  // (Top nav GoldBar/TabBtn removed in redesign — sidebar is the sole desktop nav.)

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
      <div style={{marginLeft:42,marginRight:20,marginBottom:8,fontFamily:"'DM Mono', monospace"}}>
        {subs.map(sub => (
          <div key={sub.id} className="subtask-row" style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid var(--hair)"}}>
            <button onClick={()=>toggleSubTask(taskId,sub.id)}
              style={{width:16,height:16,minWidth:16,borderRadius:"50%",border:`1.5px solid ${sub.isComplete?"var(--accent)":"var(--muted)"}`,
                background:sub.isComplete?"var(--accent)":"transparent",cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {sub.isComplete&&<svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#0c0e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
            </button>
            <span style={{flex:1,fontSize:13,color:sub.isComplete?"var(--muted)":"var(--ink)",textDecoration:sub.isComplete?"line-through":"none"}}>{sub.title}</span>
            <button onClick={()=>deleteSubTask(taskId,sub.id)}
              className="subtask-del"
              style={{background:"none",border:"none",cursor:"pointer",padding:2,opacity:0,transition:"opacity 0.15s"}}>
              <Ico d={I.x} size={12} color="#c25c44"/>
            </button>
          </div>
        ))}
        {addingSubTo===taskId ? (
          <div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0"}}>
            <input autoFocus value={newSubTitle} onChange={e=>setNewSubTitle(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")addSubTask(taskId,newSubTitle);if(e.key==="Escape"){setAddingSubTo(null);setNewSubTitle("");}}}
              placeholder="Sub-task title…"
              style={{flex:1,fontSize:13,padding:"7px 10px",borderRadius:0,border:"1px solid var(--hair2)",background:"var(--card)",color:"var(--ink)",outline:"none",fontFamily:"'DM Mono', monospace"}}/>
            <button onClick={()=>addSubTask(taskId,newSubTitle)}
              style={{fontSize:11,fontWeight:700,color:"var(--accent)",background:"none",border:"none",cursor:"pointer",fontFamily:"'Syne', sans-serif",textTransform:"uppercase",letterSpacing:"0.06em"}}>Add</button>
          </div>
        ) : (
          <button onClick={(e)=>{e.stopPropagation();setAddingSubTo(taskId);setNewSubTitle("");}}
            style={{fontSize:11,color:"var(--accent)",background:"none",border:"none",cursor:"pointer",padding:"8px 0",fontFamily:"'DM Mono', monospace",letterSpacing:"0.04em"}}>
            + Add sub-task
          </button>
        )}
      </div>
    );
  };

  const TaskCard = ({task}) => {
    const sel = selectedTask?.id===task.id;
    const od=isOverdue(task.dueDate);
    const isExpanded = expandedTasks.has(task.id);
    const done = task.completed;
    const hiPri = !done && task.priority<=2;
    const hasMeta = !done && (task.startDate||task.dueDate||task.recurrence||task.subtasks>0||task.fromEmail);
    return (
      <>
        <div onClick={()=>setSelectedTask(sel?null:task)}
          style={{display:"flex",alignItems:"flex-start",gap:16,padding:"17px 20px",borderRadius:0,
            background:"var(--card)",
            border:`1px solid ${sel?"var(--hair2)":"var(--hair)"}`,
            boxShadow:sel?"0 4px 16px rgba(0,0,0,0.10)":"none",
            cursor:"pointer",marginBottom:isExpanded?0:8,transition:"box-shadow 0.2s, border-color 0.2s"}}
          onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.10)";e.currentTarget.style.borderColor="var(--hair2)";}}
          onMouseLeave={e=>{e.currentTarget.style.boxShadow=sel?"0 4px 16px rgba(0,0,0,0.10)":"none";e.currentTarget.style.borderColor=sel?"var(--hair2)":"var(--hair)";}}
        >
          <button onClick={e=>{e.stopPropagation();toggleDone(task.id);}}
            style={{width:26,height:26,minWidth:26,borderRadius:"50%",marginTop:1,flexShrink:0,cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",
              border:done?"1.5px solid var(--accent)":hiPri?"2px solid #b04a34":"1.5px solid var(--muted)",
              background:done?"var(--accent)":"transparent"}}
            onMouseEnter={e=>{if(done)return;e.currentTarget.style.background=hiPri?"rgba(176,74,52,0.12)":"transparent";if(!hiPri)e.currentTarget.style.borderColor="var(--accent)";}}
            onMouseLeave={e=>{if(done)return;e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=hiPri?"#b04a34":"var(--muted)";}}
          >{done&&<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0c0e0b" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:16,lineHeight:1.45,color:done?"var(--muted)":"var(--ink)",textDecoration:done?"line-through":"none"}}>{task.title}</div>
            {hasMeta&&<div style={{display:"flex",gap:14,marginTop:7,alignItems:"center",flexWrap:"wrap",fontSize:12.5}}>
              {(task.startDate||task.dueDate)&&<span style={{color:od?"#c25c44":"var(--muted)"}}>
                {task.startDate?fmtDateRange(task.startDate,task.dueDate):fmtDate(task.dueDate)}
              </span>}
              {task.recurrence&&<span style={{color:"var(--accent)"}}>↻ {RL[task.recurrence]}</span>}
              {task.subtasks>0&&<span onClick={e=>{e.stopPropagation();setExpandedTasks(p=>{const n=new Set(p);n.has(task.id)?n.delete(task.id):n.add(task.id);return n;});}}
                style={{color:"var(--muted)",display:"flex",alignItems:"center",gap:3,cursor:"pointer"}}>
                {task.subtasksDone}/{task.subtasks}
                <Ico d={I.chevD} size={11} color="var(--muted)" style={{transform:isExpanded?"rotate(180deg)":"none",transition:"transform 0.15s"}}/>
              </span>}
              {task.fromEmail&&<span style={{color:"var(--muted)"}}>✉</span>}
            </div>}
          </div>
        </div>
        {isExpanded&&<SubTaskList taskId={task.id}/>}
      </>
    );
  };

  const completedCount = useMemo(() => {
    let done = tasks.filter(x => x.completed);
    if (projectFilter!=="all") done = done.filter(x => x.projectId===projectFilter);
    if (dayFilter) done = done.filter(x => matchesDay(x, dayFilter));
    return done.length;
  }, [tasks, projectFilter, dayFilter]);

  const renderFeed = (flat=false) => {
    const isEmpty = visTasks.length===0;
    const showTodayEvents = view==="today" && todayEvents.length > 0;
    const groupLabel = {fontFamily:"'DM Mono', monospace",fontSize:11,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--muted2)"};
    const emptyState = <div style={{padding:"80px 0",textAlign:"center",fontFamily:"'DM Mono', monospace",fontSize:14,color:"var(--muted2)"}}>Nothing here — you're all caught up. ❋</div>;
    const quickAddBar = (
      <div style={{display:"flex",alignItems:"center",gap:14,height:58,background:"var(--card)",border:"1px solid var(--hair2)",borderRadius:0,padding:"0 18px",margin:"12px 0 16px"}}>
        <div style={{width:30,height:30,minWidth:30,borderRadius:"50%",background:"var(--accent)",color:"#0c0e0b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0}}>＋</div>
        <input id="ls-qa-input" value={newTitle} onChange={e=>setNewTitle(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&newTitle.trim())addTask();}}
          placeholder="Add a task to General…   press Enter to save"
          style={{flex:1,minWidth:0,border:"none",outline:"none",background:"transparent",fontFamily:"'DM Mono', monospace",fontSize:isMobile?16:15,color:"var(--ink)"}}/>
      </div>
    );
    const wrap = (children) => <div style={{maxWidth:920,margin:"0 auto",paddingBottom:8}}>{view==="tasks"&&quickAddBar}{children}</div>;

    if (flat||view==="today"||dayFilter) return wrap(<>
      {showTodayEvents && (
        <div style={{marginBottom:visTasks.length?16:0}}>
          <div style={{...groupLabel,marginBottom:8}}>Calendar</div>
          {todayEvents.map((ev,i) => {
            const isAllDay = ev.allDay || ev.event_type==="all_day";
            const timeStr = isAllDay ? "All day" : (ev.start_time || (ev.date && ev.date.length > 10 ? ev.date.slice(11,16) : ""));
            const isShared = ev.calendarSource==="shared" || ev.calendar_source==="shared";
            const lower = (ev.title||"").toLowerCase();
            const isBday = lower.includes("birthday")||lower.includes("bday")||lower.includes("anniversary");
            const accent = isBday ? "#8A6310" : isShared ? "#4A3F80" : "#2A5E54";
            const bg = isBday ? "rgba(181,135,26,0.10)" : isShared ? "rgba(123,111,170,0.10)" : "rgba(74,124,111,0.10)";
            return (
              <div key={ev.id||ev.gcal_event_id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",marginBottom:8,borderRadius:0,background:bg,borderLeft:`3px solid ${accent}`}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'DM Mono', monospace",fontSize:14,color:"var(--ink)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</div>
                  {ev.location && <div style={{fontSize:11,color:"var(--muted)",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.location}</div>}
                </div>
                {timeStr && <div style={{fontFamily:"'DM Mono', monospace",fontSize:12,color:accent,whiteSpace:"nowrap"}}>{timeStr}</div>}
              </div>
            );
          })}
        </div>
      )}
      {visTasks.length > 0 && showTodayEvents && (
        <div style={{...groupLabel,margin:"24px 0 10px"}}>Tasks</div>
      )}
      {isEmpty && !showTodayEvents ? emptyState : <div style={{display:"flex",flexDirection:"column",gap:8}}>{visTasks.map(t=><TaskCard key={t.id} task={t}/>)}</div>}
    </>);

    if (projectFilter !== "all") return wrap(
      isEmpty ? emptyState : <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {visTasks.filter(t=>!t.completed).map(t=><TaskCard key={t.id} task={t}/>)}
        {showCompleted&&visTasks.filter(t=>t.completed).map(t=><TaskCard key={t.id} task={t}/>)}
      </div>
    );

    const anyGroup = sortedProjects.some(proj=>visTasks.some(t=>t.projectId===proj.id&&(!t.completed||showCompleted)));
    return wrap(
      !anyGroup ? emptyState : sortedProjects.map(proj=>{
        const projTasks=visTasks.filter(t=>t.projectId===proj.id&&!t.completed);
        if (!projTasks.length && !(showCompleted && visTasks.some(t=>t.projectId===proj.id&&t.completed))) return null;
        const doneTasks=showCompleted?visTasks.filter(t=>t.projectId===proj.id&&t.completed):[];
        return (
          <div key={proj.id}>
            <div style={{display:"flex",alignItems:"center",gap:10,margin:"24px 0 10px"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:PROJECT_COLORS[proj.name]||proj.color||"#c4902a",flexShrink:0}}/>
              <span style={groupLabel}>{proj.name}</span>
              <div style={{flex:1,height:1,background:"var(--hair)"}}/>
              <span style={{fontFamily:"'DM Mono', monospace",fontSize:12,color:"var(--muted2)"}}>{projTasks.length+doneTasks.length}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {projTasks.map(t=><TaskCard key={t.id} task={t}/>)}
              {doneTasks.map(t=><TaskCard key={t.id} task={t}/>)}
            </div>
          </div>
        );
      })
    );
  };

  const renderFilterPills = (padH=44) => {
    const h = isMobile?42:44;
    const chip = (active) => ({
      height:h,display:"flex",alignItems:"center",gap:8,padding:"0 22px",borderRadius:999,whiteSpace:"nowrap",cursor:"pointer",
      fontFamily:"'DM Mono', monospace",fontSize:12.5,textTransform:"uppercase",letterSpacing:"0.05em",transition:"all 0.15s",
      background:active?"var(--pill)":"transparent",
      border:`1px solid ${active?"var(--pill)":"var(--hair2)"}`,
      color:active?"var(--pillfg)":"var(--ink)",
    });
    const hoverIn = (active)=>(e)=>{if(!active){e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.color="var(--accent)";}};
    const hoverOut = (active)=>(e)=>{if(!active){e.currentTarget.style.borderColor="var(--hair2)";e.currentTarget.style.color="var(--ink)";}};
    return (
    <div style={{display:"flex",gap:10,padding:isMobile?"14px 16px":`18px ${padH}px`,flexWrap:isMobile?"nowrap":"wrap",overflowX:isMobile?"auto":"visible",scrollbarWidth:"none",flexShrink:0}}>
      {[{id:"all",name:"All"},...sortedProjects.map(p=>({id:p.id,name:p.name}))].map(f=>{
        const active=projectFilter===f.id;
        return (
          <div key={f.id} onClick={()=>setProjectFilter(f.id)} style={chip(active)} onMouseEnter={hoverIn(active)} onMouseLeave={hoverOut(active)}>{f.name}</div>
        );
      })}
      {view==="tasks"&&completedCount>0&&(
        <div onClick={()=>setShowCompleted(p=>!p)} style={chip(showCompleted)} onMouseEnter={hoverIn(showCompleted)} onMouseLeave={hoverOut(showCompleted)}>
          Completed<span style={{opacity:0.55}}>{completedCount}</span>
        </div>
      )}
      {view==="tasks"&&showCompleted&&completedCount>0&&(
        <div onClick={()=>{
          const scope=projectFilter!=="all"?`${completedCount} completed tasks in this project`:`all ${completedCount} completed tasks`;
          if(!window.confirm(`Delete ${scope}? This cannot be undone.`)) return;
          const toDelete=tasks.filter(t=>t.completed&&(projectFilter==="all"||t.projectId===projectFilter));
          const ids=toDelete.map(t=>t.id);
          setTasks(p=>p.filter(t=>!ids.includes(t.id)));
          setShowCompleted(false);
          supabase.from("tm_tasks").delete().in("id",ids).then(({error})=>{if(error)console.error("clearCompleted:",error.message);});
        }}
          style={{display:"flex",alignItems:"center",height:h,fontFamily:"'DM Mono', monospace",fontSize:11,color:"#c25c44",cursor:"pointer",whiteSpace:"nowrap",letterSpacing:"0.04em",textTransform:"uppercase"}}
        >Clear all</div>
      )}
    </div>
    );
  };

  const renderCalendar = (padH=16) => {
    const {daysInMonth,startPad,byDate}=calData, {year,month}=calMonth;
    const now=new Date(); now.setHours(0,0,0,0);
    const tD=now.getDate(),tM=now.getMonth(),tY=now.getFullYear();
    const isCurMonth = year===tY && month===tM;
    const cells=[...Array(startPad).fill(null),...Array.from({length:daysInMonth},(_,i)=>i+1)];
    while(cells.length%7!==0) cells.push(null);

    const PRIORITY_FAMILY = {1:'urgent',2:'gold',3:'green',4:'slate'};
    const familyOf = (t) =>
        t._gcal     ? getEventFamily(t.title, t.calendarSource)
      : t._calEvent ? getEventFamily(t.event_type, t.calendar_source)
      :               (PRIORITY_FAMILY[t.priority] || 'slate');   // local + email tasks
    const dedup = (arr) => arr.filter((ev,idx,self)=>idx===self.findIndex(e=>e.title===ev.title&&e.dueDate===ev.dueDate));

    const prevMonth = ()=>setCalMonth(p=>p.month===0?{year:p.year-1,month:11}:{...p,month:p.month-1});
    const nextMonth = ()=>setCalMonth(p=>p.month===11?{year:p.year+1,month:0}:{...p,month:p.month+1});
    const goToday   = ()=>setCalMonth({year:tY,month:tM});
    const dateEyebrow = now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}).toUpperCase();

    const arrowBtn = (glyph,onClick)=>(
      <button onClick={onClick}
        style={{width:42,height:42,borderRadius:"50%",border:"1px solid var(--hair2)",background:"var(--card)",color:"var(--ink)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono', monospace",fontSize:18,lineHeight:1,paddingBottom:2,transition:"border-color 0.15s"}}
        onMouseEnter={e=>e.currentTarget.style.borderColor="var(--accent)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--hair2)"}>{glyph}</button>
    );

    const header = (
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",padding:isMobile?"24px 16px 14px":"30px 44px 18px",borderBottom:"1px solid var(--hair)"}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond', serif",fontWeight:300,fontSize:isMobile?38:46,lineHeight:1,color:"var(--title)"}}>Calendar</div>
          <div style={{fontFamily:"'DM Mono', monospace",fontSize:12,textTransform:"uppercase",letterSpacing:"0.12em",color:"var(--muted)",marginTop:8}}>{dateEyebrow}</div>
        </div>
        <button onClick={()=>runSync('calendar')} disabled={!!syncing}
          style={{display:"flex",alignItems:"center",gap:8,height:46,padding:"0 22px",borderRadius:"999px",border:"none",background:syncing==='calendar'?"var(--soft)":"var(--pill)",color:syncing==='calendar'?"var(--muted)":"var(--pillfg)",cursor:syncing?"not-allowed":"pointer",fontFamily:"'DM Mono', monospace",fontSize:12.5,letterSpacing:"0.06em",textTransform:"uppercase",transition:"all 0.15s",flexShrink:0}}>
          {syncing==='calendar'
            ? <><span style={{display:"inline-block",width:12,height:12,border:"2px solid var(--muted)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Syncing…</>
            : <>Sync Now</>}
        </button>
      </div>
    );

    const monthNav = (
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:isMobile?"16px":"24px 44px 18px"}}>
        {arrowBtn("‹",prevMonth)}
        <div style={{fontFamily:"'Cormorant Garamond', serif",fontStyle:"italic",fontSize:30,color:"var(--title)",whiteSpace:"nowrap"}}>{MONTHS[month]} {year}</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {arrowBtn("›",nextMonth)}
          <button onClick={goToday}
            style={{height:42,padding:"0 18px",borderRadius:"999px",border:"1px solid var(--hair2)",background:"var(--card)",color:"var(--ink)",cursor:"pointer",fontFamily:"'DM Mono', monospace",fontSize:12,letterSpacing:"0.05em",textTransform:"uppercase"}}>Today</button>
        </div>
      </div>
    );

    // ── Mobile agenda ──
    if (isMobile) {
      const agendaDays=[];
      for (let d=1; d<=daysInMonth; d++){
        if (isCurMonth && d<tD) continue;
        const evs=dedup(byDate[d]||[]);
        if (evs.length) agendaDays.push({d,evs});
      }
      return (
        <div>
          {header}
          {monthNav}
          <div style={{padding:"16px 16px 110px"}}>
            {agendaDays.length===0 && (
              <div style={{fontFamily:"'DM Mono', monospace",fontSize:13,color:"var(--muted)",textAlign:"center",padding:"40px 0"}}>Nothing scheduled. ❋</div>
            )}
            {agendaDays.map(({d,evs})=>{
              const isToday=isCurMonth&&d===tD;
              const wd=DAYS[new Date(year,month,d).getDay()];
              return (
                <div key={d} style={{marginBottom:24}}>
                  <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:10}}>
                    <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:30,lineHeight:1,color:isToday?"var(--accent)":"var(--title)"}}>{d}</span>
                    <span style={{fontFamily:"'DM Mono', monospace",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--muted)"}}>{wd} · {MONTHS[month].slice(0,3)}</span>
                    {isToday && <span style={{fontFamily:"'DM Mono', monospace",fontSize:9.5,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--pillfg)",background:"var(--pill)",borderRadius:"999px",padding:"2px 9px"}}>Today</span>}
                  </div>
                  {evs.map((t,ti)=>{
                    const c=getChipColors(familyOf(t),theme);
                    const recur=t._projected||t.recurrence;
                    const clickable=!t._projected&&!t._gcal&&t.sectionId;
                    return (
                      <div key={ti} onClick={()=>{if(clickable)setSelectedTask(t);}}
                        style={{background:"var(--card)",border:"1px solid var(--hair)",borderLeft:`3px solid ${c.border}`,padding:"14px 16px",marginBottom:8,fontFamily:"'DM Mono', monospace",fontSize:15,color:"var(--ink)",cursor:clickable?"pointer":"default"}}>
                        {recur?'↻ ':''}{t.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ── Desktop grid ──
    return (
      <div>
        {header}
        {monthNav}
        <div style={{padding:"0 44px 48px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderLeft:"1px solid var(--hair2)",borderTop:"1px solid var(--hair2)"}}>
            {DAYS.map(d=>(
              <div key={d} style={{padding:"12px 14px",fontFamily:"'DM Mono', monospace",fontSize:11,letterSpacing:"0.14em",color:"var(--muted2)",textTransform:"uppercase",borderRight:"1px solid var(--hair2)",borderBottom:"1px solid var(--hair2)",background:"var(--soft)"}}>{d.toUpperCase()}</div>
            ))}
            {cells.map((day,i)=>{
              if(!day) return <div key={i} style={{minHeight:124,borderRight:"1px solid var(--hair2)",borderBottom:"1px solid var(--hair2)",background:"var(--soft)",opacity:0.5}}/>;
              const isT=year===tY&&month===tM&&day===tD;
              const dt=dedup(byDate[day]||[]);
              return (
                <div key={i} onClick={()=>{const dd=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;setDayFilter(dd);setView("today");}}
                  style={{minHeight:124,background:"var(--card)",borderRight:"1px solid var(--hair2)",borderBottom:"1px solid var(--hair2)",padding:"8px 8px 10px",display:"flex",flexDirection:"column",gap:4,cursor:"pointer",overflow:"hidden"}}>
                  {isT
                    ? <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:"var(--pill)",color:"var(--pillfg)",fontFamily:"'DM Mono', monospace",fontSize:12,lineHeight:1,flexShrink:0}}>{day}</span>
                    : <span style={{fontFamily:"'DM Mono', monospace",fontSize:13,color:"var(--muted2)",padding:2}}>{day}</span>}
                  {dt.slice(0,2).map((t,ti)=>{
                    const c=getChipColors(familyOf(t),theme);
                    const proj=t._projected;
                    const recur=proj||t.recurrence;
                    return (
                      <div key={ti} title={t.title+(proj?' (projected)':'')}
                        onClick={(e)=>{if(proj){e.stopPropagation();return;}if(!t._gcal&&t.sectionId)setSelectedTask(t);}}
                        style={{fontFamily:"'DM Mono', monospace",fontSize:11,lineHeight:1.35,padding:"3px 7px",borderLeft:`2px solid ${c.border}`,background:c.bg,color:c.color,borderRadius:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",opacity:proj?0.7:1,cursor:!t._gcal&&!proj&&t.sectionId?"pointer":"default"}}>
                        {recur?'↻ ':''}{t.title}
                      </div>
                    );
                  })}
                  {dt.length>2&&<div style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:"var(--muted2)",padding:"1px 7px"}}>+{dt.length-2} more</div>}
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:22,flexWrap:"wrap",padding:"18px 0 0"}}>
            {[{f:'green',l:'Health'},{f:'gold',l:'Finance & birthdays'},{f:'slate',l:'Shared / external'},{f:'urgent',l:'Urgent'}].map(x=>(
              <div key={x.f} style={{display:"flex",alignItems:"center",gap:8,fontFamily:"'DM Mono', monospace",fontSize:11,color:"var(--muted2)"}}>
                <span style={{width:11,height:11,borderRadius:0,background:getChipColors(x.f,theme).border}}/>{x.l}
              </div>
            ))}
            <div style={{display:"flex",alignItems:"center",gap:8,fontFamily:"'DM Mono', monospace",fontSize:11,color:"var(--muted2)"}}>↻ Projected</div>
          </div>
        </div>
      </div>
    );
  };

  const renderEmailView = (padH=16) => {
    const hasSel = selectedEmails.size > 0;
    const PRIORITY_FAMILY = {1:'urgent',2:'gold',3:'green',4:'slate'};
    const dateEyebrow = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}).toUpperCase();

    const header = (
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",padding:isMobile?"24px 16px 14px":"30px 44px 18px",borderBottom:"1px solid var(--hair)"}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond', serif",fontWeight:300,fontSize:isMobile?38:46,lineHeight:1,color:"var(--title)"}}>Email Capture</div>
          <div style={{fontFamily:"'DM Mono', monospace",fontSize:12,textTransform:"uppercase",letterSpacing:"0.12em",color:"var(--muted)",marginTop:8}}>{dateEyebrow} · {emailTasks.length} TO TRIAGE</div>
        </div>
        <button onClick={()=>runSync('email')} disabled={!!syncing}
          style={{display:"flex",alignItems:"center",gap:8,height:46,padding:"0 22px",borderRadius:"999px",border:"none",background:syncing==='email'?"var(--soft)":"var(--pill)",color:syncing==='email'?"var(--muted)":"var(--pillfg)",cursor:syncing?"not-allowed":"pointer",fontFamily:"'DM Mono', monospace",fontSize:12.5,letterSpacing:"0.06em",textTransform:"uppercase",transition:"all 0.15s",flexShrink:0}}>
          {syncing==='email'
            ? <><span style={{display:"inline-block",width:12,height:12,border:"2px solid var(--muted)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Syncing…</>
            : <>Sync Now</>}
        </button>
      </div>
    );

    return (
      <div>
        {header}
        {emailTasks.length===0?(
          <div style={{padding:"60px 0",textAlign:"center",fontFamily:"'DM Mono', monospace",fontSize:14,color:"var(--muted2)"}}>Inbox zero — every email triaged. ❋</div>
        ):(
          <div style={{maxWidth:1040,padding:isMobile?"20px 16px":"32px 44px",paddingBottom:hasSel?(isMobile?"110px":"100px"):(isMobile?110:48),display:"flex",flexDirection:"column",gap:12}}>
            {emailTasks.map(et=>{
              const checked = selectedEmails.has(et.id);
              const c = getChipColors(PRIORITY_FAMILY[et.priority],theme);
              return (
                <div key={et.id}
                  style={{display:"flex",gap:18,alignItems:"flex-start",background:"var(--card)",border:checked?"1px solid var(--accent)":"1px solid var(--hair)",borderLeft:`3px solid ${c.border}`,padding:"20px 22px",borderRadius:0,transition:"box-shadow 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                  <button onClick={()=>toggleEmailSelect(et.id)}
                    style={{width:26,height:26,minWidth:26,borderRadius:"6px",border:checked?"1.5px solid var(--accent)":"1.5px solid var(--muted)",background:checked?"var(--accent)":"transparent",cursor:"pointer",padding:0,flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}
                    onMouseEnter={e=>{if(!checked)e.currentTarget.style.borderColor="var(--accent)";}} onMouseLeave={e=>{if(!checked)e.currentTarget.style.borderColor="var(--muted)";}}>
                    {checked&&<svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#0c0e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                  <div style={{width:44,height:44,minWidth:44,background:"var(--soft)",border:"1px solid var(--hair)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18,color:"var(--muted2)"}}>✉</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"'DM Mono', monospace",fontWeight:500,fontSize:16,lineHeight:1.4,color:"var(--ink)"}}>{et.title}</div>
                    <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap",marginTop:9}}>
                      <span style={{background:"var(--soft)",fontFamily:"'DM Mono', monospace",fontSize:11.5,color:"var(--muted2)",padding:"4px 10px",borderRadius:0}}>From: {et.emailFrom}</span>
                      <span style={{fontFamily:"'DM Mono', monospace",fontSize:11.5,textTransform:"uppercase",letterSpacing:"0.04em",color:c.color}}>{PL[et.priority]}</span>
                      {et.dueDate&&<span style={{fontFamily:"'DM Mono', monospace",fontSize:11.5,color:isOverdue(et.dueDate)?"#c25c44":"var(--muted)"}}>📅 {fmtDate(et.dueDate)}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {hasSel&&(
          <div style={{position:"sticky",bottom:0,background:"var(--card)",borderTop:"1px solid var(--hair)",padding:isMobile?"14px 16px":"14px 44px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <span style={{fontFamily:"'DM Mono', monospace",fontSize:12.5,letterSpacing:"0.04em",textTransform:"uppercase",color:"var(--accent)",whiteSpace:"nowrap"}}>{selectedEmails.size} selected</span>
            <select value={batchProject} onChange={e=>setBatchProject(e.target.value)}
              style={{flex:1,minWidth:140,background:"var(--soft)",border:"1px solid var(--hair2)",color:"var(--ink)",borderRadius:0,padding:"9px 12px",fontFamily:"'DM Mono', monospace",fontSize:12,outline:"none"}}>
              {sortedProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={()=>batchAssign(batchProject)}
              style={{height:42,padding:"0 20px",background:"var(--pill)",border:"none",color:"var(--pillfg)",borderRadius:"999px",cursor:"pointer",fontFamily:"'DM Mono', monospace",fontSize:12,letterSpacing:"0.05em",textTransform:"uppercase",whiteSpace:"nowrap"}}>
              Assign
            </button>
            <button onClick={batchDismiss}
              style={{height:42,padding:"0 20px",background:"transparent",border:"1px solid var(--hair2)",color:"var(--ink)",borderRadius:"999px",cursor:"pointer",fontFamily:"'DM Mono', monospace",fontSize:12,letterSpacing:"0.05em",textTransform:"uppercase",whiteSpace:"nowrap"}}>
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── News View ───────────────────────────────────────────────
  const renderNewsView = (padH=16) => {
    // Group stories by date
    const byDate = {};
    newsSummaries.forEach(s => {
      if (!byDate[s.storyDate]) byDate[s.storyDate] = [];
      byDate[s.storyDate].push(s);
    });
    const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
    const dateEyebrow = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}).toUpperCase();

    const header = (
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",padding:isMobile?"24px 16px 14px":"30px 44px 18px",borderBottom:"1px solid var(--hair)"}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond', serif",fontWeight:300,fontSize:isMobile?38:46,lineHeight:1,color:"var(--title)"}}>News</div>
          <div style={{fontFamily:"'DM Mono', monospace",fontSize:12,textTransform:"uppercase",letterSpacing:"0.12em",color:"var(--muted)",marginTop:8}}>{dateEyebrow}</div>
        </div>
        <button onClick={()=>runSync('news')} disabled={!!syncing}
          style={{display:"flex",alignItems:"center",gap:8,height:46,padding:"0 22px",borderRadius:"999px",border:"none",background:syncing==='news'?"var(--soft)":"var(--pill)",color:syncing==='news'?"var(--muted)":"var(--pillfg)",cursor:syncing?"not-allowed":"pointer",fontFamily:"'DM Mono', monospace",fontSize:12.5,letterSpacing:"0.06em",textTransform:"uppercase",transition:"all 0.15s",flexShrink:0}}>
          {syncing==='news'
            ? <><span style={{display:"inline-block",width:12,height:12,border:"2px solid var(--muted)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Syncing…</>
            : <>Sync Now</>}
        </button>
      </div>
    );

    return (
      <div>
        {header}
        {newsSummaries.length === 0 ? (
          <div style={{padding:"60px 0",textAlign:"center",fontFamily:"'DM Mono', monospace",fontSize:14,color:"var(--muted2)"}}>No news summaries yet — sync to fetch today's briefing. ❋</div>
        ) : (
          <div style={{maxWidth:1040,padding:isMobile?"20px 16px 110px":"32px 44px"}}>
            {dates.map(date => (
              <div key={date} style={{marginBottom:32}}>
                <div style={{fontFamily:"'DM Mono', monospace",fontSize:11,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--muted2)",marginBottom:14}}>
                  {new Date(date + "T00:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {byDate[date].map(item => {
                    const variant = getNewsSourceVariant(item.source);
                    const tagColors = NEWS_TAG_COLORS[theme][variant];
                    const Card = item.url ? "a" : "div";
                    const cardProps = item.url ? {href:item.url, target:"_blank", rel:"noopener noreferrer"} : {};
                    return (
                      <Card key={item.id} {...cardProps}
                        style={{display:"block",background:"var(--card)",border:"1px solid var(--hair)",borderRadius:0,padding:"24px 26px",transition:"box-shadow 0.2s",textDecoration:"none",color:"inherit",cursor:item.url?"pointer":"default"}}
                        onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 18px rgba(0,0,0,0.1)";}}
                        onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
                          <span style={{background:tagColors.bg,color:tagColors.color,fontFamily:"'DM Mono', monospace",fontSize:10.5,letterSpacing:"0.05em",textTransform:"uppercase",borderRadius:0,padding:"4px 10px"}}>{item.source}</span>
                          {item.category && <span style={{background:"transparent",border:"1px solid var(--hair2)",color:"var(--muted2)",fontFamily:"'DM Mono', monospace",fontSize:10.5,letterSpacing:"0.05em",textTransform:"uppercase",borderRadius:0,padding:"4px 10px"}}>{item.category}</span>}
                        </div>
                        <div style={{fontFamily:"'Cormorant Garamond', serif",fontWeight:500,fontSize:26,lineHeight:1.2,color:"var(--title)",marginBottom:10}}>{item.headline}</div>
                        <div style={{fontFamily:"'DM Mono', monospace",fontSize:13.5,lineHeight:1.75,color:"var(--muted2)"}}>{item.summary}</div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
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

      {selectedTask&&isMobile&&renderDetailDrawer(selectedTask,true)}

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
  const renderSidebar = () => {
    const navItems = [
      {key:"tasks",label:"All Tasks",badge:openCount?<span style={{color:"#daa84a",fontSize:12}}>{openCount}</span>:null},
      {key:"today",label:"Today"},
      {key:"calendar",label:"Calendar"},
      {key:"email",label:"Email Capture",badge:emailTasks.length?<span style={{minWidth:20,height:20,padding:"0 5px",borderRadius:"50%",background:"#c4902a",color:"#0c0e0b",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>{emailTasks.length}</span>:null},
      {key:"news",label:"News"},
    ];
    return (
    <div style={{width:272,minWidth:272,background:"var(--sidebar)",display:"flex",flexDirection:"column",padding:"28px 20px",paddingBottom:"20px",fontFamily:"'DM Mono', monospace",overflow:"hidden"}}>
      {/* Wordmark */}
      <div style={{marginBottom:26}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:27,letterSpacing:"0.05em",color:"#f0ede6",lineHeight:1}}>
          LOTUS<em style={{fontStyle:"italic",color:"#daa84a"}}>LIST</em>
        </div>
        <div style={{fontSize:9.5,letterSpacing:"0.18em",color:"rgba(240,237,230,0.45)",marginTop:4}}>TASK MANAGER · 2026</div>
      </div>

      {/* Profile chip */}
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"11px 12px",border:"1px solid rgba(255,255,255,0.1)",marginBottom:18}}>
        <div style={{width:38,height:38,borderRadius:"50%",border:"1px solid #daa84a",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontSize:19,color:"#daa84a",flexShrink:0}}>A</div>
        <div style={{minWidth:0}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#f0ede6",lineHeight:1.15}}>Anthan</div>
          <div style={{fontSize:9.5,letterSpacing:"0.1em",color:"rgba(240,237,230,0.45)"}}>LOTUS LIST</div>
        </div>
      </div>

      {/* Add task */}
      <button onClick={goAdd} style={{width:"100%",height:52,background:"var(--accent)",color:"#0c0e0b",border:"none",borderRadius:0,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,textTransform:"uppercase",letterSpacing:"0.08em",cursor:"pointer",marginBottom:26}}>＋ Add task</button>

      {/* VIEWS */}
      <div style={{fontSize:10,letterSpacing:"0.2em",color:"rgba(240,237,230,0.4)",marginBottom:10}}>VIEWS</div>
      <div style={{display:"flex",flexDirection:"column",gap:2,marginBottom:24}}>
        {navItems.map(n=>{
          const act=view===n.key;
          return (
            <button key={n.key} onClick={()=>{setView(n.key);setDayFilter(null);}}
              style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 12px",border:"none",borderRadius:0,cursor:"pointer",fontFamily:"'DM Mono', monospace",fontSize:14,background:act?"rgba(196,144,42,0.18)":"transparent",color:act?"#f0ede6":"rgba(240,237,230,0.72)"}}>
              <span>{n.label}</span>
              {n.badge||null}
            </button>
          );
        })}
      </div>

      {/* PROJECTS */}
      <div style={{fontSize:10,letterSpacing:"0.2em",color:"rgba(240,237,230,0.4)",marginBottom:10}}>PROJECTS</div>
      <div style={{display:"flex",flexDirection:"column",gap:1,flex:1,minHeight:0,overflowY:"auto"}}>
        {sortedProjects.map(p=>(
          <div key={p.id} onClick={()=>{setProjectFilter(p.id);setView("tasks");setDayFilter(null);}}
            style={{display:"flex",alignItems:"center",gap:11,padding:"9px 12px",cursor:"pointer"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:PROJECT_COLORS[p.name]||p.color||"#c4902a",flexShrink:0}}/>
            <span style={{flex:1,fontSize:13.5,color:"rgba(240,237,230,0.78)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
            <span style={{fontSize:11,color:"rgba(240,237,230,0.4)"}}>{tasks.filter(t=>!t.completed&&t.projectId===p.id).length}</span>
          </div>
        ))}
      </div>

      {/* Theme toggle */}
      <button onClick={toggleTheme} style={{height:42,background:"transparent",border:"1px solid rgba(255,255,255,0.16)",borderRadius:0,fontFamily:"'DM Mono', monospace",fontSize:12,textTransform:"uppercase",letterSpacing:"0.05em",color:"rgba(240,237,230,0.78)",marginTop:14,marginBottom:8,cursor:"pointer"}}>
        {isDark?"☀  Light mode":"☾  Dark mode"}
      </button>
      <div style={{height: '20px', flexShrink: 0}} />
    </div>
    );
  };

  // ── Desktop Detail Panel ─────────────────────────────────────
  const renderDetailPanel = () => {
    const task=selectedTask; if(!task) return null;
    return renderDetailDrawer(task,false);
  };

  // Shared task-detail drawer body (desktop in-flow panel + mobile full-screen)
  const renderDetailDrawer = (task, mob) => {
    const od=isOverdue(task.dueDate);
    const fld={background:"var(--soft)",border:"1px solid var(--hair2)",borderRadius:0,padding:"8px 12px",fontFamily:"'DM Mono', monospace",fontSize:15,color:"var(--ink)",width:"100%",outline:"none",boxSizing:"border-box"};
    const foc={onFocus:e=>e.currentTarget.style.borderColor="var(--accent)",onBlur:e=>e.currentTarget.style.borderColor="var(--hair2)"};
    const lbl={fontFamily:"'DM Mono', monospace",fontSize:11,textTransform:"uppercase",letterSpacing:"0.14em",color:"var(--muted2)",marginBottom:8};
    const sectionStyle={padding:"20px 28px",borderBottom:"1px solid var(--hair)"};
    const container=mob
      ? {position:"fixed",inset:0,width:"100vw",height:"100dvh",zIndex:1000,background:"var(--card)",borderLeft:"1px solid var(--hair)",boxShadow:"-4px 0 24px rgba(0,0,0,0.08)",borderRadius:0,display:"flex",flexDirection:"column"}
      : {width:420,minWidth:420,height:"100%",background:"var(--card)",borderLeft:"1px solid var(--hair)",boxShadow:"-4px 0 24px rgba(0,0,0,0.08)",borderRadius:0,display:"flex",flexDirection:"column"};
    return (
      <div style={container}>
        {/* Header */}
        <div style={{padding:"28px 28px 20px",borderBottom:"1px solid var(--hair)",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontFamily:"'DM Mono', monospace",fontSize:12,textTransform:"uppercase",letterSpacing:"0.14em",color:"var(--muted2)"}}>Task Detail</div>
            <button onClick={()=>setSelectedTask(null)}
              style={{width:32,height:32,borderRadius:"50%",border:"1px solid var(--hair2)",background:"transparent",color:"var(--muted2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono', monospace",fontSize:16,lineHeight:1,transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.color="var(--accent)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--hair2)";e.currentTarget.style.color="var(--muted2)";}}>×</button>
          </div>
          <input value={task.title} onChange={e=>updateTask(task.id,{title:e.target.value})}
            style={{width:"100%",marginTop:12,background:"transparent",border:"none",borderBottom:"1px solid var(--hair2)",color:"var(--title)",fontFamily:"'Cormorant Garamond', serif",fontWeight:500,fontSize:32,lineHeight:1.2,outline:"none",padding:"4px 0"}}
            onFocus={e=>e.currentTarget.style.borderBottomColor="var(--accent)"} onBlur={e=>e.currentTarget.style.borderBottomColor="var(--hair2)"}/>
        </div>

        {/* Scroll body */}
        <div style={{flex:1,overflowY:"auto"}}>
          {/* Status pill */}
          <div style={{padding:"18px 28px 0"}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:6,background:"var(--soft)",border:"1px solid var(--hair2)",borderRadius:"999px",padding:"6px 14px",fontFamily:"'DM Mono', monospace",fontSize:13,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--muted2)"}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:PC[task.priority],display:"inline-block"}}/>{PL[task.priority]}
            </span>
          </div>

          {/* Dates */}
          <div style={sectionStyle}>
            {task.startDate ? (
              <>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div style={{...lbl,marginBottom:0}}>Start Date</div><div style={{...lbl,marginBottom:0}}>End Date</div>
                </div>
                <div style={{display:"flex",gap:12,marginTop:8}}>
                  <input type="date" value={task.startDate||""} onChange={e=>updateTask(task.id,{startDate:e.target.value})} style={fld} {...foc}/>
                  <input type="date" value={task.dueDate||""} onChange={e=>updateTask(task.id,{dueDate:e.target.value})} style={{...fld,borderColor:od?"#c25c44":"var(--hair2)"}} onFocus={e=>e.currentTarget.style.borderColor="var(--accent)"} onBlur={e=>e.currentTarget.style.borderColor=od?"#c25c44":"var(--hair2)"}/>
                </div>
              </>
            ) : (
              <>
                <div style={lbl}>Due Date</div>
                <input type="date" value={task.dueDate||""} onChange={e=>updateTask(task.id,{dueDate:e.target.value})} style={{...fld,borderColor:od?"#c25c44":"var(--hair2)"}} onFocus={e=>e.currentTarget.style.borderColor="var(--accent)"} onBlur={e=>e.currentTarget.style.borderColor=od?"#c25c44":"var(--hair2)"}/>
              </>
            )}
            <button onClick={()=>{if(task.startDate){updateTask(task.id,{startDate:""});}else{updateTask(task.id,{startDate:task.dueDate||todayStr()});}}}
              style={{background:"none",border:"none",cursor:"pointer",padding:0,marginTop:6,fontFamily:"'DM Mono', monospace",fontSize:12,color:"var(--accent)"}}>
              {task.startDate?"· Single date":"· Date range"}
            </button>
          </div>

          {/* Priority + Project */}
          <div style={sectionStyle}>
            <div style={{display:"flex",gap:16}}>
              <div style={{flex:1}}>
                <div style={lbl}>Priority</div>
                <select value={task.priority} onChange={e=>updateTask(task.id,{priority:Number(e.target.value)})} style={fld} {...foc}>{[1,2,3,4].map(p=><option key={p} value={p}>{PL[p]}</option>)}</select>
              </div>
              <div style={{flex:1}}>
                <div style={lbl}>Project</div>
                <select value={task.projectId} onChange={e=>updateTask(task.id,{projectId:e.target.value})} style={fld} {...foc}>{sortedProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
              </div>
            </div>
          </div>

          {/* Repeat */}
          <div style={sectionStyle}>
            <div style={lbl}>Repeat</div>
            <select value={task.recurrence||""} onChange={e=>updateTask(task.id,{recurrence:e.target.value||"",recurring:!!e.target.value})} disabled={!task.dueDate} style={{...fld,opacity:task.dueDate?1:0.4}} {...foc}>
              {RECURRENCE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Email origin */}
          {task.fromEmail&&(
            <div style={sectionStyle}>
              <div style={lbl}>Email Origin</div>
              <div style={{background:"var(--soft)",border:"1px solid var(--hair2)",padding:"10px 12px",fontFamily:"'DM Mono', monospace",fontSize:12,color:"var(--muted2)"}}>From: {task.emailFrom}</div>
            </div>
          )}

          {/* Sub-tasks */}
          <div style={sectionStyle}>
            <div style={{...lbl,marginBottom:12}}>Sub-tasks{task.subtasks>0&&` (${task.subtasksDone}/${task.subtasks})`}</div>
            {(subTasks[task.id]||[]).map((sub,si,arr)=>(
              <div key={sub.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:si===arr.length-1?"none":"1px solid var(--hair)"}}>
                <button onClick={()=>toggleSubTask(task.id,sub.id)}
                  style={{width:18,height:18,minWidth:18,borderRadius:"3px",border:sub.isComplete?"1.5px solid var(--accent)":"1.5px solid var(--muted)",background:sub.isComplete?"var(--accent)":"transparent",cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {sub.isComplete&&<svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#0c0e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
                </button>
                <span style={{flex:1,fontFamily:"'DM Mono', monospace",fontSize:15,color:sub.isComplete?"var(--muted)":"var(--ink)",textDecoration:sub.isComplete?"line-through":"none"}}>{sub.title}</span>
                <button onClick={()=>deleteSubTask(task.id,sub.id)}
                  style={{background:"transparent",border:"none",cursor:"pointer",padding:2,fontFamily:"'DM Mono', monospace",fontSize:11,color:"var(--muted2)",lineHeight:1,transition:"color 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.color="var(--accent)"} onMouseLeave={e=>e.currentTarget.style.color="var(--muted2)"}>×</button>
              </div>
            ))}
            {addingSubTo===task.id ? (
              <div style={{display:"flex",gap:8,alignItems:"center",marginTop:10}}>
                <input autoFocus value={newSubTitle} onChange={e=>setNewSubTitle(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")addSubTask(task.id,newSubTitle);if(e.key==="Escape"){setAddingSubTo(null);setNewSubTitle("");}}}
                  placeholder="Sub-task title…" style={fld} {...foc}/>
                <button onClick={()=>addSubTask(task.id,newSubTitle)}
                  style={{fontFamily:"'DM Mono', monospace",fontSize:12,color:"var(--accent)",background:"none",border:"none",cursor:"pointer"}}>Add</button>
              </div>
            ) : (
              <button onClick={()=>{setAddingSubTo(task.id);setNewSubTitle("");}}
                style={{fontFamily:"'DM Mono', monospace",fontSize:13,color:"var(--accent)",background:"none",border:"none",cursor:"pointer",padding:0,marginTop:10}}>
                + Add sub-task
              </button>
            )}
          </div>

          {/* Delete (separated from Mark Complete) */}
          <div style={{padding:"16px 28px",borderTop:"1px solid var(--hair)"}}>
            <button onClick={()=>{if(window.confirm('Delete this task?'))deleteTask(task.id);}}
              style={{width:"100%",height:38,background:"transparent",border:"1px solid var(--hair2)",color:"var(--muted2)",borderRadius:0,cursor:"pointer",fontFamily:"'DM Mono', monospace",fontSize:13,textTransform:"uppercase",letterSpacing:"0.06em",transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#b04a34";e.currentTarget.style.color="#b04a34";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--hair2)";e.currentTarget.style.color="var(--muted2)";}}>Delete</button>
          </div>
        </div>

        {/* Spacer so scroll content clears the sticky footer */}
        <div style={{height:80,flexShrink:0}}/>

        {/* Footer */}
        <div style={{padding:"24px 28px",marginTop:"auto",borderTop:"1px solid var(--hair)",flexShrink:0,display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={()=>toggleDone(task.id)}
            style={{width:"100%",height:46,background:"var(--pill)",color:"var(--pillfg)",border:"none",borderRadius:"999px",cursor:"pointer",fontFamily:"'DM Mono', monospace",fontSize:14,textTransform:"uppercase",letterSpacing:"0.06em"}}>{task.completed?"Mark Incomplete":"Mark Complete"}</button>
        </div>
      </div>
    );
  };

  // ── Desktop Main Header ──────────────────────────────────────
  // Desktop content header for the Tasks/Today views (title + date eyebrow + stats).
  const renderTasksHeader = () => {
    const dateStr = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}).toUpperCase();
    const stats = [
      {n:todayCount, l:"TODAY", c:"var(--title)"},
      {n:openCount,  l:"OPEN",  c:"var(--accent)"},
      {n:emailTasks.length, l:"EMAILS", c:"var(--title)"},
    ];
    return (
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",padding:"30px 44px 18px",borderBottom:"1px solid var(--hair)",flexShrink:0}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond', serif",fontWeight:300,fontSize:46,lineHeight:1,color:"var(--title)"}}>{view==="today"?"Today":"All Tasks"}</div>
          <div style={{fontFamily:"'DM Mono', monospace",fontSize:12,textTransform:"uppercase",letterSpacing:"0.12em",color:"var(--muted)",marginTop:8}}>{dateStr}</div>
        </div>
        <div style={{display:"flex",gap:32,alignItems:"flex-end"}}>
          {stats.map(s=>(
            <div key={s.l} style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Cormorant Garamond', serif",fontWeight:300,fontSize:36,lineHeight:1,color:s.c}}>{s.n}</div>
              <div style={{fontFamily:"'DM Mono', monospace",fontSize:10,textTransform:"uppercase",letterSpacing:"0.12em",color:"var(--muted)",marginTop:5}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
  const renderTopBar = () => {
    const titles = {tasks:"All Tasks",today:"Today",calendar:"Calendar",email:"Email Capture",news:"News"};
    const sub = view==="email"
      ? `${emailTasks.length} TO TRIAGE`
      : new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}).toUpperCase();
    return (
      <div style={{background:"var(--sidebar)",padding:"18px 20px 14px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:24,letterSpacing:"0.04em",color:"#f0ede6"}}>
            LOTUS<em style={{fontStyle:"italic",color:"#daa84a"}}>LIST</em>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button onClick={toggleTheme} style={{width:40,height:40,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"#daa84a",fontSize:16,cursor:"pointer"}}>{isDark?"☀":"☾"}</button>
            <div style={{width:40,height:40,borderRadius:"50%",border:"1px solid #daa84a",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"#daa84a"}}>A</div>
          </div>
        </div>
        <div style={{marginTop:14}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:32,color:"#f0ede6",lineHeight:1}}>{titles[view]||"All Tasks"}</div>
          <div style={{fontFamily:"'DM Mono', monospace",fontSize:11,letterSpacing:"0.1em",color:"rgba(240,237,230,0.55)",marginTop:6}}>{sub}</div>
        </div>
      </div>
    );
  };

  const renderBottomNav = () => {
    const tabs = [
      {key:"tasks",label:"Tasks",icon:"☰"},
      {key:"calendar",label:"Calendar",icon:"▦"},
      {fab:true},
      {key:"news",label:"News",icon:"▤"},
      {key:"email",label:"Inbox",icon:"✉"},
    ];
    return (
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,height:84,background:"var(--card)",borderTop:"1px solid var(--hair2)",display:"flex",alignItems:"center",justifyContent:"space-around",padding:"0 10px 14px",zIndex:100}}>
        {tabs.map((t,i)=> t.fab ? (
          <button key="fab" onClick={goAdd} style={{width:56,height:56,borderRadius:"50%",background:"var(--accent)",color:"#0c0e0b",border:"none",fontSize:28,lineHeight:1,marginTop:-22,cursor:"pointer",boxShadow:"0 6px 18px rgba(196,144,42,0.4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>＋</button>
        ) : (
          <div key={t.key} onClick={()=>{setView(t.key);setDayFilter(null);}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}>
            <span style={{fontSize:18,lineHeight:1,color:view===t.key?"var(--accent)":"var(--muted2)"}}>{t.icon}</span>
            <span style={{fontFamily:"'DM Mono', monospace",fontSize:10,color:view===t.key?"var(--accent)":"var(--muted2)"}}>{t.label}</span>
          </div>
        ))}
      </div>
    );
  };

  // ── QUICK ADD (standalone /quick-add route — never shows the splash) ──
  if (isQuickAdd) {
    const sectionLabel = { fontFamily:"'Syne',sans-serif", fontSize:10, fontWeight:600, color:"#8a7a64", textTransform:"uppercase", letterSpacing:"0.1em" };
    const fieldShadow = "0 4px 14px rgba(45,74,53,0.08)";
    const projName = (projects.find(p => p.id === newProject)?.name) || "General";
    const prios = [{v:1,l:"Urgent"},{v:2,l:"High"},{v:3,l:"Medium"},{v:4,l:"None"}];
    return (
      <div style={{minHeight:"100dvh",background:"#e7e5df",display:"flex",justifyContent:"center"}}>
        <div style={{position:"relative",width:"100%",maxWidth:430,minHeight:"100dvh",background:"#EFEBE3",padding:"62px 22px 44px",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* grid texture overlay */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none",backgroundImage:"linear-gradient(rgba(45,74,53,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(45,74,53,0.04) 1px,transparent 1px)",backgroundSize:"26px 26px",WebkitMaskImage:"radial-gradient(circle at 50% 0%, #000 0%, transparent 70%)",maskImage:"radial-gradient(circle at 50% 0%, #000 0%, transparent 70%)"}}/>
          {/* copper glow top-right */}
          <div style={{position:"absolute",top:-120,right:-120,width:340,height:340,pointerEvents:"none",background:"radial-gradient(circle, rgba(181,112,58,0.14) 0%, transparent 70%)"}}/>
          {/* top accent bars — full-bleed: gold flush to the top edge, green directly below */}
          <div style={{position:"absolute",top:0,left:0,right:0,height:20,background:"linear-gradient(90deg, #C8972F, #E8C658, #C8972F)",zIndex:2}}/>
          <div style={{position:"absolute",top:20,left:0,right:0,height:5,background:"#2D4A35",zIndex:2}}/>

          {/* content */}
          <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",flex:1}}>
            {/* header row */}
            <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:34}}>
              <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:"#B5703A",textTransform:"uppercase",letterSpacing:"0.14em"}}>Lotus List</span>
              <span style={{fontFamily:"'Syne',sans-serif",fontWeight:600,fontSize:10,color:"#2D4A35",opacity:0.5}}>QUICK ADD</span>
            </div>

            {/* H1 */}
            <h1 style={{margin:"0 0 22px",fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:34,color:"#2D4A35"}}>
              New <em style={{fontStyle:"italic",color:"#B5703A"}}>task.</em>
            </h1>

            {/* task name */}
            <input
              value={newTitle}
              onChange={e=>setNewTitle(e.target.value)}
              placeholder="Task name"
              style={{width:"100%",height:54,border:"none",borderRadius:15,background:"#FFFFFF",fontFamily:"'DM Mono',monospace",fontSize:15,color:"#2D4A35",padding:"0 18px",outline:"none",boxShadow:"0 0 0 2px rgba(181,112,58,0.45), 0 4px 14px rgba(45,74,53,0.10)"}}
            />

            {/* priority */}
            <div style={{...sectionLabel,margin:"24px 0 9px"}}>Priority</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {prios.map(p=>{
                const sel = newPrio===p.v;
                return (
                  <button key={p.v} onClick={()=>setNewPrio(p.v)} style={{
                    height:48,borderRadius:12,border:"none",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:13,
                    background:sel?"#2D4A35":"#FFFFFF",color:sel?"#F4F1EC":"#2D4A35",
                    transform:sel?"translateY(2px)":"none",
                    boxShadow:sel?"inset 0 2px 5px rgba(0,0,0,0.3)":"0 3px 0 rgba(45,74,53,0.14), 0 4px 10px rgba(45,74,53,0.06)",
                  }}>{p.l}</button>
                );
              })}
            </div>

            {/* due date */}
            <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",margin:"24px 0 9px"}}>
              <span style={sectionLabel}>Due date</span>
              <button onClick={()=>{ setNewDateRange(v=>!v); if(!newDateRange && !newStartDate) setNewStartDate(todayStr()); }}
                style={{border:"none",background:"none",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12,color:"#B5703A",padding:0}}>
                {newDateRange ? "– Remove range" : "+ Date range"}
              </button>
            </div>
            {newDateRange && (
              <label style={{position:"relative",display:"flex",alignItems:"center",gap:10,height:54,borderRadius:15,background:"#FFFFFF",boxShadow:fieldShadow,padding:"0 18px",marginBottom:10}}>
                <i className="ti ti-calendar" style={{fontSize:18,color:"#B5703A"}}/>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:"#2D4A35"}}>{newStartDate ? fmtSlash(newStartDate) : "Start date"}</span>
                <input type="date" value={newStartDate} onChange={e=>setNewStartDate(e.target.value)} style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%"}}/>
              </label>
            )}
            <label style={{position:"relative",display:"flex",alignItems:"center",gap:10,height:54,borderRadius:15,background:"#FFFFFF",boxShadow:fieldShadow,padding:"0 18px"}}>
              <i className="ti ti-calendar" style={{fontSize:18,color:"#B5703A"}}/>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:"#2D4A35"}}>{newDate ? fmtSlash(newDate) : "Select date"}</span>
              <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%"}}/>
            </label>

            {/* project + repeat */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}>
              <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",height:52,borderRadius:15,background:"#FFFFFF",boxShadow:fieldShadow,padding:"0 14px"}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#2D4A35",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{projName}</span>
                <i className="ti ti-chevron-down" style={{fontSize:16,color:"#2D4A35",opacity:0.45}}/>
                <select value={newProject} onChange={e=>setNewProject(e.target.value)} style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%",border:"none"}}>
                  {sortedProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",height:52,borderRadius:15,background:"#FFFFFF",boxShadow:fieldShadow,padding:"0 14px"}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#2D4A35"}}>{RL[newRecurrence] || "None"}</span>
                <i className="ti ti-chevron-down" style={{fontSize:16,color:"#2D4A35",opacity:0.45}}/>
                <select value={newRecurrence} onChange={e=>setNewRecurrence(e.target.value)} style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%",border:"none"}}>
                  {RECURRENCE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* add button */}
            <button onClick={handleQuickAdd} style={{
              marginTop:"auto",width:"100%",height:60,borderRadius:16,border:"none",cursor:"pointer",
              background:quickAddDone ? "linear-gradient(180deg,#3D6348,#2D4A35)" : "linear-gradient(180deg,#345740,#2D4A35)",
              color:"#F4F1EC",fontFamily:"'DM Mono',monospace",fontWeight:500,fontSize:14,textTransform:"uppercase",letterSpacing:"0.1em",
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,
              boxShadow:"0 3px 0 #1d3023, 0 10px 24px rgba(45,74,53,0.38)",
            }}>
              <i className={quickAddDone ? "ti ti-check" : "ti ti-plus"} style={{fontSize:18,color:"#F4F1EC"}}/>
              {quickAddDone ? "Task added" : "Add Task"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MORNING SPLASH ─────────────────────────────────────────
  if (showMorning) {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    return (
      <div style={{
        background:T.bg, color:T.text, fontFamily:"'Jost', sans-serif",
        minHeight:"100dvh", display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"flex-start",
        padding:isMobile?"40px 24px 60px":"16px 24px 40px", textAlign:"center", overflowY:"auto",
      }}>
        <div style={{flex:"0 0 auto",minHeight:8}}/>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%",flex:"0 0 auto"}}>
        {/* Wordmark */}
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?18:"1.25rem",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",color:T.text,marginBottom:12,display:"flex",alignItems:"baseline",gap:1}}>
          Lotus<em style={{fontStyle:"italic",color:T.forestMid}}>List</em>
        </div>

        {/* Greeting */}
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:isMobile?13:"0.6rem",fontWeight:500,letterSpacing:"0.22em",textTransform:"uppercase",color:T.textMute,marginBottom:8}}>Good Morning</div>
        <div style={{fontSize:isMobile?16:"0.82rem",color:T.textMute,marginBottom:40}}>{dateStr}  ·  Los Angeles</div>

        {/* YSS Quote */}
        {yssQuote.quote && (
          <div style={{maxWidth:620,width:"100%",textAlign:"left",marginBottom:48,padding:isMobile?"0 24px":"0 8px"}}>
            {yssQuote.topic && (
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:500,letterSpacing:"0.2em",textTransform:"uppercase",color:"#B5703A",border:"1px solid #B5703A",borderRadius:20,padding:"3px 14px",display:"inline-block",marginBottom:"0.75rem"}}>{yssQuote.topic}</div>
            )}
            <div style={{fontFamily:isMobile?"'Jost', sans-serif":"'Cormorant Garamond',serif",fontWeight:isMobile?700:undefined,fontSize:isMobile?22:"1.45rem",fontStyle:isMobile?"normal":"italic",lineHeight:1.65,color:T.text,marginBottom:14}}>
              "{yssQuote.quote}"
            </div>
            <div style={{fontSize:isMobile?14:"0.78rem",color:T.textMute,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
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
            width:isMobile?"100%":undefined,
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
  const base = {color:'var(--ink)',fontFamily:"'Jost', sans-serif",fontSize:14,background:'var(--canvas)'};

  if (!isMobile) return (
    <div style={{...getThemeVars(theme),...base,fontFamily:"'DM Mono', monospace",background:'var(--canvas)',display:"flex",flexDirection:"column",height:"100dvh",overflow:"hidden"}}>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {renderSidebar()}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",borderRight:"1px solid var(--hair)"}}>
          {(view==="tasks"||view==="today") ? renderTasksHeader() : (view==="calendar"||view==="email"||view==="news") ? null : renderMainHeader()}
          {(view==="tasks"||view==="today")&&renderFilterPills(44)}
          <div style={{flex:1,overflowY:"auto",padding:(view==="calendar"||view==="email"||view==="news")?0:"0 32px 52px"}}>
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
      {syncToast&&<div style={{position:"fixed",bottom:48,left:"50%",transform:"translateX(-50%)",background:syncToast.isError?"#B94040":"var(--pill)",color:syncToast.isError?"#fff":"var(--pillfg)",padding:"10px 20px",borderRadius:10,fontSize:13,fontFamily:"'Jost',sans-serif",fontWeight:500,zIndex:1100,boxShadow:"0 4px 16px rgba(0,0,0,0.2)",animation:"fadeIn 0.2s ease"}}>{syncToast.message}</div>}
    </div>
  );

  return (
    <div style={{...getThemeVars(theme),...base,fontFamily:"'DM Mono', monospace",background:'var(--canvas)',maxWidth:430,margin:"0 auto",height:"100dvh",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"stretch",justifyContent:"flex-start"}}>
      {renderTopBar()}
      <div style={{flex:1,overflowY:"auto",paddingBottom:100}}>
        {(view==="tasks"||view==="today")&&renderFilterPills(16)}
        {view==="tasks"&&<div style={{padding:"0 16px"}}>{renderFeed(false)}</div>}
        {view==="today"&&<div style={{padding:"0 16px"}}>{renderFeed(true)}</div>}
        {view==="calendar"&&renderCalendar(16)}
        {view==="email"&&renderEmailView(16)}
        {view==="news"&&renderNewsView(16)}
      </div>
      {renderBottomNav()}
      {renderModals()}
      {syncToast&&<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:syncToast.isError?"#B94040":"var(--pill)",color:syncToast.isError?"#fff":"var(--pillfg)",padding:"10px 20px",borderRadius:10,fontSize:13,fontFamily:"'Jost',sans-serif",fontWeight:500,zIndex:1100,boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>{syncToast.message}</div>}
    </div>
  );
}
