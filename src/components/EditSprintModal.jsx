import React, { useState, useEffect } from 'react';

const EditSprintModal = ({ sprint, isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState('');
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    useEffect(() => {
        if (sprint) {
            setName(sprint.name || '');
            setStartDate(sprint.startDate || '');
            setEndDate(sprint.endDate || '');
            setStatus(sprint.status || 'Planned');
            setErrors({});
            setTouched({});
        }
    }, [sprint]);

    if (!isOpen) return null;

    const validate = (field, value) => {
        switch (field) {
            case 'name':
                if (!value.trim()) return 'Sprint name is required';
                if (value.trim().length < 2) return 'Name must be at least 2 characters';
                if (value.trim().length > 60) return 'Name must be under 60 characters';
                return '';
            case 'startDate': return value ? '' : 'Start date is required';
            case 'endDate':
                if (!value) return 'End date is required';
                if (startDate && value < startDate) return 'End date must be after start date';
                return '';
            case 'status': return value ? '' : 'Please select a status';
            default: return '';
        }
    };

    const handleBlur = (field, value) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        setErrors((prev) => ({ ...prev, [field]: validate(field, value) }));
    };

    const blockNumbers = (e) => { if (/\d/.test(e.key)) e.preventDefault(); };

    const handleNameChange = (e) => {
        const v = e.target.value;
        if (/\d/.test(v.charAt(v.length - 1)) && v.length > name.length) return;
        setName(v);
        if (touched.name) setErrors((prev) => ({ ...prev, name: validate('name', v) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const fields = { name, startDate, endDate, status };
        const newErrors = {};
        let hasError = false;
        Object.entries(fields).forEach(([f, v]) => { const msg = validate(f, v); if (msg) { newErrors[f] = msg; hasError = true; } });
        setErrors(newErrors);
        setTouched({ name: true, startDate: true, endDate: true, status: true });
        if (hasError) return;
        if (onSubmit) onSubmit({ id: sprint.id, name, startDate, endDate, status });
    };

    const inputClass = (field) => `ds-input${touched[field] && errors[field] ? ' error' : ''}`;

    return (
        <div className="ds-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
            <div className="ds-modal">
                <div className="ds-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF1FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#8A9FE8" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </div>
                        <h2 className="ds-modal-title">Edit Sprint</h2>
                    </div>
                    <button className="ds-modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="ds-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                        <div className="ds-form-group">
                            <label className="ds-label">Sprint Name <span style={{ color: '#EF4444' }}>*</span></label>
                            <input
                                type="text" className={inputClass('name')}
                                value={name} onChange={handleNameChange}
                                onBlur={() => handleBlur('name', name)} onKeyDown={blockNumbers}
                                required minLength={2} maxLength={60} placeholder="Sprint name (letters only)"
                            />
                            {touched.name && errors.name && <span className="ds-error">{errors.name}</span>}
                        </div>

                        <div className="ds-form-row">
                            <div className="ds-form-group">
                                <label className="ds-label">Start Date <span style={{ color: '#EF4444' }}>*</span></label>
                                <input
                                    type="date" className={inputClass('startDate')} value={startDate}
                                    onChange={e => {
                                        setStartDate(e.target.value);
                                        if (touched.startDate) setErrors(prev => ({ ...prev, startDate: validate('startDate', e.target.value) }));
                                        if (endDate && touched.endDate) setErrors(prev => ({ ...prev, endDate: endDate < e.target.value ? 'End date must be after start date' : '' }));
                                    }}
                                    onBlur={() => handleBlur('startDate', startDate)} required
                                />
                                {touched.startDate && errors.startDate && <span className="ds-error">{errors.startDate}</span>}
                            </div>
                            <div className="ds-form-group">
                                <label className="ds-label">End Date <span style={{ color: '#EF4444' }}>*</span></label>
                                <input
                                    type="date" className={inputClass('endDate')} value={endDate}
                                    onChange={e => { setEndDate(e.target.value); if (touched.endDate) setErrors(prev => ({ ...prev, endDate: validate('endDate', e.target.value) })); }}
                                    onBlur={() => handleBlur('endDate', endDate)} required min={startDate || undefined}
                                />
                                {touched.endDate && errors.endDate && <span className="ds-error">{errors.endDate}</span>}
                            </div>
                        </div>

                        <div className="ds-form-group">
                            <label className="ds-label">Status <span style={{ color: '#EF4444' }}>*</span></label>
                            <select
                                className={`ds-select${touched.status && errors.status ? ' error' : ''}`}
                                value={status}
                                onChange={e => { setStatus(e.target.value); if (touched.status) setErrors(prev => ({ ...prev, status: validate('status', e.target.value) })); }}
                                onBlur={() => handleBlur('status', status)}
                            >
                                <option value="Active">Active</option>
                                <option value="Planned">Planned</option>
                                <option value="Completed">Completed</option>
                            </select>
                            {touched.status && errors.status && <span className="ds-error">{errors.status}</span>}
                        </div>

                    </div>
                    <div className="ds-modal-footer">
                        <button type="button" className="ds-btn ds-btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="ds-btn ds-btn-primary">
                            <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSprintModal;
