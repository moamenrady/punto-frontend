import React, { useState } from 'react';

const categoryStyle = {
    network:  { background: '#F4ECFF', color: '#9333EA' },
    hardware: { background: '#FFF0D4', color: '#D97706' },
    software: { background: '#E1FBFC', color: '#0891B2' },
};

const statusStyle = {
    'open':        { background: '#DBEAFE', color: '#1E40AF' },
    'in progress': { background: '#FEF3C7', color: '#92400E' },
    'closed':      { background: '#D1FAE5', color: '#065F46' },
};

const TicketDetailsModal = ({ ticket, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('details');

    if (!isOpen || !ticket) return null;

    const catStyle = categoryStyle[ticket.category?.toLowerCase()] || categoryStyle.software;
    const statStyle = statusStyle[ticket.status?.toLowerCase()] || statusStyle.open;

    const tabs = ['details', 'solutions', 'chat'];

    return (
        <div className="ds-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
            <div className="ds-modal ds-modal-lg">

                <div className="ds-modal-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                        <h2 className="ds-modal-title" style={{ fontSize: '1.1rem', lineHeight: 1.3 }}>{ticket.title}</h2>
                        <button className="ds-modal-close" onClick={onClose}>×</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <span className="ds-badge" style={catStyle}>{ticket.category}</span>
                        <span className="ds-badge" style={statStyle}>{ticket.status}</span>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E9EBF0', padding: '0 24px' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '10px 18px',
                                border: 'none',
                                background: 'transparent',
                                fontFamily: 'inherit',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: activeTab === tab ? '#8A9FE8' : '#9CA3AF',
                                cursor: 'pointer',
                                borderBottom: activeTab === tab ? '2px solid #8A9FE8' : '2px solid transparent',
                                marginBottom: -1,
                                textTransform: 'capitalize',
                                transition: 'color 0.15s',
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="ds-modal-body">

                    {activeTab === 'details' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div className="ds-form-group">
                                <label className="ds-label">Description</label>
                                <div style={{ padding: '10px 14px', background: '#F9FAFB', border: '1px solid #E9EBF0', borderRadius: 8, fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.6 }}>
                                    {ticket.description || 'No description provided.'}
                                </div>
                            </div>
                            <div className="ds-form-group">
                                <label className="ds-label">Assigned User</label>
                                <div style={{ padding: '10px 14px', background: '#F9FAFB', border: '1px solid #E9EBF0', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                                    Ahmed Ali
                                </div>
                            </div>
                            <div className="ds-form-group">
                                <label className="ds-label">Attachments</label>
                                <div style={{ border: '1.5px dashed #D1D5DB', borderRadius: 8, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#9CA3AF', fontSize: '0.875rem', background: '#F9FAFB' }}>
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                    No file attached
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'solutions' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {['Check your internet connection and try again', 'Restart VPN and refresh the network', 'Secure connection failed — please reconnect'].map((sol, i) => (
                                <div key={i} style={{ padding: '12px 16px', border: '1px solid #E9EBF0', borderRadius: 8, fontSize: '0.875rem', background: '#F9FAFB', color: '#374151' }}>
                                    {sol}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'chat' && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: 320 }}>
                            <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 8 }}>
                                {[
                                    { id: 'them', name: 'Ahmed Ali', initials: 'AA', text: 'Hi, I have an issue with my connection.' },
                                    { id: 'me',   name: 'Me',        initials: 'Me', text: 'Sure, can you describe it in more detail?' },
                                    { id: 'them', name: 'Ahmed Ali', initials: 'AA', text: 'The VPN keeps disconnecting every few minutes.' },
                                    { id: 'me',   name: 'Me',        initials: 'Me', text: 'Got it, I\'ll look into it right away.' },
                                ].map((msg, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 10, maxWidth: '85%', alignSelf: msg.id === 'me' ? 'flex-end' : 'flex-start', flexDirection: msg.id === 'me' ? 'row-reverse' : 'row' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: msg.id === 'me' ? '#EEF1FD' : '#E9EBF0', color: msg.id === 'me' ? '#8A9FE8' : '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>
                                            {msg.initials}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginBottom: 3, textAlign: msg.id === 'me' ? 'right' : 'left' }}>{msg.name}</div>
                                            <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: '0.875rem', lineHeight: 1.5, background: msg.id === 'me' ? '#8A9FE8' : '#F3F4F6', color: msg.id === 'me' ? '#fff' : '#111827' }}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid #E9EBF0' }}>
                                <input type="text" className="ds-input" style={{ borderRadius: 20, flexGrow: 1 }} placeholder="Type your message..." />
                                <button style={{ width: 36, height: 36, borderRadius: '50%', background: '#8A9FE8', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default TicketDetailsModal;
