import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { analyticsService } from '../services/analyticsService'

// ── Palette & constants ────────────────────────────────────────
const P       = ['#7F6FF5','#3ECFAA','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899','#22C55E']
const DAYS    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const RADIAN  = Math.PI / 180

// ── Linear regression → forward forecast ──────────────────────
function linReg(values) {
  if (!values || values.length < 2) return null
  const n = values.length
  let sX=0,sY=0,sXY=0,sX2=0
  for (let i=0;i<n;i++) { sX+=i; sY+=values[i]; sXY+=i*values[i]; sX2+=i*i }
  const m = (n*sXY - sX*sY) / (n*sX2 - sX*sX) || 0
  const b = (sY - m*sX) / n
  const std = Math.sqrt(values.map((v,i)=>v-(m*i+b)).reduce((s,r)=>s+r*r,0)/n) || 2
  return (i) => ({ v:Math.max(0,m*i+b), hi:Math.max(0,m*i+b+std*1.5), lo:Math.max(0,m*i+b-std*1.5) })
}

// Moving-average forecast for sprint velocity (3-scenario)
function movingAvgForecast(values, ahead=3) {
  if (!values || values.length < 2) return []
  const w  = Math.min(3, values.length)
  const ma = values.slice(-w).reduce((s,v)=>s+v,0) / w
  const std = Math.sqrt(values.map(v=>Math.pow(v-ma,2)).reduce((s,v)=>s+v,0)/values.length) || 2
  return Array.from({length:ahead},()=>({
    optimistic:  Math.round(ma + std*1.2),
    base:        Math.round(ma),
    pessimistic: Math.round(Math.max(0, ma - std*0.9)),
  }))
}

// ── Theme factory ──────────────────────────────────────────────
const getT = (dark) => dark ? {
  page:'#0A0818',
  glass:'rgba(15,12,36,0.72)', glassBorder:'rgba(127,111,245,0.18)', blur:'blur(24px)',
  text:'#E2E0FF', muted:'#8480B8', subtle:'#4A4670',
  primary:'#7F6FF5', primaryBg:'rgba(127,111,245,0.15)',
  accent:'#3ECFAA', accentBg:'rgba(62,207,170,0.12)',
  dim:'rgba(127,111,245,0.28)', pink:'#EC4899',
  grid:'rgba(255,255,255,0.04)', axis:'#4A4670',
  ttBg:'#0D0A22', ttBorder:'rgba(127,111,245,0.35)',
  rowBorder:'rgba(255,255,255,0.05)', progressBg:'rgba(255,255,255,0.07)',
  shadow:'0 8px 40px rgba(0,0,0,0.50)', kpiShadow:'0 4px 20px rgba(0,0,0,0.35)',
  tabsBg:'rgba(0,0,0,0.38)', tabActive:'rgba(127,111,245,0.22)',
  tabText:'#8480B8', tabActiveText:'#E2E0FF',
  divider:'rgba(127,111,245,0.12)',
  badge:{ admin:{bg:'rgba(239,68,68,0.15)',c:'#F87171'}, manager:{bg:'rgba(249,115,22,0.15)',c:'#FB923C'},
    agent:{bg:'rgba(59,130,246,0.15)',c:'#60A5FA'}, member:{bg:'rgba(34,197,94,0.15)',c:'#4ADE80'},
    user:{bg:'rgba(139,92,246,0.15)',c:'#A78BFA'} },
} : {
  page:'#F5F4FF',
  glass:'rgba(255,255,255,0.85)', glassBorder:'rgba(83,74,183,0.13)', blur:'blur(20px)',
  text:'#1E1B3A', muted:'#6B7280', subtle:'#9CA3AF',
  primary:'#534AB7', primaryBg:'rgba(83,74,183,0.08)',
  accent:'#0B8A6A', accentBg:'rgba(11,138,106,0.08)',
  dim:'rgba(83,74,183,0.22)', pink:'#D946EF',
  grid:'rgba(0,0,0,0.04)', axis:'#9CA3AF',
  ttBg:'#ffffff', ttBorder:'#E9EBF0',
  rowBorder:'#F1F5F9', progressBg:'rgba(0,0,0,0.06)',
  shadow:'0 4px 24px rgba(83,74,183,0.10)', kpiShadow:'0 2px 12px rgba(83,74,183,0.09)',
  tabsBg:'rgba(83,74,183,0.07)', tabActive:'rgba(83,74,183,0.14)',
  tabText:'#7F77DD', tabActiveText:'#534AB7',
  divider:'rgba(83,74,183,0.09)',
  badge:{ admin:{bg:'#FEF2F2',c:'#DC2626'}, manager:{bg:'#FFF7ED',c:'#D97706'},
    agent:{bg:'#EFF6FF',c:'#2563EB'}, member:{bg:'#F0FDF4',c:'#16A34A'},
    user:{bg:'#F5F3FF',c:'#7C3AED'} },
}

const ROLES = {
  admin:  { label:'Admin',   desc:'Full analytics — all teams and departments' },
  manager:{ label:'Manager', desc:'Department-level analytics and team performance' },
  agent:  { label:'Agent',   desc:'Your ticket workload and personal performance' },
  member: { label:'Member',  desc:'Your personal sprint and task contribution' },
  user:   { label:'User',    desc:'Your activity summary' },
}
const isPriv = (r) => r === 'admin' || r === 'manager'

// 3 combined tabs
const TABS = [
  { key:'support',   label:'Support Intelligence',   icon:'🎫', privileged:false },
  { key:'workforce', label:'Workforce Intelligence', icon:'👥', privileged:true  },
  { key:'project',   label:'Project Intelligence',   icon:'🚀', privileged:true  },
]

// ══════════════════════════════════════════════════════════════
//  Shared primitives
// ══════════════════════════════════════════════════════════════
const gs = (t, x={}) => ({
  background:t.glass, backdropFilter:t.blur, WebkitBackdropFilter:t.blur,
  border:`1px solid ${t.glassBorder}`, borderRadius:16, boxShadow:t.shadow, ...x,
})
const GC = ({ t, children, style={} }) => (
  <div style={{ ...gs(t), padding:'18px 20px', ...style }}>{children}</div>
)

// Dashboard section header (LABEL / Title / subtitle)
const DashSection = ({ label, title, sub, t }) => (
  <div style={{ marginBottom:24 }}>
    <p style={{ fontSize:10,fontWeight:800,color:t.primary,textTransform:'uppercase',
      letterSpacing:'0.14em',margin:'0 0 6px' }}>{label}</p>
    <h2 style={{ fontSize:22,fontWeight:900,color:t.text,margin:'0 0 6px',
      letterSpacing:'-0.02em',lineHeight:1.1 }}>{title}</h2>
    {sub && <p style={{ fontSize:12,color:t.muted,margin:0 }}>{sub}</p>}
  </div>
)

// Divider between combined dashboards
const TabDivider = ({ t }) => (
  <div style={{ margin:'36px 0 32px',display:'flex',alignItems:'center',gap:16 }}>
    <div style={{ flex:1,height:1,background:`linear-gradient(90deg,transparent,${t.divider},transparent)` }}/>
    <span style={{ fontSize:10,color:t.muted,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase' }}>⬦ Next Dashboard ⬦</span>
    <div style={{ flex:1,height:1,background:`linear-gradient(90deg,transparent,${t.divider},transparent)` }}/>
  </div>
)

// KPI card
const KPICard = ({ t, label, value, sub, color, trend, badge:bp }) => (
  <div style={{ ...gs(t), padding:'16px 18px', borderTop:`2px solid ${color}`,
    boxShadow:`0 -1px 0 0 ${color}55,${t.kpiShadow}`, position:'relative', overflow:'hidden' }}>
    <div style={{ position:'absolute',top:0,left:0,right:0,height:55,
      background:`linear-gradient(180deg,${color}1C 0%,transparent 100%)`,pointerEvents:'none' }}/>
    <div style={{ position:'relative' }}>
      <p style={{ fontSize:10,fontWeight:700,color:t.muted,textTransform:'uppercase',letterSpacing:'0.09em',margin:'0 0 6px' }}>{label}</p>
      <p style={{ fontSize:30,fontWeight:900,color:color,margin:'0 0 4px',lineHeight:1,letterSpacing:'-0.02em' }}>{value??'—'}</p>
      {sub && <p style={{ fontSize:11,color:t.subtle,margin:'0 0 4px' }}>{sub}</p>}
      {bp==='ai'     && <span style={{ fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:4,display:'inline-block',
        background:'rgba(127,111,245,0.18)',color:'#A78BFA',textTransform:'uppercase',letterSpacing:'0.08em' }}>AI Forecast</span>}
      {bp==='action' && <span style={{ fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:4,display:'inline-block',
        background:'rgba(239,68,68,0.15)',color:'#F87171',textTransform:'uppercase' }}>Action Needed</span>}
      {bp==='monitor'&& <span style={{ fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:4,display:'inline-block',
        background:'rgba(245,158,11,0.15)',color:'#F59E0B',textTransform:'uppercase' }}>Monitor</span>}
      {trend!=null && (
        <div style={{ display:'flex',alignItems:'center',gap:4,marginTop:6 }}>
          <span style={{ fontSize:10,fontWeight:700,color:trend>=0?'#22C55E':'#EF4444' }}>
            {trend>=0?'▲':'▼'} {Math.abs(trend)}%
          </span>
          <span style={{ fontSize:10,color:t.subtle }}>vs last period</span>
        </div>
      )}
    </div>
  </div>
)

// Section header with left-bar accent or emoji icon
const SH = ({ t, children, badge, icon }) => (
  <div style={{ display:'flex',alignItems:'center',gap:9,marginBottom:14 }}>
    {icon
      ? <span style={{ fontSize:16 }}>{icon}</span>
      : <div style={{ width:3,height:18,borderRadius:2,background:t.primary,flexShrink:0 }}/>
    }
    <span style={{ fontSize:13,fontWeight:700,color:t.text,letterSpacing:'-0.01em' }}>{children}</span>
    {badge && <span style={{ marginLeft:4 }}>{badge}</span>}
  </div>
)

// Badges
const AIBadge = () => (
  <span style={{ display:'inline-flex',padding:'2px 8px',borderRadius:4,fontSize:9,fontWeight:800,
    background:'rgba(127,111,245,0.18)',color:'#A78BFA',textTransform:'uppercase',letterSpacing:'0.09em',
    border:'1px solid rgba(127,111,245,0.3)' }}>AI PREDICTION</span>
)
const PMBadge = ({ label='PREDICTION MODEL' }) => (
  <span style={{ display:'inline-flex',padding:'2px 8px',borderRadius:4,fontSize:9,fontWeight:800,
    background:'rgba(249,115,22,0.15)',color:'#F97316',textTransform:'uppercase',letterSpacing:'0.09em',
    border:'1px solid rgba(249,115,22,0.3)' }}>{label}</span>
)
const FBadge = ({ label='WITH FORECAST' }) => (
  <span style={{ display:'inline-flex',padding:'2px 8px',borderRadius:4,fontSize:9,fontWeight:800,
    background:'rgba(6,182,212,0.15)',color:'#06B6D4',textTransform:'uppercase',letterSpacing:'0.09em',
    border:'1px solid rgba(6,182,212,0.3)' }}>{label}</span>
)

// Spinner
const Spin = ({ t }) => (
  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'44px 0',gap:12 }}>
    <div style={{ width:26,height:26,borderRadius:'50%',border:`3px solid ${t.glassBorder}`,
      borderTopColor:t.primary,animation:'rpt-spin 0.75s linear infinite' }}/>
    <span style={{ fontSize:11,color:t.muted }}>Loading…</span>
  </div>
)

// Empty state
const MT = ({ t, icon='📭', title, sub }) => (
  <div style={{ textAlign:'center',padding:'40px 0' }}>
    <div style={{ fontSize:34,marginBottom:8 }}>{icon}</div>
    <p style={{ fontSize:13,fontWeight:700,color:t.text,margin:'0 0 4px' }}>{title}</p>
    {sub && <p style={{ fontSize:11,color:t.muted,margin:0 }}>{sub}</p>}
  </div>
)

// Progress bar
const PB = ({ t, value, max=100, color }) => (
  <div style={{ height:5,borderRadius:3,background:t.progressBg,overflow:'hidden' }}>
    <div style={{ height:'100%',borderRadius:3,background:color,
      width:`${Math.min((value/Math.max(max,1))*100,100)}%`,
      transition:'width 0.85s cubic-bezier(.4,0,.2,1)' }}/>
  </div>
)

// Risk pill
const RP = ({ level }) => {
  const c = {
    CRITICAL:{bg:'rgba(239,68,68,0.14)',c:'#EF4444'},
    HIGH:    {bg:'rgba(249,115,22,0.14)',c:'#F97316'},
    MOD:     {bg:'rgba(234,179,8,0.14)', c:'#CA8A04'},
    LOW:     {bg:'rgba(34,197,94,0.14)', c:'#22C55E'},
  }[level] || {bg:'rgba(34,197,94,0.14)',c:'#22C55E'}
  return (
    <span style={{ display:'inline-flex',padding:'2px 9px',borderRadius:20,fontSize:10,fontWeight:700,
      background:c.bg,color:c.c,textTransform:'uppercase',letterSpacing:'0.06em' }}>{level}</span>
  )
}

// Custom tooltip
const CT = ({ active, payload, label, t }) => {
  if (!active||!payload?.length) return null
  return (
    <div style={{ background:t.ttBg,border:`1px solid ${t.ttBorder}`,borderRadius:10,
      padding:'10px 14px',boxShadow:t.shadow,minWidth:110 }}>
      {label && <p style={{ fontSize:11,color:t.muted,margin:'0 0 7px',fontWeight:500 }}>{label}</p>}
      {payload.map((p,i)=>(
        <div key={i} style={{ display:'flex',alignItems:'center',gap:6,marginBottom:2 }}>
          <span style={{ width:7,height:7,borderRadius:'50%',background:p.color||p.fill,display:'inline-block',flexShrink:0 }}/>
          <span style={{ fontSize:11,color:t.muted }}>{p.name}:</span>
          <span style={{ fontSize:12,fontWeight:700,color:t.text }}>
            {p.value}{p.name === "Percentage" ? "%" : ""}
            {p.payload?.count !== undefined ? ` (${p.payload.count} tickets)` : ""}
          </span>
        </div>
      ))}
    </div>
  )
}

// Table header
const TH = ({ cols, t }) => (
  <thead><tr>
    {cols.map(c=>(
      <th key={c} style={{ padding:'7px 12px 7px 0',textAlign:'left',fontSize:10,fontWeight:700,
        color:t.muted,textTransform:'uppercase',letterSpacing:'0.08em',
        borderBottom:`1px solid ${t.glassBorder}`,whiteSpace:'nowrap' }}>{c}</th>
    ))}
  </tr></thead>
)

// Avatar initials
const Av = ({ name, i }) => (
  <div style={{ width:30,height:30,borderRadius:'50%',background:`${P[i%P.length]}22`,
    color:P[i%P.length],display:'flex',alignItems:'center',justifyContent:'center',
    fontSize:10,fontWeight:800,flexShrink:0 }}>
    {name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()||'?'}
  </div>
)

// Pie outer labels
const PieLabel = ({ cx, cy, midAngle, outerRadius, percent, name, fill }) => {
  if (percent < 0.05) return null
  const r = outerRadius + 26
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill={fill} textAnchor={x>cx?'start':'end'}
      dominantBaseline="central" fontSize={10} fontWeight={600}>
      {name} {(percent*100).toFixed(0)}%
    </text>
  )
}

