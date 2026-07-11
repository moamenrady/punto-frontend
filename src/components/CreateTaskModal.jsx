import React, { useState, useEffect } from 'react';

/**
 * Props:
 *  isOpen           – boolean
 *  onClose          – fn
 *  onSubmit         – fn({ backlogId, name, description, priority, sprintId, assignedTo })
 *  backlogs         – [{ _id, name }]
 *  sprints          – [{ _id, name }]
 *  members          – [{ _id, name, role }]  project members for assignment
 *  defaultBacklogId – pre-selected backlog
 *  defaultSprintId  – pre-selected sprint
 */
const CreateTaskModal = ({ isOpen, onClose, onSubmit, backlogs = [], sprints = [], members = [], defaultBacklogId = '', defaultSprintId = '' }) => {
    const makeEmpty = () => ({ name: '', description: '', backlogId: defaultBacklogId, sprintId: defaultSprintId, priority: 'medium', assignedTo: [] });
    const [form, setForm]       = useState(makeEmpty);
    const [errors, setErrors]   = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens or defaults change
    useEffect(() => {
        if (isOpen) {
            setForm({ name: '', description: '', backlogId: defaultBacklogId, sprintId: defaultSprintId, priority: 'medium', assignedTo: [] });
            setErrors({});
            setTouched({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, defaultBacklogId, defaultSprintId]);

    if (!isOpen) return null;

    const validate = (field, value) => {
        switch (field) {
            case 'name':
                if (!value.trim())             return 'Task name is required.';
                if (value.trim().length < 3)   return 'Name must be at least 3 characters.';
                if (value.trim().length > 100)  return 'Name must be under 100 characters.';
                return '';
            case 'backlogId':
                return value ? '' : 'Please select a backlog.';
            case 'priority':
                return value ? '' : 'Please select a priority.';
            case 'description':
                if (value.trim() && value.trim().length < 5) return 'Description must be at least 5 characters if provided.';
                return '';
            default: return '';
        }
    };

    const set = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (touched[field]) setErrors(prev => ({ ...prev, [field]: validate(field, value) }));
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(prev => ({ ...prev, [field]: validate(field, form[field]) }));
    };

    const handleSubmit = async (e) => { 
        e.preventDefault();
        const requiredFields = ['name', 'backlogId', 'priority'];
        const newErrors = {};
        requiredFields.forEach(f => {
            const msg = validate(f, form[f]);
            if (msg) newErrors[f] = msg;
        });
        const descMsg = validate('description', form.description);
        if (descMsg) newErrors.description = descMsg;

        setErrors(newErrors);
        setTouched({ name: true, backlogId: true, priority: true, description: true });
        if (Object.keys(newErrors).length) return;

        setIsSubmitting(true);
try {
    await onSubmit({
            backlogId:   form.backlogId,
            name:        form.name.trim(),
            description: form.description.trim(),
            priority:    form.priority,
            sprintId:    form.sprintId   || undefined,
            assignedTo:  form.assignedTo.length ? form.assignedTo : undefined,
        });
} finally {
    setIsSubmitting(false);
}
    };

    const inputClass  = (f) => `ds-input${touched[f] && errors[f] ? ' error' : ''}`;
    const selectClass = (f) => `ds-select${touched[f] && errors[f] ? ' error' : ''}`;

    
const showBacklogPicker = !defaultBacklogId || !!defaultSprintId;
    // If sprint was pre-selected, show a read-only label instead of full dropdown
    const sprintPreSelected = !!defaultSprintId;
    const preSelectedSprint = sprints.find(s => s._id === defaultSprintId);

    return (
        <div className="ds-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
            <div className="ds-modal">
                <div className="ds-modal-header">
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:8, background:'#EEF1FD', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#8A9FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="12" y1="18" x2="12" y2="12"/>
                                <line x1="9" y1="15" x2="15" y2="15"/>
                            </svg>
                        </div>
                        <h2 className="ds-modal-title">Create New Task</h2>
                    </div>
                    <button className="ds-modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="ds-modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>

                        {/* Task Name */}
                        <div className="ds-form-group">
                            <label className="ds-label">Task Name <span style={{ color:'#EF4444' }}>*</span></label>
                            <input
                                type="text"
                                className={inputClass('name')}
                                placeholder="Enter a clear, concise task name"
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                onBlur={() => handleBlur('name')}
                                required
                            />
                            {touched.name && errors.name && <span className="ds-error">{errors.name}</span>}
                        </div>

                        {/* Description */}
                        <div className="ds-form-group">
                            <label className="ds-label">Description <span style={{ fontSize:'0.7rem', color:'#9CA3AF', fontWeight:400 }}>(optional)</span></label>
                            <textarea
                                className={`ds-textarea${touched.description && errors.description ? ' error' : ''}`}
                                placeholder="Describe what needs to be done…"
                                value={form.description}
                                onChange={e => set('description', e.target.value)}
                                onBlur={() => handleBlur('description')}
                                rows={3}
                            />
                            {touched.description && errors.description && <span className="ds-error">{errors.description}</span>}
                        </div>

                        {/* Backlog selector (hidden if defaultBacklogId is provided) */}
                        {showBacklogPicker && (
                            <div className="ds-form-group">
                                <label className="ds-label">Backlog <span style={{ color:'#EF4444' }}>*</span></label>
                                {backlogs.length === 0 ? (
                                    <p style={{ fontSize:'0.82rem', color:'#EF4444', margin:0 }}>No backlogs available. Create a backlog first.</p>
                                ) : (
                                    <select
                                        className={selectClass('backlogId')}
                                        value={form.backlogId}
                                        onChange={e => set('backlogId', e.target.value)}
                                        onBlur={() => handleBlur('backlogId')}
                                    >
                                        <option value="" disabled>Select a backlog</option>
                                        {backlogs.map(bl => <option key={bl._id} value={bl._id}>{bl.name}</option>)}
                                    </select>
                                )}
                                {touched.backlogId && errors.backlogId && <span className="ds-error">{errors.backlogId}</span>}
                            </div>
                        )}

                        <div className="ds-form-row">
                            {/* Priority */}
                            <div className="ds-form-group">
                                <label className="ds-label">Priority <span style={{ color:'#EF4444' }}>*</span></label>
                                <select
                                    className={selectClass('priority')}
                                    value={form.priority}
                                    onChange={e => set('priority', e.target.value)}
                                    onBlur={() => handleBlur('priority')}
                                >
                                    <option value="" disabled>Select priority</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                                {touched.priority && errors.priority && <span className="ds-error">{errors.priority}</span>}
                            </div>

                            {/* Sprint */}
                            <div className="ds-form-group">
                                <label className="ds-label">
                                    Sprint{' '}
                                    {sprintPreSelected
                                        ? <span style={{ fontSize:'0.7rem', color:'#8A9FE8', fontWeight:600 }}>(pre-selected)</span>
                                        : <span style={{ fontSize:'0.7rem', color:'#9CA3AF', fontWeight:400 }}>(optional)</span>
                                    }
                                </label>
                                {sprintPreSelected ? (
                                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#EEF1FD', borderRadius:8, border:'1px solid #C7D2F8' }}>
                                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#534AB7" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                        <span style={{ fontSize:'0.85rem', fontWeight:600, color:'#534AB7' }}>
                                            {preSelectedSprint?.name ?? 'Selected Sprint'}
                                        </span>
                                    </div>
                                ) : (
                                    <select
                                        className="ds-select"
                                        value={form.sprintId}
                                        onChange={e => set('sprintId', e.target.value)}
                                    >
                                        <option value="">No sprint</option>
                                        {sprints.map(sp => <option key={sp._id} value={sp._id}>{sp.name}</option>)}
                                        
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Assign To (optional, only if members provided) */}
                        {members.length > 0 && (
                            <div className="ds-form-group">
                                <label className="ds-label">Assign To <span style={{ fontSize:'0.7rem', color:'#9CA3AF', fontWeight:400 }}>(optional)</span></label>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:'8px', border:'1px solid #E9EBF0', borderRadius:8, background:'#F9FAFB', maxHeight:120, overflowY:'auto' }}>
                                    {members.map(m => {
                                        const selected = form.assignedTo.includes(m._id);
                                        return (
                                            <button
                                                key={m._id}
                                                type="button"
                                                onClick={() => {
                                                    setForm(prev => ({
                                                        ...prev,
                                                        assignedTo: selected
                                                            ? prev.assignedTo.filter(id => id !== m._id)
                                                            : [...prev.assignedTo, m._id],
                                                    }));
                                                }}
                                                style={{
                                                    display:'flex', alignItems:'center', gap:6,
                                                    padding:'4px 10px', borderRadius:20, cursor:'pointer',
                                                    border: selected ? '1.5px solid #534AB7' : '1.5px solid #E9EBF0',
                                                    background: selected ? '#EEF1FD' : '#fff',
                                                    color: selected ? '#534AB7' : '#6B7280',
                                                    fontWeight: selected ? 700 : 500,
                                                    fontSize:'0.78rem', transition:'all .15s',
                                                }}
                                            >
                                                <div style={{ width:18, height:18, borderRadius:'50%', background:'linear-gradient(135deg,#8A9FE8,#534AB7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.55rem', fontWeight:800, color:'#fff', flexShrink:0 }}>
                                                    {m.name?.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}
                                                </div>
                                                {m.name?.split(' ')[0]}
                                                {selected && <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                                            </button>
                                        );
                                    })}
                                </div>
                                {form.assignedTo.length > 0 && (
                                    <span style={{ fontSize:'0.72rem', color:'#534AB7', fontWeight:600 }}>{form.assignedTo.length} member{form.assignedTo.length>1?'s':''} selected</span>
                                )}
                            </div>
                        )}

                    </div>
                    <div className="ds-modal-footer">
                        <button type="button" className="ds-btn ds-btn-secondary" onClick={onClose}>Cancel</button>
                        <button
    type="submit"
    className="ds-btn ds-btn-primary"
    disabled={(showBacklogPicker && backlogs.length === 0) || isSubmitting}
    style={{ opacity: ((showBacklogPicker && backlogs.length === 0) || isSubmitting) ? 0.5 : 1 }}
>
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;
