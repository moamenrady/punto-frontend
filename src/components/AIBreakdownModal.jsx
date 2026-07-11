import React, { useEffect, useState } from "react";
import { AiFeatures, TaskManagement } from "../services/aiOpsService";

let rowIdCounter = 0;
const nextRowId = () => `bd-row-${Date.now()}-${rowIdCounter++}`;

/**
 * AIBreakdownModal — "AI Breakdown" + "Assign & Save" flow.
 *
 * Step 1 (idea): manager describes the big project idea.
 *   POST /api/ai/breakdown-task -> [{ name, description, priority }]
 * Step 2 (review): editable table — pick a backlog for the batch and an
 *   assignee per row, tweak priority if needed.
 *   "Assign & Save" -> POST /api/ai/bulk-create-tasks
 *
 * Props:
 *  - isOpen, onClose
 *  - backlogs   – [{ _id, name }] for the currently selected project
 *  - members    – [{ _id, name, role }] project members, for the assignee picker
 *  - companyId  – current user's company_id
 *  - createdBy  – current user's _id
 *  - onCreated  – fn() called after a successful save, so the parent can refresh + close
 */
const AIBreakdownModal = ({ isOpen, onClose, backlogs = [], members = [], companyId, createdBy, onCreated }) => {
  const [step, setStep] = useState("idea"); // 'idea' | 'review'
  const [description, setDescription] = useState("");
  const [isBreaking, setIsBreaking] = useState(false);
  const [breakdownError, setBreakdownError] = useState(null);

  const [rows, setRows] = useState([]);
  const [backlogId, setBacklogId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep("idea");
      setDescription("");
      setBreakdownError(null);
      setRows([]);
      setBacklogId(backlogs[0]?._id ?? "");
      setSaveError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBreakdown = async () => {
    if (!description.trim()) return;
    setIsBreaking(true);
    setBreakdownError(null);
    try {
      const data = await AiFeatures.breakdownTask({ description: description.trim() });
      const list = Array.isArray(data) ? data : data?.tasks ?? data?.data ?? [];
      if (!list.length) {
        setBreakdownError("The AI didn't return any tasks — try describing the idea in more detail.");
        return;
      }
      setRows(
        list.map((t) => ({
          id: nextRowId(),
          name: t.name ?? "",
          description: t.description ?? "",
          priority: (t.priority ?? "medium").toLowerCase(),
          assignedTo: "",
        }))
      );
      setStep("review");
    } catch (err) {
      setBreakdownError(err.message);
    } finally {
      setIsBreaking(false);
    }
  };

  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSave = async () => {
    if (!backlogId) {
      setSaveError("Select a backlog to save these tasks into.");
      return;
    }
    if (rows.length === 0) {
      setSaveError("No tasks left to save.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await TaskManagement.bulkCreateTasks({
        companyId,
        createdBy,
        tasks: rows.map((r) => ({
          name: r.name,
          description: r.description,
          priority: r.priority,
          assignedTo: r.assignedTo || undefined,
          backlogId,
        })),
      });
      onCreated?.();
      onClose?.();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="ds-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="ds-modal" style={{ maxWidth: step === "review" ? 880 : 560 }}>
        <div className="ds-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#EEF1FD", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "1rem" }}>✨</span>
            </div>
            <h2 className="ds-modal-title" style={{ marginBottom: 0 }}>AI Breakdown</h2>
          </div>
          <button className="ds-modal-close" onClick={onClose}>×</button>
        </div>

        {step === "idea" && (
          <>
            <div className="ds-modal-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#6B7280" }}>
                Describe the big project idea and the AI will break it into smaller tasks you can assign.
              </p>
              <textarea
                className="ds-textarea"
                style={{ width: "100%", minHeight: 140 }}
                placeholder="e.g. We need to migrate the whole office network to a new VLAN setup and roll out new switches per floor..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {breakdownError && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", fontSize: "0.82rem", color: "#DC2626" }}>
                  {breakdownError}
                </div>
              )}
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn ds-btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>
                Cancel
              </button>
              <button
                className="ds-btn ds-btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
                disabled={!description.trim() || isBreaking}
                onClick={handleBreakdown}
              >
                {isBreaking ? "Breaking it down..." : "✨ AI Breakdown"}
              </button>
            </div>
          </>
        )}

        {step === "review" && (
          <>
            <div className="ds-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label className="ds-label">Save into backlog</label>
                  {backlogs.length === 0 ? (
                    <p style={{ fontSize: "0.82rem", color: "#EF4444", margin: 0 }}>No backlogs available in this project — create one first.</p>
                  ) : (
                    <select className="ds-select" value={backlogId} onChange={(e) => setBacklogId(e.target.value)}>
                      {backlogs.map((bl) => (
                        <option key={bl._id} value={bl._id}>{bl.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", background: "#F3F4F6", border: "1px solid #E9EBF0", borderRadius: 20, padding: "4px 12px" }}>
                  {rows.length} task{rows.length === 1 ? "" : "s"}
                </span>
              </div>

              <div style={{ overflowX: "auto", border: "1px solid #E9EBF0", borderRadius: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E9EBF0", background: "#F9FAFB" }}>
                      {["#", "Task Name", "Description", "Priority", "Assign To", ""].map((h) => (
                        <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: "0.68rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "8px 12px", fontSize: "0.78rem", color: "#9CA3AF", fontWeight: 600 }}>{i + 1}</td>
                        <td style={{ padding: "8px 12px", minWidth: 160 }}>
                          <input
                            className="ds-input"
                            style={{ fontSize: "0.82rem", padding: "6px 10px" }}
                            value={r.name}
                            onChange={(e) => updateRow(r.id, { name: e.target.value })}
                          />
                        </td>
                        <td style={{ padding: "8px 12px", minWidth: 220 }}>
                          <input
                            className="ds-input"
                            style={{ fontSize: "0.82rem", padding: "6px 10px" }}
                            value={r.description}
                            onChange={(e) => updateRow(r.id, { description: e.target.value })}
                          />
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <select
                            className="ds-select"
                            style={{ fontSize: "0.82rem", padding: "6px 8px" }}
                            value={r.priority}
                            onChange={(e) => updateRow(r.id, { priority: e.target.value })}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </td>
                        <td style={{ padding: "8px 12px", minWidth: 160 }}>
                          <select
                            className="ds-select"
                            style={{ fontSize: "0.82rem", padding: "6px 8px" }}
                            value={r.assignedTo}
                            onChange={(e) => updateRow(r.id, { assignedTo: e.target.value })}
                          >
                            <option value="">Unassigned</option>
                            {members.map((m) => (
                              <option key={m._id} value={m._id}>{m.name}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <button
                            type="button"
                            onClick={() => removeRow(r.id)}
                            style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#9CA3AF", fontSize: "0.82rem" }}>
                          All tasks removed.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {saveError && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", fontSize: "0.82rem", color: "#DC2626" }}>
                  {saveError}
                </div>
              )}
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn ds-btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setStep("idea")}>
                ← Back
              </button>
              <button
                className="ds-btn ds-btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
                disabled={isSaving || rows.length === 0 || !backlogId}
                onClick={handleSave}
              >
                {isSaving ? "Saving..." : "Assign & Save"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIBreakdownModal;
