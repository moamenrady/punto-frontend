import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../dashboard.css';
import { projectService } from '../services/projectService';
import { DndContext, DragOverlay, rectIntersection, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import ViewTaskModal from './ViewTaskModal';
import StockUsageConfirmModal from './StockUsageConfirmModal';
import Toast, { useToast } from './Toast';
import { SystemAdmin } from '../services/aiOpsService';

// ─── Shift config ──────────────────────────────────────────────────────────────
const SHIFT_CFG = {
  morning: {
    label: "6AM – 2PM",
    bg: "#D1FAE5",
    color: "#065F46",
    dot: "#059669",
  },
  afternoon: {
    label: "2PM – 10PM",
    bg: "#EEF1FD",
    color: "#3730A3",
    dot: "#534AB7",
  },
  night: {
    label: "10PM – 6AM",
    bg: "#EDE9FE",
    color: "#5B21B6",
    dot: "#7C3AED",
  },
  off: { label: "Off", bg: "#F3F4F6", color: "#9CA3AF", dot: "#D1D5DB" },
  arrived: {
    label: "Arrived",
    bg: "#FEF3C7",
    color: "#92400E",
    dot: "#D97706",
  },
  timeout: {
    label: "Timeout",
    bg: "#FEE2E2",
    color: "#991B1B",
    dot: "#DC2626",
  },
};
const ShiftBadge = ({ shift = "off" }) => {
  const c = SHIFT_CFG[shift] ?? SHIFT_CFG.off;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        background: c.bg,
        color: c.color,
        fontSize: "0.72rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c.dot,
          flexShrink: 0,
        }}
      />
      {c.label}
    </span>
  );
};

// ─── helpers ───────────────────────────────────────────────────────────────────
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const fmtDay = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "—";

const normalizeStatus = (s = "") => {
  const l = s.toLowerCase().replace(/_/g, "").replace(/\s/g, "");
  if (l === "open" || l === "todo" || l === "") return "To Do";
  if (l === "inprogress") return "In Progress";
  if (l === "completed" || l === "done" || l === "closed") return "Completed";
  return s;
};

const PRIORITY_STYLE = {
  high: { bg: "#FEE2E2", color: "#DC2626", label: "High" },
  medium: { bg: "#FEF3C7", color: "#D97706", label: "Medium" },
  low: { bg: "#D1FAE5", color: "#059669", label: "Low" },
};
const COL_CFG = [
  { key: "todo", label: "To Do", accent: "#534AB7", bg: "#EEF1FD" },
  { key: "inprogress", label: "In Progress", accent: "#D97706", bg: "#FEF9C3" },
  { key: "completed", label: "Done", accent: "#059669", bg: "#D1FAE5" },
];
const COL_STATUS = {
  todo: "To Do",
  inprogress: "In Progress",
  completed: "Completed",
};
const STATUS_COL = {
  "To Do": "todo",
  "In Progress": "inprogress",
  Completed: "completed",
};

const PriorityBadge = ({ p = "medium" }) => {
  const s = PRIORITY_STYLE[p?.toLowerCase()] ?? PRIORITY_STYLE.medium;
  return (
    <span
      style={{
        fontSize: "0.68rem",
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 20,
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
};
const Avatar = ({ name = "?", size = 26 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: "linear-gradient(135deg,#8A9FE8,#6B82D8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: `${size * 0.38}px`,
      fontWeight: 800,
      color: "#fff",
      flexShrink: 0,
    }}
  >
    {(name || "?")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()}
  </div>
);
const Spinner = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 180,
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        border: "3px solid #E9EBF0",
        borderTop: "3px solid #8A9FE8",
        borderRadius: "50%",
        animation: "spin .8s linear infinite",
      }}
    />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

