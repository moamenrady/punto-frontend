// ─────────────────────────────────────────────────────────────────────────────
//  Mock API — mirrors real endpoint contracts.
//  Replace each function body with a real fetch() call when your backend is ready.
//  e.g.  export const getTicketKPIs = () => fetch('/api/v1/tickets/analytics/kpis').then(r => r.json())
// ─────────────────────────────────────────────────────────────────────────────

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms))

// ── /api/v1/tickets/analytics/kpis ──────────────────────────────────────────
export const getTicketKPIs = async () => {
  await delay()
  return {
    total_open: 248,
    avg_response_time_hours: 2.4,
    resolution_rate_pct: 87.3,
    escalation_rate_pct: 6.1,
    sla_breach_pct: 4.2,
    csat_score: 4.6,
    total_closed_this_week: 134,
    delta: {
      total_open: +12,
      avg_response_time_hours: -0.3,
      resolution_rate_pct: +1.8,
      escalation_rate_pct: -0.4,
    },
  }
}

// ── /api/v1/tickets/analytics/weekly-trends ─────────────────────────────────
export const getTicketWeeklyTrends = async () => {
  await delay()
  return {
    weeks: [
      { week: 'W1 Jan', open: 180, in_progress: 62, resolved: 210, escalated: 14 },
      { week: 'W2 Jan', open: 195, in_progress: 71, resolved: 198, escalated: 18 },
      { week: 'W3 Jan', open: 172, in_progress: 58, resolved: 225, escalated: 11 },
      { week: 'W4 Jan', open: 210, in_progress: 80, resolved: 190, escalated: 22 },
      { week: 'W1 Feb', open: 230, in_progress: 74, resolved: 215, escalated: 17 },
      { week: 'W2 Feb', open: 218, in_progress: 68, resolved: 232, escalated: 15 },
      { week: 'W3 Feb', open: 205, in_progress: 77, resolved: 248, escalated: 12 },
      { week: 'W4 Feb', open: 248, in_progress: 85, resolved: 220, escalated: 19 },
      // AI-predicted future weeks
      { week: 'W1 Mar', predicted_open: 265, predicted_resolved: 238 },
      { week: 'W2 Mar', predicted_open: 252, predicted_resolved: 255 },
    ],
  }
}

// ── /api/v1/tickets/analytics/categories ─────────────────────────────────────
export const getTicketCategories = async () => {
  await delay()
  return {
    categories: [
      { name: 'Technical Support', count: 98, pct: 39.5 },
      { name: 'Billing & Payments', count: 62, pct: 25.0 },
      { name: 'Account Access',    count: 45, pct: 18.1 },
      { name: 'Feature Requests',  count: 28, pct: 11.3 },
      { name: 'Onboarding',        count: 15, pct: 6.1  },
    ],
  }
}

// ── /api/v1/tickets/analytics/resolution ─────────────────────────────────────
export const getTicketResolution = async () => {
  await delay()
  return {
    trend: [
      { date: 'Jan 8',  avg_hours: 3.8, sla_target: 4.0 },
      { date: 'Jan 15', avg_hours: 3.2, sla_target: 4.0 },
      { date: 'Jan 22', avg_hours: 4.1, sla_target: 4.0 },
      { date: 'Jan 29', avg_hours: 2.9, sla_target: 4.0 },
      { date: 'Feb 5',  avg_hours: 2.6, sla_target: 4.0 },
      { date: 'Feb 12', avg_hours: 2.4, sla_target: 4.0 },
      { date: 'Feb 19', avg_hours: 3.0, sla_target: 4.0 },
      { date: 'Feb 26', avg_hours: 2.4, sla_target: 4.0 },
      { date: 'Mar 4',  predicted_hours: 2.2 },
      { date: 'Mar 11', predicted_hours: 2.0 },
    ],
    status_distribution: [
      { name: 'Open',        value: 248, color: '#f97316' },
      { name: 'In Progress', value: 85,  color: '#3b82f6' },
      { name: 'Resolved',    value: 134, color: '#22c55e' },
      { name: 'Escalated',   value: 19,  color: '#ef4444' },
    ],
  }
}

// ── /api/v1/users/analytics/growth ───────────────────────────────────────────
export const getUserGrowth = async () => {
  await delay()
  return {
    monthly: [
      { month: 'Aug', total_users: 1820, active_users: 1340, new_users: 210 },
      { month: 'Sep', total_users: 2015, active_users: 1490, new_users: 195 },
      { month: 'Oct', total_users: 2240, active_users: 1680, new_users: 225 },
      { month: 'Nov', total_users: 2380, active_users: 1750, new_users: 140 },
      { month: 'Dec', total_users: 2490, active_users: 1820, new_users: 110 },
      { month: 'Jan', total_users: 2720, active_users: 2010, new_users: 230 },
      { month: 'Feb', total_users: 2940, active_users: 2180, new_users: 220 },
      // AI predictions
      { month: 'Mar', predicted_total: 3180, predicted_active: 2350 },
      { month: 'Apr', predicted_total: 3450, predicted_active: 2530 },
    ],
  }
}

// ── /api/v1/users/analytics/churn-risk ───────────────────────────────────────
export const getUserChurnRisk = async () => {
  await delay()
  return {
    summary: { high: 38, medium: 112, low: 340 },
    users: [
      { id: 1, name: 'Alex Morgan',    email: 'a.morgan@co.io',  score: 0.91, last_active_days: 28, tickets: 0, risk_label: 'High'   },
      { id: 2, name: 'Jordan Lee',     email: 'j.lee@co.io',     score: 0.85, last_active_days: 21, tickets: 1, risk_label: 'High'   },
      { id: 3, name: 'Sam Rivera',     email: 's.rivera@co.io',  score: 0.79, last_active_days: 18, tickets: 2, risk_label: 'High'   },
      { id: 4, name: 'Casey Park',     email: 'c.park@co.io',    score: 0.72, last_active_days: 15, tickets: 1, risk_label: 'High'   },
      { id: 5, name: 'Taylor Brooks',  email: 't.brooks@co.io',  score: 0.68, last_active_days: 12, tickets: 3, risk_label: 'Medium' },
      { id: 6, name: 'Morgan Chen',    email: 'm.chen@co.io',    score: 0.61, last_active_days: 10, tickets: 2, risk_label: 'Medium' },
      { id: 7, name: 'Riley Quinn',    email: 'r.quinn@co.io',   score: 0.55, last_active_days: 9,  tickets: 4, risk_label: 'Medium' },
      { id: 8, name: 'Dana Foster',    email: 'd.foster@co.io',  score: 0.49, last_active_days: 7,  tickets: 1, risk_label: 'Medium' },
    ],
  }
}

// ── /api/v1/users/analytics/demographics ─────────────────────────────────────
export const getUserDemographics = async () => {
  await delay()
  return {
    engagement_buckets: [
      { label: 'Power Users',  score_range: '80–100', count: 428 },
      { label: 'Active',       score_range: '60–79',  count: 812 },
      { label: 'Occasional',   score_range: '40–59',  count: 640 },
      { label: 'At-Risk',      score_range: '20–39',  count: 480 },
      { label: 'Dormant',      score_range: '0–19',   count: 380 },
    ],
    by_role: [
      { role: 'Admin',    count: 48  },
      { role: 'Manager',  count: 142 },
      { role: 'Agent',    count: 560 },
      { role: 'Viewer',   count: 980 },
      { role: 'External', count: 210 },
    ],
  }
}

// ── /api/v1/analytics/activity-heatmap ───────────────────────────────────────
export const getActivityHeatmap = async () => {
  await delay()
  const days   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const hours  = [0,2,4,6,8,10,12,14,16,18,20,22]
  const data   = []
  days.forEach((day, di) => {
    hours.forEach(h => {
      const base = (di < 5) ? (h >= 8 && h <= 18 ? 60 : 10) : 15
      data.push({ day, hour: `${h}:00`, value: Math.round(base + Math.random() * 40) })
    })
  })
  return { data }
}

