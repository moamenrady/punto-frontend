import React, { useEffect, useRef } from 'react';

/**
 * Toast — lightweight top-right notification
 *
 * Props:
 *  toasts  – [{ id, type:'success'|'error'|'info', title, message }]
 *  onClose – fn(id)
 */

const STYLES = {
  success: {
    border:  '#22C55E',
    iconBg:  '#DCFCE7',
    icon:    '#16A34A',
    bar:     '#22C55E',
  },
  error: {
    border:  '#EF4444',
    iconBg:  '#FEE2E2',
    icon:    '#DC2626',
    bar:     '#EF4444',
  },
  info: {
    border:  '#8A9FE8',
    iconBg:  '#EEF1FD',
    icon:    '#534AB7',
    bar:     '#8A9FE8',
  },
};

const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

/* Individual toast item — handles its own auto-dismiss timer */
const ToastItem = ({ toast, onClose }) => {
  const s   = STYLES[toast.type] ?? STYLES.info;
  const dur = toast.duration ?? 3500;

  const barRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), dur);

    // Animate the progress bar
    if (barRef.current) {
      barRef.current.style.transition = `width ${dur}ms linear`;
      requestAnimationFrame(() => {
        if (barRef.current) barRef.current.style.width = '0%';
      });
    }

    return () => clearTimeout(timer);
  }, [toast.id, dur, onClose]);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: '#fff',
        border: `1px solid ${s.border}`,
        borderLeft: `4px solid ${s.border}`,
        borderRadius: 12,
        padding: '14px 40px 14px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        minWidth: 300,
        maxWidth: 380,
        animation: 'toastIn .25s cubic-bezier(0.16,1,0.3,1)',
        overflow: 'hidden',
      }}
    >
      {/* Icon */}
      <div style={{ width: 32, height: 32, borderRadius: 8, background: s.iconBg, color: s.icon, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {ICONS[toast.type] ?? ICONS.info}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        {toast.title && (
          <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>
            {toast.title}
          </p>
        )}
        {toast.message && (
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#6B7280', lineHeight: 1.5 }}>
            {toast.message}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => onClose(toast.id)}
        style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s, color .15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#374151'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Progress bar */}
      <div ref={barRef} style={{ position: 'absolute', bottom: 0, left: 0, height: 3, width: '100%', background: s.bar, borderRadius: '0 0 12px 12px', transition: 'none' }} />
    </div>
  );
};

/* Container — renders all active toasts */
const Toast = ({ toasts = [], onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateX(40px) scale(0.95); }
          to   { opacity:1; transform:translateX(0)    scale(1);    }
        }
      `}</style>
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onClose={onClose} />
        ))}
      </div>
    </>
  );
};

export default Toast;

/* ── useToast hook — use this in any component ── */
export const useToast = () => {
  const [toasts, setToasts] = React.useState([]);

  const show = React.useCallback(({ type = 'info', title = '', message = '', duration = 3500 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  const close = React.useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Convenience shortcuts
  const success = React.useCallback((title, message, duration) => show({ type: 'success', title, message, duration }), [show]);
  const error   = React.useCallback((title, message, duration) => show({ type: 'error',   title, message, duration }), [show]);
  const info    = React.useCallback((title, message, duration) => show({ type: 'info',    title, message, duration }), [show]);

  return { toasts, close, show, success, error, info };
};
