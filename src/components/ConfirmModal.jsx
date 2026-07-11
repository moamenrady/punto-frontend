import React from 'react';

/**
 * Props:
 *  isOpen       – boolean
 *  onClose      – fn
 *  onConfirm    – fn (called when user clicks confirm)
 *  title        – string
 *  message      – string | ReactNode
 *  confirmLabel – string  (default 'Delete')
 *  danger       – boolean (red confirm button, default true)
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title       = 'Confirm Action',
  message     = 'Are you sure?',
  confirmLabel = 'Delete',
  danger      = true,
}) => {
  if (!isOpen) return null;

  const confirmColor = danger ? '#EF4444' : '#534AB7';
  const confirmHover = danger ? '#DC2626' : '#4338CA';
  const iconBg       = danger ? '#FEF2F2' : '#EEF1FD';
  const iconStroke   = danger ? '#EF4444' : '#534AB7';

  return (
    <div
      className="ds-overlay"
      onClick={e => e.target === e.currentTarget && onClose?.()}
      style={{ zIndex: 9999 }}
    >
      <div className="ds-modal" style={{ maxWidth: 440 }}>

        {/* Header */}
        <div className="ds-modal-header">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {danger ? (
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke={iconStroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke={iconStroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              )}
            </div>
            <h2 className="ds-modal-title">{title}</h2>
          </div>
          <button className="ds-modal-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="ds-modal-body">
          <p style={{ margin:0, fontSize:'0.9rem', color:'#374151', lineHeight:1.65 }}>
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="ds-modal-footer">
          <button
            className="ds-btn ds-btn-secondary"
            onClick={onClose}
            style={{ minWidth:90 }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm?.(); onClose?.(); }}
            style={{
              display:'flex', alignItems:'center', gap:7,
              padding:'9px 22px', borderRadius:10, border:'none',
              background: confirmColor, color:'#fff',
              fontWeight:700, fontSize:'0.875rem', cursor:'pointer',
              transition:'background .15s', minWidth:90,
            }}
            onMouseEnter={e => e.currentTarget.style.background = confirmHover}
            onMouseLeave={e => e.currentTarget.style.background = confirmColor}
          >
            {danger && (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            )}
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;
