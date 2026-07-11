import React, { useState, useEffect } from 'react';

const EditBacklogModal = ({ backlog, isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [goal, setGoal] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    useEffect(() => {
        if (backlog) {
            setName(backlog.name || '');
            setGoal(backlog.backlog_goal || '');
            setStartDate(backlog.start_date ? backlog.start_date.substring(0, 10) : '');
            setEndDate(backlog.end_date ? backlog.end_date.substring(0, 10) : '');
            setErrors({});
            setTouched({});
        }
    }, [backlog]);

    if (!isOpen) return null;

    const validate = (field, value) => {
        switch (field) {
            case 'name':
                if (!value.trim())            return 'Backlog name is required.';
                if (value.trim().length < 2)  return 'Name must be at least 2 characters.';
                if (value.trim().length > 80) return 'Name must be under 80 characters.';
                return '';
            case 'endDate':
                if (!value) return '';
                if (startDate && value < startDate) return 'End date must be after start date.';
                return '';
            default: return '';
        }
    };

    const handleBlur = (field, value) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        setErrors((prev) => ({ ...prev, [field]: validate(field, value) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        const nameErr = validate('name', name);
        const endErr = validate('endDate', endDate);
        if (nameErr) newErrors.name = nameErr;
        if (endErr) newErrors.endDate = endErr;

        setErrors(newErrors);
        setTouched({ name: true, endDate: true });

        if (Object.keys(newErrors).length) return;

        if (onSubmit) {
            onSubmit({
                id: backlog._id || backlog.id,
                name: name.trim(),
                goal: goal.trim(),
                startDate,
                endDate,
            });
        }
    };

    const inputClass = (field) => `ds-input${touched[field] && errors[field] ? ' error' : ''}`;

    return (
        <div className="ds-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
            <div className="ds-modal">
                <div className="ds-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF1FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#8A9FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </div>
                        <h2 className="ds-modal-title">Edit Backlog</h2>
                    </div>
                    <button className="ds-modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="ds-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                        {/* Backlog Name */}
                        <div className="ds-form-group">
                            <label className="ds-label">Backlog Name <span style={{ color: '#EF4444' }}>*</span></label>
                            <input
                                type="text"
                                className={inputClass('name')}
                                value={name}
                                onChange={e => {
                                    setName(e.target.value);
                                    if (touched.name) setErrors(prev => ({ ...prev, name: validate('name', e.target.value) }));
                                }}
                                onBlur={() => handleBlur('name', name)}
                                required
                                placeholder="e.g., Authentication Backlog"
                            />
                            {touched.name && errors.name && <span className="ds-error">{errors.name}</span>}
                        </div>

                        {/* Backlog Goal */}
                        <div className="ds-form-group">
                            <label className="ds-label">Goal <span style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
                            <textarea
                                className="ds-textarea"
                                placeholder="What is this backlog intended to deliver?"
                                value={goal}
                                onChange={e => setGoal(e.target.value)}
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
                                    value={startDate}
                                    onChange={e => {
                                        setStartDate(e.target.value);
                                        if (endDate && touched.endDate) {
                                            setErrors(prev => ({
                                                ...prev,
                                                endDate: endDate < e.target.value ? 'End date must be after start date.' : ''
                                            }));
                                        }
                                    }}
                                />
                            </div>
                            <div className="ds-form-group">
                                <label className="ds-label">End Date</label>
                                <input
                                    type="date"
                                    className={inputClass('endDate')}
                                    value={endDate}
                                    onChange={e => {
                                        setEndDate(e.target.value);
                                        if (touched.endDate) setErrors(prev => ({ ...prev, endDate: validate('endDate', e.target.value) }));
                                    }}
                                    onBlur={() => handleBlur('endDate', endDate)}
                                    min={startDate || undefined}
                                />
                                {touched.endDate && errors.endDate && <span className="ds-error">{errors.endDate}</span>}
                            </div>
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

export default EditBacklogModal;
