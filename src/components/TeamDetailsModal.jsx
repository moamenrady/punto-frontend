import React from 'react';

const ROLE_COLORS = {
  admin:   { bg: '#FEE2E2', color: '#DC2626' },
  manager: { bg: '#FEF3C7', color: '#D97706' },
  user:    { bg: '#EEF1FD', color: '#534AB7' },
};

import Avatar from './Avatar';

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/**
 * TeamDetailsModal
 *
 * Props:
 *  team    – team object (populated: members[], created_by, name, description, createdAt)
 *  isOpen  – boolean
 *  onClose – fn
 *  onEdit  – fn(team)   optional – shows Edit button for admins
 *  isAdmin – boolean
 */
const TeamDetailsModal = ({ team, isOpen, onClose, onEdit, isAdmin = false }) => {
  if (!isOpen || !team) return null;

  const members = team.members ?? [];
  const initial = (team.name ?? 'T').charAt(0).toUpperCase();

  return (
    <div
      className="ds-overlay"
      onClick={e => e.target === e.currentTarget && onClose?.()}
      style={{ zIndex: 1200 }}
    >
      <div className="ds-modal ds-modal-lg" style={{ maxWidth: 560, padding: 0, overflow: 'hidden' }}>

        {/* ── Coloured header banner ── */}
        <div style={{
          background: 'linear-gradient(135deg,#06B6D4,#0891B2)',
          padding: '28px 28px 24px',
          position: 'relative',
        }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.18)', cursor: 'pointer',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.30)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Team initial badge + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'rgba(255,255,255,0.22)',
              border: '2px solid rgba(255,255,255,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', fontWeight: 900, color: '#fff', flexShrink: 0,
            }}>
              {initial}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                {team.name}
              </h2>
              {team.description ? (
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.80)', lineHeight: 1.5 }}>
                  {team.description}
                </p>
              ) : (
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>
                  No description
                </p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 20, marginTop: 18 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{members.length}</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.70)', fontWeight: 600 }}>Members</p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.25)' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                {team.created_by?.name ?? 'Admin'}
              </p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.70)', fontWeight: 600 }}>Created by</p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.25)' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>{fmt(team.createdAt)}</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.70)', fontWeight: 600 }}>Created on</p>
            </div>
          </div>
        </div>

        {/* ── Members list ── */}
        <div style={{ padding: '20px 28px 24px' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '0.875rem', color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#534AB7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Members
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#534AB7', background: '#EEF1FD', padding: '1px 8px', borderRadius: 20 }}>
              {members.length}
            </span>
          </p>

          {members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px', color: '#9CA3AF', fontSize: '0.85rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>👥</div>
              No members in this team yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
              {members.filter(m => m && m.user).map((m, idx) => {
                const u = m.user;
                const roleStyle = ROLE_COLORS[m.role] ?? ROLE_COLORS.user;
                return (
                  <div key={u._id ?? idx} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 10,
                    background: idx % 2 === 0 ? '#FAFAFA' : '#fff',
                    border: '1px solid #F3F4F6',
                  }}>
                    <Avatar photo={u.photo} name={u.name ?? '?'} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#111827', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {u.name ?? '—'}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#9CA3AF', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {u.email ?? '—'}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700,
                      padding: '3px 10px', borderRadius: 20,
                      background: roleStyle.bg, color: roleStyle.color,
                      flexShrink: 0, textTransform: 'capitalize',
                    }}>
                      {m.role ?? 'user'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="ds-modal-footer" style={{ borderTop: '1px solid #F3F4F6', padding: '14px 28px' }}>
          {isAdmin && onEdit && (
            <button
              className="ds-btn ds-btn-secondary"
              onClick={() => { onClose(); onEdit(team); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Team
            </button>
          )}
          <button className="ds-btn ds-btn-primary" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default TeamDetailsModal;
