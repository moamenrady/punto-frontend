import React, { useState } from "react";
import {
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
  ListChecks,
  Inbox,
  Users,
} from "lucide-react";
import { AiFeatures } from "../services/aiOpsService";

const PRIORITY_STYLES = {
  high: "bg-red-50 text-red-600 ring-1 ring-red-200",
  medium: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
  low: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200",
};

/**
 * AIAutoAssignModal
 *
 * A focused flow for handing an entire backlog to the AI:
 *   1. Pick a backlog (or arrive with one pre-selected via defaultBacklogId,
 *      e.g. when opened from that backlog's own row).
 *   2. Pick the team that should take the work.
 *   3. "Auto-Assign All with AI" - the AI distributes every task in that
 *      backlog across that team's members in one bulk call.
 *
 * Wired to the real /api/ai/assign-bulk-tasks route (via
 * AiFeatures.assignBulkTasks) - the backend requires a team to be chosen
 * up front; there is no backend route that lets the AI pick a team with
 * zero input, so a team picker is a required step here, not optional
 * context.
 *
 * Props:
 *  - isOpen, onClose
 *  - backlogs        - [{ _id, name, backlog_goal? }] backlogs to choose from
 *  - tasksByBacklog   - { [backlogId]: Task[] } tasks that live in each backlog
 *  - teams            - [{ _id, name, members? }] teams to assign the backlog to
 *  - defaultBacklogId - preselect a backlog (e.g. opened from that backlog's row)
 *  - onAssigned       - fn(result, backlog, team) after a successful assignment
 */
const AIAutoAssignModal = ({
  isOpen,
  onClose,
  backlogs = [],
  tasksByBacklog = {},
  teams = [],
  defaultBacklogId = "",
  onAssigned,
}) => {
  const [selectedBacklogId, setSelectedBacklogId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setSelectedBacklogId(defaultBacklogId || "");
      setSelectedTeamId("");
      setError(null);
      setResult(null);
      setIsAssigning(false);
    }
  }

  if (!isOpen) return null;

  const selectedBacklog = backlogs.find((bl) => bl._id === selectedBacklogId) ?? null;
  const selectedTeam = teams.find((t) => t._id === selectedTeamId) ?? null;
  const tasks = tasksByBacklog[selectedBacklogId] ?? [];
  const canSubmit = Boolean(selectedBacklogId) && Boolean(selectedTeamId) && tasks.length > 0 && !isAssigning;

  const handleAutoAssign = async () => {
    if (!canSubmit) return;
    setIsAssigning(true);
    setError(null);
    setResult(null);

    try {
      const data = await AiFeatures.assignBulkTasks({
        taskIds: tasks.map((t) => t._id),
        teamId: selectedTeamId,
      });

      setResult(data ?? { message: "Tasks assigned successfully." });
      onAssigned?.(data, selectedBacklog, selectedTeam);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col bg-white rounded-3xl border border-gray-100 shadow-2xl ring-1 ring-black/5 overflow-hidden">
        <div className="relative px-6 py-5 bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 text-white shrink-0 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 right-16 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                <Sparkles size={19} />
              </div>
              <div>
                <h2 className="font-semibold text-base leading-tight">AI Auto-Assign</h2>
                <p className="text-[12.5px] text-white/75 mt-0.5">
                  Pick a backlog and a team, the AI splits the work across them
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors shrink-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto">
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 mb-2">
              <Layers size={14} className="text-indigo-600" />
              Backlog
            </label>

            {backlogs.length === 0 ? (
              <div className="flex items-center gap-2 text-[13px] text-gray-400 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
                <Inbox size={16} className="shrink-0" />
                No backlogs available. Create one first.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1 -mr-1">
                {backlogs.map((bl) => {
                  const count = (tasksByBacklog[bl._id] ?? []).length;
                  const isSelected = bl._id === selectedBacklogId;
                  const isEmpty = count === 0;
                  return (
                    <button
                      type="button"
                      key={bl._id}
                      disabled={isAssigning}
                      onClick={() => setSelectedBacklogId(bl._id)}
                      className={[
                        "w-full text-left rounded-2xl border px-3.5 py-2.5 flex items-center gap-3 transition-colors",
                        isSelected
                          ? "border-indigo-300 bg-indigo-50/70 ring-1 ring-indigo-200"
                          : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50",
                        isAssigning ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                      ].join(" ")}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-medium text-gray-900 truncate">
                          {bl.name}
                        </p>
                        {bl.backlog_goal && (
                          <p className="text-[12px] text-gray-400 truncate">{bl.backlog_goal}</p>
                        )}
                      </div>
                      <span
                        className={[
                          "text-[11px] font-semibold rounded-full px-2.5 py-1 shrink-0",
                          isEmpty
                            ? "bg-gray-100 text-gray-400"
                            : "bg-indigo-100 text-indigo-700",
                        ].join(" ")}
                      >
                        {count} {count === 1 ? "task" : "tasks"}
                      </span>
                      {isSelected && (
                        <CheckCircle2 size={17} className="text-indigo-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedBacklogId && (
            <div>
              <label className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 mb-2">
                <ListChecks size={14} className="text-indigo-600" />
                Tasks the AI will assign
              </label>

              {tasks.length === 0 ? (
                <p className="text-[13px] text-gray-400 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
                  This backlog has no tasks yet.
                </p>
              ) : (
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50/60 p-1.5">
                  {tasks.map((t) => (
                    <div
                      key={t._id}
                      className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-1.5 border border-gray-100"
                    >
                      <span className="text-[12.5px] text-gray-700 truncate">{t.name}</span>
                      {t.priority && (
                        <span
                          className={[
                            "text-[10.5px] font-semibold rounded-full px-2 py-0.5 shrink-0 capitalize",
                            PRIORITY_STYLES[t.priority] ?? "bg-gray-100 text-gray-500",
                          ].join(" ")}
                        >
                          {t.priority}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className={!selectedBacklogId ? "opacity-50 pointer-events-none select-none" : ""}>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 mb-2">
              <Users size={14} className="text-indigo-600" />
              Team
            </label>

            {teams.length === 0 ? (
              <div className="flex items-center gap-2 text-[13px] text-gray-400 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
                <Inbox size={16} className="shrink-0" />
                No teams available. Create one first.
              </div>
            ) : (
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={!selectedBacklogId || isAssigning}
                className="w-full rounded-2xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 bg-white text-gray-900"
              >
                <option value="">Select a team...</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name} {team.members?.length ? `(${team.members.length} members)` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-2xl px-3.5 py-2.5">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && !error && (
            <div className="flex items-center gap-2 text-[13px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl px-3.5 py-2.5">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{result.message || "The AI has assigned this backlog."}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 shrink-0">
          <button
            onClick={handleAutoAssign}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-white text-sm font-semibold py-3 hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isAssigning ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Assigning {tasks.length} task{tasks.length === 1 ? "" : "s"}...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {tasks.length > 0
                  ? `Auto-Assign All with AI (${tasks.length})`
                  : "Auto-Assign All with AI"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAutoAssignModal;
