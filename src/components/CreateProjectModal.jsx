import React, { useState } from 'react';

const CreateProjectModal = ({ isOpen, onClose, onSubmit }) => {
    const empty = { name: '', description: '' };
    const [form, setForm]       = useState(empty);
    const [errors, setErrors]   = useState({});
    const [touched, setTouched] = useState({});

    if (!isOpen) return null;

    const validate = (field, value) => {
        switch (field) {
            case 'name':
                if (!value.trim())            return 'Project name is required.';
                if (value.trim().length < 2)  return 'Name must be at least 2 characters.';
                if (value.trim().length > 80) return 'Name must be under 80 characters.';
                return '';
            case 'description':
                if (!value.trim())            return 'Description is required.';
                if (value.trim().length < 10) return 'Description must be at least 10 characters.';
                if (value.trim().length > 300) return 'Description must be under 300 characters.';
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
        const nameErr = validate('name', form.name);
        const descErr = validate('description', form.description);
        const newErrors = {};
        if (nameErr) newErrors.name = nameErr;
        if (descErr) newErrors.description = descErr;
        setErrors(newErrors);
        setTouched({ name: true, description: true });
        if (Object.keys(newErrors).length) return;

        onSubmit({ name: form.name.trim(), description: form.description.trim() });
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
                                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                            </svg>
                        </div>
                        <h2 className="ds-modal-title">Create New Project</h2>
                    </div>
                    <button className="ds-modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="ds-modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>

                        {/* Project Name */}
                        <div className="ds-form-group">
                            <label className="ds-label">Project Name <span style={{ color:'#EF4444' }}>*</span></label>
                            <input
                                type="text"
                                className={inputClass('name')}
                                placeholder="e.g., E-Commerce Platform v2"
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                onBlur={() => handleBlur('name')}
                                required
                            />
                            {touched.name && errors.name && <span className="ds-error">{errors.name}</span>}
                        </div>

                        {/* Description */}
                        <div className="ds-form-group">
                            <label className="ds-label">Description <span style={{ color:'#EF4444' }}>*</span></label>
                            <textarea
                                className={`ds-textarea${touched.description && errors.description ? ' error' : ''}`}
                                placeholder="Describe the project goals and scope (min 10 characters)"
                                value={form.description}
                                onChange={e => set('description', e.target.value)}
                                onBlur={() => handleBlur('description')}
                                rows={3}
                                required
                            />
                            {touched.description && errors.description && <span className="ds-error">{errors.description}</span>}
                        </div>

                        <p style={{ margin:0, fontSize:'0.75rem', color:'#9CA3AF', background:'#F9FAFB', border:'1px solid #E9EBF0', borderRadius:8, padding:'8px 12px' }}>
                            💡 After creating the project, you can add team members using the <strong>Manage Team</strong> button.
                        </p>

                    </div>
                    <div className="ds-modal-footer">
                        <button type="button" className="ds-btn ds-btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="ds-btn ds-btn-primary">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