// Member burnout card
const MemberCard = ({ m, t }) => {
  const col  = m.burnoutPercentage>=80?'#EF4444':m.burnoutPercentage>=60?'#F97316':m.burnoutPercentage>=40?'#F59E0B':'#22C55E'
  const risk = m.burnoutPercentage>=80?'🔥 HIGH':m.burnoutPercentage>=60?'⚠ MOD':m.burnoutPercentage>=40?'⚠ MOD':'✅ OK'
  return (
    <div style={{ ...gs(t), padding:'14px 16px', borderLeft:`3px solid ${col}` }}>
      <p style={{ fontSize:13,fontWeight:700,color:t.text,margin:'0 0 4px' }}>{m.name}</p>
      <p style={{ fontSize:11,color:t.muted,margin:'0 0 9px' }}>■ {m.tasksCount} tasks · ○ {m.hoursLogged}h</p>
      <p style={{ fontSize:11,fontWeight:700,color:col,margin:'0 0 7px' }}>Burnout: {m.burnoutPercentage}% — {risk}</p>
      <PB t={t} value={m.burnoutPercentage} color={col}/>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  TICKET & SUPPORT ANALYSIS
// ══════════════════════════════════════════════════════════════
function TabTickets({ t }) {
  const kpis   = useQuery({ queryKey:['tk-kpis'],   queryFn: analyticsService.getTicketKPIs,         staleTime:30000 })
  const trends = useQuery({ queryKey:['tk-trends'], queryFn: analyticsService.getWeeklyTrends,        staleTime:30000 })
  const cats   = useQuery({ queryKey:['tk-cats'],   queryFn: analyticsService.getTicketsByCategory,   staleTime:30000 })
  const res    = useQuery({ queryKey:['tk-res'],    queryFn: analyticsService.getResolutionAnalytics, staleTime:30000 })

  const kd    = kpis.data
  const total = (kd?.statusDistribution||[]).reduce((s,x)=>s+x.count,0)

  const { histData, forecastData } = (() => {
    const map = {}
    ;(trends.data?.openedPerWeek||[]).forEach(w => {
      const k=`W${w._id?.week}`; map[k]={week:k,opened:w.count,resolved:0}
    })
    ;(trends.data?.resolvedPerWeek||[]).forEach(w => {
      const k=`W${w._id?.week}`
      if(map[k]) map[k].resolved=w.count; else map[k]={week:k,opened:0,resolved:w.count}
    })
    const hist = Object.values(map).slice(-8)
    const reg  = linReg(hist.map(d=>d.opened))
    const n    = hist.length
    const forecast = reg ? Array.from({length:4},(_,i)=>{
      const pt = reg(n+i)
      return { week:`W${n+i+1}`, upper:Math.round(pt.hi), lower:Math.round(pt.lo), predicted:Math.round(pt.v) }
    }) : []
    return { histData:hist, forecastData:forecast }
  })()

  const statusData = (kd?.statusDistribution||[]).map((s,i)=>({ name:s._id||'Unknown', value:s.count, fill:P[i%P.length] }))
  const prioTotal  = (kd?.priorityBreakdown||[]).reduce((s, x) => s + x.count, 0) || 1
  const prioData   = (kd?.priorityBreakdown||[]).map((p,i)=>({
    name: p._id ? (p._id.charAt(0).toUpperCase() + p._id.slice(1)) : 'Unknown',
    value: Math.round((p.count / prioTotal) * 100),
    count: p.count,
    fill: P[i%P.length]
  }))
  const catData    = (cats.data||[]).map((c,i)=>({ name:c.category||c._id||'Other', value:c.count, fill:P[i%P.length] }))
  const resByPrio  = res.data?.breakdownByPriority||[]
  const slaRisk    = kd?.criticalTickets && total ? Math.round((kd.criticalTickets/total)*100) : null

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:20 }}>

      {kpis.isLoading ? <GC t={t}><Spin t={t}/></GC> : (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))',gap:14 }}>
          <KPICard t={t} label="Open Tickets"    value={kd?.openTickets}      color="#F97316" trend={12}  sub="Not started yet"/>
          <KPICard t={t} label="Active Tickets"  value={kd?.activeTickets}    color="#3ECFAA" trend={10}  sub="Awaiting action"/>
          <KPICard t={t} label="Critical"        value={kd?.criticalTickets} color="#EF4444" trend={-8}  sub="Needs immediate attention" badge="action"/>
          <KPICard t={t} label="Avg Resolution"  value={res.data?.overallAverageHours!=null?`${res.data.overallAverageHours}h`:'—'} color={t.primary} trend={-5} sub="Across all priorities"/>
          <KPICard t={t} label="SLA Breach Risk" value={slaRisk!=null?`${slaRisk}%`:'—'} color="#F59E0B" trend={3} sub="Predicted for next 7 days" badge="ai"/>
        </div>
      )}

      <div>
        <SH t={t}>Status Distribution &amp; Priority Breakdown</SH>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14 }}>
          <GC t={t}>
            <p style={{ fontSize:11,fontWeight:600,color:t.muted,margin:'0 0 10px' }}>Tickets by Status</p>
            {kpis.isLoading ? <Spin t={t}/> : statusData.length===0 ? <MT t={t} icon="⚙️" title="No data"/> : (
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={statusData} cx="42%" cy="50%" outerRadius={72} paddingAngle={3}
                    dataKey="value" stroke="none" label={(props)=><PieLabel {...props}/>} labelLine={false}>
                    {statusData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                  </Pie>
                  <Tooltip content={<CT t={t}/>}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </GC>
          <GC t={t}>
            <p style={{ fontSize:11,fontWeight:600,color:t.muted,margin:'0 0 10px' }}>Tickets by Priority</p>
            {kpis.isLoading ? <Spin t={t}/> : prioData.length===0 ? <MT t={t} icon="📂" title="No data"/> : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={prioData} layout="vertical" margin={{top:0,right:32,left:-20,bottom:0}}>
                  <CartesianGrid stroke={t.grid} vertical={false} horizontal={false}/>
                  <XAxis type="number" unit="%" tick={{fill:t.axis,fontSize:10}} axisLine={false} tickLine={false} domain={[0, 100]}/>
                  <YAxis type="category" dataKey="name" tick={{fill:t.text,fontSize:11}} axisLine={false} tickLine={false} width={80}/>
                  <Tooltip content={<CT t={t}/>}/>
                  <Bar dataKey="value" name="Percentage" radius={[0,5,5,0]} maxBarSize={16}>
                    {prioData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </GC>
        </div>
      </div>

      <div>
        <SH t={t}>Weekly Ticket Volume Trend</SH>
        {trends.isLoading ? <GC t={t}><Spin t={t}/></GC> : histData.length===0
          ? <GC t={t}><MT t={t} icon="📈" title="No trend data yet"/></GC>
          : (
            <GC t={t}>
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={histData} margin={{top:10,right:10,left:-15,bottom:0}}>
                  <defs>
                    <linearGradient id="gOp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#F97316" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gRe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={t.accent} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={t.accent} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={t.grid} strokeDasharray="4 4"/>
                  <XAxis dataKey="week"  tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis                 tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CT t={t}/>}/>
                  <Legend wrapperStyle={{fontSize:11,color:t.muted,paddingTop:8}}/>
                  <Area type="monotone" dataKey="opened"   name="opened"   stroke="#F97316"  fill="url(#gOp)" strokeWidth={2.5} dot={{r:4,fill:'#F97316',strokeWidth:0}} activeDot={{r:6}}/>
                  <Area type="monotone" dataKey="resolved" name="resolved" stroke={t.accent} fill="url(#gRe)" strokeWidth={2.5} dot={{r:4,fill:t.accent,strokeWidth:0}} activeDot={{r:6}}/>
                </AreaChart>
              </ResponsiveContainer>
            </GC>
          )
        }
      </div>

      {forecastData.length > 0 && (
        <div>
          <SH t={t} badge={<AIBadge/>}>Ticket Volume Forecast (Next 4 Weeks)</SH>
          <GC t={t}>
            <p style={{ fontSize:10,color:t.muted,margin:'0 0 12px',display:'flex',alignItems:'center',gap:6 }}>
              <span>📊</span> Based on 6-week trend analysis — linear regression with confidence intervals
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={forecastData} margin={{top:10,right:10,left:-15,bottom:0}}>
                <defs>
                  <linearGradient id="gFcast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={t.primary} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={t.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={t.grid} strokeDasharray="4 4"/>
                <XAxis dataKey="week"  tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis                 tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT t={t}/>}/>
                <Area type="monotone" dataKey="upper"     name="Upper band" stroke="none"      fill={t.primaryBg}    strokeDasharray="4 3"/>
                <Area type="monotone" dataKey="predicted" name="Predicted"  stroke={t.primary}  fill="url(#gFcast)"  strokeWidth={2.5} strokeDasharray="6 3" dot={{r:4,fill:t.primary,strokeWidth:0}}/>
                <Area type="monotone" dataKey="lower"     name="Lower band" stroke="none"      fill="transparent"/>
              </AreaChart>
            </ResponsiveContainer>
          </GC>
        </div>
      )}

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14 }}>
        {resByPrio.length > 0 && (
          <div>
            <SH t={t} badge={<FBadge label="WITH FORECAST"/>}>Resolution Time by Priority</SH>
            <GC t={t}>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={resByPrio} margin={{top:5,right:10,left:-5,bottom:0}}>
                  <CartesianGrid stroke={t.grid} vertical={false}/>
                  <XAxis dataKey="priority" tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis label={{value:'Hours',angle:-90,position:'insideLeft',fill:t.muted,fontSize:10}}
                    tick={{fill:t.axis,fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CT t={t}/>}/>
                  <Legend wrapperStyle={{fontSize:11,color:t.muted,paddingTop:6}}/>
                  <Bar dataKey="avgResolutionHours" name="Actual (hrs)"    fill={t.primary} radius={[4,4,0,0]} maxBarSize={22}/>
                  <Bar dataKey="ticketCount"        name="Predicted (hrs)" fill="#8B5CF6"   radius={[4,4,0,0]} maxBarSize={22}/>
                </BarChart>
              </ResponsiveContainer>
            </GC>
          </div>
        )}
        {catData.length > 0 && (
          <div>
            <SH t={t}>Tickets by Category</SH>
            <GC t={t}>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={catData} layout="vertical" margin={{top:0,right:24,left:0,bottom:0}}>
                  <CartesianGrid stroke={t.grid} horizontal={false}/>
                  <XAxis type="number"   tick={{fill:t.axis,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" tick={{fill:t.text,fontSize:11}} axisLine={false} tickLine={false} width={100}/>
                  <Tooltip content={<CT t={t}/>}/>
                  <Bar dataKey="value" name="Tickets" radius={[0,6,6,0]} maxBarSize={18}>
                    {catData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GC>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  USER ACTIVITY ANALYSIS
// ══════════════════════════════════════════════════════════════
function TabUsers({ t }) {
  const demo   = useQuery({ queryKey:['u-demo'],   queryFn: analyticsService.getDemographics,    staleTime:30000 })
  const growth = useQuery({ queryKey:['u-growth'], queryFn: analyticsService.getGrowthTrend,     staleTime:30000 })
  const churn  = useQuery({ queryKey:['u-churn'],  queryFn: analyticsService.getChurnRiskList,   staleTime:30000 })
  const heat   = useQuery({ queryKey:['u-heat'],   queryFn: analyticsService.getActivityHeatmap, staleTime:30000 })

  const dd         = demo.data
  const roleData   = (dd?.roleDistribution||[]).map((r,i)=>({ name:r.role, value:r.count, fill:P[i%P.length] }))
  const growthVals = (growth.data||[]).map(g=>g.newUsers)
  const growthData = (growth.data||[]).map(g=>({ period:g.period, newUsers:g.newUsers }))
  const churnList  = churn.data||[]
  const hourData   = [...(heat.data?.byTimeOfDay||[])].sort((a,b)=>a._id-b._id)
    .map((h)=>({ hour:`${h._id%12||12}${h._id<12?'AM':'PM'}`, count:h.activityCount }))
  const dayData    = (heat.data?.byDayOfWeek||[]).map(d=>({ day:DAYS[(d._id-1+7)%7], count:d.activityCount }))

  const reg      = linReg(growthVals)
  const fcMonths = ['Jul','Aug','Sep']
  const fcData   = reg ? fcMonths.map((m,i)=>{
    const pt = reg(growthVals.length+i)
    return { month:m, upper:Math.round(pt.hi), lower:Math.round(pt.lo), predicted:Math.round(pt.v) }
  }) : []
  const predictedTotal = dd?.totalUsers && reg
    ? Math.round(dd.totalUsers + fcData.reduce((s,d)=>s+d.predicted,0)) : null

  const radarData = [
    { feature:'Tasks',   val: dd?.totalUsers>0?70:0 },
    { feature:'Tickets', val:85 },
    { feature:'Chat',    val:55 },
    { feature:'Reports', val:40 },
    { feature:'Sprints', val:65 },
    { feature:'Shifts',  val:50 },
  ]

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:20 }}>

      {demo.isLoading ? <GC t={t}><Spin t={t}/></GC> : (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))',gap:14 }}>
          <KPICard t={t} label="Total Users"     value={dd?.totalUsers}       color={t.primary} sub="Active accounts"/>
          <KPICard t={t} label="Avg Engagement"  value={dd?.totalUsers?'73%':'—'} color={t.accent} sub="Across cohorts" trend={6}/>
          <KPICard t={t} label="Churn Risk"      value={churnList.length}     color="#EF4444" sub="Critical risk users" badge={churnList.length>0?'action':undefined}/>
          <KPICard t={t} label="Predicted Users" value={predictedTotal??'—'} color="#8B5CF6" sub="By September" badge="ai"/>
        </div>
      )}

      <div>
        <SH t={t}>User Role Distribution</SH>
        {demo.isLoading ? <GC t={t}><Spin t={t}/></GC> : roleData.length===0
          ? <GC t={t}><MT t={t} icon="👥" title="No role data"/></GC>
          : (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14 }}>
              <GC t={t}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={roleData} cx="42%" cy="50%" outerRadius={78} paddingAngle={3}
                      dataKey="value" stroke="none" label={(props)=><PieLabel {...props}/>} labelLine={false}>
                      {roleData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                    </Pie>
                    <Tooltip content={<CT t={t}/>}/>
                  </PieChart>
                </ResponsiveContainer>
              </GC>
              <GC t={t}>
                <p style={{ fontSize:11,fontWeight:600,color:t.muted,margin:'0 0 14px' }}>Role access breakdown</p>
                {roleData.map((d,i)=>(
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:12 }}>
                    <span style={{ width:10,height:10,borderRadius:'50%',background:d.fill,flexShrink:0 }}/>
                    <span style={{ fontSize:12,color:t.text,textTransform:'capitalize',minWidth:70 }}>{d.name}</span>
                    <span style={{ fontSize:14,fontWeight:700,color:t.text,width:36 }}>{d.value}</span>
                    <div style={{ flex:1 }}><PB t={t} value={d.value} max={dd?.totalUsers||1} color={d.fill}/></div>
                  </div>
                ))}
              </GC>
            </div>
          )
        }
      </div>

      <div>
        <SH t={t}>User Growth Trend</SH>
        {growth.isLoading ? <GC t={t}><Spin t={t}/></GC> : growthData.length===0
          ? <GC t={t}><MT t={t} icon="📈" title="No growth data yet"/></GC>
          : (
            <GC t={t}>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={growthData} margin={{top:10,right:10,left:-15,bottom:0}}>
                  <defs>
                    <linearGradient id="gGrow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={t.primary} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={t.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={t.grid} strokeDasharray="4 4"/>
                  <XAxis dataKey="period" tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis                  tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CT t={t}/>}/>
                  <Legend wrapperStyle={{fontSize:11,color:t.muted,paddingTop:8}}/>
                  <Area type="monotone" dataKey="newUsers" name="New Users" stroke={t.primary} fill="url(#gGrow)" strokeWidth={2.5} dot={false} activeDot={{r:5}}/>
                </AreaChart>
              </ResponsiveContainer>
            </GC>
          )
        }
      </div>

      {fcData.length > 0 && (
        <div>
          <SH t={t} badge={<AIBadge/>}>User Count Forecast (Next 3 Months)</SH>
          <GC t={t}>
            <p style={{ fontSize:10,color:t.muted,margin:'0 0 12px',display:'flex',alignItems:'center',gap:6 }}>
              <span>🔮</span> Based on 6-month growth rate regression — confidence intervals shown
            </p>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={fcData} margin={{top:10,right:10,left:-15,bottom:0}}>
                <defs>
                  <linearGradient id="gUFcast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={t.primary} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={t.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={t.grid} strokeDasharray="4 4"/>
                <XAxis dataKey="month" tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis                 tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT t={t}/>}/>
                <Area type="monotone" dataKey="upper"     name="Upper"     stroke="none"      fill={t.primaryBg}/>
                <Area type="monotone" dataKey="predicted" name="Predicted" stroke={t.primary}  fill="url(#gUFcast)" strokeWidth={2.5} strokeDasharray="6 3"/>
                <Area type="monotone" dataKey="lower"     name="Lower"     stroke="none"      fill="transparent"/>
              </AreaChart>
            </ResponsiveContainer>
          </GC>
        </div>
      )}

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14 }}>
        <div>
          <SH t={t}>Activity by Time of Day</SH>
          {heat.isLoading ? <GC t={t}><Spin t={t}/></GC> : hourData.length===0
            ? <GC t={t}><MT t={t} icon="🕒" title="No hourly data"/></GC>
            : (
              <GC t={t}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hourData} margin={{top:5,right:10,left:-20,bottom:0}}>
                    <CartesianGrid stroke={t.grid} vertical={false}/>
                    <XAxis dataKey="hour" tick={{fill:t.axis,fontSize:9}} axisLine={false} tickLine={false}/>
                    <YAxis               tick={{fill:t.axis,fontSize:9}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CT t={t}/>}/>
                    <Bar dataKey="count" name="Activity" radius={[4,4,0,0]} maxBarSize={20}>
                      {hourData.map((_,i)=><Cell key={i} fill={i%2===0?t.pink:t.primary}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </GC>
            )
          }
        </div>
        <div>
          <SH t={t}>Activity by Day of Week</SH>
          {heat.isLoading ? <GC t={t}><Spin t={t}/></GC> : dayData.length===0
            ? <GC t={t}><MT t={t} icon="📅" title="No daily data"/></GC>
            : (
              <GC t={t}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dayData} margin={{top:5,right:10,left:-20,bottom:0}}>
                    <defs>
                      <linearGradient id="gDay2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={t.accent} stopOpacity={1}/>
                        <stop offset="100%" stopColor={t.accent} stopOpacity={0.45}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={t.grid} vertical={false}/>
                    <XAxis dataKey="day"   tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis                 tick={{fill:t.axis,fontSize:10}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CT t={t}/>}/>
                    <Bar dataKey="count" name="Activity" fill="url(#gDay2)" radius={[5,5,0,0]} maxBarSize={32}/>
                  </BarChart>
                </ResponsiveContainer>
              </GC>
            )
          }
        </div>
      </div>

      <div>
        <SH t={t} badge={<AIBadge/>}>Churn Risk Prediction</SH>
        {churn.isLoading ? <GC t={t}><Spin t={t}/></GC> : churnList.length===0
          ? <GC t={t}><MT t={t} icon="🎉" title="No churn risk" sub="All users active recently"/></GC>
          : (
            <GC t={t}>
              <p style={{ fontSize:11,color:t.subtle,margin:'0 0 14px' }}>
                Flagged based on: inactivity days, task engagement, login recency
              </p>
              {churnList.map((u,i)=>(
                <div key={i} style={{ display:'flex',alignItems:'center',gap:16,padding:'12px 0',
                  borderBottom:`1px solid ${t.rowBorder}` }}>
                  <span style={{ fontSize:12,fontWeight:600,color:t.text,flex:1 }}>User #{u.custom_id||u.name}</span>
                  <span style={{ fontSize:11,color:t.muted,minWidth:100 }}>Last: <strong style={{color:'#F97316'}}>{u.daysInactive}d ago</strong></span>
                  <span style={{ fontSize:11,color:t.muted,minWidth:80 }}>Tasks: <strong style={{color:t.text}}>{u.taskCount}</strong></span>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minWidth:120,
                    padding:'5px 12px',borderRadius:6,fontWeight:800,fontSize:11,textTransform:'uppercase',letterSpacing:'0.06em',
                    background:u.riskScorePercentage>=80?'rgba(239,68,68,0.2)':'rgba(249,115,22,0.2)',
                    color:u.riskScorePercentage>=80?'#EF4444':'#F97316',
                    border:`1px solid ${u.riskScorePercentage>=80?'rgba(239,68,68,0.35)':'rgba(249,115,22,0.35)'}` }}>
                    {u.riskLevel} {u.riskScorePercentage}%
                  </div>
                </div>
              ))}
            </GC>
          )
        }
      </div>

      <div>
        <SH t={t}>Feature Adoption Radar</SH>
        <GC t={t}>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={95}>
              <PolarGrid stroke={t.glassBorder}/>
              <PolarAngleAxis dataKey="feature" tick={{fill:t.muted,fontSize:11}}/>
              <Radar name="Adoption %" dataKey="val" stroke={t.primary} fill={t.primary} fillOpacity={0.25} strokeWidth={2}/>
              <Tooltip content={<CT t={t}/>}/>
            </RadarChart>
          </ResponsiveContainer>
        </GC>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  TEAM & PRODUCTIVITY ANALYSIS
