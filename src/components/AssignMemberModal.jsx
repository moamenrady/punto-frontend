import React, { useState } from 'react';

const TEAM_MEMBERS = [
    { id: 1, name: 'Khaled Mohamed', role: 'IT Support Engineer', avatar: 'https://ui-avatars.com/api/?name=Khaled+Mohamed&background=EEF1FD&color=8A9FE8' },
    { id: 2, name: 'Amira Ali', role: 'Senior Network Admin', avatar: 'https://ui-avatars.com/api/?name=Amira+Ali&background=EEF1FD&color=8A9FE8' },
    { id: 3, name: 'Sara Youssef', role: 'Software Specialist', avatar: 'https://ui-avatars.com/api/?name=Sara+Youssef&background=EEF1FD&color=8A9FE8' },
    { id: 4, name: 'Mina Nabil', role: 'Hardware Technician', avatar: 'https://ui-avatars.com/api/?name=Mina+Nabil&background=EEF1FD&color=8A9FE8' }
];

export default function AssignMemberModal({ onClose, onAssign }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    const filteredMembers = TEAM_MEMBERS.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = () => {
        if (!selectedUser) return;
        onAssign(selectedUser);
    };

    return (
        <div className="ds-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
            <div className="ds-modal">
                {/* Header */}
                <div className="ds-modal-header">
                    <h2 className="ds-modal-title">Assign Ticket</h2>
                    <button className="ds-modal-close" onClick={onClose}>×</button>
                </div>

                {/* Body */}
                <div className="ds-modal-body">
                    {/* Search */}
                    <div className="ds-search-wrap" style={{ marginBottom: 16 }}>
                        <span className="ds-search-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search team members by name or role..."
                            className="ds-search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Member List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                        {filteredMembers.length > 0 ? (
                            filteredMembers.map(member => (
                                <div
                                    key={member.id}
                                    onClick={() => setSelectedUser(member)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 14,
                                        padding: '10px 14px',
                                        borderRadius: 10,
                                        border: `1px solid ${selectedUser?.id === member.id ? '#8A9FE8' : '#E9EBF0'}`,
                                        background: selectedUser?.id === member.id ? '#EEF1FD' : '#ffffff',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.15s, background 0.15s'
                                    }}
                                    onMouseEnter={e => {
                                        if (selectedUser?.id !== member.id) {
                                            e.currentTarget.style.background = '#F9FAFB';
                                            e.currentTarget.style.borderColor = '#D1D5DB';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (selectedUser?.id !== member.id) {
                                            e.currentTarget.style.background = '#ffffff';
                                            e.currentTarget.style.borderColor = '#E9EBF0';
                                        }
                                    }}
                                >
                                    <img
                                        src={member.avatar}
                                        alt={member.name}
                                        style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #E9EBF0' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>{member.name}</div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#6B7280' }}>{member.role}</div>
                                    </div>
                                    {selectedUser?.id === member.id && (
                                        <div style={{ color: '#8A9FE8' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '0.875rem', color: '#9CA3AF', fontWeight: 500 }}>
                                No team members found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="ds-modal-footer">
                    <button className="ds-btn ds-btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="ds-btn ds-btn-primary"
                        onClick={handleSubmit}
                        disabled={!selectedUser}
                        style={{ opacity: selectedUser ? 1 : 0.5, cursor: selectedUser ? 'pointer' : 'not-allowed' }}
                    >
                        {selectedUser ? `Assign to ${selectedUser.name.split(' ')[0]}` : 'Assign Member'}
                    </button>
                </div>
            </div>
        </div>
    );
}
