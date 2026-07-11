import React, { useState, useEffect, useMemo } from 'react';
import { projectService } from '../services/projectService';
import Avatar from './Avatar';

const ROLE_COLORS = {
  admin:   { bg: '#FEE2E2', color: '#DC2626' },
  manager: { bg: '#FEF3C7', color: '#D97706' },
  user:    { bg: '#EEF1FD', color: '#534AB7' },
};

/**
 * Props:
 *  isOpen   – boolean
 *  onClose  – fn
 *  onSubmit – fn({ name, description, members:[id,…] }) → Promise
 *  editTeam – team object for edit mode (optional)
 */
const AddTeamModal = ({ isOpen, onClose, onSubmit, editTeam = null }) => {
  const isEdit = !!editTeam;

  const [name,           setName]           = useState('');
  const [description,    setDescription]    = useState('');
  const [errors,         setErrors]         = useState({});
  const [allUsers,       setAllUsers]       = useState([]);
  const [selectedMembers,setSelectedMembers]= useState([]);   // full user objects
  const [search,         setSearch]         = useState('');
  const [loadingUsers,   setLoadingUsers]   = useState(false);
  const [isSubmitting,   setIsSubmitting]   = useState(false);

  /* ── reset + load users on open ── */
  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setSearch('');

    if (isEdit) {
      setName(editTeam.name ?? '');
      setDescription(editTeam.description ?? '');
      // Flatten members: backend returns [{ user: { _id, name... }, role... }]
      // We want to store the User objects in selectedMembers
      const flattened = (editTeam.members ?? []).map(m => m.user).filter(Boolean);
      setSelectedMembers(flattened);
    } else {
      setName('');
      setDescription('');
      setSelectedMembers([]);
    }

    setLoadingUsers(true);
    projectService.searchUsers('').then(users => {
      setAllUsers(Array.isArray(users) ? users : []);
    }).catch(e => console.error('Failed to load users:', e))
      .finally(() => setLoadingUsers(false));
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── live filter: name, email, _id + exclude selected ── */
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    // Always exclude users who are already in the selectedMembers list
    const selectedIds = new Set(selectedMembers.map(m => m._id));
const available = allUsers.filter(u => !selectedIds.has(u._id) && u.role !== 'manager' && u.role !== 'admin');

    if (!q) return available;
    return available.filter(u =>
      u.name?.toLowerCase().includes(q)  ||
      u.email?.toLowerCase().includes(q) ||
      u._id?.toLowerCase().includes(q)
    );
  }, [allUsers, search, selectedMembers]);

  const isSelected   = id  => selectedMembers.some(m => m._id === id);
  const toggleMember = user => setSelectedMembers(prev =>
    isSelected(user._id) ? prev.filter(m => m._id !== user._id) : [...prev, user]
  );

  /* ── submit ── */
  const handleSubmit = async () => {
    const errs = {};
    if (!name.trim())            errs.name = 'Team name is required';
    else if (name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), members: selectedMembers.map(m => m._id) });
      onClose();
    } catch (e) {
      // error is handled by the parent (toastError) — just keep modal open
      console.error('Team save failed:', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ds-overlay" onClick={e => e.target === e.currentTarget && !isSubmitting && onClose?.()} style={{ zIndex: 1100 }}>
      <div className="ds-modal ds-modal-lg" style={{ maxWidth: 580 }}>

        {/* ── Header ── */}
        <div className="ds-modal-header">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:'#EEF1FD', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h2 className="ds-modal-title">{isEdit ? 'Edit Team' : 'Create New Team'}</h2>
          </div>
          <button className="ds-modal-close" onClick={onClose} disabled={isSubmitting}>×</button>
        </div>

        {/* ── Body ── */}
        <div className="ds-modal-body" style={{ display:'flex', flexDirection:'column', gap:18 }}>

          {/* Team Name */}
          <div className="ds-form-group">
            <label className="ds-label">Team Name <span style={{ color:'#EF4444' }}>*</span></label>
            <input
              className={`ds-input${errors.name ? ' error' : ''}`}
              placeholder="e.g. Frontend Team, DevOps Squad…"
              value={name}
              onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: null })); }}
              disabled={isSubmitting}
              autoFocus
            />
            {errors.name && <span className="ds-error">{errors.name}</span>}
          </div>

          {/* Description */}
          <div className="ds-form-group">
            <label className="ds-label">
              Description
              <span style={{ fontSize:'0.7rem', color:'#9CA3AF', fontWeight:400, marginLeft:4 }}>(optional)</span>
            </label>
            <input
              className="ds-input"
              placeholder="Short description of the team's purpose…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Member Picker */}
          <div className="ds-form-group">
            <label className="ds-label">
              Members
              {selectedMembers.length > 0 && (
                <span style={{ marginLeft:6, fontSize:'0.72rem', fontWeight:700, color:'#534AB7', background:'#EEF1FD', padding:'1px 7px', borderRadius:20 }}>
                  {selectedMembers.length} selected
                </span>
              )}
            </label>

            {/* Search box */}
            <div style={{ position:'relative', marginBottom:8 }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF', display:'flex', pointerEvents:'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </span>
              <input
                className="ds-search-input"
                style={{ paddingLeft:36, paddingRight: search ? 36 : 14, borderRadius:8 }}
                placeholder="Search by name, email, or ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                disabled={isSubmitting}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#9CA3AF', cursor:'pointer', padding:2, display:'flex', alignItems:'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>

            {/* Results list */}
            <div style={{ border:'1px solid #E9EBF0', borderRadius:10, overflow:'hidden', maxHeight:230, overflowY:'auto' }}>
              {loadingUsers ? (
                <div style={{ padding:'20px', textAlign:'center', color:'#9CA3AF', fontSize:'0.85rem' }}>Loading users…</div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ padding:'20px', textAlign:'center', color:'#9CA3AF', fontSize:'0.85rem' }}>
                  {search ? `No users matching "${search}"` : 'No users found'}
                </div>
              ) : (
                filteredUsers.map((u, idx) => {
                  const selected   = isSelected(u._id);
                  const roleStyle  = ROLE_COLORS[u.role] ?? ROLE_COLORS.user;
                  const isLast     = idx === filteredUsers.length - 1;
                  return (
                    <div
                      key={u._id}
                      onClick={() => !isSubmitting && toggleMember(u)}
                      style={{
                        display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        background: selected ? '#F0F3FF' : idx % 2 === 0 ? '#FAFAFA' : '#fff',
                        borderBottom: isLast ? 'none' : '1px solid #F3F4F6',
                        transition:'background .1s',
                      }}
                      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#F3F4F6'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = selected ? '#F0F3FF' : idx % 2 === 0 ? '#FAFAFA' : '#fff'; }}
                    >
                      <Avatar photo={u.photo} name={u.name ?? '?'} size={34} />

                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:0, fontWeight:600, fontSize:'0.875rem', color:'#111827', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                          {u.name}
                        </p>
                        <p style={{ margin:0, fontSize:'0.72rem', color:'#9CA3AF', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                          {u.email}
                        </p>
                      </div>

                      <span style={{ fontSize:'0.68rem', fontWeight:700, padding:'2px 8px', borderRadius:20, background:roleStyle.bg, color:roleStyle.color, flexShrink:0, textTransform:'capitalize' }}>
                        {u.role}
                      </span>

                      {/* Checkbox */}
                      <div style={{ width:20, height:20, borderRadius:6, flexShrink:0, border: selected ? 'none' : '2px solid #D1D5DB', background: selected ? '#534AB7' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}>
                        {selected && <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {search && !loadingUsers && (
              <p style={{ margin:'4px 0 0', fontSize:'0.72rem', color:'#9CA3AF' }}>
                {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''} for "{search}"
              </p>
            )}
          </div>

          {/* Selected chips */}
          {selectedMembers.length > 0 && (
            <div className="ds-form-group">
              <label className="ds-label">Selected ({selectedMembers.length})</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {selectedMembers.map(m => (
                  <div key={m._id} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px 4px 5px', borderRadius:20, background:'#EEF1FD', border:'1.5px solid #C7D2F8' }}>
                    <Avatar photo={m.photo} name={m.name ?? '?'} size={20} />
                    <span style={{ fontSize:'0.8rem', fontWeight:600, color:'#534AB7', maxWidth:90, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                      {m.name?.split(' ')[0]}
                    </span>
                    <button type="button" onClick={() => toggleMember(m)} style={{ display:'flex', alignItems:'center', background:'none', border:'none', cursor:'pointer', color:'#8A9FE8', padding:1 }}>
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="ds-modal-footer">
          <button className="ds-btn ds-btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button className="ds-btn ds-btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (isEdit ? 'Saving…' : 'Creating…') : (
              <>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {isEdit ? 'Save Changes' : 'Create Team'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddTeamModal;
