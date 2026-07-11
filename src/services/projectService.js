const BASE = 'https://punto-production-21ed.up.railway.app/api/v1';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

async function request(method, url, body) {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `Request failed (HTTP ${res.status})`);
  return json;
}

// ─── Response parsers (handle different shapes gracefully) ───────────────────
const parseProjects  = (json) => json?.data?.projects  ?? json?.data?.data ?? [];
const parseSprints   = (json) => json?.data?.sprints   ?? json?.data?.data ?? [];
const parseBacklogs  = (json) => json?.data?.backlogs  ?? json?.data?.data ?? [];
const parseTasks     = (json) => json?.data?.tasks     ?? json?.data?.data ?? [];
const parseUsers     = (json) => Array.isArray(json)   ? json
                               : json?.data?.users     ?? json?.data?.data ?? json?.data ?? [];
const parseTeams     = (json) => json?.data?.teams     ?? json?.data?.data ?? [];

export const projectService = {
  // ── Projects ────────────────────────────────────────────────────────────────
  getProjects:   ()           => request('GET',    '/projects').then(parseProjects),
  createProject: (data)       => request('POST',   '/projects', data).then(j => j?.data?.doc ?? j?.data?.project ?? j?.data),
  updateProject: (id, data)   => request('PATCH',  `/projects/${id}`, data).then(j => j?.data?.doc ?? j?.data?.project ?? j?.data),
  deleteProject: (id)         => request('DELETE', `/projects/${id}`),

  // ── Project Members ─────────────────────────────────────────────────────────
  addMember:     (pid, userId)           => request('POST',   `/projects/${pid}/members`, { userId }).then(j => j?.data?.project ?? j?.data),
  removeMember:  (pid, userId)           => request('DELETE', `/projects/${pid}/members/${userId}`).then(j => j?.data?.project ?? j?.data),

  // ── Sprints (nested under project) ──────────────────────────────────────────
  getSprints:    (pid)           => request('GET',    `/projects/${pid}/sprints`).then(parseSprints),
  createSprint:  (pid, data)     => request('POST',   `/projects/${pid}/sprints`, data).then(j => j?.data?.doc ?? j?.data?.sprint ?? j?.data),
  updateSprint:  (pid, sid, data)=> request('PATCH',  `/projects/${pid}/sprints/${sid}`, data).then(j => j?.data?.doc ?? j?.data?.sprint ?? j?.data),
  deleteSprint:  (pid, sid)      => request('DELETE', `/projects/${pid}/sprints/${sid}`),

  // ── Backlogs (nested under project) ─────────────────────────────────────────
  getBacklogs:   (pid)           => request('GET',    `/projects/${pid}/backlogs`).then(parseBacklogs),
  createBacklog: (pid, data)     => request('POST',   `/projects/${pid}/backlogs`, data).then(j => j?.data?.doc ?? j?.data?.backlog ?? j?.data),
  updateBacklog: (pid, bid, data) => request('PATCH',  `/projects/${pid}/backlogs/${bid}`, data).then(j => j?.data?.doc ?? j?.data?.backlog ?? j?.data),
  deleteBacklog: (pid, bid)      => request('DELETE', `/projects/${pid}/backlogs/${bid}`),

  // ── Tasks (nested under backlog) ─────────────────────────────────────────────
  getTasksByBacklog: (bid)            => request('GET',    `/backlogs/${bid}/tasks`).then(parseTasks),
  getProjectTasks:   (pid)            => request('GET',    `/projects/${pid}/tasks`).then(parseTasks),
  createTask:        (bid, data)      => request('POST',   `/backlogs/${bid}/tasks`, data).then(j => j?.data?.doc ?? j?.data?.task ?? j?.data),
  updateTask:        (bid, tid, data) => request('PATCH',  `/backlogs/${bid}/tasks/${tid}`, data).then(j => j?.data?.doc ?? j?.data?.task ?? j?.data),
  deleteTask:        (bid, tid)       => request('DELETE', `/backlogs/${bid}/tasks/${tid}`),

  // ── Users (admin: search all users) ─────────────────────────────────────────
  searchUsers: async (query = '') => {
    const qs = query ? `?search=${encodeURIComponent(query)}` : '';
    return request('GET', `/users${qs}`).then(parseUsers);
  },

  // ── My Tasks (tasks assigned to the logged-in user) ──────────────────────────
  getMyTasks: () => request('GET', '/tasks/my').then(j => j?.data?.tasks ?? []),

  // ── Teams ────────────────────────────────────────────────────────────────────
  getTeams:        ()           => request('GET',    '/teams').then(parseTeams),
  createTeam:      (data)       => request('POST',   '/teams', data).then(j => j?.data?.doc ?? j?.data?.team ?? j?.data),
  updateTeam:      (id, data)   => request('PATCH',  `/teams/${id}`, data).then(j => j?.data?.doc ?? j?.data?.team ?? j?.data),
  deleteTeam:      (id)         => request('DELETE', `/teams/${id}`),
  addTeamMember:   (tid, userId) => request('POST',  `/teams/${tid}/members`, { userId }).then(j => j?.data?.team ?? j?.data),
  removeTeamMember:(tid, userId) => request('DELETE', `/teams/${tid}/members/${userId}`).then(j => j?.data?.team ?? j?.data),

  // ── Schedules ────────────────────────────────────────────────────────────────
  getMySchedule:      (projectId, weekStart) => {
    const params = new URLSearchParams();
    if (projectId) params.set('project_id', projectId);
    if (weekStart) params.set('week_start', weekStart);
    return request('GET', `/schedules/me?${params}`).then(j => j?.data?.schedule ?? null);
  },
  getProjectSchedules:(projectId, weekStart) => {
    const qs = weekStart ? `?week_start=${weekStart}` : '';
    return request('GET', `/schedules/project/${projectId}${qs}`).then(j => j?.data?.schedules ?? []);
  },
  upsertSchedule:     (data) => request('POST',  '/schedules', data).then(j => j?.data?.schedule ?? null),
  updateScheduleEntry:(id, day, shift_type) => request('PATCH', `/schedules/${id}/entry`, { day, shift_type }).then(j => j?.data?.schedule ?? null),
  deleteSchedule:     (id) => request('DELETE', `/schedules/${id}`),
};
