import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AssignMemberModal from '../components/AssignMemberModal';
import Avatar from '../components/Avatar';
import HelpSolveModal from '../components/HelpSolveModal';
import './ticket-details.css';

/* ── helpers ─────────────────────────────── */
const getStatusBadgeClass = (status) => {
  if (!status) return 'td-badge td-badge-closed';
  const s = status.toLowerCase();
  if (s === 'open') return 'td-badge td-badge-open';
  if (s === 'in progress' || s === 'in_progress') return 'td-badge td-badge-inprogress';
  if (s === 'assigned') return 'td-badge td-badge-assigned';
  if (s === 'closed' || s === 'resolved') return 'td-badge td-badge-closed';
  return 'td-badge td-badge-closed';
};

const getPriorityBadgeClass = (priority) => {
  if (!priority) return 'td-badge td-badge-low';
  const p = priority.toLowerCase();
  if (p === 'high' || p === 'critical') return 'td-badge td-badge-high';
  if (p === 'medium') return 'td-badge td-badge-medium';
  return 'td-badge td-badge-low';
};

const AccentTitle = ({ title }) => {
  if (!title) return <span>No Title</span>;
  const words = title.split(' ');
  if (words.length < 2) return <span>{title}</span>;
  return (
    <>
      {words[0]}{' '}
      <span className="accent">{words[1]}</span>
      {words.length > 2 ? ' ' + words.slice(2).join(' ') : ''}
    </>
  );
};

export default function TicketDetailsPage({ tickets = [], isITUser, user }) {
  const { id } = useParams();
  const [localTicket, setLocalTicket] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [solution, setSolution] = useState("");
  const [loading, setLoading] = useState(true);
  const [showHelpSolve, setShowHelpSolve] = useState(false);

  const API_BASE = "https://punto-production-21ed.up.railway.app/api/v1/tickets";

  // 1. Initial Load: Find in props or fetch from API
  useEffect(() => {
    const found = tickets.find((t) => t._id === id || t.id === id);
    if (found) {
      setLocalTicket(found);
      setLoading(false);
    } else {
      // If not in props (happens after resolve/refresh), fetch directly
      const token = localStorage.getItem("token");
      fetch(`${API_BASE}/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
        .then(res => res.json())
        .then(data => {
          if (data.data) setLocalTicket(data.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id, tickets]);

  // 2. Assign To Me
  const handleAssignToMe = async () => {
    if (!user?._id) return alert("User session not found.");
    setIsUpdating(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ assign_to: user._id, status: 'in_progress' })
      });
      if (response.ok) {
        setLocalTicket({ ...localTicket, assign_to: { _id: user._id, name: user.name }, status: 'in_progress' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. Resolve Ticket
  const handleResolveTicket = async () => {
    if (!solution.trim()) return alert("Please provide a solution description.");
    setIsUpdating(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ 
          status: 'closed',
          description: localTicket.description + "\n\nRESOLUTION: " + solution 
        })
      });

      if (response.ok) {
        setLocalTicket({ ...localTicket, status: 'closed' });
        setShowResolveForm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="td-bg flex items-center justify-center h-full">Syncing...</div>;

  if (!localTicket) {
    return (
      <div className="td-bg flex flex-col items-center justify-center h-full gap-4">
        <p className="text-lg font-semibold text-slate-700">Ticket not found.</p>
        <Link to="/" className="text-sm text-blue-600 hover:underline">← Back to My Tickets</Link>
      </div>
    );
  }

  const createdBy = localTicket.created_by || {};
  const assignTo = localTicket.assign_to || null;
  const isAssignedToMe = assignTo?._id === user?._id;

  return (
    <div className="td-bg">
      <div className="td-header">
        <div className="td-header-left">
          <Link to="/" className="td-back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </Link>
          <div>
            <h1 className="td-header-title">Ticket #{localTicket._id?.slice(-6)}</h1>
            <p className="td-header-sub">View and manage full history</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="td-assign-btn"
            style={{ backgroundColor: '#EEF1FD', borderColor: '#C7D2F8', color: '#534AB7' }}
            onClick={() => setShowHelpSolve(true)}
          >
            🧠 Help me solve
          </button>

          {isITUser && localTicket.status === 'open' && (
            <button className="td-assign-btn" onClick={handleAssignToMe} disabled={isUpdating}>
              Assign To Me
            </button>
          )}

          {isITUser && isAssignedToMe && localTicket.status === 'in_progress' && !showResolveForm && (
            <button 
              className="td-assign-btn" 
              style={{ backgroundColor: '#10B981', borderColor: '#10B981' }} 
              onClick={() => setShowResolveForm(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: 6}}>
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Resolve Ticket
            </button>
          )}
        </div>
      </div>

      <div className="td-grid">
        <div className="td-left-col">
          {showResolveForm && (
            <div className="td-card" style={{ border: '2px solid #10B981', backgroundColor: '#F0FDF4', marginBottom: 20 }}>
              <p className="td-card-title" style={{ color: '#166534' }}>Final Solution</p>
              <textarea 
                className="ds-textarea" 
                placeholder="Describe how this was fixed..."
                style={{ marginTop: 10, minHeight: 80, width: '100%' }}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="ds-btn ds-btn-primary" style={{ backgroundColor: '#10B981' }} onClick={handleResolveTicket} disabled={isUpdating}>
                  Submit Resolution
                </button>
                <button className="ds-btn ds-btn-secondary" onClick={() => setShowResolveForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="td-card">
            <p className="td-ticket-headline"><AccentTitle title={localTicket.name} /></p>
          </div>

          <div className="td-card">
            <p className="td-card-title">User Profile</p>
            <div className="td-creator-layout">
              <Avatar photo={createdBy.photo} name={createdBy.name} size={48} />
              <div className="td-creator-grid">
                <div><div className="td-field-label">Full Name</div><div className="td-field-value">{createdBy.name}</div></div>
                <div><div className="td-field-label">Role</div><div className="td-field-value">{createdBy.role}</div></div>
                <div><div className="td-field-label">Email</div><div className="td-field-value">{createdBy.email || 'N/A'}</div></div>
                <div><div className="td-field-label">Phone</div><div className="td-field-value">{createdBy.phone || 'N/A'}</div></div>
                <div><div className="td-field-label">Created</div><div className="td-field-value">{localTicket.createdAt}</div></div>
              </div>
            </div>
          </div>

          <div className="td-card">
            <p className="td-card-title">Full Description</p>
            <p className="td-description-text" style={{ whiteSpace: 'pre-wrap' }}>{localTicket.description}</p>
          </div>
        </div>

        <div className="td-details-card">
          <h3>Ticket Overview</h3>
          <div className="td-detail-row">
            <div className="td-detail-label">Status</div>
            <span className={getStatusBadgeClass(localTicket.status)}>{localTicket.status}</span>
          </div>
          <div className="td-detail-row">
            <div className="td-detail-label">Assigned To</div>
            <div className="td-detail-value">{assignTo?.name || 'Unassigned'}</div>
          </div>
          <div className="td-detail-row">
            <div className="td-detail-label">Priority</div>
            <span className={getPriorityBadgeClass(localTicket.priority)}>{localTicket.priority}</span>
          </div>
          <div className="td-detail-row">
            <div className="td-detail-label">Category</div>
            <div className="td-detail-value">{localTicket.category}</div>
          </div>
        </div>
      </div>

      <HelpSolveModal
        isOpen={showHelpSolve}
        onClose={() => setShowHelpSolve(false)}
        itemId={localTicket._id}
        itemType="ticket"
        itemLabel={localTicket.name}
      />
    </div>
  );
}