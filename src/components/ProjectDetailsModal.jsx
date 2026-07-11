import React from 'react';

/**
 * ProjectDetailsModal
 * Props:
 *  isOpen   – boolean
 *  onClose  – fn
 *  project  – full project object
 *  stats    – { sprints, backlogs, tasks, completed }
 *  isAdmin  – boolean
 *  onManageTeam – fn  (opens AddMemberModal)
 */
const ProjectDetailsModal = ({ isOpen, onClose, project, stats = {}, isAdmin, onManageTeam }) => {
    if (!isOpen || !project) return null;

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';

    const roleColor = (role) => ({ admin: '#DC2626', manager: '#D97706', user: '#059669' }[role] ?? '#6B7280');
    const roleBg    = (role) => ({ admin: '#FEE2E2', manager: '#FEF3C7', user: '#D1FAE5' }[role] ?? '#F3F4F6');

    const members = project.members ?? [];
    const completionPct = stats.tasks ? Math.round((stats.completed / stats.tasks) * 100) : 0;

    return (
        <div className="ds-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
            <div className="ds-modal" style={{ maxWidth:560, width:'100%' }}>
                {/* Header */}
                <div className="ds-modal-header">
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#8A9FE8,#534AB7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', fontWeight:800, color:'#fff', flexShrink:0 }}>
                            {project.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="ds-modal-title" style={{ marginBottom:2 }}>{project.name}</h2>
                            <p style={{ margin:0, fontSize:'0.75rem', color:'#9CA3AF' }}>Created {fmt(project.createdAt)}</p>
                        </div>
                    </div>
                    <button className="ds-modal-close" onClick={onClose}>×</button>
                </div>

                <div className="ds-modal-body" style={{ display:'flex', flexDirection:'column', gap:20 }}>
                    {/* Description */}
                    {project.description && (
                        <div>
                            <p style={{ margin:'0 0 4px', fontSize:'0.72rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em' }}>Description</p>
                            <p style={{ margin:0, fontSize:'0.875rem', color:'#374151', lineHeight:1.6 }}>{project.description}</p>
                        </div>
                    )}

                    {/* Stats grid */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                        {[
                            { label:'Sprints',    value: stats.sprints   ?? 0, color:'#534AB7', bg:'#EEF1FD' },
                            { label:'Backlogs',   value: stats.backlogs  ?? 0, color:'#D97706', bg:'#FEF3C7' },
                            { label:'Tasks',      value: stats.tasks     ?? 0, color:'#6B7280', bg:'#F3F4F6' },
                            { label:'Done',       value: stats.completed ?? 0, color:'#059669', bg:'#D1FAE5' },
                        ].map(s => (
                            <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:'12px', textAlign:'center' }}>
                                <p style={{ margin:'0 0 4px', fontSize:'1.4rem', fontWeight:800, color:s.color }}>{s.value}</p>
                                <p style={{ margin:0, fontSize:'0.7rem', fontWeight:700, color:s.color, textTransform:'uppercase', letterSpacing:'0.06em', opacity:0.7 }}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Progress bar */}
                    {(stats.tasks ?? 0) > 0 && (
                        <div>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                                <p style={{ margin:0, fontSize:'0.78rem', fontWeight:600, color:'#374151' }}>Overall Progress</p>
                                <p style={{ margin:0, fontSize:'0.78rem', fontWeight:700, color:'#059669' }}>{completionPct}%</p>
                            </div>
                            <div style={{ height:8, background:'#E9EBF0', borderRadius:99, overflow:'hidden' }}>
                                <div style={{ height:'100%', width:`${completionPct}%`, background:'linear-gradient(90deg,#534AB7,#3ECFAA)', borderRadius:99, transition:'width .5s ease' }} />
                            </div>
                        </div>
                    )}

                    {/* Created by */}
                    <div>
                        <p style={{ margin:'0 0 8px', fontSize:'0.72rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em' }}>Created By</p>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#8A9FE8,#6B82D8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:800, color:'#fff' }}>
                                {project.created_by?.name?.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() ?? '?'}
                            </div>
                            <div>
                                <p style={{ margin:0, fontWeight:700, fontSize:'0.875rem', color:'#111827' }}>{project.created_by?.name ?? '—'}</p>
                                <p style={{ margin:0, fontSize:'0.75rem', color:'#9CA3AF' }}>{project.created_by?.email ?? ''}</p>
                            </div>
                        </div>
                    </div>

                    {/* Team members */}
                    <div>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                            <p style={{ margin:0, fontSize:'0.72rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em' }}>Team ({members.length})</p>
                            {isAdmin && (
                                <button
                                    onClick={() => { onClose(); onManageTeam?.(); }}
                                    style={{ fontSize:'0.78rem', fontWeight:600, color:'#534AB7', background:'#EEF1FD', border:'1px solid #C7D2F8', borderRadius:6, padding:'4px 10px', cursor:'pointer' }}>
                                    Manage Team
                                </button>
                            )}
                        </div>
                        {members.length === 0 ? (
                            <p style={{ color:'#D1D5DB', fontSize:'0.85rem', margin:0 }}>No team members added yet</p>
                        ) : (
                            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                                {members.filter(Boolean).map(m => (
                                    <div key={m._id} title={`${m.name} (${m.email})`}
                                        style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px 6px 8px', background:'#F9FAFB', border:'1px solid #E9EBF0', borderRadius:20 }}>
                                        <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#8A9FE8,#6B82D8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.68rem', fontWeight:800, color:'#fff', flexShrink:0 }}>
                                            {m.name?.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}
                                        </div>
                                        <div>
                                            <p style={{ margin:0, fontSize:'0.8rem', fontWeight:600, color:'#111827' }}>{m.name}</p>
                                            <span style={{ fontSize:'0.65rem', fontWeight:700, padding:'1px 6px', borderRadius:10, background:roleBg(m.role), color:roleColor(m.role) }}>{m.role}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="ds-modal-footer">
                    <button type="button" className="ds-btn ds-btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailsModal;