// ── /api/v1/analytics/team-output ────────────────────────────────────────────
export const getTeamOutput = async () => {
  await delay()
  return {
    teams: [
      { name: 'Frontend',  tasks_completed: 142, tickets_resolved: 38, productivity_score: 87, burnout_risk: 24 },
      { name: 'Backend',   tasks_completed: 168, tickets_resolved: 54, productivity_score: 82, burnout_risk: 35 },
      { name: 'DevOps',    tasks_completed: 94,  tickets_resolved: 71, productivity_score: 78, burnout_risk: 41 },
      { name: 'Design',    tasks_completed: 118, tickets_resolved: 22, productivity_score: 91, burnout_risk: 18 },
      { name: 'QA',        tasks_completed: 210, tickets_resolved: 48, productivity_score: 85, burnout_risk: 29 },
      { name: 'Support',   tasks_completed: 76,  tickets_resolved: 186, productivity_score: 73, burnout_risk: 52 },
    ],
    weekly_trend: [
      { week: 'W1', output: 610, target: 700 },
      { week: 'W2', output: 688, target: 700 },
      { week: 'W3', output: 721, target: 700 },
      { week: 'W4', output: 695, target: 700 },
      { week: 'W5', output: 744, target: 700 },
      { week: 'W6', output: 808, target: 700 },
    ],
  }
}

// ── /api/v1/analytics/member-workload ────────────────────────────────────────
export const getMemberWorkload = async () => {
  await delay()
  return {
    members: [
      { id: 1, name: 'Elena Vasquez', role: 'Backend',   avatar_color: '#3b82f6', tasks_assigned: 24, tasks_done: 18, hours_logged: 52, burnout_score: 0.72, productivity: 81, sprint_health: 74 },
      { id: 2, name: 'Marcus Jin',    role: 'DevOps',    avatar_color: '#f97316', tasks_assigned: 19, tasks_done: 12, hours_logged: 61, burnout_score: 0.84, productivity: 68, sprint_health: 58 },
      { id: 3, name: 'Priya Sharma',  role: 'Frontend',  avatar_color: '#22c55e', tasks_assigned: 21, tasks_done: 19, hours_logged: 44, burnout_score: 0.31, productivity: 94, sprint_health: 91 },
      { id: 4, name: 'Noah Williams', role: 'QA',        avatar_color: '#a855f7', tasks_assigned: 32, tasks_done: 28, hours_logged: 48, burnout_score: 0.45, productivity: 88, sprint_health: 85 },
      { id: 5, name: 'Aisha Okafor',  role: 'Design',    avatar_color: '#06b6d4', tasks_assigned: 15, tasks_done: 14, hours_logged: 39, burnout_score: 0.22, productivity: 96, sprint_health: 95 },
      { id: 6, name: 'Diego Reyes',   role: 'Backend',   avatar_color: '#f59e0b', tasks_assigned: 28, tasks_done: 20, hours_logged: 58, burnout_score: 0.68, productivity: 76, sprint_health: 70 },
      { id: 7, name: 'Sara Lindqvist',role: 'Support',   avatar_color: '#ef4444', tasks_assigned: 40, tasks_done: 26, hours_logged: 67, burnout_score: 0.91, productivity: 65, sprint_health: 48 },
      { id: 8, name: 'Kenji Tanaka',  role: 'Frontend',  avatar_color: '#8b5cf6', tasks_assigned: 18, tasks_done: 17, hours_logged: 41, burnout_score: 0.28, productivity: 93, sprint_health: 90 },
    ],
  }
}

// ── /api/v1/analytics/attendance-trend ───────────────────────────────────────
export const getAttendanceTrend = async () => {
  await delay()
  return {
    weekly: [
      { week: 'W1 Jan', attendance_pct: 91, remote_pct: 44, on_site_pct: 47, absent_pct: 9  },
      { week: 'W2 Jan', attendance_pct: 88, remote_pct: 42, on_site_pct: 46, absent_pct: 12 },
      { week: 'W3 Jan', attendance_pct: 93, remote_pct: 48, on_site_pct: 45, absent_pct: 7  },
      { week: 'W4 Jan', attendance_pct: 86, remote_pct: 40, on_site_pct: 46, absent_pct: 14 },
      { week: 'W1 Feb', attendance_pct: 90, remote_pct: 46, on_site_pct: 44, absent_pct: 10 },
      { week: 'W2 Feb', attendance_pct: 94, remote_pct: 50, on_site_pct: 44, absent_pct: 6  },
      { week: 'W3 Feb', attendance_pct: 92, remote_pct: 47, on_site_pct: 45, absent_pct: 8  },
      { week: 'W4 Feb', attendance_pct: 89, remote_pct: 43, on_site_pct: 46, absent_pct: 11 },
    ],
  }
}

