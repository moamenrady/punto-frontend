import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
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

const AttachmentViewer = ({ ticketId, attachmentIndex, attachment }) => {
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    if (attachment && attachment.data) {
      try {
        const rawData = attachment.data.data || attachment.data;
        if (Array.isArray(rawData)) {
          const blob = new Blob([new Uint8Array(rawData)], { type: attachment.contentType });
          const url = URL.createObjectURL(blob);
          setImgSrc(url);
          return () => URL.revokeObjectURL(url);
        }
      } catch (err) {
        console.error("Failed to parse local attachment data", err);
      }
    }

    let isMounted = true;
    const fetchAttachment = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `https://punto-production-21ed.up.railway.app/api/v1/tickets/${ticketId}/attachments/${attachmentIndex}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: "blob"
          }
        );
        if (isMounted) {
          const url = URL.createObjectURL(res.data);
          setImgSrc(url);
        }
      } catch (err) {
        console.error("Failed to fetch attachment from endpoint", err);
      }
    };
    fetchAttachment();
    return () => {
      isMounted = false;
    };
  }, [ticketId, attachmentIndex, attachment]);

  if (!imgSrc) {
    return (
      <div className="flex items-center gap-2 p-4 border rounded-2xl bg-gray-50/50 dark:bg-white/5">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent" />
        <span className="text-xs text-gray-500 font-medium">Loading attachment...</span>
      </div>
    );
  }

  const filename = attachment.filename || `Attachment-${attachmentIndex}`;

  return (
    <div className="border rounded-2xl overflow-hidden bg-white dark:bg-[#1E1B3A] shadow-sm max-w-sm flex flex-col">
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900/40 p-2 flex items-center justify-center min-h-[160px]">
        <img src={imgSrc} alt={filename} className="max-w-full max-h-40 object-contain rounded-lg shadow-sm" />
      </div>
      <div className="p-3 bg-gray-50/80 dark:bg-[#15132d] text-xs flex justify-between items-center border-t border-gray-100 dark:border-gray-800">
        <span className="truncate font-semibold text-gray-700 dark:text-gray-300 max-w-[180px]">{filename}</span>
        <a href={imgSrc} download={filename} className="text-purple-600 dark:text-purple-400 font-bold hover:underline">
          Download
        </a>
      </div>
    </div>
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
  const [resolveError, setResolveError] = useState("");

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
    if (!solution.trim()) {
      setResolveError("Please provide a solution description.");
      return;
    }
    setResolveError("");
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
          status: 'resolved',
          resolution: solution
        })
      });

      const data = await response.json();

      if (response.ok) {
        setLocalTicket({ ...localTicket, status: 'resolved', resolution: solution });
        setShowResolveForm(false);
        setSolution("");
      } else {
        setResolveError(data?.message || "Failed to resolve ticket. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setResolveError("Network error. Please try again.");
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
  const isAssignedToMe = assignTo?._id?.toString() === user?._id?.toString();

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
              {resolveError && (
                <p style={{ color: '#DC2626', fontSize: 13, marginTop: 8, fontWeight: 500 }}>{resolveError}</p>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="ds-btn ds-btn-primary" style={{ backgroundColor: '#10B981' }} onClick={handleResolveTicket} disabled={isUpdating}>
                  {isUpdating ? 'Submitting...' : 'Submit Resolution'}
                </button>
                <button className="ds-btn ds-btn-secondary" onClick={() => { setShowResolveForm(false); setResolveError(""); }}>Cancel</button>
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

            {localTicket.attachments && localTicket.attachments.length > 0 && (
              <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-4">
                <p className="td-card-title mb-3">Attachments</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {localTicket.attachments.map((att, idx) => (
                    <AttachmentViewer
                      key={att._id || idx}
                      ticketId={localTicket._id}
                      attachmentIndex={idx}
                      attachment={att}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {localTicket.resolution && (
            <div className="td-card" style={{ border: '2px solid #10B981', background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <p className="td-card-title" style={{ color: '#166534', margin: 0 }}>IT Response</p>
              </div>
              <p className="td-description-text" style={{ whiteSpace: 'pre-wrap', color: '#15803D', fontWeight: 500 }}>
                {localTicket.resolution}
              </p>
            </div>
          )}
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