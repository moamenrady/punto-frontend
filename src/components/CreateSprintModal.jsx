import React, { useState } from 'react';

const CreateSprintModal = ({ isOpen, onClose, onSubmit }) => {
    const empty = { name: '', goal: '', startDate: '', endDate: '', status: 'planned' };
    const [form, setForm]     = useState(empty);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    if (!isOpen) return null;

    const validate = (field, value) => {
        switch (field) {
            case 'name':
                if (!value.trim())            return 'Sprint name is required.';
                if (value.trim().length < 2)  return 'Name must be at least 2 characters.';
                if (value.trim().length > 60) return 'Name must be under 60 characters.';
                return '';
            case 'endDate':
                if (!value) return '';
                if (form.startDate && value < form.startDate) return 'End date must be after start date.';
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

    const handleSubmit = (e) => {
        e.preventDefault();
        const nameErr   = validate('name', form.name);
        const endErr    = validate('endDate', form.endDate);
        const newErrors = {};
        if (nameErr) newErrors.name    = nameErr;
        if (endErr)  newErrors.endDate = endErr;
        setErrors(newErrors);
        setTouched({ name: true, endDate: true });
        if (Object.keys(newErrors).length) return;

        onSubmit({ ...form, name: form.name.trim() });
        setForm(empty);
        setErrors({});
        setTouched({});
    };

    const inputClass = (f) => `ds-input${touched[f] && errors[f] ? ' error' : ''}`;

    return (
        <div className="ds-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
            <div className="ds-modal">
                <div className="ds-modal-header">
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:8, background:'#EEF1FD', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#8A9FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                            </svg>
                        </div>
                        <h2 className="ds-modal-title">Create New Sprint</h2>
                    </div>
                    <button className="ds-modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="ds-modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>

                        {/* Sprint Name */}
                        <div className="ds-form-group">
                            <label className="ds-label">Sprint Name <span style={{ color:'#EF4444' }}>*</span></label>
                            <input
                                type="text"
                                className={inputClass('name')}
                                placeholder="e.g., Sprint 1 — Auth & Onboarding"
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                onBlur={() => handleBlur('name')}
                                required
                            />
                            {touched.name && errors.name && <span className="ds-error">{errors.name}</span>}
                        </div>

                        {/* Sprint Goal */}
                        <div className="ds-form-group">
                            <label className="ds-label">Sprint Goal <span style={{ fontSize:'0.7rem', color:'#9CA3AF', fontWeight:400 }}>(optional)</span></label>
                            <textarea
                                className="ds-textarea"
                                placeholder="What's the main objective of this sprint?"
                                value={form.goal}
                                onChange={e => set('goal', e.target.value)}
                                rows={2}
                            />
                        </div>

                        {/* Dates row */}
                        <div className="ds-form-row">
                            <div className="ds-form-group">
                                <label className="ds-label">Start Date</label>
                                <input
                                    type="date"
                                    className="ds-input"
                                    value={form.startDate}
                                    onChange={e => {
                                        set('startDate', e.target.value);
                                        if (form.endDate && touched.endDate)
                                            setErrors(prev => ({ ...prev, endDate: form.endDate < e.target.value ? 'End date must be after start date.' : '' }));
                                    }}
                                />
                            </div>
                            <div className="ds-form-group">
                                <label className="ds-label">End Date</label>
                                <input
                                    type="date"
                                    className={inputClass('endDate')}
                                    value={form.endDate}
                                    onChange={e => set('endDate', e.target.value)}
                                    onBlur={() => handleBlur('endDate')}
                                    min={form.startDate || undefined}
                                />
                                {touched.endDate && errors.endDate && <span className="ds-error">{errors.endDate}</span>}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="ds-form-group">
    <label className="ds-label">Status</label>
    <div style={{ padding:'10px 14px', borderRadius:8, border:'1px solid #E9EBF0', background:'#F9FAFB', fontSize:'0.85rem', color:'#6B7280' }}>
        Planned <span style={{ fontSize:'0.72rem', color:'#9CA3AF', marginLeft:6 }}>(can be changed after creation)</span>
    </div>
</div>

                    </div>
                    <div className="ds-modal-footer">
                        <button type="button" className="ds-btn ds-btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="ds-btn ds-btn-primary">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Create Sprint
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSprintModal;