// ── /api/v1/analytics/shift-analytics ────────────────────────────────────────
export const getShiftAnalytics = async () => {
  await delay()
  return {
    shifts: [
      { shift: 'Morning (6–14)', headcount: 48, avg_output: 88, satisfaction: 4.2 },
      { shift: 'Day (9–17)',     headcount: 124,avg_output: 82, satisfaction: 4.4 },
      { shift: 'Evening (14–22)',headcount: 62, avg_output: 79, satisfaction: 3.9 },
      { shift: 'Night (22–6)',   headcount: 18, avg_output: 71, satisfaction: 3.5 },
    ],
  }
}

// ── /api/v1/tasks/my (current user sprint) ───────────────────────────────────
export const getMyTasks = async () => {
  await delay()
  return {
    current_sprint: {
      name: 'Sprint 14',
      start: '2026-05-01',
      end:   '2026-05-14',
      total_points: 84,
      completed_points: 61,
      remaining_points: 23,
    },
    tasks: [
      { id: 't1', title: 'Refactor auth middleware',   status: 'done',        points: 8,  assignee: 'Elena Vasquez' },
      { id: 't2', title: 'Build notification service', status: 'in_progress', points: 13, assignee: 'Marcus Jin'    },
      { id: 't3', title: 'Dashboard unit tests',       status: 'done',        points: 5,  assignee: 'Noah Williams' },
      { id: 't4', title: 'CI/CD pipeline upgrade',     status: 'blocked',     points: 8,  assignee: 'Marcus Jin'    },
      { id: 't5', title: 'Design system tokens',       status: 'done',        points: 3,  assignee: 'Aisha Okafor'  },
      { id: 't6', title: 'API rate limiter',           status: 'in_progress', points: 8,  assignee: 'Elena Vasquez' },
    ],
  }
}

// ── Sprint-level data (TODO: wire to /api/v1/sprints when endpoint is available) ──
export const getSprintAnalytics = async () => {
  await delay()
  return {
    velocity: [
      { sprint: 'S8',  planned: 72,  completed: 64,  predicted: null },
      { sprint: 'S9',  planned: 76,  completed: 71,  predicted: null },
      { sprint: 'S10', planned: 80,  completed: 78,  predicted: null },
      { sprint: 'S11', planned: 78,  completed: 82,  predicted: null },
      { sprint: 'S12', planned: 84,  completed: 79,  predicted: null },
      { sprint: 'S13', planned: 88,  completed: 85,  predicted: null },
      { sprint: 'S14', planned: 84,  completed: 61,  predicted: null },   // current (partial)
      { sprint: 'S15', planned: null,completed: null,predicted: 88 },
      { sprint: 'S16', planned: null,completed: null,predicted: 92 },
    ],
    burndown: (() => {
      const total = 84
      const days = 14
      const ideal = Array.from({ length: days + 1 }, (_, i) => ({
        day: `Day ${i}`,
        ideal: Math.round(total - (total / days) * i),
        actual: null,
        predicted: null,
      }))
      const actuals = [84,81,76,72,68,62,58,54]
      actuals.forEach((v, i) => { ideal[i].actual = v })
      ideal[8].predicted  = 50
      ideal[9].predicted  = 44
      ideal[10].predicted = 36
      ideal[11].predicted = 28
      ideal[12].predicted = 18
      ideal[13].predicted = 8
      ideal[14].predicted = 0
      return ideal
    })(),
    health: {
      velocity_trend: 'improving',
      scope_creep_pct: 8,
      bug_rate: 12,
      team_morale: 74,
    },
  }
}