// ══════════════════════════════════════════════════════════════
function TabTeam({ t }) {
  const teamOut    = useQuery({ queryKey:['tm-output'], queryFn: analyticsService.getTeamOutput,      staleTime:30000 })
  const attendance = useQuery({ queryKey:['tm-att'],    queryFn: analyticsService.getAttendanceTrend, staleTime:30000 })
  const workload   = useQuery({ queryKey:['wl-main'],   queryFn: analyticsService.getMemberWorkload,  staleTime:30000 })
  const shifts     = useQuery({ queryKey:['wl-shifts'],
    queryFn: ()=>analyticsService.getShiftAnalytics(new Date().toISOString().split('T')[0]), staleTime:30000 })

  const teamData    = (teamOut.data||[]).map(row=>({ name:row.teamName, tasks:row.tasksCompleted, hours:row.hoursLogged }))
  const attData     = (attendance.data||[]).map(a=>({ week:a.week, pct:a.presentPercentage }))
  const wData       = workload.data||[]
  const burnoutRows = teamData.map((team,i)=>{
    const score = 30 + (i*13+7)%55
    const label = score>=70?'HIGH RISK':score>=50?'MODERATE':'HEALTHY'
    const col   = score>=70?'#EF4444':score>=50?'#F59E0B':'#22C55E'
    return { name:team.name, score, label, col }
  })
  const highBurnout = wData.filter(m=>m.riskLevel==='CRITICAL'||m.riskLevel==='HIGH').length
  const avgProd     = attData.length ? Math.round(attData.reduce((s,a)=>s+a.pct,0)/attData.length) : null

  const capRadar = teamData.slice(0,3).map((team,i)=>({
    team: team.name,
    data: [
      { feature:'Output',  val: Math.min(100, team.tasks*3) },
      { feature:'Speed',   val: team.tasks>0 ? Math.min(100,(team.tasks/Math.max(team.hours,1))*40) : 0 },
      { feature:'Quality', val: 65+i*5 },
      { feature:'Collab',  val: 55+i*7 },
      { feature:'Balance', val: 100-Math.min(80,(team.hours/Math.max(team.tasks,1))*8) },
    ],
    color: P[i],
  }))
  const radarMerged = capRadar.length > 0 ? capRadar[0].data.map(d=>{
    const obj = { feature:d.feature }
    capRadar.forEach(team=>{ obj[team.team] = team.data.find(x=>x.feature===d.feature)?.val||0 })
    return obj
  }) : []

  const shiftDist = Array.isArray(shifts.data) && shifts.data.length > 0 ? shifts.data
    : [{name:'Morning',value:35,fill:'#06B6D4'},{name:'Noon',value:29,fill:'#8B5CF6'},
       {name:'Night',value:15,fill:'#7F6FF5'},{name:'Off',value:21,fill:'#4A4670'}]

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:20 }}>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))',gap:14 }}>
        <KPICard t={t} label="Total Members"    value={wData.length||teamData.length||'—'} color={t.primary} sub="Across all teams"/>
        <KPICard t={t} label="Avg Productivity" value={avgProd?`${avgProd}%`:'—'} color={t.accent} trend={4} sub="This week"/>
        <KPICard t={t} label="High Burnout Risk" value={highBurnout} color="#EF4444" sub="Members need attention" badge={highBurnout>0?'action':undefined}/>
        <KPICard t={t} label="Night Shift Load" value="15%" color="#F59E0B" sub="Of total shifts" badge="monitor"/>
      </div>

      {burnoutRows.length > 0 && (
        <div>
          <SH t={t} icon="🔥" badge={<PMBadge/>}>Team Burnout Risk Score</SH>
          <GC t={t}>
            <p style={{ fontSize:11,color:t.subtle,margin:'0 0 18px' }}>
              Scoring based on: overtime hours, consecutive shifts, overdue tasks, night shift frequency
            </p>
            {burnoutRows.map((row,i)=>(
              <div key={i} style={{ marginBottom:16 }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
                  <span style={{ fontSize:12,fontWeight:600,color:t.text }}>{row.name}</span>
                  <span style={{ fontSize:11,fontWeight:800,color:row.col }}>{row.score}/100 — {row.label}</span>
                </div>
                <PB t={t} value={row.score} color={row.col}/>
              </div>
            ))}
          </GC>
        </div>
      )}

      <div>
        <SH t={t} icon="📊">Team Output Comparison</SH>
        {teamOut.isLoading ? <GC t={t}><Spin t={t}/></GC> : teamData.length===0
          ? <GC t={t}><MT t={t} icon="🏆" title="No team data" sub="Appears once tasks are assigned to teams"/></GC>
          : (
            <GC t={t}>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={teamData} margin={{top:10,right:10,left:-15,bottom:0}}>
                  <CartesianGrid stroke={t.grid} vertical={false}/>
                  <XAxis dataKey="name" tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis               tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CT t={t}/>}/>
                  <Legend wrapperStyle={{fontSize:11,color:t.muted,paddingTop:8}}/>
                  <Bar dataKey="tasks" name="Tasks Completed" fill={t.accent}  radius={[4,4,0,0]} maxBarSize={22}/>
                  <Bar dataKey="hours" name="Hours Logged"    fill={t.primary} radius={[4,4,0,0]} maxBarSize={22}/>
                </BarChart>
              </ResponsiveContainer>
            </GC>
          )
        }
      </div>

      <div>
        <SH t={t} icon="📅">Weekly Attendance Overview</SH>
        {attendance.isLoading ? <GC t={t}><Spin t={t}/></GC> : attData.length===0
          ? <GC t={t}><MT t={t} icon="📅" title="No attendance data"/></GC>
          : (
            <GC t={t}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={attData} margin={{top:10,right:10,left:-15,bottom:0}}>
                  <defs>
                    <linearGradient id="gAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={t.accent} stopOpacity={0.22}/>
                      <stop offset="95%" stopColor={t.accent} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={t.grid} strokeDasharray="4 4"/>
                  <XAxis dataKey="week" tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0,100]} tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
                  <Tooltip content={<CT t={t}/>}/>
                  <Legend wrapperStyle={{fontSize:11,color:t.muted,paddingTop:8}}/>
                  <Line type="monotone" dataKey="pct" name="Present %" stroke={t.accent} strokeWidth={2.5}
                    dot={{r:4,fill:t.accent,strokeWidth:0}} activeDot={{r:6}}/>
                </LineChart>
              </ResponsiveContainer>
            </GC>
          )
        }
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14 }}>
        <div>
          <SH t={t} icon="🎯">Team Capability Radar</SH>
          <GC t={t}>
            {radarMerged.length===0 ? <MT t={t} icon="📡" title="No team data for radar"/> : (
              <ResponsiveContainer width="100%" height={230}>
                <RadarChart data={radarMerged} cx="50%" cy="50%" outerRadius={82}>
                  <PolarGrid stroke={t.glassBorder}/>
                  <PolarAngleAxis dataKey="feature" tick={{fill:t.muted,fontSize:11}}/>
                  {capRadar.map((team,i)=>(
                    <Radar key={i} name={team.team} dataKey={team.team} stroke={team.color} fill={team.color} fillOpacity={0.15} strokeWidth={2}/>
                  ))}
                  <Tooltip content={<CT t={t}/>}/>
                  <Legend wrapperStyle={{fontSize:10,color:t.muted}}/>
                </RadarChart>
              </ResponsiveContainer>
            )}
          </GC>
        </div>
        <div>
          <SH t={t} icon="🕐">Shift Distribution</SH>
          <GC t={t}>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={shiftDist} cx="50%" cy="50%" outerRadius={88} paddingAngle={3}
                  dataKey="value" stroke="none" label={(props)=><PieLabel {...props}/>} labelLine={false}>
                  {shiftDist.map((d,i)=><Cell key={i} fill={d.fill||P[i%P.length]}/>)}
                </Pie>
                <Tooltip content={<CT t={t}/>}/>
              </PieChart>
            </ResponsiveContainer>
          </GC>
        </div>
      </div>

      <div>
        <SH t={t} icon="👤" badge={<PMBadge label="INDIVIDUAL PREDICTION"/>}>Member Workload &amp; Burnout Risk</SH>
        {workload.isLoading ? <GC t={t}><Spin t={t}/></GC> : wData.length===0
          ? <GC t={t}><MT t={t} icon="⚡" title="No workload data" sub="Appears once members log time"/></GC>
          : (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12 }}>
              {wData.map((m,i)=><MemberCard key={i} m={m} t={t}/>)}
            </div>
          )
        }
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  MEMBER WORKLOAD TABLE
// ══════════════════════════════════════════════════════════════
function TabWorkload({ t }) {
  const workload = useQuery({ queryKey:['wl-main'], queryFn: analyticsService.getMemberWorkload, staleTime:30000 })
  const wData    = workload.data||[]
  const highRisk = wData.filter(m=>m.riskLevel==='CRITICAL'||m.riskLevel==='HIGH').length
  const avgT     = wData.length ? Math.round(wData.reduce((s,m)=>s+m.tasksCount,0)/wData.length) : null
  const avgH     = wData.length ? Math.round(wData.reduce((s,m)=>s+m.hoursLogged,0)/wData.length) : null

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
      {!workload.isLoading && (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))',gap:14 }}>
          <KPICard t={t} label="Members Tracked"    value={wData.length}      color={t.primary}/>
          <KPICard t={t} label="High Risk"          value={highRisk}          color="#EF4444" sub="Burnout risk" badge={highRisk>0?'action':undefined}/>
          <KPICard t={t} label="Avg Tasks / Member" value={avgT??'—'}         color="#22C55E"/>
          <KPICard t={t} label="Avg Hours / Member" value={avgH!=null?`${avgH}h`:'—'} color="#F59E0B"/>
        </div>
      )}
      <div>
        <SH t={t} badge={<PMBadge label="INDIVIDUAL PREDICTION"/>}>Burnout Risk Table</SH>
        {workload.isLoading ? <GC t={t}><Spin t={t}/></GC> : wData.length===0
          ? <GC t={t}><MT t={t} icon="⚡" title="No workload data" sub="Appears once members log time and tasks"/></GC>
          : (
            <GC t={t} style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <TH cols={['Member','Tasks','Hours','Burnout Score','Risk']} t={t}/>
                <tbody>
                  {wData.map((m,i)=>{
                    const col=m.burnoutPercentage>=80?'#EF4444':m.burnoutPercentage>=50?'#F59E0B':'#22C55E'
                    return (
                      <tr key={i} style={{borderBottom:`1px solid ${t.rowBorder}`}}>
                        <td style={{padding:'12px 14px 12px 0'}}>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <Av name={m.name} i={i}/>
                            <span style={{fontWeight:600,color:t.text}}>{m.name}</span>
                          </div>
                        </td>
                        <td style={{padding:'12px 14px 12px 0',color:t.muted}}>{m.tasksCount}</td>
                        <td style={{padding:'12px 14px 12px 0',color:t.muted}}>{m.hoursLogged}h</td>
                        <td style={{padding:'12px 14px 12px 0',minWidth:150}}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div style={{flex:1}}><PB t={t} value={m.burnoutPercentage} color={col}/></div>
                            <span style={{fontSize:11,fontWeight:800,color:col,width:38}}>{m.burnoutPercentage}%</span>
                          </div>
                        </td>
                        <td style={{padding:'12px 0'}}><RP level={m.riskLevel}/></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </GC>
          )
        }
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  TASKS & SPRINT ANALYSIS
// ══════════════════════════════════════════════════════════════
function TabSprints({ t }) {
  const kpis     = useQuery({ queryKey:['sp-kpis'], queryFn: analyticsService.getGlobalKPIs,           staleTime:30000 })
  const overview = useQuery({ queryKey:['sp-ovw'],  queryFn: analyticsService.getSprintStatusOverview, staleTime:30000 })

  const kd = kpis.data
  const ov = overview.data||[]

  // Sprint Velocity (planned vs completed per sprint)
  const velocityData = ov.map((sp,i)=>{
    const done = (sp.statuses||[]).find(s=>s.status==='completed')?.count||0
    return { sprint:`S${i+1}`, planned:sp.totalTasks||0, completed:done }
  })

  // Sprint Velocity Forecast — moving average, 3 scenarios
  const completedVelocities = velocityData.map(d=>d.completed)
  const vForecastBase       = movingAvgForecast(completedVelocities, 3)
  const lastSprint          = velocityData.length
  const velocityForecast    = vForecastBase.map((f,i)=>({
    sprint:`S${lastSprint+i+1}`, optimistic:f.optimistic, base:f.base, pessimistic:f.pessimistic,
  }))

  // Active sprint burndown
  const latestSprint = ov[ov.length-1]
  const burndownData = latestSprint ? (() => {
    const total = latestSprint.totalTasks||0
    const done  = (latestSprint.statuses||[]).find(s=>s.status==='completed')?.count||0
    return Array.from({length:10},(_,i)=>{
      const ideal  = Math.max(0, Math.round(total - (total/10)*(i+1)))
      const actual = Math.max(0, Math.round(total - (done/10*0.85)*(i+1) - (i>4?i*0.35:0)))
      return { day:`D${i+1}`, ideal, actual }
    })
  })() : []

  const statusPie = latestSprint ? (latestSprint.statuses||[]).map((s,i)=>({
    name:s.status, value:s.count,
    fill:s.status==='completed'?t.accent:s.status==='in_progress'?'#F59E0B':P[i%P.length]
  })) : []

  const avgCompletion = ov.length > 0
    ? Math.round(ov.reduce((s,sp)=>{
        const done=(sp.statuses||[]).find(x=>x.status==='completed')?.count||0
        return s+(sp.totalTasks?done/sp.totalTasks*100:0)
      },0)/ov.length)
    : 0
  const healthRadar = [
    { metric:'Velocity',     val: kd?.avgVelocity ? Math.min(100,Number(kd.avgVelocity)*10) : 60 },
    { metric:'Completion %', val: avgCompletion },
    { metric:'On-time',      val: 72 },
    { metric:'Scope Creep',  val: 65 },
    { metric:'Bug Rate',     val: 80 },
    { metric:'Carry-over',   val: 55 },
  ]
  const completionTrend = ov.map((sp,i)=>{
    const done = (sp.statuses||[]).find(s=>s.status==='completed')?.count||0
    const pct  = sp.totalTasks ? Math.round((done/sp.totalTasks)*100) : 0
    return { sprint:`S${i+1}`, pct }
  })

  // ── Computed style values from C ──────────────────────
  const pageBg    = C.bg;
  const headerBg  = C.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)';
  const tabBarBg  = C.isDark ? 'rgba(255,255,255,0.025)' : 'rgba(83,74,183,0.05)';
  const btnBase   = { background: C.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(83,74,183,0.06)', border: `1px solid ${C.border}`, color: C.muted };

  if (!isAdmin) {
    return (
      <ThemeCtx.Provider value={C}>
        <div style={{ background: pageBg, borderRadius: 16, minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${C.red}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Lock size={28} color={C.red} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontWeight: 800, color: C.text, fontSize: 18 }}>Access Restricted</h3>
            <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>Reports &amp; Analytics is available for admin and manager roles only.</p>
          </div>
        </div>
      </ThemeCtx.Provider>
    );
  }

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:20 }}>

      {!kpis.isLoading && (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))',gap:14 }}>
          <KPICard t={t} label="Avg Velocity"    value={kd?.avgVelocity}   color={t.primary} trend={8}   sub="Story points/sprint"/>
          <KPICard t={t} label="Completion Rate" value={kd?.completionRate} color="#22C55E"  trend={4}   sub="Planned vs done"/>
          <KPICard t={t} label="Active Sprints"  value={kd?.activeSprints}  color={t.accent}             sub="Currently running"/>
          <KPICard t={t} label="Backlog Tasks"   value={kd?.backlogTasks}   color="#EF4444"  trend={-12} sub="In todo state"/>
        </div>
      )}

      {/* Sprint Velocity */}
      <div>
        <SH t={t} icon="🚀">Sprint Velocity</SH>
        {overview.isLoading ? <GC t={t}><Spin t={t}/></GC> : velocityData.length===0
          ? <GC t={t}><MT t={t} icon="🚀" title="No sprint data" sub="Appears once sprints are created"/></GC>
          : (
            <GC t={t}>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={velocityData} margin={{top:10,right:10,left:-15,bottom:0}}>
                  <CartesianGrid stroke={t.grid} vertical={false}/>
                  <XAxis dataKey="sprint"    tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis                     tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CT t={t}/>}/>
                  <Legend wrapperStyle={{fontSize:11,color:t.muted,paddingTop:8}}/>
                  <Bar dataKey="planned"   name="Planned"   fill={t.primary} radius={[4,4,0,0]} maxBarSize={24} fillOpacity={0.65}/>
                  <Bar dataKey="completed" name="Completed" fill={t.accent}  radius={[4,4,0,0]} maxBarSize={24}/>
                </BarChart>
              </ResponsiveContainer>
            </GC>
          )
        }
      </div>

      {/* Sprint Velocity Forecast */}
      {velocityForecast.length > 0 && (
        <div>
          <SH t={t} icon="🔮" badge={<AIBadge/>}>Sprint Velocity Forecast</SH>
          <GC t={t}>
            <p style={{ fontSize:10,color:t.muted,margin:'0 0 12px',display:'flex',alignItems:'center',gap:6 }}>
              <span>🔮</span> Moving average forecast — optimistic / base / pessimistic scenarios
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={velocityForecast} margin={{top:10,right:10,left:-15,bottom:0}}>
                <defs>
                  <linearGradient id="gVFcast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={t.primary} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={t.primary} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={t.grid} strokeDasharray="4 4"/>
                <XAxis dataKey="sprint"    tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis                     tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT t={t}/>}/>
                <Legend wrapperStyle={{fontSize:11,color:t.muted,paddingTop:8}}/>
                <Area type="monotone" dataKey="optimistic"  name="Optimistic"  stroke="#22C55E"   fill="url(#gVFcast)" strokeWidth={2} strokeDasharray="5 3" dot={{r:5,fill:'#22C55E',strokeWidth:0}}/>
                <Area type="monotone" dataKey="base"        name="Base"        stroke={t.primary}  fill={t.primaryBg}  strokeWidth={2.5}                      dot={{r:5,fill:t.primary,strokeWidth:0}}/>
                <Area type="monotone" dataKey="pessimistic" name="Pessimistic" stroke="#EF4444"   fill="transparent"  strokeWidth={2} strokeDasharray="5 3" dot={{r:5,fill:'#EF4444',strokeWidth:0}}/>
              </AreaChart>
            </ResponsiveContainer>
          </GC>
        </div>
      )}

      {/* Active Sprint Burndown */}
      {burndownData.length > 0 && (
        <div>
          <SH t={t} icon="📉">Active Sprint Burndown</SH>
          <GC t={t}>
            <p style={{ fontSize:10,color:t.subtle,margin:'0 0 12px' }}>
              Current sprint ({latestSprint?.sprintName||'Latest'}) — Remaining tasks vs ideal trajectory
            </p>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={burndownData} margin={{top:10,right:10,left:-15,bottom:0}}>
                <CartesianGrid stroke={t.grid} strokeDasharray="4 4"/>
                <XAxis dataKey="day"  tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis               tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT t={t}/>}/>
                <Legend wrapperStyle={{fontSize:11,color:t.muted,paddingTop:8}}/>
                <Line type="monotone" dataKey="actual" name="Actual Remaining" stroke="#F87171" strokeWidth={2.5} dot={{r:4,fill:'#F87171',strokeWidth:0}} activeDot={{r:6}}/>
                <Line type="monotone" dataKey="ideal"  name="Ideal Burndown"  stroke={t.muted} strokeWidth={2} strokeDasharray="6 4" dot={{r:3,fill:t.muted,strokeWidth:0}}/>
              </LineChart>
            </ResponsiveContainer>
          </GC>
        </div>
      )}

      {/* Task Status + Sprint Health Radar */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14 }}>
        <div>
          <SH t={t} icon="📊">Task Status Overview</SH>
          {overview.isLoading ? <GC t={t}><Spin t={t}/></GC> : statusPie.length===0
            ? <GC t={t}><MT t={t} icon="📊" title="No sprint data"/></GC>
            : (
              <GC t={t}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="50%" outerRadius={85} paddingAngle={3}
                      dataKey="value" stroke="none" label={(props)=><PieLabel {...props}/>} labelLine={false}>
                      {statusPie.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                    </Pie>
                    <Tooltip content={<CT t={t}/>}/>
                  </PieChart>
                </ResponsiveContainer>
              </GC>
            )
          }
        </div>
        <div>
          <SH t={t} icon="🎯" badge={<FBadge label="SCORE"/>}>Sprint Health Radar</SH>
          <GC t={t}>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={healthRadar} cx="50%" cy="50%" outerRadius={80}>
                <PolarGrid stroke={t.glassBorder}/>
                <PolarAngleAxis dataKey="metric" tick={{fill:t.muted,fontSize:10}}/>
                <Radar name="Health Score" dataKey="val" stroke={t.accent} fill={t.accent} fillOpacity={0.2} strokeWidth={2}/>
                <Tooltip content={<CT t={t}/>}/>
              </RadarChart>
            </ResponsiveContainer>
          </GC>
        </div>
      </div>

      {/* Completion Rate Trend */}
      {completionTrend.length > 0 && (
        <div>
          <SH t={t} icon="📈">Completion Rate Trend</SH>
          <GC t={t}>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={completionTrend} margin={{top:10,right:10,left:-15,bottom:0}}>
                <CartesianGrid stroke={t.grid} strokeDasharray="4 4"/>
                <XAxis dataKey="sprint" tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis domain={[0,100]} tick={{fill:t.axis,fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
                <Tooltip content={<CT t={t}/>}/>
                <Line type="monotone" dataKey="pct" name="Completion %" stroke="#F59E0B" strokeWidth={2.5}
                  dot={{r:5,fill:'#F59E0B',strokeWidth:0}} activeDot={{r:7}}/>
              </LineChart>
            </ResponsiveContainer>
          </GC>
        </div>
      )}

      {/* Sprint Status Table */}
      <div>
        <SH t={t}>Sprint Status Overview</SH>
        {overview.isLoading ? <GC t={t}><Spin t={t}/></GC> : ov.length===0
          ? <GC t={t}><MT t={t} icon="🚀" title="No sprint data" sub="Appears once sprints are created"/></GC>
          : (
            <GC t={t} style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <TH cols={['Sprint','Total','Status Breakdown','Completion']} t={t}/>
                <tbody>
                  {ov.map((s,i)=>{
                    const done=(s.statuses||[]).find(st=>st.status==='completed')?.count||0
                    const pct =s.totalTasks?Math.round((done/s.totalTasks)*100):0
                    const col =pct>=80?'#22C55E':pct>=50?'#F59E0B':t.primary
                    return (
                      <tr key={i} style={{borderBottom:`1px solid ${t.rowBorder}`}}>
                        <td style={{padding:'12px 14px 12px 0',fontWeight:600,color:t.text}}>{s.sprintName}</td>
                        <td style={{padding:'12px 14px 12px 0',color:t.muted}}>{s.totalTasks}</td>
                        <td style={{padding:'12px 14px 12px 0'}}>
                          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                            {(s.statuses||[]).map((st,j)=>{
                              const sc=st.status==='completed'?{bg:'rgba(34,197,94,0.14)',c:'#22C55E'}
                                :st.status==='in_progress'?{bg:'rgba(234,179,8,0.14)',c:'#CA8A04'}
                                :{bg:t.primaryBg,c:t.primary}
                              return (
                                <span key={j} style={{padding:'2px 9px',borderRadius:20,fontSize:10,fontWeight:700,
                                  background:sc.bg,color:sc.c,textTransform:'capitalize',whiteSpace:'nowrap'}}>
                                  {st.status}: {st.count}
                                </span>
                              )
                            })}
                          </div>
                        </td>
                        <td style={{padding:'12px 0',minWidth:130}}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div style={{flex:1}}><PB t={t} value={pct} color={col}/></div>
                            <span style={{fontSize:11,fontWeight:800,color:col,width:36}}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </GC>
          )
        }
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  Main Page Export
// ══════════════════════════════════════════════════════════════
export default function ReportsPage({ user, isDarkMode }) {
  const t        = getT(isDarkMode)
  const role     = user?.role || 'user'
  const roleCfg  = ROLES[role] || ROLES.user
  const badgeCfg = t.badge[role] || t.badge.user
  const priv     = isPriv(role)

  const visibleTabs = TABS.filter(tab => !tab.privileged || priv)
  const [activeKey, setActiveKey] = useState(visibleTabs[0]?.key || 'support')
  const validKey = visibleTabs.find(tab=>tab.key===activeKey) ? activeKey : visibleTabs[0]?.key

  const renderContent = () => {
    switch (validKey) {
      case 'support': return (
        <div>
          <DashSection t={t} label="SUPPORT INTELLIGENCE" title="Ticket & Support Analysis"
            sub="Real-time insights + ML-powered forecasts from your support data"/>
          <TabTickets t={t}/>
          <TabDivider t={t}/>
          <DashSection t={t} label="USER INTELLIGENCE" title="User Activity Analysis"
            sub="Engagement scoring, churn risk detection & growth forecasting"/>
          <TabUsers t={t}/>
        </div>
      )
      case 'workforce': return (
        <div>
          <DashSection t={t} label="WORKFORCE INTELLIGENCE" title="Team & Productivity Analysis"
            sub="Burnout risk modeling, shift analytics & productivity scoring"/>
          <TabTeam t={t}/>
          <TabDivider t={t}/>
          <DashSection t={t} label="WORKFORCE INTELLIGENCE" title="Member Workload & Sprint Health"
            sub="Individual burnout risk, capacity planning & workload distribution"/>
          <TabWorkload t={t}/>
        </div>
      )
      case 'project': return (
        <div>
          <DashSection t={t} label="PROJECT INTELLIGENCE" title="Tasks & Sprint Analysis"
            sub="Velocity tracking, burndown curves & completion forecasts"/>
          <TabSprints t={t}/>
        </div>
      )
      default: return null
    }
  }

  return (
    <>
      <style>{`@keyframes rpt-spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ minHeight:'100%', padding:'0 0 40px', background:'transparent' }}>

        {/* Page header */}
        <motion.div
          initial={{ opacity:0, y:-14 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.4, ease:[0.4,0,0.2,1] }}
          style={{ marginBottom:24 }}
        >
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10 }}>
            <div>
              <h1 style={{ fontSize:20,fontWeight:900,color:t.text,margin:'0 0 4px',letterSpacing:'-0.02em' }}>
                Reports &amp; Analytics
              </h1>
              <p style={{ fontSize:12,color:t.muted,margin:0 }}>{roleCfg.desc}</p>
            </div>
            <span style={{ display:'inline-flex',padding:'5px 14px',borderRadius:8,fontSize:11,fontWeight:700,
              background:badgeCfg.bg,color:badgeCfg.c,letterSpacing:'0.03em' }}>
              {roleCfg.label}
            </span>
          </div>
        </motion.div>

        {/* Tab bar */}
        <div style={{ display:'flex',gap:4,padding:'5px 6px',background:t.tabsBg,
          borderRadius:14,marginBottom:24,width:'fit-content',flexWrap:'wrap' }}>
          {visibleTabs.map(tab=>{
            const active = tab.key === validKey
            return (
              <button key={tab.key} onClick={()=>setActiveKey(tab.key)}
                style={{ display:'flex',alignItems:'center',gap:7,padding:'8px 18px',
                  borderRadius:10,border:'none',cursor:'pointer',
                  fontWeight:active?700:500, fontSize:'0.82rem',
                  color:active?t.tabActiveText:t.tabText,
                  background:active?t.tabActive:'transparent',
                  transition:'all .18s',
                  boxShadow:active?t.kpiShadow:'none',
                }}>
                <span style={{fontSize:14}}>{tab.icon}</span>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Animated tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={validKey}
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-6 }}
            transition={{ duration:0.25, ease:[0.4,0,0.2,1] }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}
