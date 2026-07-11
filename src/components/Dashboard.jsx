import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import '../dashboard.css';
import { projectService } from '../services/projectService';
import UserDashboard from './UserDashboard';
import { DndContext, DragOverlay, rectIntersection, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import CreateProjectModal  from './CreateProjectModal';
import AIBreakdownModal    from './AIBreakdownModal';
import EditSprintModal     from './EditSprintModal';
import DeleteSprintModal   from './DeleteSprintModal';
import ViewTaskModal       from './ViewTaskModal';
import CreateSprintModal   from './CreateSprintModal';
import CreateBacklogModal  from './CreateBacklogModal';
import EditBacklogModal    from './EditBacklogModal';
import CreateTaskModal     from './CreateTaskModal';
import AddMemberModal      from './AddMemberModal';
import ConfirmModal        from './ConfirmModal';
import ProjectDetailsModal from './ProjectDetailsModal';
import AddTeamModal        from './AddTeamModal';
import TeamDetailsModal    from './TeamDetailsModal';
import Toast, { useToast } from './Toast';
import Avatar from './Avatar';
import StockUsageConfirmModal from './StockUsageConfirmModal';
import { SystemAdmin } from '../services/aiOpsService';
import AssignTaskToSprintModal from "./AssignTaskToSprintModal";

// ─── helpers ───────────────────────────────────────────────────────────────────
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const normalizeStatus = (s = "") => {
  const l = s.toLowerCase().replace(/_/g, "").replace(/\s/g, "");
  if (l === "open" || l === "todo" || l === "") return "To Do";
  if (l === "inprogress") return "In Progress";
  if (l === "completed" || l === "done" || l === "closed") return "Completed";
  return s;
};

const STATUS_API = {
  "To Do": "todo",
  "In Progress": "in_progress",
  Completed: "completed",
};

const PRIORITY_STYLE = {
  high: { bg: "#FEE2E2", color: "#DC2626", label: "High" },
  medium: { bg: "#FEF3C7", color: "#D97706", label: "Medium" },
  low: { bg: "#D1FAE5", color: "#059669", label: "Low" },
};
const STATUS_STYLE = {
  "To Do": { bg: "#EEF1FD", color: "#534AB7" },
  "In Progress": { bg: "#FEF3C7", color: "#92400E" },
  Completed: { bg: "#D1FAE5", color: "#065F46" },
};
const SPRINT_STATUS_STYLE = {
  planned: { bg: "#EEF1FD", color: "#534AB7", label: "Planned" },
  active: { bg: "#D1FAE5", color: "#065F46", label: "Active" },
  completed: { bg: "#F3F4F6", color: "#6B7280", label: "Completed" },
};

const PriorityBadge = ({ priority = "medium" }) => {
  const s = PRIORITY_STYLE[priority?.toLowerCase()] ?? PRIORITY_STYLE.medium;
  return (
    <span
      style={{
        fontSize: "0.72rem",
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 20,
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
};
const StatusBadge = ({ status }) => {
  const n = normalizeStatus(status);
  const s = STATUS_STYLE[n] ?? { bg: "#F3F4F6", color: "#6B7280" };
  return (
    <span
      style={{
        fontSize: "0.72rem",
        fontWeight: 700,
        padding: "2px 9px",
        borderRadius: 20,
        background: s.bg,
        color: s.color,
      }}
    >
      {n}
    </span>
  );
};
const SprintBadge = ({ status = "planned" }) => {
  const s =
    SPRINT_STATUS_STYLE[status?.toLowerCase()] ?? SPRINT_STATUS_STYLE.planned;
  return (
    <span
      style={{
        fontSize: "0.72rem",
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 20,
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
};

const iconBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  borderRadius: 8,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#9CA3AF",
  transition: "background .15s, color .15s",
};

// ─── Schedule constants ────────────────────────────────────────────────────────
const SCHED_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHIFT_STYLE = {
  morning: {
    bg: "#FEF3C7",
    color: "#D97706",
    dot: "#F59E0B",
    label: "Morning",
  },
  afternoon: {
    bg: "#DBEAFE",
    color: "#2563EB",
    dot: "#3B82F6",
    label: "Afternoon",
  },
  night: { bg: "#EDE9FE", color: "#7C3AED", dot: "#8B5CF6", label: "Night" },
  off: { bg: "#F3F4F6", color: "#9CA3AF", dot: "#D1D5DB", label: "Off" },
};
const ShiftBadge = ({ type = "off", small = false }) => {
  const s = SHIFT_STYLE[type] ?? SHIFT_STYLE.off;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: small ? "0.68rem" : "0.75rem",
        fontWeight: 700,
        padding: small ? "2px 6px" : "3px 8px",
        borderRadius: 20,
        background: s.bg,
        color: s.color,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: small ? 6 : 7,
          height: small ? 6 : 7,
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
        }}
      />
      {s.label}
    </span>
  );
};

const Spinner = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 200,
      gap: 12,
    }}
  >
    <div
      style={{
        width: 34,
        height: 34,
        border: "3px solid #E9EBF0",
        borderTop: "3px solid #8A9FE8",
        borderRadius: "50%",
        animation: "spin .8s linear infinite",
      }}
    />
    <p style={{ color: "#9CA3AF", fontSize: "0.875rem" }}>Loading…</p>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const EmptyState = ({ icon, title, sub }) => (
  <div style={{ textAlign: "center", padding: "48px 16px" }}>
    <div
      style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}
    >
      {icon}
    </div>
    <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 4px" }}>
      {title}
    </p>
    {sub && (
      <p style={{ fontSize: "0.85rem", color: "#9CA3AF", margin: 0 }}>{sub}</p>
    )}
  </div>
);

const ErrorBanner = ({ msg, onRetry }) => (
  <div
    style={{
      background: "#FEF2F2",
      border: "1px solid #FECACA",
      borderRadius: 10,
      padding: "12px 16px",
      marginBottom: 16,
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}
  >
    <span>⚠️</span>
    <span
      style={{
        fontSize: "0.875rem",
        color: "#DC2626",
        fontWeight: 500,
        flex: 1,
      }}
    >
      {msg}
    </span>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          fontSize: "0.8rem",
          color: "#8A9FE8",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Retry
      </button>
    )}
  </div>
);

const ProjectSelector = ({ projects, value, onChange }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span
      style={{
        fontSize: "0.78rem",
        fontWeight: 600,
        color: "#6B7280",
        whiteSpace: "nowrap",
      }}
    >
      Project:
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "7px 12px",
        borderRadius: 8,
        border: "1px solid #E5E7EB",
        fontSize: "0.85rem",
        color: "#111827",
        background: "#fff",
        cursor: "pointer",
        minWidth: 180,
      }}
    >
      <option value="">— Select a project —</option>
      {projects.map((p) => (
        <option key={p._id} value={p._id}>
          {p.name}
        </option>
      ))}
    </select>
  </div>
);

// ─── DnD Kanban primitives ─────────────────────────────────────────────────────
const KanbanCard = ({
  task,
  col,
  onView,
  isDragging = false,
  isOverlay = false,
}) => {
  const assignees = task.assigned_to ?? [];
  return (
    <div
      className="ds-card"
      style={{
        padding: "12px 14px",
        border: `1px solid ${isDragging ? col.accent : "#E9EBF0"}`,
        background: "#fff",
        borderRadius: 10,
        boxShadow: isOverlay
          ? `0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(83,74,183,0.15)`
          : isDragging
            ? "none"
            : undefined,
        transform: isOverlay ? "rotate(2deg) scale(1.03)" : undefined,
        transition: isDragging ? "none" : "box-shadow .15s",
        userSelect: "none",
      }}
      onClick={!isDragging ? () => onView(task) : undefined}
    >
      <p
        style={{
          fontWeight: 600,
          fontSize: "0.875rem",
          color: "#111827",
          margin: "0 0 8px",
          lineHeight: 1.4,
        }}
        title={task.name}
      >
        {task.name?.length > 48 ? task.name.slice(0, 48) + "…" : task.name}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <PriorityBadge priority={task.priority} />
        {/* Assignee avatars */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {assignees.length === 0 ? (
            <span
              style={{
                fontSize: "0.68rem",
                color: "#D1D5DB",
                fontStyle: "italic",
              }}
            >
              Unassigned
            </span>
          ) : (
            assignees.slice(0, 3).map((u, i) => (
              <div
                key={u._id ?? i}
                title={u.name ?? "?"}
                style={{ marginLeft: i > 0 ? -7 : 0, zIndex: 10 - i }}
              >
                <Avatar photo={u.photo} name={u.name ?? "?"} size={22} />
              </div>
            ))
          )}
          {assignees.length > 3 && (
            <span
              style={{ fontSize: "0.68rem", color: "#9CA3AF", marginLeft: 4 }}
            >
              +{assignees.length - 3}
            </span>
          )}
        </div>
      </div>
      {task.sprint_id?.name && (
        <p
          style={{
            margin: "6px 0 0",
            fontSize: "0.7rem",
            color: "#8A9FE8",
            background: "#EEF1FD",
            padding: "1px 6px",
            borderRadius: 4,
            display: "inline-block",
          }}
        >
          {task.sprint_id.name}
        </p>
      )}
    </div>
  );
};

const DraggableCard = ({ task, col, onView }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task._id,
      data: { task, colKey: col.key },
    });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.35 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
        transition: isDragging ? "none" : "opacity .2s",
        outline: "none",
      }}
    >
      <KanbanCard
        task={task}
        col={col}
        onView={onView}
        isDragging={isDragging}
      />
    </div>
  );
};

const DroppableColumn = ({ col, tasks, onView }) => {
  const { isOver, setNodeRef } = useDroppable({ id: col.key });

  return (
    <div
      ref={setNodeRef}
      className="ds-card"
      style={{
        padding: 0,
        overflow: "hidden",
        minHeight: 320,
        transition: "box-shadow .2s, outline .15s",
        outline: isOver ? `2px dashed ${col.accent}` : "2px dashed transparent",
        outlineOffset: 3,
        boxShadow: isOver ? `0 0 0 4px ${col.accent}18` : undefined,
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: "14px 16px",
          background: isOver ? col.accent : col.bg,
          borderBottom: `2px solid ${col.accent}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "background .2s",
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: "0.9rem",
            color: isOver ? "#fff" : col.accent,
            transition: "color .2s",
          }}
        >
          {col.label}
        </span>
        <span
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            background: isOver ? "rgba(255,255,255,0.3)" : col.accent,
            color: "#fff",
            borderRadius: 20,
            padding: "1px 8px",
            transition: "background .2s",
          }}
        >
          {tasks.length}
        </span>
      </div>
      {/* Cards */}
      <div
        style={{
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          minHeight: 120,
        }}
      >
        {tasks.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 80,
              borderRadius: 8,
              border: `2px dashed ${isOver ? col.accent : "#E9EBF0"}`,
              transition: "border-color .2s, background .2s",
              background: isOver ? `${col.accent}08` : "transparent",
              padding: "16px 0",
            }}
          >
            <p
              style={{
                margin: 0,
                color: isOver ? col.accent : "#D1D5DB",
                fontSize: "0.82rem",
                fontWeight: isOver ? 600 : 400,
                transition: "color .2s",
              }}
            >
              {isOver ? "⬇ Drop here" : "No tasks"}
            </p>
          </div>
        ) : (
          tasks.map((t) => (
            <DraggableCard key={t._id} task={t} col={col} onView={onView} />
          ))
        )}
        {/* Drop zone at the bottom when there are already cards */}
        {tasks.length > 0 && isOver && (
          <div
            style={{
              height: 4,
              borderRadius: 99,
              background: col.accent,
              transition: "all .2s",
              margin: "4px 0",
            }}
          />
        )}
      </div>
    </div>
  );
};

// ─── Main Dashboard ─────────────────────────────────────────────────────────────
const Dashboard = ({ user }) => {
  // Non-admin users get their own tailored view
  if (user?.role !== "admin" && user?.role !== "manager")
    return <UserDashboard user={user} />;

  const isAdmin = user?.role === "admin" || user?.role === "manager";

  // ── toast notifications ──
  const { toasts, close: closeToast, success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [stockPrompt, setStockPrompt] = useState(null); // { taskName, items } | null

  // ── data state ──
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [backlogs, setBacklogs] = useState([]);
  const [tasksByBacklog, setTasksByBacklog] = useState({}); // { backlogId: Task[] }

  // Tracks the most-recently-requested project ID so stale fetches don't overwrite fresh data
  const currentFetchPid = useRef(null);

  // ── loading / error ──
  const [projLoading, setProjLoading] = useState(true);
  const [projError, setProjError] = useState(null);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);

  // ── ui state ──
  const [viewMode, setViewMode] = useState("landing"); // 'landing' | 'project'
  const [activeTab, setActiveTab] = useState("backlog");
  const [selectedProjId, setSelectedProjId] = useState("");
  const [expandedBacklogs, setExpandedBacklogs] = useState([]);
  const [expandedSprints, setExpandedSprints] = useState([]);
  const [taskSearch, setTaskSearch] = useState("");
  const [activeDragId, setActiveDragId] = useState(null);

  // ── schedule ──
  const [schedWeekOffset, setSchedWeekOffset] = useState(0);
  const [teamSchedules, setTeamSchedules] = useState([]);
  const [schedLoading, setSchedLoading] = useState(false);

  // ── modals ──
  const [modal, setModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { title, message, onConfirm }
  const [teamModal, setTeamModal] = useState(null); // null | { mode:'create' } | { mode:'edit', team }
  const [viewTeam, setViewTeam] = useState(null); // team object to view details

  // ── DnD sensors ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Maps column droppable key → status string
  const colStatusMap = {
    todo: "To Do",
    inprogress: "In Progress",
    completed: "Completed",
  };
  // Maps normalized status → column key (reverse lookup)
  const statusColMap = {
    "To Do": "todo",
    "In Progress": "inprogress",
    Completed: "completed",
  };

  // ─── computed ─────────────────────────────────────────────────────────────────
  const selectedProject = useMemo(
    () => projects.find((p) => p._id === selectedProjId),
    [projects, selectedProjId],
  );
  const allTasks = useMemo(
    () => Object.values(tasksByBacklog).flat(),
    [tasksByBacklog],
  );
  const activeSprints = useMemo(
    () => sprints.filter((s) => s.status === "active"),
    [sprints],
  );

  const stats = useMemo(
    () => ({
      totalProjects: projects.length,
      totalTasks: allTasks.length,
      activeSprints: activeSprints.length,
      completed: allTasks.filter(
        (t) => normalizeStatus(t.status) === "Completed",
      ).length,
    }),
    [projects, allTasks, activeSprints],
  );

  const kanban = useMemo(() => {
    const term = taskSearch.toLowerCase();
    const filtered = allTasks.filter(
      (t) => !term || t.name?.toLowerCase().includes(term),
    );
    return {
      todo: filtered.filter((t) => normalizeStatus(t.status) === "To Do"),
      inprogress: filtered.filter(
        (t) => normalizeStatus(t.status) === "In Progress",
      ),
      completed: filtered.filter(
        (t) => normalizeStatus(t.status) === "Completed",
      ),
    };
  }, [allTasks, taskSearch]);

  const activeDragTask = useMemo(
    () => (activeDragId ? allTasks.find((t) => t._id === activeDragId) : null),
    [activeDragId, allTasks],
  );

  // ─── Team schedule data ───────────────────────────────────────────────────────
  const teamSchedule = useMemo(() => {
    const members = selectedProject?.members ?? [];
    if (members.length === 0) return [];
    return members.map((member) => {
      const memberId = member._id ?? member;
      const memberTasks = allTasks.filter((t) => {
        const cid = t.created_by?._id ?? t.created_by;
        return cid === memberId;
      });
      const done = memberTasks.filter(
        (t) => normalizeStatus(t.status) === "Completed",
      ).length;
      const inProg = memberTasks.filter(
        (t) => normalizeStatus(t.status) === "In Progress",
      ).length;
      const todo = memberTasks.filter(
        (t) => normalizeStatus(t.status) === "To Do",
      ).length;
      const total = memberTasks.length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      return { member, memberTasks, done, inProg, todo, total, pct };
    });
  }, [selectedProject, allTasks]);

  // ─── API calls ────────────────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    try {
      setProjLoading(true);
      setProjError(null);
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (e) {
      setProjError(e.message);
    } finally {
      setProjLoading(false);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      setTeamsLoading(true);
      const data = await projectService.getTeams();
      setTeams(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load teams:", e.message);
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  const fetchProjectData = useCallback(async (pid) => {
    // Register this fetch as the "current" one
    currentFetchPid.current = pid;

    // Clear previous project data immediately — no stale tasks shown during load
    setSprints([]);
    setBacklogs([]);
    setTasksByBacklog({});
    if (!pid) return;

    try {
      setDataLoading(true);
      setDataError(null);
      const [sprintData, backlogData] = await Promise.all([
        projectService.getSprints(pid),
        projectService.getBacklogs(pid),
      ]);

      // Abort if a newer fetch has already been triggered for a different project
      if (currentFetchPid.current !== pid) return;

      // Fetch tasks for every backlog of THIS project in parallel
      const taskEntries = await Promise.all(
        backlogData.map(async (bl) => {
          try {
            const tasks = await projectService.getTasksByBacklog(bl._id);
            return [bl._id, tasks];
          } catch {
            return [bl._id, []];
          }
        }),
      );

      // Final stale check before committing task data
      if (currentFetchPid.current !== pid) return;

      setSprints(sprintData);
      setBacklogs(backlogData);
      // Completely replace task map — only this project's backlogs/tasks are kept
      setTasksByBacklog(Object.fromEntries(taskEntries));
      setExpandedBacklogs(backlogData.map((b) => b._id));
      setExpandedSprints(sprintData.map((s) => s._id));
    } catch (e) {
      if (currentFetchPid.current === pid) setDataError(e.message);
    } finally {
      if (currentFetchPid.current === pid) setDataLoading(false);
    }
  }, []);

  // ─── Schedule helpers ─────────────────────────────────────────────────────────
  const getSundayOfWeek = (offsetWeeks = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + offsetWeeks * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const fmtWeekLabel = (sunday) => {
    const sat = new Date(sunday);
    sat.setDate(sat.getDate() + 6);
    const o = { month: "short", day: "numeric" };
    return `${sunday.toLocaleDateString("en-US", o)} – ${sat.toLocaleDateString("en-US", o)}`;
  };

  const fetchTeamSchedules = useCallback(async (pid, weekOffset) => {
    if (!pid) {
      setTeamSchedules([]);
      return;
    }
    try {
      setSchedLoading(true);
      const sunday = (() => {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay() + weekOffset * 7);
        d.setHours(0, 0, 0, 0);
        return d;
      })();
      const weekStart = sunday.toISOString().slice(0, 10);
      const data = await projectService.getProjectSchedules(pid, weekStart);
      setTeamSchedules(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("fetchTeamSchedules:", e);
      setTeamSchedules([]);
    } finally {
      setSchedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);
  useEffect(() => {
    fetchProjectData(selectedProjId);
  }, [selectedProjId, fetchProjectData]);
  useEffect(() => {
    if (activeTab === "team")
      fetchTeamSchedules(selectedProjId, schedWeekOffset);
  }, [activeTab, selectedProjId, schedWeekOffset, fetchTeamSchedules]);

  const refreshProjectData = () => fetchProjectData(selectedProjId);

  // ─── Team handlers ────────────────────────────────────────────────────────────
  const handleCreateTeam = async (formData) => {
    try {
      const team = await projectService.createTeam(formData);
      setTeams((prev) => [team, ...prev]);
      toastSuccess(
        "Team Created!",
        `"${team.name}" has been created with ${(team.members ?? []).length} member${(team.members ?? []).length !== 1 ? "s" : ""}.`,
      );
    } catch (e) {
      toastError("Failed to Create Team", e.message);
      throw e; // re-throw so modal stays open
    }
  };

  const handleEditTeam = async (formData) => {
    try {
      const id = teamModal?.team?._id;
      const team = await projectService.updateTeam(id, formData);
      setTeams((prev) => prev.map((t) => (t._id === id ? team : t)));
      toastSuccess(
        "Team Updated!",
        `"${team.name}" has been saved successfully.`,
      );
    } catch (e) {
      toastError("Failed to Update Team", e.message);
      throw e; // re-throw so modal stays open
    }
  };

  const handleDeleteTeam = (team) => {
    setConfirmModal({
      title: "Delete Team",
      message: `Delete team "${team.name}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await projectService.deleteTeam(team._id);
          setTeams((prev) => prev.filter((t) => t._id !== team._id));
          toastSuccess("Team Deleted", `"${team.name}" has been removed.`);
        } catch (e) {
          toastError("Failed to Delete Team", e.message);
        }
      },
    });
  };

  // ─── handlers ─────────────────────────────────────────────────────────────────
  const closeModal = () => setModal(null);

  const handleCreateProject = async (formData) => {
    try {
      const p = await projectService.createProject({
        name: formData.name,
        description: formData.description,
      });
      await fetchProjects();
      closeModal();
      toastSuccess("Project Created!", `"${formData.name}" is ready.`);
    } catch (e) {
      toastError("Failed", e.message);
    }
  };

  const handleDeleteProject = (project) => {
    setConfirmModal({
      title: "Delete Project",
      message: `Are you sure you want to delete "${project.name}"? All its sprints, backlogs and tasks will be permanently removed.`,
      onConfirm: async () => {
        try {
          await projectService.deleteProject(project._id);
          if (selectedProjId === project._id) {
            setSelectedProjId("");
            setViewMode("landing");
          }
          await fetchProjects();
          toastSuccess(
            "Project Deleted",
            `"${project.name}" has been removed.`,
          );
        } catch (e) {
          toastError("Failed", e.message);
        }
      },
    });
  };

  const handleCreateSprint = async (formData) => {
    try {
      await projectService.createSprint(selectedProjId, {
        name: formData.name,
        sprint_goal: formData.goal,
        start_date: formData.startDate || undefined,
        end_date: formData.endDate || undefined,
        status: formData.status,
      });
      await refreshProjectData();
      closeModal();
      toastSuccess(
        "Sprint Created!",
        `"${formData.name}" added to this project.`,
      );
    } catch (e) {
      toastError("Failed", e.message);
    }
  };

  const handleEditSprint = async (formData) => {
    const sprint = modal?.data;
    if (!sprint) return;
    try {
      await projectService.updateSprint(selectedProjId, sprint._id, {
        name: formData.name,
        start_date: formData.startDate || undefined,
        end_date: formData.endDate || undefined,
        status: formData.status?.toLowerCase(),
      });
      await refreshProjectData();
      closeModal();
      toastSuccess("Sprint Updated", `"${formData.name}" saved.`);
    } catch (e) {
      toastError("Failed", e.message);
    }
  };

  const handleDeleteSprint = async (sprintId) => {
    try {
      await projectService.deleteSprint(selectedProjId, sprintId);
      await refreshProjectData();
      closeModal();
      toastSuccess("Sprint Deleted", "Sprint has been removed.");
    } catch (e) {
      toastError("Failed", e.message);
    }
  };

  const handleCreateBacklog = async (formData) => {
    try {
      await projectService.createBacklog(selectedProjId, {
        name: formData.name,
        backlog_goal: formData.goal,
        start_date: formData.startDate || undefined,
        end_date: formData.endDate || undefined,
        status: "open",
      });
      await refreshProjectData();
      closeModal();
      toastSuccess(
        "Backlog Created!",
        `"${formData.name}" added to this project.`,
      );
    } catch (e) {
      toastError("Failed", e.message);
    }
  };

  const handleDeleteBacklog = (backlog) => {
    setConfirmModal({
      title: "Delete Backlog",
      message: `Delete backlog "${backlog.name}"? All tasks inside it will also be removed.`,
      onConfirm: async () => {
        try {
          await projectService.deleteBacklog(selectedProjId, backlog._id);
          await refreshProjectData();
          toastSuccess(
            "Backlog Deleted",
            `"${backlog.name}" and its tasks have been removed.`,
          );
        } catch (e) {
          toastError("Failed", e.message);
        }
      },
    });
  };

  const handleEditBacklog = async (formData) => {
    const backlog = modal?.data;
    if (!backlog) return;
    try {
      await projectService.updateBacklog(selectedProjId, backlog._id, {
        name: formData.name,
        backlog_goal: formData.goal,
        start_date: formData.startDate || undefined,
        end_date: formData.endDate || undefined,
      });
      await refreshProjectData();
      closeModal();
      toastSuccess("Backlog Updated", `"${formData.name}" saved.`);
    } catch (e) {
      toastError("Failed", e.message);
    }
  };

  const handleCreateTask = async (formData) => {
    const { backlogId, name, description, priority, sprintId, assignedTo } =
      formData;
    try {
      await projectService.createTask(backlogId, {
        name,
        description,
        priority: priority.toLowerCase(),
        status: "todo",
        sprint_id: sprintId || undefined,
        assigned_to: assignedTo?.length ? assignedTo : undefined,
      });
      await refreshProjectData();
      closeModal();
      toastSuccess("Task Created!", `"${name}" added successfully.`);
    } catch (e) {
      toastError("Failed", e.message);
    }
  };

  const handleUpdateTaskStatus = async (task, newStatus) => {
    const backlogId = task.backlog_id?._id ?? task.backlog_id;
    const apiStatus = STATUS_API[newStatus] ?? newStatus;
    try {
      await projectService.updateTask(backlogId, task._id, {
        status: apiStatus,
      });
      setTasksByBacklog((prev) => {
        const bTasks = (prev[backlogId] ?? []).map((t) =>
          t._id === task._id ? { ...t, status: newStatus } : t,
        );
        return { ...prev, [backlogId]: bTasks };
      });

      // "Automatic Stock Deduction" — best-effort check, never blocks completion.
      if (newStatus === 'Completed' && user?.company_id) {
        SystemAdmin.extractStockUsage({ taskId: task._id, companyId: user.company_id })
          .then((result) => {
            const usedItems = result?.used_items ?? [];
            if (usedItems.length > 0) setStockPrompt({ taskName: task.name, items: usedItems });
          })
          .catch((err) => console.warn('Stock usage check skipped:', err.message));
      }
    } catch (e) {
      toastError("Failed to update status", e.message);
    }
  };

  const handleDeleteTask = (task) => {
    setConfirmModal({
      title: "Delete Task",
      message: `Delete task "${task.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        const backlogId = task.backlog_id?._id ?? task.backlog_id;
        try {
          await projectService.deleteTask(backlogId, task._id);
          setTasksByBacklog((prev) => ({
            ...prev,
            [backlogId]: (prev[backlogId] ?? []).filter(
              (t) => t._id !== task._id,
            ),
          }));
          toastSuccess("Task Deleted", `"${task.name}" has been removed.`);
        } catch (e) {
          toastError("Failed", e.message);
        }
      },
    });
  };

  const handleMembersChange = (updatedProject) => {
    if (!updatedProject) return;
    setProjects((prev) =>
      prev.map((p) =>
        p._id === updatedProject._id ? { ...p, ...updatedProject } : p,
      ),
    );
  };

  // Update a task's assignees (admin)
  const handleUpdateTaskAssignees = async (taskId, backlogId, newIds) => {
    const updated = await projectService.updateTask(backlogId, taskId, {
      assigned_to: newIds,
    });
    // Patch local state
    setTasksByBacklog((prev) => ({
      ...prev,
      [backlogId]: (prev[backlogId] ?? []).map((t) =>
        t._id === taskId
          ? { ...t, ...(updated ?? { assigned_to: newIds }) }
          : t,
      ),
    }));
    // Keep modal data fresh
    if (modal?.data?._id === taskId) {
      setModal((prev) => ({
        ...prev,
        data: { ...prev.data, ...(updated ?? { assigned_to: newIds }) },
      }));
    }
  };

  const handleShiftChange = async (member, day, newShift) => {
    const sunday = getSundayOfWeek(schedWeekOffset);
    const weekStart = sunday.toISOString().slice(0, 10);
    const memberId = member._id ?? member;

    const existing = teamSchedules.find((s) => {
      const uid = s.user_id?._id ?? s.user_id;
      return String(uid) === String(memberId);
    });

    // Optimistic UI update
    setTeamSchedules((prev) => {
      if (existing) {
        return prev.map((s) => {
          const uid = s.user_id?._id ?? s.user_id;
          if (String(uid) !== String(memberId)) return s;
          return {
            ...s,
            entries: s.entries.map((e) =>
              e.day === day ? { ...e, shift_type: newShift } : e,
            ),
          };
        });
      }
      // Create a ghost schedule locally for the optimistic render
      const ghostEntries = SCHED_DAYS.map((d, i) => {
        const date = new Date(sunday);
        date.setDate(date.getDate() + i);
        return {
          day: d,
          date: date.toISOString(),
          shift_type: d === day ? newShift : "off",
        };
      });
      return [
        ...prev,
        {
          _id: `temp_${memberId}`,
          user_id: member,
          project_id: selectedProjId,
          week_start: weekStart,
          entries: ghostEntries,
        },
      ];
    });

    try {
      if (existing) {
        const updated = await projectService.updateScheduleEntry(
          existing._id,
          day,
          newShift,
        );
        if (updated)
          setTeamSchedules((prev) =>
            prev.map((s) => (s._id === existing._id ? updated : s)),
          );
      } else {
        const entries = SCHED_DAYS.map((d, i) => {
          const date = new Date(sunday);
          date.setDate(date.getDate() + i);
          return {
            day: d,
            date: date.toISOString(),
            shift_type: d === day ? newShift : "off",
          };
        });
        const created = await projectService.upsertSchedule({
          user_id: memberId,
          project_id: selectedProjId,
          week_start: weekStart,
          entries,
        });
        if (created) {
          setTeamSchedules((prev) => [
            ...prev.filter((s) => s._id !== `temp_${memberId}`),
            created,
          ]);
        }
      }
    } catch (e) {
      alert(`Failed to update schedule: ${e.message}`);
      // Revert optimistic update
      fetchTeamSchedules(selectedProjId, schedWeekOffset);
    }
  };

  // ─── DnD handlers ──────────────────────────────────────────────────────────────
  const handleDragStart = (event) => setActiveDragId(event.active.id);

  const handleDragEnd = async (event) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || !active) return;

    const task = active.data.current?.task;
    if (!task) return;

    // over.id is EITHER a column key ('todo'/'inprogress'/'completed')
    // OR a task._id when dropped directly on top of another card.
    // In both cases we resolve the target column.
    let targetColKey = over.id;

    if (!colStatusMap[targetColKey]) {
      // over.id is a task _id — find which column that task lives in
      const overTask = allTasks.find((t) => t._id === over.id);
      if (overTask) {
        targetColKey = statusColMap[normalizeStatus(overTask.status)];
      }
    }

    if (!targetColKey || !colStatusMap[targetColKey]) return;

    const newStatus = colStatusMap[targetColKey];
    if (normalizeStatus(task.status) === newStatus) return; // same column — no-op

    await handleUpdateTaskStatus(task, newStatus);
  };

  // ─── render helpers ───────────────────────────────────────────────────────────
  const toggleBacklog = (id) =>
    setExpandedBacklogs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const toggleSprint = (id) =>
    setExpandedSprints((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const noProjectSelected = (
    <EmptyState
      icon="👆"
      title="Select a project"
      sub="Choose a project from the dropdown above to get started"
    />
  );

  // Compute per-project stats for the details modal
  const getProjectStats = (pid) => {
    const pSprints = sprints.filter(
      (s) => s.project_id === pid || s.project?._id === pid,
    );
    const pBacklogs = backlogs;
    const pTasks = allTasks;
    return {
      sprints: pSprints.length || sprints.length,
      backlogs: pBacklogs.length,
      tasks: pTasks.length,
      completed: pTasks.filter((t) => normalizeStatus(t.status) === "Completed")
        .length,
    };
  };

  // helper: enter a specific project
  const enterProject = (projectId, tab = "backlog") => {
    setSelectedProjId(projectId);
    setActiveTab(tab);
    setViewMode("project");
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // LANDING PAGE — all projects + teams overview
  // ══════════════════════════════════════════════════════════════════════════════
  const renderLanding = () => (
    <>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "#111827",
              margin: "0 0 4px",
            }}
          >
            Dashboard
          </h1>
          <p style={{ color: "#9CA3AF", fontSize: "0.85rem", margin: 0 }}>
            Overview of all your projects and teams
          </p>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="ds-btn ds-btn-secondary"
              onClick={() => setTeamModal({ mode: "create" })}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              New Team
            </button>
            <button
              className="ds-btn ds-btn-primary"
          onClick={() => setModal({ type: "createProject" })}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Project
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="landing-stats-grid" style={{ gap: 14, marginBottom: 28 }}>
        {[
          {
            label: "Total Projects",
            value: stats.totalProjects,
            color: "#534AB7",
            bg: "#EEF1FD",
            svg: (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#534AB7">
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
              </svg>
            ),
          },
          {
            label: "Total Teams",
            value: teams.length,
            color: "#534AB7",
            bg: "#EEF1FD",
            svg: (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#534AB7">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            ),
          },
          {
            label: "Active Sprints",
            value: stats.activeSprints,
            color: "#534AB7",
            bg: "#EEF1FD",
            svg: (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#534AB7">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            ),
          },
          {
            label: "Completed Tasks",
            value: stats.completed,
            color: "#534AB7",
            bg: "#EEF1FD",
            svg: (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="#534AB7">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            ),
          },
        ].map((c) => (
          <div
            key={c.label}
            className="ds-card"
            style={{
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: c.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {c.svg}
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {c.label}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "1.7rem",
                  fontWeight: 800,
                  color: c.color,
                  lineHeight: 1.1,
                }}
              >
                {c.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Projects Overview */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "#111827",
              margin: 0,
            }}
          >
            Projects Overview
            <span
              style={{
                marginLeft: 8,
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#8A9FE8",
                background: "#EEF1FD",
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              {projects.length}
            </span>
          </h2>
        </div>

        {projLoading ? (
          <Spinner />
        ) : projError ? (
          <ErrorBanner msg={projError} onRetry={fetchProjects} />
        ) : projects.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" width="40" height="40" fill="#534AB7">
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
              </svg>
            }
            title="No projects yet"
            sub={
              isAdmin
                ? 'Click "New Project" to create your first project'
                : "No projects available"
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {projects.map((p) => {
              /* per-card task stats need project data — use cached allTasks only if this project is already loaded */
              const cardMembers = p.members ?? [];
              return (
                <div
                  key={p._id}
                  className="ds-card"
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                    transition: "box-shadow .15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(83,74,183,0.10)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
                >
                  {/* Project icon */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "linear-gradient(135deg,#8A9FE8,#534AB7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + description */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: "0 0 2px",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "#111827",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {p.name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.78rem",
                        color: "#9CA3AF",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {p.description || "No description"}
                    </p>
                  </div>

                  {/* Team avatars */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {cardMembers.length === 0 ? (
                      <span style={{ fontSize: "0.75rem", color: "#D1D5DB" }}>
                        No members
                      </span>
                    ) : (
                      <>
                        {cardMembers
                          .filter(Boolean)
                          .slice(0, 5)
                          .map((m, i) => (
                            <div
                              key={m._id ?? i}
                              title={m.name ?? "?"}
                              style={{
                                marginLeft: i > 0 ? -8 : 0,
                                zIndex: 10 - i,
                              }}
                            >
                              <Avatar
                                photo={m.photo}
                                name={m.name ?? "?"}
                                size={28}
                              />
                            </div>
                          ))}
                        {cardMembers.length > 5 && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: "0.72rem",
                              color: "#9CA3AF",
                            }}
                          >
                            +{cardMembers.length - 5}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Created date */}
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#9CA3AF",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {fmt(p.createdAt)}
                  </span>

                  {/* Action buttons */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <button
                      title="View Details"
                      onClick={() => {
                        setSelectedProjId(p._id);
                        setModal({ type: "projectDetails", data: p });
                      }}
                      style={{ ...iconBtn }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#EEF1FD";
                        e.currentTarget.style.color = "#534AB7";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "";
                        e.currentTarget.style.color = "#9CA3AF";
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </button>
                    {isAdmin && (
                      <button
                        title="Manage Team"
                        onClick={() => {
                          setSelectedProjId(p._id);
                          setModal({ type: "manageTeam", data: p });
                        }}
                        style={{ ...iconBtn }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#D1FAE5";
                          e.currentTarget.style.color = "#065F46";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "";
                          e.currentTarget.style.color = "#9CA3AF";
                        }}
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        title="Delete Project"
                        onClick={() => handleDeleteProject(p)}
                        style={{ ...iconBtn }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#FEF2F2";
                          e.currentTarget.style.color = "#EF4444";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "";
                          e.currentTarget.style.color = "#9CA3AF";
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                        </svg>
                      </button>
                    )}
                    {/* Enter project */}
                    <button
                      onClick={() => enterProject(p._id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 14px",
                        borderRadius: 8,
                        border: "none",
                        background: "#534AB7",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        transition: "background .15s",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#4338CA")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#534AB7")
                      }
                    >
                      Open
                      <svg
                        viewBox="0 0 24 24"
                        width="13"
                        height="13"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Teams Overview ── */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "#111827",
              margin: 0,
            }}
          >
            Teams Overview
            <span
              style={{
                marginLeft: 8,
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#0891B2",
                background: "#E0F2FE",
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              {teams.length}
            </span>
          </h2>
          {isAdmin && (
            <button
              className="ds-btn ds-btn-secondary"
              style={{ fontSize: "0.8rem", padding: "6px 12px" }}
              onClick={() => setTeamModal({ mode: "create" })}
            >
              <svg
                viewBox="0 0 24 24"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Team
            </button>
          )}
        </div>

        {teamsLoading ? (
          <Spinner />
        ) : teams.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" width="40" height="40" fill="#534AB7">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            }
            title="No teams yet"
            sub={
              isAdmin
                ? 'Click "Add Team" to create your first team'
                : "No teams have been created yet"
            }
          />
        ) : (
          <div className="landing-teams-grid" style={{ gap: 14 }}>
            {teams.map((team) => {
              const members = team.members ?? [];
              return (
                <div
                  key={team._id}
                  className="ds-card"
                  style={{
                    padding: "18px 20px",
                    transition: "box-shadow .15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(8,145,178,0.10)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
                >
                  {/* Card header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: "linear-gradient(135deg,#06B6D4,#0891B2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                          fontWeight: 800,
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {(team.name ?? "T").charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            color: "#111827",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            maxWidth: 160,
                          }}
                        >
                          {team.name}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.72rem",
                            color: "#9CA3AF",
                          }}
                        >
                          {members.length} member
                          {members.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Action icons */}
                    {isAdmin && (
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button
                          title="Edit team"
                          onClick={() => setTeamModal({ mode: "edit", team })}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: "#9CA3AF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all .15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#EEF1FD";
                            e.currentTarget.style.color = "#534AB7";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "";
                            e.currentTarget.style.color = "#9CA3AF";
                          }}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          title="Delete team"
                          onClick={() => handleDeleteTeam(team)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: "#9CA3AF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all .15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#FEF2F2";
                            e.currentTarget.style.color = "#EF4444";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "";
                            e.currentTarget.style.color = "#9CA3AF";
                          }}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {team.description && (
                    <p
                      style={{
                        margin: "0 0 10px",
                        fontSize: "0.78rem",
                        color: "#6B7280",
                        lineHeight: 1.5,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {team.description}
                    </p>
                  )}

                  {/* Member avatars */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 14,
                      minHeight: 30,
                    }}
                  >
                    {members.length === 0 ? (
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "#D1D5DB",
                          fontStyle: "italic",
                        }}
                      >
                        No members yet
                      </span>
                    ) : (
                      <>
                        {members
                          .filter((m) => m && m.user)
                          .slice(0, 7)
                          .map((m, i) => {
                            const u = m.user;
                            return (
                              <div
                                key={u._id ?? i}
                                title={u.name ?? "?"}
                                style={{
                                  marginLeft: i > 0 ? -8 : 0,
                                  zIndex: 10 - i,
                                  border: "2px solid #fff",
                                  borderRadius: "50%",
                                }}
                              >
                                <Avatar
                                  photo={u.photo}
                                  name={u.name ?? "?"}
                                  size={30}
                                />
                              </div>
                            );
                          })}
                        {members.length > 7 && (
                          <div
                            style={{
                              marginLeft: 4,
                              fontSize: "0.72rem",
                              color: "#9CA3AF",
                              fontWeight: 600,
                            }}
                          >
                            +{members.length - 7}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Created by + date + view button */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: 10,
                      borderTop: "1px solid #F3F4F6",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.7rem", color: "#9CA3AF" }}>
                        By {team.created_by?.name ?? "Admin"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "#D1D5DB",
                          margin: "0 6px",
                        }}
                      >
                        ·
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "#9CA3AF" }}>
                        {fmt(team.createdAt)}
                      </span>
                    </div>
                    <button
                      onClick={() => setViewTeam(team)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#0891B2",
                        background: "#E0F2FE",
                        border: "none",
                        borderRadius: 8,
                        padding: "5px 11px",
                        cursor: "pointer",
                        transition: "background .15s, color .15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#0891B2";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#E0F2FE";
                        e.currentTarget.style.color = "#0891B2";
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="12"
                        height="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // TAB: OVERVIEW (kept for backwards compat, not used directly)
  // ══════════════════════════════════════════════════════════════════════════════
  const renderOverview = () => (
    <>
      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Total Projects",
            value: stats.totalProjects,
            icon: "🗂️",
            color: "#534AB7",
          },
          {
            label: "Total Tasks",
            value: stats.totalTasks,
            icon: "📋",
            color: "#D97706",
          },
          {
            label: "Active Sprints",
            value: stats.activeSprints,
            icon: "🚀",
            color: "#059669",
          },
          {
            label: "Completed Tasks",
            value: stats.completed,
            icon: "✅",
            color: "#6B7280",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="ds-card"
            style={{ padding: "20px 24px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    margin: "0 0 10px",
                  }}
                >
                  {card.label}
                </p>
                <p
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: card.color,
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {card.value}
                </p>
              </div>
              <span style={{ fontSize: "1.5rem", opacity: 0.7 }}>
                {card.icon}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Projects table */}
      <div className="ds-card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #E9EBF0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#111827",
                margin: "0 0 2px",
              }}
            >
              All Projects
            </h2>
            <p style={{ fontSize: "0.78rem", color: "#9CA3AF", margin: 0 }}>
              {projects.length} project{projects.length !== 1 ? "s" : ""} in
              total
            </p>
          </div>
          {isAdmin && (
            <button
              className="ds-btn ds-btn-primary"
              onClick={() => setModal({ type: "createProject" })}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Project
            </button>
          )}
        </div>

        {projLoading ? (
          <Spinner />
        ) : projError ? (
          <ErrorBanner msg={projError} onRetry={fetchProjects} />
        ) : projects.length === 0 ? (
          <EmptyState
            icon="🗂️"
            title="No projects yet"
            sub={
              isAdmin
                ? 'Click "New Project" to get started'
                : "No projects available"
            }
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E9EBF0" }}>
                  {[
                    "Project Name",
                    "Description",
                    "Team",
                    "Created At",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 20px",
                        textAlign: "left",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "#9CA3AF",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr
                    key={p._id}
                    style={{
                      borderBottom: "1px solid #E9EBF0",
                      transition: "background .15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F9FAFB")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "")
                    }
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background:
                              "linear-gradient(135deg,#8A9FE8,#6B82D8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.85rem",
                            fontWeight: 800,
                            color: "#fff",
                            flexShrink: 0,
                          }}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedProjId(p._id);
                            setActiveTab("backlog");
                          }}
                          style={{
                            fontWeight: 700,
                            color: "#111827",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            textAlign: "left",
                            padding: 0,
                            transition: "color .15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#534AB7")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#111827")
                          }
                        >
                          {p.name}
                        </button>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        fontSize: "0.85rem",
                        color: "#6B7280",
                        maxWidth: 200,
                      }}
                    >
                      <span
                        title={p.description}
                        style={{
                          display: "block",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          maxWidth: 180,
                        }}
                      >
                        {p.description}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: -4,
                        }}
                      >
                        {(p.members ?? [])
                          .filter(Boolean)
                          .slice(0, 4)
                          .map((m, i) => (
                            <div
                              key={m._id ?? i}
                              title={m.name ?? ""}
                              style={{
                                marginLeft: i > 0 ? -8 : 0,
                                zIndex: 10 - i,
                              }}
                            >
                              <Avatar
                                photo={m.photo}
                                name={m.name ?? "?"}
                                size={26}
                              />
                            </div>
                          ))}
                        {(p.members ?? []).length > 4 && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "#9CA3AF",
                              marginLeft: 6,
                            }}
                          >
                            +{(p.members ?? []).length - 4}
                          </span>
                        )}
                        {(p.members ?? []).length === 0 && (
                          <span
                            style={{ fontSize: "0.78rem", color: "#D1D5DB" }}
                          >
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        fontSize: "0.82rem",
                        color: "#9CA3AF",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmt(p.createdAt)}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {/* Details */}
                        <button
                          onClick={() => {
                            setSelectedProjId(p._id);
                            setModal({ type: "projectDetails", data: p });
                          }}
                          style={{ ...iconBtn, color: "#8A9FE8" }}
                          title="Project details"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#EEF1FD";
                            e.currentTarget.style.color = "#534AB7";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "";
                            e.currentTarget.style.color = "#8A9FE8";
                          }}
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                        </button>
                        {/* Manage team */}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setSelectedProjId(p._id);
                              setModal({ type: "manageTeam", data: p });
                            }}
                            style={{ ...iconBtn, color: "#059669" }}
                            title="Manage team"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#D1FAE5";
                              e.currentTarget.style.color = "#065F46";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "";
                              e.currentTarget.style.color = "#059669";
                            }}
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          </button>
                        )}
                        {/* View sprints */}
                        <button
                          onClick={() => {
                            setSelectedProjId(p._id);
                            setActiveTab("sprint");
                          }}
                          style={{ ...iconBtn, color: "#D97706" }}
                          title="View sprints"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#FEF3C7";
                            e.currentTarget.style.color = "#92400E";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "";
                            e.currentTarget.style.color = "#D97706";
                          }}
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteProject(p)}
                            style={{ ...iconBtn, color: "#EF4444" }}
                            title="Delete project"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#FEF2F2";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "";
                            }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // TAB: BACKLOG
  // ══════════════════════════════════════════════════════════════════════════════
  const renderBacklog = () => (
    <>
      {isAdmin && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 20 }}>
          <button className="ds-btn ds-btn-secondary" onClick={() => setModal({ type: 'aiBreakdown' })}>
            ✨ AI Breakdown
          </button>
          <button
            className="ds-btn ds-btn-primary"
            onClick={() => setModal({ type: "createBacklog" })}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Backlog
          </button>
        </div>
      )}

      {dataLoading ? (
        <Spinner />
      ) : dataError ? (
        <ErrorBanner msg={dataError} onRetry={refreshProjectData} />
      ) : backlogs.length === 0 ? (
        <EmptyState
          icon="📂"
          title="No backlogs yet"
          sub={
            isAdmin
              ? 'Click "Add Backlog" to create one'
              : "No backlogs in this project"
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {backlogs.map((bl) => (
            <div
              key={bl._id}
              className="ds-card"
              style={{ padding: 0, overflow: "hidden" }}
            >
              {/* Backlog header */}
              <div
                style={{
                  padding: "14px 20px",
                  background: "#F9FAFB",
                  borderBottom: "1px solid #E9EBF0",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                }}
                onClick={() => toggleBacklog(bl._id)}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="2.5"
                  style={{
                    transform: expandedBacklogs.includes(bl._id)
                      ? "rotate(90deg)"
                      : "rotate(0)",
                    transition: "transform .2s",
                    flexShrink: 0,
                  }}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontWeight: 700,
                      color: "#111827",
                      fontSize: "0.9rem",
                    }}
                  >
                    {bl.name}
                  </span>
                  {bl.backlog_goal && (
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "#9CA3AF",
                        marginLeft: 10,
                      }}
                    >
                      {bl.backlog_goal}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#6B7280",
                    background: "#EEF1FD",
                    borderRadius: 20,
                    padding: "2px 10px",
                    flexShrink: 0,
                  }}
                >
                  {(tasksByBacklog[bl._id] ?? []).length} tasks
                </span>
                <div
                  style={{ display: "flex", gap: 6 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isAdmin && (
                    <button
                      className="ds-btn ds-btn-primary"
                      onClick={() => setModal({ type: "createTask", data: { backlogId: bl._id } })}
                    >
                      + Task
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      style={{ ...iconBtn, color: "#4F46E5" }}
                      title="Edit backlog"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#EEF2FF";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "";
                      }}
                      onClick={() => setModal({ type: "editBacklog", data: bl })}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      style={{ ...iconBtn, color: "#EF4444" }}
                      title="Delete backlog"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#FEF2F2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "";
                      }}
                      onClick={() => handleDeleteBacklog(bl)}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Backlog tasks */}
              {expandedBacklogs.includes(bl._id) &&
                (() => {
                  const tasks = tasksByBacklog[bl._id] ?? [];
                  return tasks.length === 0 ? (
                    <div
                      style={{
                        padding: "24px",
                        textAlign: "center",
                        color: "#9CA3AF",
                        fontSize: "0.85rem",
                      }}
                    >
                      No tasks in this backlog yet
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <thead>
                          <tr style={{ borderBottom: "1px solid #E9EBF0" }}>
                            {[
                              "#",
                              "Task Name",
                              "Priority",
                              "Status",
                              "Sprint",
                              "Assigned To",
                              "Actions",
                            ].map((h) => (
                              <th
                                key={h}
                                style={{
                                  padding: "10px 16px",
                                  textAlign: "left",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  color: "#9CA3AF",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.06em",
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map((t, i) => (
                            <tr
                              key={t._id}
                              style={{
                                borderBottom: "1px solid #F3F4F6",
                                transition: "background .15s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#F9FAFB")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "")
                              }
                            >
                              <td
                                style={{
                                  padding: "10px 16px",
                                  fontSize: "0.78rem",
                                  color: "#9CA3AF",
                                  fontWeight: 600,
                                }}
                              >
                                {i + 1}
                              </td>
                              <td
                                style={{
                                  padding: "10px 16px",
                                  fontWeight: 600,
                                  fontSize: "0.875rem",
                                  color: "#111827",
                                  maxWidth: 220,
                                }}
                              >
                                <span
                                  title={t.name}
                                  style={{
                                    display: "block",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                    textOverflow: "ellipsis",
                                    maxWidth: 200,
                                  }}
                                >
                                  {t.name}
                                </span>
                              </td>
                              <td style={{ padding: "10px 16px" }}>
                                <PriorityBadge priority={t.priority} />
                              </td>
                              <td style={{ padding: "10px 16px" }}>
                                <StatusBadge status={t.status} />
                              </td>
                              <td
                                style={{
                                  padding: "10px 16px",
                                  fontSize: "0.82rem",
                                  color: "#6B7280",
                                }}
                              >
                                {t.sprint_id?.name ?? (
                                  <span style={{ color: "#D1D5DB" }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: "10px 16px" }}>
                                {(t.assigned_to ?? []).length === 0 ? (
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#D1D5DB",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    Unassigned
                                  </span>
                                ) : (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    {(t.assigned_to ?? [])
                                      .slice(0, 3)
                                      .map((u, i) => (
                                        <div
                                          key={u._id ?? i}
                                          title={u.name ?? "?"}
                                          style={{
                                            marginLeft: i > 0 ? -6 : 0,
                                            zIndex: 10 - i,
                                          }}
                                        >
                                          <Avatar
                                            photo={u.photo}
                                            name={u.name ?? "?"}
                                            size={24}
                                          />
                                        </div>
                                      ))}
                                    {(t.assigned_to ?? []).length > 3 && (
                                      <span
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#9CA3AF",
                                          marginLeft: 5,
                                        }}
                                      >
                                        +{t.assigned_to.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: "10px 16px" }}>
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button
                                    style={{ ...iconBtn }}
                                    title="View"
                                    onClick={() =>
                                      setModal({ type: "viewTask", data: t })
                                    }
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background =
                                        "#EEF1FD";
                                      e.currentTarget.style.color = "#534AB7";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "";
                                      e.currentTarget.style.color = "#9CA3AF";
                                    }}
                                  >
                                    <svg
                                      width="15"
                                      height="15"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.2"
                                    >
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                  </button>
                                  {isAdmin && (
                                    <button
                                      style={{ ...iconBtn }}
                                      title="Delete"
                                      onClick={() => handleDeleteTask(t)}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background =
                                          "#FEF2F2";
                                        e.currentTarget.style.color = "#EF4444";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "";
                                        e.currentTarget.style.color = "#9CA3AF";
                                      }}
                                    >
                                      <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                      >
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                        <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
            </div>
          ))}
        </div>
      )}
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // TAB: SPRINT PLANNING
  // ══════════════════════════════════════════════════════════════════════════════
  const renderSprintPlanning = () => (
    <>
      {isAdmin && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 20,
          }}
        >
          <button
            className="ds-btn ds-btn-primary"
            onClick={() => setModal({ type: "createSprint" })}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Sprint
          </button>
        </div>
      )}

      {dataLoading ? (
        <Spinner />
      ) : dataError ? (
        <ErrorBanner msg={dataError} onRetry={refreshProjectData} />
      ) : sprints.length === 0 ? (
        <EmptyState
          icon="🚀"
          title="No sprints yet"
          sub={
            isAdmin
              ? 'Click "Add Sprint" to create one'
              : "No sprints in this project"
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sprints.map((sp) => {
            const sprintTasks = allTasks.filter(
              (t) => t.sprint_id?._id === sp._id || t.sprint_id === sp._id,
            );
            const spTodo = sprintTasks.filter(
              (t) => normalizeStatus(t.status) === "To Do",
            ).length;
            const spInProg = sprintTasks.filter(
              (t) => normalizeStatus(t.status) === "In Progress",
            ).length;
            const spDone = sprintTasks.filter(
              (t) => normalizeStatus(t.status) === "Completed",
            ).length;
            const spTotal = sprintTasks.length;
            const spPct = spTotal ? Math.round((spDone / spTotal) * 100) : 0;

            return (
              <div
                key={sp._id}
                className="ds-card"
                style={{ padding: 0, overflow: "hidden" }}
              >
                {/* Sprint header */}
                <div
                  style={{
                    padding: "14px 20px",
                    background: "#F9FAFB",
                    borderBottom: "1px solid #E9EBF0",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                  }}
                  onClick={() => toggleSprint(sp._id)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="#9CA3AF"
                    strokeWidth="2.5"
                    style={{
                      transform: expandedSprints.includes(sp._id)
                        ? "rotate(90deg)"
                        : "rotate(0)",
                      transition: "transform .2s",
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#111827",
                        fontSize: "0.9rem",
                      }}
                    >
                      {sp.name}
                    </span>
                    <SprintBadge status={sp.status} />
                    {(sp.start_date || sp.end_date) && (
                      <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                        {fmt(sp.start_date)} → {fmt(sp.end_date)}
                      </span>
                    )}
                  </div>
                  {/* Mini progress */}
                  {spTotal > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ display: "flex", gap: 4 }}>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "#534AB7",
                            fontWeight: 700,
                            background: "#EEF1FD",
                            padding: "1px 6px",
                            borderRadius: 4,
                          }}
                        >
                          {spTodo} Todo
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "#92400E",
                            fontWeight: 700,
                            background: "#FEF3C7",
                            padding: "1px 6px",
                            borderRadius: 4,
                          }}
                        >
                          {spInProg} In Progress
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "#065F46",
                            fontWeight: 700,
                            background: "#D1FAE5",
                            padding: "1px 6px",
                            borderRadius: 4,
                          }}
                        >
                          {spDone} Done
                        </span>
                      </div>
                      <div
                        style={{
                          width: 60,
                          height: 6,
                          background: "#E9EBF0",
                          borderRadius: 99,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${spPct}%`,
                            background:
                              "linear-gradient(90deg,#534AB7,#3ECFAA)",
                            borderRadius: 99,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "#059669",
                        }}
                      >
                        {spPct}%
                      </span>
                    </div>
                  )}
                  <div
                    style={{ display: "flex", gap: 6 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isAdmin && (
                      <button
                        className="ds-btn ds-btn-primary"
                        style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                        onClick={() =>
                          setModal({
                            type: "assignToSprint",
                            data: sp,
                          })
                        }
                      >
                        + Task
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        className="ds-btn ds-btn-secondary"
                        style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                        onClick={() =>
                          setModal({ type: "editSprint", data: sp })
                        }
                      >
                        Edit
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        style={{ ...iconBtn, color: "#EF4444" }}
                        title="Delete sprint"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#FEF2F2";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "";
                        }}
                        onClick={() =>
                          setModal({ type: "deleteSprint", data: sp })
                        }
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sprint expanded: mini kanban columns */}
                {expandedSprints.includes(sp._id) &&
                  (sprintTasks.length === 0 ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#9CA3AF",
                        fontSize: "0.85rem",
                      }}
                    >
                      No tasks assigned to this sprint
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3,1fr)",
                        gap: 12,
                        padding: 16,
                      }}
                    >
                      {[
                        {
                          label: "Todo",
                          tasks: sprintTasks.filter(
                            (t) => normalizeStatus(t.status) === "To Do",
                          ),
                          accent: "#534AB7",
                          bg: "#EEF1FD",
                        },
                        {
                          label: "In Progress",
                          tasks: sprintTasks.filter(
                            (t) => normalizeStatus(t.status) === "In Progress",
                          ),
                          accent: "#D97706",
                          bg: "#FEF9C3",
                        },
                        {
                          label: "Done",
                          tasks: sprintTasks.filter(
                            (t) => normalizeStatus(t.status) === "Completed",
                          ),
                          accent: "#059669",
                          bg: "#D1FAE5",
                        },
                      ].map((col) => (
                        <div
                          key={col.label}
                          style={{
                            background: "#FAFAFA",
                            border: "1px solid #E9EBF0",
                            borderRadius: 10,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              padding: "8px 12px",
                              background: col.bg,
                              borderBottom: `1px solid ${col.accent}20`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                color: col.accent,
                              }}
                            >
                              {col.label}
                            </span>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                color: col.accent,
                                background: `${col.accent}20`,
                                borderRadius: 20,
                                padding: "1px 7px",
                              }}
                            >
                              {col.tasks.length}
                            </span>
                          </div>
                          <div
                            style={{
                              padding: 8,
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              minHeight: 60,
                            }}
                          >
                            {col.tasks.length === 0 ? (
                              <p
                                style={{
                                  textAlign: "center",
                                  fontSize: "0.75rem",
                                  color: "#D1D5DB",
                                  padding: "8px 0",
                                  margin: 0,
                                }}
                              >
                                Empty
                              </p>
                            ) : (
                              col.tasks.map((t) => (
                                <div
                                  key={t._id}
                                  style={{
                                    background: "#fff",
                                    border: "1px solid #E9EBF0",
                                    borderRadius: 7,
                                    padding: "8px 10px",
                                    cursor: "pointer",
                                    transition: "box-shadow .15s",
                                  }}
                                  onClick={() =>
                                    setModal({ type: "viewTask", data: t })
                                  }
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.boxShadow =
                                      "0 2px 6px rgba(0,0,0,0.07)")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.boxShadow = "")
                                  }
                                >
                                  <p
                                    style={{
                                      margin: "0 0 4px",
                                      fontSize: "0.8rem",
                                      fontWeight: 600,
                                      color: "#111827",
                                      overflow: "hidden",
                                      whiteSpace: "nowrap",
                                      textOverflow: "ellipsis",
                                    }}
                                    title={t.name}
                                  >
                                    {t.name}
                                  </p>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                    }}
                                  >
                                    <PriorityBadge priority={t.priority} />
                                    <Avatar
                                      photo={t.created_by?.photo}
                                      name={t.created_by?.name ?? "?"}
                                      size={18}
                                    />
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // TAB: BOARD (Drag & Drop Kanban)
  // ══════════════════════════════════════════════════════════════════════════════
  const renderBoard = () => {
    const colCfg = [
      { key: "todo", label: "To Do", accent: "#534AB7", bg: "#EEF1FD" },
      {
        key: "inprogress",
        label: "In Progress",
        accent: "#D97706",
        bg: "#FEF9C3",
      },
      {
        key: "completed",
        label: "Completed",
        accent: "#059669",
        bg: "#D1FAE5",
      },
    ];

    return (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <div className="ds-search-wrap" style={{ width: 220 }}>
            <span className="ds-search-icon">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              className="ds-search-input"
              placeholder="Search tasks…"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
            />
          </div>
        
        </div>

        {dataLoading ? (
          <Spinner />
        ) : dataError ? (
          <ErrorBanner msg={dataError} onRetry={refreshProjectData} />
        ) : (
          <>
            <p
              style={{
                margin: "0 0 12px",
                fontSize: "0.78rem",
                color: "#9CA3AF",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 9h14M5 15h14" />
                <circle cx="4" cy="9" r="1" fill="currentColor" />
                <circle cx="4" cy="15" r="1" fill="currentColor" />
              </svg>
              Drag cards between columns to update task status
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={rectIntersection}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div
                className="kanban-board-grid"
                style={{ gap: 16, alignItems: "start" }}
              >
                {colCfg.map((col) => (
                  <DroppableColumn
                    key={col.key}
                    col={col}
                    tasks={kanban[col.key]}
                    onView={(t) => setModal({ type: "viewTask", data: t })}
                  />
                ))}
              </div>
              <DragOverlay
                dropAnimation={{
                  duration: 180,
                  easing: "cubic-bezier(0.18,0.67,0.6,1.22)",
                }}
              >
                {activeDragTask ? (
                  <div style={{ width: 260 }}>
                    <KanbanCard
                      task={activeDragTask}
                      col={
                        colCfg.find(
                          (c) =>
                            c.key ===
                            (statusColMap[
                              normalizeStatus(activeDragTask.status)
                            ] ?? "todo"),
                        ) ?? colCfg[0]
                      }
                      onView={() => {}}
                      isOverlay={true}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        )}
      </>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // TAB: TEAM SCHEDULE
  // ══════════════════════════════════════════════════════════════════════════════
  const renderTeamSchedule = () => {
    const members = selectedProject?.members ?? [];
    const sunday = getSundayOfWeek(schedWeekOffset);
    const weekLabel = fmtWeekLabel(sunday);
    const isThisWeek = schedWeekOffset === 0;

    // Build a lookup: { memberId: { Sun: 'morning', Mon: 'off', ... } }
    const schedMap = {};
    teamSchedules.forEach((s) => {
      const uid = String(s.user_id?._id ?? s.user_id);
      schedMap[uid] = {};
      (s.entries ?? []).forEach((e) => {
        schedMap[uid][e.day] = e.shift_type;
      });
    });

    const getShift = (memberId, day) =>
      schedMap[String(memberId)]?.[day] ?? "off";

    return (
      <>
        {/* Top bar */}
        {isAdmin && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 20,
            }}
          >
            <button
              className="ds-btn ds-btn-secondary"
              onClick={() =>
                setModal({ type: "manageTeam", data: selectedProject })
              }
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Manage Team
            </button>
          </div>
        )}

        {dataLoading ? (
          <Spinner />
        ) : dataError ? (
          <ErrorBanner msg={dataError} onRetry={refreshProjectData} />
        ) : members.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No team members"
            sub={
              isAdmin
                ? 'Click "Manage Team" to add members to this project'
                : "No members have been added to this project yet"
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* ── Summary stats ── */}
            <div
              className="team-stats-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 12,
              }}
            >
          {[
  {
    label: "Team Size",
    value: members.length,
    color: "#534AB7",
    bg: "#EEF1FD",
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="#534AB7">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    ),
  },
  {
    label: "Total Tasks",
    value: allTasks.length,
    color: "#D97706",
    bg: "#FEF3C7",
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="#D97706">
        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm5 14H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>
    ),
  },
  {
    label: "Completed",
    value: allTasks.filter((t) => normalizeStatus(t.status) === "Completed").length,
    color: "#059669",
    bg: "#D1FAE5",
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="#059669">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
      </svg>
    ),
  },
].map((s) => (
  <div key={s.label} className="ds-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {s.icon}
    </div>
    <div>
      <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: s.color }}>{s.value}</p>
      <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
    </div>
  </div>
))}
            </div>

            {/* ── Weekly Shift Schedule ── */}
            <div className="ds-card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Section header + week navigator */}
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid #E9EBF0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                  background: "#FAFAFA",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="#534AB7"
                    strokeWidth="2"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "#111827",
                    }}
                  >
                    Weekly Shift Schedule
                  </span>
                  {isAdmin && (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "#9CA3AF",
                        fontWeight: 500,
                      }}
                    >
                      — click a cell to change shift
                    </span>
                  )}
                </div>
                {/* Week navigator */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => setSchedWeekOffset((p) => p - 1)}
                    title="Previous week"
                    style={{
                      ...iconBtn,
                      border: "1px solid #E9EBF0",
                      borderRadius: 8,
                      width: 30,
                      height: 30,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#EEF1FD")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="13"
                      height="13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 14px",
                      background: "#EEF1FD",
                      borderRadius: 8,
                      border: "1px solid #C7D2F8",
                      minWidth: 180,
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "#534AB7",
                      }}
                    >
                      {weekLabel}
                    </span>
                    {isThisWeek && (
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          background: "#534AB7",
                          color: "#fff",
                          borderRadius: 20,
                          padding: "1px 7px",
                        }}
                      >
                        This Week
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSchedWeekOffset((p) => p + 1)}
                    title="Next week"
                    style={{
                      ...iconBtn,
                      border: "1px solid #E9EBF0",
                      borderRadius: 8,
                      width: 30,
                      height: 30,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#EEF1FD")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="13"
                      height="13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                  {schedWeekOffset !== 0 && (
                    <button
                      onClick={() => setSchedWeekOffset(0)}
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#8A9FE8",
                        background: "none",
                        border: "1px solid #C7D2F8",
                        borderRadius: 8,
                        padding: "4px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Today
                    </button>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div
                style={{
                  padding: "8px 20px",
                  borderBottom: "1px solid #E9EBF0",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  background: "#fff",
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginRight: 4,
                  }}
                >
                  Shifts:
                </span>
                {Object.entries(SHIFT_STYLE).map(([type]) => (
                  <ShiftBadge key={type} type={type} small />
                ))}
              </div>

              {schedLoading ? (
                <Spinner />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: 640,
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "#F9FAFB",
                          borderBottom: "1px solid #E9EBF0",
                        }}
                      >
                        <th
                          style={{
                            padding: "10px 16px",
                            textAlign: "left",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: "#9CA3AF",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            whiteSpace: "nowrap",
                            width: 180,
                          }}
                        >
                          Member
                        </th>
                        {SCHED_DAYS.map((d, i) => {
                          const date = new Date(sunday);
                          date.setDate(date.getDate() + i);
                          const isToday =
                            date.toDateString() === new Date().toDateString();
                          return (
                            <th
                              key={d}
                              style={{
                                padding: "8px 6px",
                                textAlign: "center",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                color: isToday ? "#534AB7" : "#9CA3AF",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                minWidth: 90,
                                background: isToday ? "#EEF1FD" : undefined,
                                borderBottom: isToday
                                  ? "2px solid #534AB7"
                                  : undefined,
                              }}
                            >
                              <div>{d}</div>
                              <div
                                style={{
                                  fontSize: "0.68rem",
                                  fontWeight: 500,
                                  color: isToday ? "#8A9FE8" : "#C9D1D9",
                                }}
                              >
                                {date.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member, ri) => (
                        <tr
                          key={member._id}
                          style={{
                            borderBottom: "1px solid #F3F4F6",
                            background: ri % 2 === 0 ? "#fff" : "#FAFAFA",
                          }}
                        >
                          {/* Member info cell */}
                          <td
                            style={{
                              padding: "10px 16px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <Avatar
                                photo={member.photo}
                                name={member.name ?? "?"}
                                size={28}
                              />
                              <div style={{ minWidth: 0 }}>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "0.8rem",
                                    fontWeight: 700,
                                    color: "#111827",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {member.name}
                                </p>
                                <span
                                  style={{
                                    fontSize: "0.65rem",
                                    fontWeight: 700,
                                    padding: "1px 5px",
                                    borderRadius: 20,
                                    background:
                                      member.role === "admin"
                                        ? "#FEE2E2"
                                        : member.role === "manager"
                                          ? "#FEF3C7"
                                          : "#EEF1FD",
                                    color:
                                      member.role === "admin"
                                        ? "#DC2626"
                                        : member.role === "manager"
                                          ? "#D97706"
                                          : "#534AB7",
                                  }}
                                >
                                  {member.role ?? "user"}
                                </span>
                              </div>
                            </div>
                          </td>
                          {/* Shift cells */}
                          {SCHED_DAYS.map((day, di) => {
                            const date = new Date(sunday);
                            date.setDate(date.getDate() + di);
                            const isToday =
                              date.toDateString() === new Date().toDateString();
                            const shift = getShift(member._id, day);
                            const ss = SHIFT_STYLE[shift] ?? SHIFT_STYLE.off;
                            return (
                              <td
                                key={day}
                                style={{
                                  padding: "6px",
                                  textAlign: "center",
                                  background: isToday ? "#F5F6FF" : undefined,
                                }}
                              >
                                {isAdmin ? (
                                  <select
                                    value={shift}
                                    onChange={(e) =>
                                      handleShiftChange(
                                        member,
                                        day,
                                        e.target.value,
                                      )
                                    }
                                    style={{
                                      fontSize: "0.72rem",
                                      fontWeight: 700,
                                      padding: "4px 6px",
                                      borderRadius: 8,
                                      border: `1.5px solid ${ss.dot}60`,
                                      background: ss.bg,
                                      color: ss.color,
                                      cursor: "pointer",
                                      outline: "none",
                                      width: "100%",
                                      maxWidth: 110,
                                      appearance: "none",
                                      WebkitAppearance: "none",
                                      textAlign: "center",
                                    }}
                                    title={`${member.name} — ${day}: ${shift}`}
                                  >
                                    {Object.keys(SHIFT_STYLE).map((t) => (
                                      <option key={t} value={t}>
                                        {SHIFT_STYLE[t].label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <ShiftBadge type={shift} small />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Per-member task progress cards ── */}
            <div>
              <h3
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  margin: "0 0 12px",
                }}
              >
                Task Progress
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))",
                  gap: 16,
                }}
              >
                {teamSchedule.map(
                  ({ member, done, inProg, todo, total, pct }) => (
                    <div
                      key={member._id}
                      className="ds-card"
                      style={{ padding: "18px 22px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 14,
                        }}
                      >
                        <Avatar
                          photo={member.photo}
                          name={member.name ?? "?"}
                          size={40}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: 700,
                              fontSize: "0.9rem",
                              color: "#111827",
                            }}
                          >
                            {member.name}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.72rem",
                              color: "#9CA3AF",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {member.email}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "1.3rem",
                              fontWeight: 800,
                              color:
                                pct === 100
                                  ? "#059669"
                                  : pct >= 50
                                    ? "#D97706"
                                    : "#534AB7",
                            }}
                          >
                            {pct}%
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.68rem",
                              color: "#9CA3AF",
                              fontWeight: 600,
                            }}
                          >
                            done
                          </p>
                        </div>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              color: "#6B7280",
                            }}
                          >
                            Progress
                          </span>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              color: "#374151",
                            }}
                          >
                            {done}/{total} tasks
                          </span>
                        </div>
                        <div
                          style={{
                            height: 7,
                            background: "#E9EBF0",
                            borderRadius: 99,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background:
                                pct === 100
                                  ? "linear-gradient(90deg,#059669,#3ECFAA)"
                                  : "linear-gradient(90deg,#534AB7,#8A9FE8)",
                              borderRadius: 99,
                              transition: "width .6s ease",
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[
                          { v: todo, l: "To Do", c: "#534AB7", bg: "#EEF1FD" },
                          {
                            v: inProg,
                            l: "In Prog",
                            c: "#D97706",
                            bg: "#FEF3C7",
                          },
                          { v: done, l: "Done", c: "#059669", bg: "#D1FAE5" },
                        ].map((s) => (
                          <div
                            key={s.l}
                            style={{
                              flex: 1,
                              background: s.bg,
                              borderRadius: 8,
                              padding: "8px",
                              textAlign: "center",
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                fontWeight: 800,
                                fontSize: "1.1rem",
                                color: s.c,
                              }}
                            >
                              {s.v}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                color: s.c,
                                textTransform: "uppercase",
                                opacity: 0.75,
                              }}
                            >
                              {s.l}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 10,
                          borderTop: "1px solid #F3F4F6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 20,
                            background:
                              member.role === "admin"
                                ? "#FEE2E2"
                                : member.role === "manager"
                                  ? "#FEF3C7"
                                  : "#EEF1FD",
                            color:
                              member.role === "admin"
                                ? "#DC2626"
                                : member.role === "manager"
                                  ? "#D97706"
                                  : "#534AB7",
                          }}
                        >
                          {member.role ?? "user"}
                        </span>
                        {total === 0 && (
                          <span
                            style={{ fontSize: "0.73rem", color: "#D1D5DB" }}
                          >
                            No tasks assigned
                          </span>
                        )}
                        {total > 0 && pct === 100 && (
                          <span
                            style={{
                              fontSize: "0.73rem",
                              color: "#059669",
                              fontWeight: 700,
                            }}
                          >
                            🎉 All done!
                          </span>
                        )}
                        {total > 0 && pct < 100 && (
                          <span
                            style={{ fontSize: "0.73rem", color: "#9CA3AF" }}
                          >
                            {total - done} remaining
                          </span>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // ─── modal helpers ─────────────────────────────────────────────────────────────
  const sprintForEdit = modal?.data
    ? {
        ...modal.data,
        startDate: modal.data.start_date
          ? modal.data.start_date.slice(0, 10)
          : "",
        endDate: modal.data.end_date ? modal.data.end_date.slice(0, 10) : "",
        status: (() => {
          const s = modal.data.status ?? "planned";
          return s.charAt(0).toUpperCase() + s.slice(1);
        })(),
      }
    : null;

const PROJECT_TABS = [
  {
    key: "backlog",
    label: "Backlog",
    icon: (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="#8A9FE8">
        <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
      </svg>
    ),
  },
  {
    key: "sprint",
    label: "Sprint Planning",
    icon: (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="#8A9FE8">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
  },
  {
    key: "board",
    label: "Board",
    icon: (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="#8A9FE8">
        <path d="M3 3h7v9H3zm0 11h7v7H3zm11-11h7v7h-7zm0 9h7v9h-7z"/>
      </svg>
    ),
  },
  {
    key: "team",
    label: "Team Schedule",
    icon: (
      <svg viewBox="0 0 24 24" width="15" height="15" fill="#8A9FE8">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    ),
  },
];

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="ds-page">
      <div className="page-content-wrapper">
        {viewMode === "landing" ? (
          /* ── LANDING PAGE ── */
          renderLanding()
        ) : (
          /* ── PROJECT DETAIL ── */
          <>
            {/* Breadcrumb */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setViewMode("landing")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #E9EBF0",
                  background: "#F9FAFB",
                  color: "#6B7280",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#EEF1FD")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#F9FAFB")
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                All Projects
              </button>
              <svg
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="none"
                stroke="#D1D5DB"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: "linear-gradient(135deg,#8A9FE8,#534AB7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  {selectedProject?.name?.charAt(0)?.toUpperCase() ?? "P"}
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "#111827",
                  }}
                >
                  {selectedProject?.name ?? "Project"}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#8A9FE8",
                    background: "#EEF1FD",
                    border: "1px solid #C7D2F8",
                    borderRadius: 20,
                    padding: "1px 8px",
                    textTransform: "capitalize",
                  }}
                >
                  {user?.role ?? "User"}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: 4,
                marginBottom: 24,
                borderBottom: "2px solid #E9EBF0",
                overflowX: "auto",
              }}
              className="tabs-row"
            >
              {PROJECT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: "10px 18px",
                    fontSize: "0.875rem",
                    fontWeight: activeTab === tab.key ? 700 : 500,
                    color: activeTab === tab.key ? "#534AB7" : "#6B7280",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    borderBottom:
                      activeTab === tab.key
                        ? "2px solid #534AB7"
                        : "2px solid transparent",
                    marginBottom: -2,
                    transition: "color .15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content — project selector removed; project is already selected */}
            {activeTab === "backlog" && renderBacklog()}
            {activeTab === "sprint" && renderSprintPlanning()}
            {activeTab === "board" && renderBoard()}
            {activeTab === "team" && renderTeamSchedule()}
          </>
        )}
      </div>

      {/* ── Confirm Modal ── */}
      <ConfirmModal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        onConfirm={confirmModal?.onConfirm}
        title={confirmModal?.title ?? "Confirm"}
        message={confirmModal?.message ?? "Are you sure?"}
      />

      {/* ── Other Modals ── */}
      <CreateProjectModal
        isOpen={modal?.type === "createProject"}
        onClose={closeModal}
        onSubmit={handleCreateProject}
      />
      <CreateSprintModal
        isOpen={modal?.type === "createSprint"}
        onClose={closeModal}
        onSubmit={handleCreateSprint}
      />
      <EditSprintModal
        sprint={sprintForEdit}
        isOpen={modal?.type === "editSprint"}
        onClose={closeModal}
        onSubmit={handleEditSprint}
      />
      <DeleteSprintModal
        sprint={modal?.data}
        isOpen={modal?.type === "deleteSprint"}
        onClose={closeModal}
        onDelete={handleDeleteSprint}
      />
      <CreateBacklogModal
        isOpen={modal?.type === "createBacklog"}
        onClose={closeModal}
        onSubmit={handleCreateBacklog}
      />
      <EditBacklogModal
        backlog={modal?.type === "editBacklog" ? modal.data : null}
        isOpen={modal?.type === "editBacklog"}
        onClose={closeModal}
        onSubmit={handleEditBacklog}
      />
      <AIBreakdownModal
        isOpen={modal?.type === 'aiBreakdown'}
        onClose={closeModal}
        backlogs={backlogs}
        members={selectedProject?.members ?? []}
        companyId={user?.company_id}
        createdBy={user?._id}
        onCreated={() => { refreshProjectData(); toastSuccess('Tasks Created', 'The AI-assigned tasks were saved to the backlog.'); }}
      />
      <CreateTaskModal
        isOpen={modal?.type === "createTask"}
        onClose={closeModal}
        onSubmit={handleCreateTask}
        backlogs={backlogs}
        sprints={sprints}
        members={selectedProject?.members ?? []}
        defaultBacklogId={modal?.data?.backlogId ?? ""}
        defaultSprintId={modal?.data?.sprintId ?? ""}
      />
      <ViewTaskModal
        task={
          modal?.type === "viewTask"
            ? {
                ...modal.data,
                status: normalizeStatus(modal.data?.status),
                priority: modal.data?.priority ?? "medium",
              }
            : null
        }
        isOpen={modal?.type === "viewTask"}
        onClose={closeModal}
        isAdmin={isAdmin}
        members={selectedProject?.members ?? []}
        currentUserId={user?._id}
        onAssigneesChange={handleUpdateTaskAssignees}
      />
      <AddMemberModal
        isOpen={modal?.type === "manageTeam"}
        onClose={closeModal}
        project={modal?.data ?? selectedProject}
        onMembersChange={handleMembersChange}
      />
      <AssignTaskToSprintModal
        isOpen={modal?.type === "assignToSprint"}
        onClose={closeModal}
        sprintId={modal?.data?._id}
        sprintName={modal?.data?.name}
        backlogs={backlogs}
        projectId={selectedProjId}
        onDone={refreshProjectData}
      />

      <Toast toasts={toasts} onClose={closeToast} />
      <ProjectDetailsModal
        isOpen={modal?.type === "projectDetails"}
        onClose={closeModal}
        project={modal?.data}
        stats={selectedProjId ? getProjectStats(selectedProjId) : {}}
        isAdmin={isAdmin}
        onManageTeam={() => setModal({ type: "manageTeam", data: modal?.data })}
      />

      {/* ── Team Details Modal ── */}
      <TeamDetailsModal
        isOpen={!!viewTeam}
        team={viewTeam}
        onClose={() => setViewTeam(null)}
        isAdmin={isAdmin}
        onEdit={(team) => setTeamModal({ mode: "edit", team })}
      />

      {/* ── Add / Edit Team Modal ── */}
      <AddTeamModal
        isOpen={!!teamModal}
        onClose={() => setTeamModal(null)}
        onSubmit={
          teamModal?.mode === "edit" ? handleEditTeam : handleCreateTeam
        }
        editTeam={teamModal?.mode === "edit" ? teamModal.team : null}
      />

      {/* ── Toast Notifications ── */}
      <StockUsageConfirmModal
        isOpen={!!stockPrompt}
        onClose={() => setStockPrompt(null)}
        taskName={stockPrompt?.taskName}
        items={stockPrompt?.items ?? []}
        onDone={(result) => {
          if (result.deducted.length > 0) {
            toastSuccess('Stock Updated', `Deducted: ${result.deducted.map(d => `${d.item_name} (${d.quantity})`).join(', ')}.`);
          }
          if (result.notFound.length > 0) {
            toastInfo('Some Items Not Found', `Couldn't match in stock: ${result.notFound.map(d => d.item_name).join(', ')}.`);
          }
          if (result.failed.length > 0) {
            toastError('Deduction Failed', `Couldn't update: ${result.failed.map(d => d.item_name).join(', ')}.`);
          }
        }}
      />

      <Toast toasts={toasts} onClose={closeToast} />
    </div>
  );
};

export default Dashboard;
