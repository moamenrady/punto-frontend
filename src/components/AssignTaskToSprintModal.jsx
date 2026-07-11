import React, { useState, useEffect } from 'react';
import { projectService } from '../services/projectService';

/**
 * Props:
 *  isOpen       – boolean
 *  onClose      – fn
 *  sprintId     – string
 *  sprintName   – string
 *  backlogs     – [{ _id, name }]
 *  projectId    – string
 *  onDone       – fn() called after assigning
 */
const AssignTaskToSprintModal = ({ isOpen, onClose, sprintId, sprintName, backlogs = [], projectId, onDone }) => {
  const [selectedBacklogId, setSelectedBacklogId] = useState('');
  const [tasks, setTasks]                         = useState([]);
  const [tasksLoading, setTasksLoading]           = useState(false);
  const [selectedTaskIds, setSelectedTaskIds]     = useState([]);
  const [submitting, setSubmitting]               = useState(false);
  const [msg, setMsg]                             = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSelectedBacklogId('');
      setTasks([]);
      setSelectedTaskIds([]);
      setMsg('');
    }
  }, [isOpen]);

  // Fetch tasks when backlog changes
  useEffect(() => {
    if (!selectedBacklogId) { setTasks([]); return; }
    (async () => {
      try {
        setTasksLoading(true);
        const all = await projectService.getTasksByBacklog(selectedBacklogId);
        // Show only tasks not already in a sprint
        setTasks(all.filter(t => !t.sprint_id));
      } catch (e) {
        console.error(e);
        setTasks([]);
      } finally {
        setTasksLoading(false);
      }
    })();
  }, [selectedBacklogId]);

  if (!isOpen) return null;

  const toggle = (id) => setSelectedTaskIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const handleAssign = async () => {
    if (!selectedTaskIds.length) return;
    setSubmitting(true);
    setMsg('');
    try {
      await Promise.all(selectedTaskIds.map(taskId => {
        const task = tasks.find(t => t._id === taskId);
        const backlogId = task?.backlog_id?._id ?? task?.backlog_id ?? selectedBacklogId;
        return projectService.updateTask(backlogId, taskId, { sprint_id: sprintId });
      }));
      setMsg(`✅ ${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's' : ''} assigned to sprint!`);
      setTimeout(() => { onDone?.(); onClose(); }, 800);
    } catch (e) {
      setMsg(`❌ Failed: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const PRIORITY_STYLE = {
    high:   { bg: '#FEE2E2', color: '#DC2626' },
    medium: { bg: '#FEF3C7', color: '#D97706' },
    low:    { bg: '#D1FAE5', color: '#059669' },
  };

  return (
    <div className="ds-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="ds-modal" style={{ maxWidth: 540 }}>

        {/* Header */}
        <div className="ds-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF1FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <h2 className="ds-modal-title" style={{ marginBottom: 0 }}>Add Tasks to Sprint</h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#9CA3AF' }}>{sprintName}</p>
            </div>
          </div>
          <button className="ds-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="ds-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Step 1: Select Backlog */}
          <div className="ds-form-group">
            <label className="ds-label">
              1. Select Backlog <span style={{ color: '#EF4444' }}>*</span>
            </label>
            {backlogs.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: '#EF4444', margin: 0 }}>No backlogs available.</p>
            ) : (
              <select
                className="ds-select"
                value={selectedBacklogId}
                onChange={e => { setSelectedBacklogId(e.target.value); setSelectedTaskIds([]); }}
              >
                <option value="" disabled>Select a backlog…</option>
                {backlogs.map(bl => <option key={bl._id} value={bl._id}>{bl.name}</option>)}
              </select>
            )}
          </div>

          {/* Step 2: Select Tasks */}
          {selectedBacklogId && (
            <div className="ds-form-group">
              <label className="ds-label">
                2. Select Tasks to Add
                {selectedTaskIds.length > 0 && (
                  <span style={{ marginLeft: 8, fontSize: '0.72rem', fontWeight: 700, color: '#534AB7', background: '#EEF1FD', padding: '1px 8px', borderRadius: 20 }}>
                    {selectedTaskIds.length} selected
                  </span>
                )}
              </label>

              {tasksLoading ? (
                <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '16px 0', fontSize: '0.85rem' }}>Loading tasks…</p>
              ) : tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 16px', background: '#F9FAFB', borderRadius: 10, border: '1px dashed #E9EBF0' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#9CA3AF' }}>No unassigned tasks in this backlog</p>
                </div>
              ) : (
                <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
                  {tasks.map(t => {
                    const selected = selectedTaskIds.includes(t._id);
                    const p = PRIORITY_STYLE[t.priority?.toLowerCase()] ?? PRIORITY_STYLE.medium;
                    return (
                      <div
                        key={t._id}
                        onClick={() => toggle(t._id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                          border: selected ? '1.5px solid #534AB7' : '1.5px solid #E9EBF0',
                          background: selected ? '#F5F4FF' : '#fff',
                          transition: 'all .15s',
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                          border: selected ? '2px solid #534AB7' : '2px solid #D1D5DB',
                          background: selected ? '#534AB7' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all .15s',
                        }}>
                          {selected && (
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>

                        {/* Task info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#111827', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {t.name}
                          </p>
                          {t.description && (
                            <p style={{ margin: 0, fontSize: '0.72rem', color: '#9CA3AF', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                              {t.description}
                            </p>
                          )}
                        </div>

                        {/* Priority badge */}
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: p.bg, color: p.color, flexShrink: 0 }}>
                          {t.priority ?? 'medium'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Message */}
          {msg && (
            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: msg.startsWith('✅') ? '#059669' : '#DC2626', textAlign: 'center' }}>
              {msg}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="ds-modal-footer">
          <button type="button" className="ds-btn ds-btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="ds-btn ds-btn-primary"
            disabled={!selectedTaskIds.length || submitting}
            style={{ opacity: (!selectedTaskIds.length || submitting) ? 0.5 : 1 }}
            onClick={handleAssign}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            {submitting ? 'Assigning…' : `Add to Sprint${selectedTaskIds.length > 0 ? ` (${selectedTaskIds.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignTaskToSprintModal;