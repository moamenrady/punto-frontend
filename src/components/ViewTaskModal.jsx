import React, { useState, useEffect } from 'react';
import HelpSolveModal from './HelpSolveModal';

const statusStyle = {
    'To Do':       { background: '#DBEAFE', color: '#1E40AF' },
    'In Progress': { background: '#FEF3C7', color: '#92400E' },
    'Completed':   { background: '#D1FAE5', color: '#065F46' },
};
const priorityStyle = {
    high:   { background: '#FCE7F3', color: '#9D174D' },
    medium: { background: '#FEF3C7', color: '#92400E' },
    low:    { background: '#D1FAE5', color: '#065F46' },
};

const Avatar = ({ name = '?', size = 26 }) => (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'linear-gradient(135deg,#8A9FE8,#6B82D8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:`${size*0.38}px`, fontWeight:800, color:'#fff', flexShrink:0 }}>
        {(name||'?').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}
    </div>
);

/**
 * Props:
 *  task             – the raw task object from the DB (with assigned_to populated)
 *  isOpen           – boolean
 *  onClose          – fn
 *  isAdmin          – boolean  (admin gets full assignee editor)
 *  members          – [{ _id, name, role }]  project members (admin only)
 *  currentUserId    – string  (logged-in user's _id)
 *  onAssigneesChange – async fn(taskId, backlogId, newAssigneeIds[]) → void
 */
const ViewTaskModal = ({
    task,
    isOpen,
    onClose,
    isAdmin       = false,
    members       = [],
    currentUserId = null,
    onAssigneesChange,
}) => {
    const [editingAssignees, setEditingAssignees] = useState(false);
    const [selectedIds,      setSelectedIds]      = useState([]);
    const [saving,           setSaving]           = useState(false);
    const [showHelpSolve,    setShowHelpSolve]    = useState(false);

    // Sync selected IDs whenever the task changes or modal opens
    useEffect(() => {
        if (!isOpen) { setEditingAssignees(false); return; }
        if (task) {
            setSelectedIds((task.assigned_to ?? []).map(u => u._id ?? u));
        }
    }, [task, isOpen]);

    if (!isOpen || !task) return null;

    const assignees  = task.assigned_to ?? [];
    const backlogId  = task.backlog_id?._id ?? task.backlog_id;
    const statusKey  = task.status ?? 'To Do';
    const priorityKey = (task.priority ?? 'medium').toLowerCase();

    const isAssignedToMe = currentUserId
        ? assignees.some(u => String(u._id ?? u) === String(currentUserId))
        : false;

    // ── self-assign / unassign ──────────────────────────────────────────────────
    const handleSelfToggle = async () => {
        if (!onAssigneesChange) return;
        setSaving(true);
        try {
            const currentIds = assignees.map(u => String(u._id ?? u));
            const newIds = isAssignedToMe
                ? currentIds.filter(id => id !== String(currentUserId))
                : [...currentIds, String(currentUserId)];
            await onAssigneesChange(task._id, backlogId, newIds);
        } catch (e) { alert(e.message); }
        finally { setSaving(false); }
    };

    // ── admin save ─────────────────────────────────────────────────────────────
    const handleSaveAssignees = async () => {
        if (!onAssigneesChange) return;
        setSaving(true);
        try {
            await onAssigneesChange(task._id, backlogId, selectedIds);
            setEditingAssignees(false);
        } catch (e) { alert(e.message); }
        finally { setSaving(false); }
    };

    const toggleMember = (id) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    // ── render ─────────────────────────────────────────────────────────────────
    return (
        <div className="ds-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
            <div className="ds-modal" style={{ maxWidth: 500 }}>

                {/* Header */}
                <div className="ds-modal-header">
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:8, background:'#EEF1FD', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#8A9FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                        </div>
                        <h2 className="ds-modal-title">Task Details</h2>
                    </div>
                    <button className="ds-modal-close" onClick={onClose}>×</button>
                </div>

                <div className="ds-modal-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>

                    {/* Task name */}
                    <div style={{ background:'#F9FAFB', border:'1px solid #E9EBF0', borderRadius:8, padding:'10px 14px' }}>
                        <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Task Name</div>
                        <div style={{ fontSize:'0.9rem', fontWeight:700, color:'#111827' }}>{task.name ?? task.title}</div>
                    </div>

                    {/* Status + Priority */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <div style={{ background:'#F9FAFB', border:'1px solid #E9EBF0', borderRadius:8, padding:'10px 14px' }}>
                            <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Status</div>
                            <span className="ds-badge" style={statusStyle[statusKey] ?? { background:'#F1F5F9', color:'#475569' }}>{statusKey}</span>
                        </div>
                        <div style={{ background:'#F9FAFB', border:'1px solid #E9EBF0', borderRadius:8, padding:'10px 14px' }}>
                            <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Priority</div>
                            <span className="ds-badge" style={priorityStyle[priorityKey] ?? { background:'#F1F5F9', color:'#475569' }}>
                                {priorityKey.charAt(0).toUpperCase() + priorityKey.slice(1)}
                            </span>
                        </div>
                    </div>

                    {/* Sprint */}
                    {task.sprint_id?.name && (
                        <div style={{ background:'#F9FAFB', border:'1px solid #E9EBF0', borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#534AB7" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                            <div>
                                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em' }}>Sprint</div>
                                <div style={{ fontSize:'0.85rem', fontWeight:600, color:'#534AB7' }}>{task.sprint_id.name}</div>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {task.description && (
                        <div style={{ background:'#F9FAFB', border:'1px solid #E9EBF0', borderRadius:8, padding:'10px 14px' }}>
                            <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Description</div>
                            <div style={{ fontSize:'0.875rem', color:'#6B7280', lineHeight:1.6 }}>{task.description}</div>
                        </div>
                    )}

                    {/* ── Assigned To section ──────────────────────────────────────────────── */}
                    <div style={{ background:'#F9FAFB', border:'1px solid #E9EBF0', borderRadius:8, padding:'10px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                            <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                                Assigned To
                                {assignees.length > 0 && (
                                    <span style={{ marginLeft:6, background:'#EEF1FD', color:'#534AB7', borderRadius:20, padding:'1px 7px', fontSize:'0.68rem' }}>
                                        {assignees.length}
                                    </span>
                                )}
                            </div>

                            {/* Admin edit button */}
                            {isAdmin && members.length > 0 && onAssigneesChange && !editingAssignees && (
                                <button
                                    onClick={() => setEditingAssignees(true)}
                                    style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.75rem', fontWeight:700, color:'#534AB7', background:'#EEF1FD', border:'1px solid #C7D2F8', borderRadius:6, padding:'3px 10px', cursor:'pointer', transition:'background .15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background='#E0E7FF'}
                                    onMouseLeave={e => e.currentTarget.style.background='#EEF1FD'}
                                >
                                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Edit
                                </button>
                            )}
                        </div>

                        {/* Current assignees list */}
                        {!editingAssignees && (
                            assignees.length === 0 ? (
                                <p style={{ margin:0, fontSize:'0.82rem', color:'#D1D5DB', fontStyle:'italic' }}>No one assigned yet</p>
                            ) : (
                                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                                    {assignees.map((u, i) => {
                                        const name = u.name ?? '?';
                                        const isMe = currentUserId && String(u._id ?? u) === String(currentUserId);
                                        return (
                                            <div key={u._id ?? i} style={{ display:'flex', alignItems:'center', gap:9 }}>
                                                <Avatar name={name} size={28} />
                                                <div style={{ flex:1, minWidth:0 }}>
                                                    <p style={{ margin:0, fontSize:'0.82rem', fontWeight:700, color:'#111827' }}>
                                                        {name}
                                                        {isMe && <span style={{ marginLeft:6, fontSize:'0.65rem', fontWeight:700, color:'#534AB7', background:'#EEF1FD', padding:'1px 6px', borderRadius:10 }}>You</span>}
                                                    </p>
                                                    <p style={{ margin:0, fontSize:'0.7rem', color:'#9CA3AF', textTransform:'capitalize' }}>{u.role ?? ''}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        )}

                        {/* Admin: editable member picker */}
                        {editingAssignees && (
                            <div>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:7, padding:'8px', border:'1px solid #E9EBF0', borderRadius:8, background:'#fff', maxHeight:160, overflowY:'auto', marginBottom:10 }}>
                                    {members.map(m => {
                                        const sel = selectedIds.includes(String(m._id));
                                        return (
                                            <button
                                                key={m._id}
                                                type="button"
                                                onClick={() => toggleMember(String(m._id))}
                                                style={{
                                                    display:'flex', alignItems:'center', gap:6,
                                                    padding:'4px 10px', borderRadius:20, cursor:'pointer',
                                                    border: sel ? '1.5px solid #534AB7' : '1.5px solid #E9EBF0',
                                                    background: sel ? '#EEF1FD' : '#fff',
                                                    color: sel ? '#534AB7' : '#6B7280',
                                                    fontWeight: sel ? 700 : 500,
                                                    fontSize:'0.78rem', transition:'all .15s',
                                                }}
                                            >
                                                <Avatar name={m.name ?? '?'} size={18} />
                                                {m.name?.split(' ')[0]}
                                                {sel && (
                                                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                                )}
                                            </button>
                                        );
                                    })}
                                    {members.length === 0 && (
                                        <p style={{ margin:0, fontSize:'0.8rem', color:'#9CA3AF' }}>No project members to assign</p>
                                    )}
                                </div>
                                <div style={{ display:'flex', gap:8 }}>
                                    <button
                                        onClick={() => { setEditingAssignees(false); setSelectedIds((task.assigned_to??[]).map(u=>u._id??u)); }}
                                        style={{ flex:1, padding:'7px', borderRadius:8, border:'1px solid #E9EBF0', background:'#F9FAFB', cursor:'pointer', fontSize:'0.82rem', fontWeight:600, color:'#6B7280' }}
                                    >Cancel</button>
                                    <button
                                        onClick={handleSaveAssignees}
                                        disabled={saving}
                                        style={{ flex:1, padding:'7px', borderRadius:8, border:'none', background:'#534AB7', color:'#fff', cursor:saving?'not-allowed':'pointer', fontSize:'0.82rem', fontWeight:700, opacity:saving?0.7:1 }}
                                    >{saving ? 'Saving…' : 'Save Assignees'}</button>
                                </div>
                            </div>
                        )}

                        {/* User: self-assign / unassign button */}
                        {!isAdmin && currentUserId && onAssigneesChange && (
                            <div style={{ marginTop: assignees.length > 0 ? 12 : 0, paddingTop: assignees.length > 0 ? 10 : 0, borderTop: assignees.length > 0 ? '1px dashed #E9EBF0' : undefined }}>
                                <button
                                    onClick={handleSelfToggle}
                                    disabled={saving}
                                    style={{
                                        display:'flex', alignItems:'center', gap:7,
                                        padding:'7px 14px', borderRadius:8, cursor:saving?'not-allowed':'pointer',
                                        border: isAssignedToMe ? '1.5px solid #FECACA' : '1.5px solid #C7D2F8',
                                        background: isAssignedToMe ? '#FEF2F2' : '#EEF1FD',
                                        color: isAssignedToMe ? '#DC2626' : '#534AB7',
                                        fontWeight:700, fontSize:'0.82rem', transition:'all .2s',
                                        opacity:saving?0.7:1,
                                    }}
                                >
                                    {isAssignedToMe ? (
                                        <>
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                            {saving ? 'Updating…' : 'Unassign me from this task'}
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                            {saving ? 'Updating…' : 'Assign this task to me'}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Creator */}
                    {task.created_by?.name && (
                        <div style={{ background:'#F9FAFB', border:'1px solid #E9EBF0', borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
                            <Avatar name={task.created_by.name} size={24} />
                            <div>
                                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em' }}>Created By</div>
                                <div style={{ fontSize:'0.82rem', fontWeight:600, color:'#374151' }}>{task.created_by.name}</div>
                            </div>
                        </div>
                    )}

                </div>

                <div className="ds-modal-footer">
                    <button
                        className="ds-btn ds-btn-secondary"
                        style={{ justifyContent:'center', flex:1, color:'#534AB7', borderColor:'#C7D2F8', background:'#EEF1FD' }}
                        onClick={() => setShowHelpSolve(true)}
                    >
                        🧠 Help me solve
                    </button>
                    <button className="ds-btn ds-btn-secondary" style={{ justifyContent:'center', flex:1 }} onClick={onClose}>Close</button>
                </div>
            </div>

            <HelpSolveModal
                isOpen={showHelpSolve}
                onClose={() => setShowHelpSolve(false)}
                itemId={task._id}
                itemType="task"
                itemLabel={task.name ?? task.title}
            />
        </div>
    );
};

export default ViewTaskModal;