// ─── DnD primitives ────────────────────────────────────────────────────────────
const KanbanCard = ({
  task,
  col,
  onView,
  currentUserId,
  isDragging = false,
  isOverlay = false,
}) => {
  const assignees = task.assigned_to ?? [];
  const isAssignedToMe =
    currentUserId &&
    assignees.some((u) => String(u._id ?? u) === String(currentUserId));
  return (
    <div
      className="ds-card"
      style={{
        padding: "11px 13px",
        border: `1px solid ${isDragging ? col.accent : isAssignedToMe ? "#C7D2F8" : "#E9EBF0"}`,
        background: isAssignedToMe ? "#FAFBFF" : "#fff",
        borderRadius: 9,
        boxShadow: isOverlay ? "0 8px 24px rgba(0,0,0,0.16)" : undefined,
        transform: isOverlay ? "rotate(2deg) scale(1.03)" : undefined,
        transition: isDragging ? "none" : "box-shadow .15s",
        userSelect: "none",
        cursor: isDragging ? "grabbing" : "pointer",
      }}
      onClick={!isDragging ? () => onView(task) : undefined}
    >
      {/* Mine indicator */}
      {isAssignedToMe && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: "0.62rem",
            fontWeight: 700,
            color: "#534AB7",
            background: "#EEF1FD",
            padding: "1px 6px",
            borderRadius: 10,
            marginBottom: 5,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="9"
            height="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          My Task
        </div>
      )}
      <p
        style={{
          fontWeight: 600,
          fontSize: "0.84rem",
          color: "#111827",
          margin: "0 0 7px",
          lineHeight: 1.4,
        }}
        title={task.name}
      >
        {task.name?.length > 46 ? task.name.slice(0, 46) + "…" : task.name}
      </p>
      {task.description && (
        <p
          style={{
            margin: "0 0 7px",
            fontSize: "0.75rem",
            color: "#9CA3AF",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {task.description}
        </p>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <PriorityBadge p={task.priority} />
          {task.sprint_id?.name && (
            <span
              style={{
                fontSize: "0.65rem",
                color: "#8A9FE8",
                background: "#EEF1FD",
                padding: "1px 6px",
                borderRadius: 4,
              }}
            >
              {task.sprint_id.name}
            </span>
          )}
        </div>
        {/* Assignee avatars */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {assignees.length === 0 ? (
            <span style={{ fontSize: "0.65rem", color: "#D1D5DB" }}>—</span>
          ) : (
            assignees.slice(0, 3).map((u, i) => (
              <div
                key={u._id ?? i}
                title={u.name ?? "?"}
                style={{ marginLeft: i > 0 ? -6 : 0, zIndex: 10 - i }}
              >
                <Avatar name={u.name ?? "?"} size={20} />
              </div>
            ))
          )}
          {assignees.length > 3 && (
            <span
              style={{ fontSize: "0.65rem", color: "#9CA3AF", marginLeft: 3 }}
            >
              +{assignees.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const DraggableCard = ({ task, col, onView, currentUserId }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task._id, data: { task, colKey: col.key } });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.35 : 1,
        touchAction: "none",
        outline: "none",
        transition: isDragging ? "none" : "opacity .2s",
      }}
    >
      <KanbanCard
        task={task}
        col={col}
        onView={onView}
        currentUserId={currentUserId}
        isDragging={isDragging}
      />
    </div>
  );
};

const DroppableCol = ({ col, tasks, onView, currentUserId }) => {
  const { isOver, setNodeRef } = useDroppable({ id: col.key });
  return (
    <div
      ref={setNodeRef}
      style={{
        background: "#fff",
        borderRadius: 12,
        border: `1px solid ${isOver ? col.accent : "#E9EBF0"}`,
        overflow: "hidden",
        minHeight: 260,
        transition: "border-color .2s, box-shadow .2s",
        boxShadow: isOver ? `0 0 0 3px ${col.accent}22` : undefined,
      }}
    >
      <div
        style={{
          padding: "12px 14px",
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
            fontSize: "0.85rem",
            color: isOver ? "#fff" : col.accent,
            transition: "color .2s",
          }}
        >
          {col.label}
        </span>
        <span
          style={{
            fontSize: "0.74rem",
            fontWeight: 700,
            background: isOver ? "rgba(255,255,255,0.3)" : col.accent,
            color: "#fff",
            borderRadius: 20,
            padding: "1px 8px",
          }}
        >
          {tasks.length}
        </span>
      </div>
      <div
        style={{
          padding: 10,
          display: "flex",
          flexDirection: "column",
          gap: 7,
          minHeight: 80,
        }}
      >
        {tasks.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 70,
              border: `2px dashed ${isOver ? col.accent : "#E9EBF0"}`,
              borderRadius: 8,
              transition: "border-color .2s, background .2s",
              background: isOver ? `${col.accent}08` : "transparent",
            }}
          >
            <p
              style={{
                margin: 0,
                color: isOver ? col.accent : "#D1D5DB",
                fontSize: "0.78rem",
                fontWeight: isOver ? 600 : 400,
              }}
            >
              {isOver ? "⬇ Drop here" : "Empty"}
            </p>
          </div>
        ) : (
          tasks.map((t) => (
            <DraggableCard
              key={t._id}
              task={t}
              col={col}
              onView={onView}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ─── Week helpers ──────────────────────────────────────────────────────────────
const getSundayOfWeek = (d = new Date()) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() - dt.getDay());
  return dt;
};
const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
const isoDate = (d) => d.toISOString().slice(0, 10);
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ══════════════════════════════════════════════════════════════════════════════
const UserDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState("board");

  // project / task data
  const [projects, setProjects] = useState([]);
  const [selectedProjId, setSelectedProjId] = useState("");
  const [allProjectTasks, setAllProjectTasks] = useState([]);

  // board filters
  const [taskFilter, setTaskFilter] = useState("mine"); // 'all' | 'mine'
  const [taskSearch, setTaskSearch] = useState("");

  // sprint
  const [activeSprint, setActiveSprint] = useState(null);

  // schedule
  const [mySchedule, setMySchedule] = useState(null);
  const [teamSchedules, setTeamSchedules] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);

  // loading
  const [loading, setLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(false);
  const [schedLoading, setSchedLoading] = useState(true);

  // modal
  const [viewTask,        setViewTask]        = useState(null);
  const [activeDragId,    setActiveDragId]    = useState(null);
  const [stockPrompt,     setStockPrompt]     = useState(null); // { taskName, items } | null

  const { toasts, close: closeToast, success: toastSuccess, info: toastInfo, error: toastError } = useToast();

  const weekStart = useMemo(() => {
    const base = getSundayOfWeek();
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const weekDates = useMemo(
    () => DAYS_SHORT.map((day, i) => ({ day, date: addDays(weekStart, i) })),
    [weekStart],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // ── Projects the user is a member of ──────────────────────────────────────
  const memberProjects = useMemo(
    () =>
      projects.filter((p) =>
        (p.members ?? []).some((m) => String(m._id ?? m) === String(user._id)),
      ),
    [projects, user._id],
  );

  // ── fetch projects + active sprint ────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const projs = await projectService.getProjects();
      setProjects(projs);

      const myProjs = projs.filter((p) =>
        (p.members ?? []).some((m) => String(m._id ?? m) === String(user._id)),
      );

      // Auto-select first project
      if (myProjs.length > 0) setSelectedProjId((pid) => pid || myProjs[0]._id);

      // Find active sprint
      let foundSprint = null;
      for (const proj of myProjs) {
        try {
          const sprints = await projectService.getSprints(proj._id);
          const active = sprints.find((s) => s.status === "active");
          if (active) {
            foundSprint = { ...active, projectName: proj.name };
            break;
          }
        } catch {
          /* skip */
        }
      }
      setActiveSprint(foundSprint);
    } catch (e) {
      console.error("UserDashboard fetch error", e);
    } finally {
      setLoading(false);
    }
  }, [user._id]);

  // ── fetch all tasks for the selected project ──────────────────────────────
  const fetchProjectTasks = useCallback(async (pid) => {
    if (!pid) {
      setAllProjectTasks([]);
      return;
    }
    try {
      setTaskLoading(true);
      const tasks = await projectService.getProjectTasks(pid);
      setAllProjectTasks(tasks);
    } catch (e) {
      console.error("fetchProjectTasks error", e);
      setAllProjectTasks([]);
    } finally {
      setTaskLoading(false);
    }
  }, []);

  // ── fetch schedule ─────────────────────────────────────────────────────────
  const fetchSchedule = useCallback(async () => {
    try {
      setSchedLoading(true);
      const ws = isoDate(weekStart);
      const projId = memberProjects[0]?._id ?? undefined;
      const [mine, team] = await Promise.all([
        projectService.getMySchedule(projId, ws),
        projId
          ? projectService.getProjectSchedules(projId, ws)
          : Promise.resolve([]),
      ]);
      setMySchedule(mine);
      setTeamSchedules(team);
    } catch (e) {
      console.error("Schedule fetch error", e);
    } finally {
      setSchedLoading(false);
    }
  }, [memberProjects, weekStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    fetchProjectTasks(selectedProjId);
  }, [selectedProjId, fetchProjectTasks]);
  useEffect(() => {
    if (!loading) fetchSchedule();
  }, [loading, fetchSchedule]);

  // ── kanban computed ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const term = taskSearch.toLowerCase();
    return allProjectTasks.filter((t) => {
      if (
        taskFilter === "mine" &&
        !(t.assigned_to ?? []).some(
          (u) => String(u._id ?? u) === String(user._id),
        )
      )
        return false;
      return !term || t.name?.toLowerCase().includes(term);
    });
  }, [allProjectTasks, taskSearch, taskFilter, user._id]);

  const kanban = useMemo(
    () => ({
      todo: filtered.filter((t) => normalizeStatus(t.status) === "To Do"),
      inprogress: filtered.filter(
        (t) => normalizeStatus(t.status) === "In Progress",
      ),
      completed: filtered.filter(
        (t) => normalizeStatus(t.status) === "Completed",
      ),
    }),
    [filtered],
  );

  const activeDragTask = useMemo(
    () =>
      activeDragId ? allProjectTasks.find((t) => t._id === activeDragId) : null,
    [activeDragId, allProjectTasks],
  );

  // ── DnD handlers (status change) ──────────────────────────────────────────
  const handleDragStart = (e) => setActiveDragId(e.active.id);
  const handleDragEnd = async (event) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || !active) return;
    const task = active.data.current?.task;
    if (!task) return;
    let targetKey = over.id;
    if (!COL_STATUS[targetKey]) {
      const overTask = allProjectTasks.find((t) => t._id === over.id);
      if (overTask) targetKey = STATUS_COL[normalizeStatus(overTask.status)];
    }
    if (!targetKey || !COL_STATUS[targetKey]) return;
    const newStatus = COL_STATUS[targetKey];
    if (normalizeStatus(task.status) === newStatus) return;
    const backlogId = task.backlog_id?._id ?? task.backlog_id;
    const STATUS_API = {
      "To Do": "todo",
      "In Progress": "in_progress",
      Completed: "completed",
    };
    const apiStatus = STATUS_API[newStatus] || newStatus.toLowerCase();

    try {
      await projectService.updateTask(backlogId, task._id, {
        status: apiStatus,
      });
      setAllProjectTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: apiStatus } : t)),
      );
    } catch (e) {
      alert(e.message);
    }
  };

  // ── assignee update (self-assign / unassign) ───────────────────────────────
  const handleAssigneesChange = async (taskId, backlogId, newIds) => {
    const updated = await projectService.updateTask(backlogId, taskId, {
      assigned_to: newIds,
    });
    const patch = updated ?? { assigned_to: newIds };
    setAllProjectTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, ...patch } : t)),
    );
    if (viewTask?._id === taskId)
      setViewTask((prev) => ({ ...prev, ...patch }));
  };

  // ── schedule entry getter ──────────────────────────────────────────────────
  const getEntry = (schedule, day) =>
    schedule?.entries?.find((e) => e.day === day)?.shift_type ?? "off";

  // ── render: stats bar ──────────────────────────────────────────────────────
  const myTaskCount = allProjectTasks.filter((t) =>
    (t.assigned_to ?? []).some((u) => String(u._id ?? u) === String(user._id)),
  ).length;
  const myDoneCount = allProjectTasks.filter(
    (t) =>
      (t.assigned_to ?? []).some(
        (u) => String(u._id ?? u) === String(user._id),
      ) && normalizeStatus(t.status) === "Completed",
  ).length;

  const sprintMembers = activeSprint
    ? (projects.find((p) => p.name === activeSprint.projectName)?.members ?? [])
    : [];

  return (
    <div className="ds-page">
      <div className="page-content-wrapper">
        {/* ── Welcome header ── */}
        <div
          style={{
            marginBottom: 20,
            padding: "20px 24px",
            background: "#fff",
            borderRadius: 14,
            border: "1px solid #E9EBF0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h1 style={{ margin:'0 0 4px', fontSize:'1.15rem', fontWeight:800, color:'#111827', display:'flex', alignItems:'center', gap:6 }}>
                Welcome, {user?.name?.split(' ')[0]}{' '}
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </h1>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#9CA3AF" }}>
                {activeSprint
                  ? `Active sprint: ${activeSprint.name} · ${activeSprint.projectName}`
                  : "No active sprint at the moment."}
              </p>
            </div>
            {/* Mini stats */}
            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  textAlign: "center",
                  padding: "8px 16px",
                  background: "#EEF1FD",
                  borderRadius: 10,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    color: "#534AB7",
                  }}
                >
                  {myTaskCount}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: "#8A9FE8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  My Tasks
                </p>
              </div>
              <div
                style={{
                  textAlign: "center",
                  padding: "8px 16px",
                  background: "#D1FAE5",
                  borderRadius: 10,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    color: "#059669",
                  }}
                >
                  {myDoneCount}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: "#059669",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Done
                </p>
              </div>
            </div>
          </div>

          {activeSprint && (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 12px",
                  background: "#EEF1FD",
                  border: "1px solid #C7D2F8",
                  borderRadius: 20,
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="12"
                  height="12"
                  fill="none"
                  stroke="#534AB7"
                  strokeWidth="2.5"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "#534AB7",
                  }}
                >
                  {activeSprint.name}
                </span>
                {(activeSprint.start_date || activeSprint.end_date) && (
                  <span style={{ fontSize: "0.72rem", color: "#8A9FE8" }}>
                    {fmt(activeSprint.start_date)} –{" "}
                    {fmt(activeSprint.end_date)}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {sprintMembers.slice(0, 5).map((m, i) => (
                  <div
                    key={m._id ?? i}
                    title={m.name}
                    style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i }}
                  >
                    <Avatar name={m.name ?? "?"} size={28} />
                  </div>
                ))}
                {sprintMembers.length > 5 && (
                  <span
                    style={{
                      marginLeft: 4,
                      fontSize: "0.72rem",
                      color: "#9CA3AF",
                    }}
                  >
                    +{sprintMembers.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 20,
            borderBottom: "2px solid #E9EBF0",
          }}
        >
          {[
            // ✅ كده - SVG بلون الموف
            {
              key: "board",
              label: "Project Board",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="#534AB7"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              ),
            },
            {
              key: "schedule",
              label: "My Schedule",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="#534AB7"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              ),
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "9px 18px",
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
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "color .15s",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ════════ BOARD TAB ════════ */}
        {activeTab === "board" &&
          (loading ? (
            <Spinner />
          ) : (
            <>
              {/* Controls bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                  flexWrap: "wrap",
                }}
              >
                {/* Project selector */}
                {memberProjects.length > 1 && (
                  <select
                    value={selectedProjId}
                    onChange={(e) => {
                      setSelectedProjId(e.target.value);
                      setTaskFilter("all");
                    }}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 8,
                      border: "1px solid #E5E7EB",
                      fontSize: "0.84rem",
                      color: "#111827",
                      background: "#fff",
                      cursor: "pointer",
                      minWidth: 180,
                    }}
                  >
                    {memberProjects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
                {memberProjects.length === 1 && (
                  <div
                    style={{
                      padding: "6px 12px",
                      background: "#EEF1FD",
                      borderRadius: 8,
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "#534AB7",
                      border: "1px solid #C7D2F8",
                    }}
                  >
                    {memberProjects[0].name}
                  </div>
                )}

                {/* Filter chips */}
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                  //  { key: "all", label: "All Tasks" },
                    { key: "mine", label: "My Tasks" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setTaskFilter(f.key)}
                      style={{
                        padding: "5px 13px",
                        borderRadius: 20,
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all .15s",
                        border:
                          taskFilter === f.key
                            ? "1.5px solid #534AB7"
                            : "1.5px solid #E9EBF0",
                        background: taskFilter === f.key ? "#534AB7" : "#fff",
                        color: taskFilter === f.key ? "#fff" : "#6B7280",
                      }}
                    >
                      {f.label}
                      {f.key === "mine" && myTaskCount > 0 && (
                        <span
                          style={{
                            marginLeft: 5,
                            background:
                              taskFilter === "mine"
                                ? "rgba(255,255,255,0.3)"
                                : "#EEF1FD",
                            color: taskFilter === "mine" ? "#fff" : "#534AB7",
                            borderRadius: 20,
                            padding: "0 5px",
                            fontSize: "0.68rem",
                          }}
                        >
                          {myTaskCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div style={{ position: "relative", flex: 1, maxWidth: 240 }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9CA3AF",
                      pointerEvents: "none",
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
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
                    style={{
                      width: "100%",
                      paddingLeft: 32,
                      paddingRight: 12,
                      paddingTop: 7,
                      paddingBottom: 7,
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      fontSize: "0.84rem",
                      color: "#111827",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    placeholder="Search tasks…"
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#9CA3AF",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginLeft: "auto",
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
                  </svg>
                  Drag to update status · Click to view &amp; assign
                </div>
              </div>

              {/* No project in */}
              {memberProjects.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 16px" }}>
                  <p style={{ fontSize: "2.5rem", margin: "0 0 10px" }}>🔍</p>
                  <p
                    style={{
                      fontWeight: 700,
                      color: "#374151",
                      margin: "0 0 4px",
                    }}
                  >
                    You're not in any project yet
                  </p>
                  <p
                    style={{ fontSize: "0.85rem", color: "#9CA3AF", margin: 0 }}
                  >
                    Ask your admin to add you to a project
                  </p>
                </div>
              ) : taskLoading ? (
                <Spinner />
              ) : allProjectTasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 16px" }}>
                  <p style={{ fontSize: "2.5rem", margin: "0 0 10px" }}>📋</p>
                  <p
                    style={{
                      fontWeight: 700,
                      color: "#374151",
                      margin: "0 0 4px",
                    }}
                  >
                    No tasks in this project yet
                  </p>
                  <p
                    style={{ fontSize: "0.85rem", color: "#9CA3AF", margin: 0 }}
                  >
                    Tasks will appear here once your admin creates them
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={rectIntersection}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 14,
                    }}
                  >
                    {COL_CFG.map((col) => (
                      <DroppableCol
                        key={col.key}
                        col={col}
                        tasks={kanban[col.key]}
                        onView={setViewTask}
                        currentUserId={user._id}
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
                      <div style={{ width: 240 }}>
                        <KanbanCard
                          task={activeDragTask}
                          col={
                            COL_CFG.find(
                              (c) =>
                                c.key ===
                                (STATUS_COL[
                                  normalizeStatus(activeDragTask.status)
                                ] ?? "todo"),
                            ) ?? COL_CFG[0]
                          }
                          onView={() => {}}
                          currentUserId={user._id}
                          isOverlay
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </>
          ))}

        {/* ════════ MY SCHEDULE TAB ════════ */}
        {activeTab === "schedule" && (
          <>
            {/* Week navigator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => setWeekOffset((w) => w - 1)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: "1px solid #E9EBF0",
                    background: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6B7280",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#F9FAFB")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#fff")
                  }
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#111827",
                    minWidth: 200,
                    textAlign: "center",
                  }}
                >
                  {fmtDay(weekStart)} – {fmtDay(addDays(weekStart, 6))}
                  {weekOffset === 0 && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "#534AB7",
                        background: "#EEF1FD",
                        padding: "2px 8px",
                        borderRadius: 20,
                      }}
                    >
                      This Week
                    </span>
                  )}
                </span>
                <button
                  onClick={() => setWeekOffset((w) => w + 1)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: "1px solid #E9EBF0",
                    background: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6B7280",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#F9FAFB")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#fff")
                  }
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                {weekOffset !== 0 && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#534AB7",
                      background: "#EEF1FD",
                      border: "1px solid #C7D2F8",
                      borderRadius: 6,
                      padding: "4px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Today
                  </button>
                )}
              </div>
              {/* Legend */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(SHIFT_CFG).map(([k, v]) => (
                  <span
                    key={k}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: "0.68rem",
                      color: v.color,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: v.dot,
                      }}
                    />
                    {v.label}
                  </span>
                ))}
              </div>
            </div>

            {schedLoading ? (
              <Spinner />
            ) : (
              <>
                {/* My Schedule table */}
                <div
                  className="ds-card"
                  style={{ marginBottom: 20, padding: 0, overflow: "hidden" }}
                >
                  <div
                    style={{
                      padding: "14px 20px",
                      borderBottom: "1px solid #E9EBF0",
                      background: "#F9FAFB",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: "1rem" }}>📅</span>
                    <h3
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color: "#111827",
                      }}
                    >
                      My Schedule
                    </h3>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr style={{ borderBottom: "1px solid #E9EBF0" }}>
                          {["Day", "Date", "Shift"].map((h) => (
                            <th
                              key={h}
                              style={{
                                padding: "10px 20px",
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
                        {weekDates.map(({ day, date }) => {
                          const isToday = isoDate(date) === isoDate(new Date());
                          const shift = getEntry(mySchedule, day);
                          return (
                            <tr
                              key={day}
                              style={{
                                borderBottom: "1px solid #F3F4F6",
                                background: isToday ? "#FAFBFF" : undefined,
                                transition: "background .15s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#F9FAFB")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = isToday
                                  ? "#FAFBFF"
                                  : "")
                              }
                            >
                              <td
                                style={{
                                  padding: "12px 20px",
                                  fontWeight: isToday ? 700 : 500,
                                  color: isToday ? "#534AB7" : "#374151",
                                  fontSize: "0.875rem",
                                }}
                              >
                                {day}
                                {isToday && (
                                  <span
                                    style={{
                                      marginLeft: 6,
                                      fontSize: "0.65rem",
                                      fontWeight: 700,
                                      color: "#534AB7",
                                      background: "#EEF1FD",
                                      padding: "1px 6px",
                                      borderRadius: 10,
                                    }}
                                  >
                                    Today
                                  </span>
                                )}
                              </td>
                              <td
                                style={{
                                  padding: "12px 20px",
                                  fontSize: "0.85rem",
                                  color: "#6B7280",
                                }}
                              >
                                {fmtDay(date)}
                              </td>
                              <td style={{ padding: "12px 20px" }}>
                                <ShiftBadge shift={shift} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {teamSchedules.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "32px 16px",
                      background: "#F9FAFB",
                      borderRadius: 12,
                      border: "1px dashed #E9EBF0",
                    }}
                  >
                    <p style={{ fontSize: "1.6rem", margin: "0 0 8px" }}>🗓️</p>
                    <p
                      style={{
                        fontWeight: 700,
                        color: "#374151",
                        margin: "0 0 4px",
                      }}
                    >
                      No team schedule yet
                    </p>
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: "#9CA3AF",
                        margin: 0,
                      }}
                    >
                      Ask your project admin to set up shifts for this week
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* View / Assign task modal */}
      <ViewTaskModal
        task={viewTask}
        isOpen={!!viewTask}
        onClose={() => setViewTask(null)}
        isAdmin={false}
        currentUserId={user._id}
        onAssigneesChange={handleAssigneesChange}
      />

      {/* Automatic Stock Deduction popup */}
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

export default UserDashboard;
