import React from 'react';

const DeleteSprintModal = ({ sprint, isOpen, onClose, onDelete }) => {
    if (!isOpen || !sprint) return null;

    return (
        <div className="ds-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
            <div className="ds-modal" style={{ maxWidth: 420 }}>
                <div className="ds-modal-header">
                    <h2 className="ds-modal-title">Delete Sprint</h2>
                    <button className="ds-modal-close" onClick={onClose}>×</button>
                </div>

                <div className="ds-modal-body" style={{ textAlign: 'center', padding: '28px 24px' }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: '#FEE2E2', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 16px'
                    }}>
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#6B7280', lineHeight: 1.6 }}>
                        Are you sure you want to delete{' '}
                        <strong style={{ color: '#8A9FE8' }}>{sprint.name}</strong>?
                        This action cannot be undone.
                    </p>
                </div>

                <div className="ds-modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
                    <button className="ds-btn ds-btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="ds-btn ds-btn-danger" onClick={() => onDelete(sprint.id)}>Delete Sprint</button>
                </div>
            </div>
        </div>
    );
};

export default DeleteSprintModal;
