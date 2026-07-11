const BASE = 'https://punto-production-21ed.up.railway.app/api/v1';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

async function request(url) {
  const res = await fetch(`${BASE}${url}`, {
    method: 'GET',
    headers: authHeaders(),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `Request failed (HTTP ${res.status})`);
  return json;
}

export const analyticsService = {
  // ── User Analytics ──
  getDemographics:    () => request('/users/analytics/demographics').then(j => j?.data),
  getGrowthTrend:     () => request('/users/analytics/growth').then(j => j?.data?.growth ?? []),
  getChurnRiskList:   () => request('/users/analytics/churn-risk').then(j => j?.data?.atRiskUsers ?? []),

  // ── Ticket Analytics ──
  getWeeklyTrends:       () => request('/tickets/analytics/weekly-trends').then(j => j?.data),
  getTicketKPIs:         () => request('/tickets/analytics/kpis').then(j => j?.data),
  getTicketsByCategory:  () => request('/tickets/analytics/categories').then(j => j?.data?.categories ?? []),
  getResolutionAnalytics:() => request('/tickets/analytics/resolution').then(j => j?.data),

  // ── Work / Activity Analytics ──
  getActivityHeatmap:  () => request('/analytics/activity-heatmap').then(j => j?.data),
  getTeamOutput:       () => request('/analytics/team-output').then(j => j?.data?.outputData ?? []),
  getMemberWorkload:   () => request('/analytics/member-workload').then(j => j?.data?.memberData ?? []),

  // ── Shift Analytics ──
  getAttendanceTrend:  () => request('/analytics/attendance-trend').then(j => j?.data?.trend ?? []),
  getShiftAnalytics:   (weekStart) => request(`/analytics/shift-analytics?weekStart=${weekStart}`).then(j => j?.data),

  // ── Sprint Analytics ──
  getBurndown:            (sprintId)  => request(`/sprints/analytics/burndown/${sprintId}`).then(j => j?.data),
  getVelocity:            (projectId) => request(`/sprints/analytics/velocity/${projectId}`).then(j => j?.data?.velocity ?? []),
  getSprintStatusOverview:()          => request('/sprints/analytics/status-overview').then(j => j?.data?.overview ?? []),
  getGlobalKPIs:          ()          => request('/sprints/analytics/global-kpis').then(j => j?.data),
};
