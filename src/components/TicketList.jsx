import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserProfileModal from "./UserProfileModal";
import Avatar from "./Avatar";

const TicketList = ({
  tickets,
  currentUser,
  allTickets,
  users,
  setUsers,
}) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  // Helper to calculate relative time
  const formatTimeSince = (dateString) => {
    if (!dateString) return "N/A";
    const now = new Date();
    const created = new Date(dateString);
    const diffInSeconds = Math.floor((now - created) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    
    return created.toLocaleDateString(); // Fallback to date for very old tickets
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "";
    
    // Status color mapping
    if (s === "open") {
      return (
        <span className="ds-badge" style={{ 
          backgroundColor: "#FEE2E2", 
          color: "#EF4444", 
          borderRadius: '6px', 
          padding: '4px 10px',
          fontSize: '0.75rem',
          fontWeight: 600 
        }}>
          Open
        </span>
      );
    }
    
    if (s === "resolved" || s === "closed") {
      return (
        <span className="ds-badge" style={{ 
          backgroundColor: "#DCFCE7", 
          color: "#22C55E", 
          borderRadius: '6px', 
          padding: '4px 10px',
          fontSize: '0.75rem',
          fontWeight: 600 
        }}>
          Resolved
        </span>
      );
    }

    if (s === "in progress" || s === "in_progress") {
      return (
        <span className="ds-badge" style={{ 
          backgroundColor: "#FEF9C3", 
          color: "#CA8A04", 
          borderRadius: '6px', 
          padding: '4px 10px',
          fontSize: '0.75rem',
          fontWeight: 600 
        }}>
          In Progress
        </span>
      );
    }

    return <span className="ds-badge ds-badge-assigned">{status}</span>;
  };

  const getPriorityBadge = (priority) => {
    const p = priority?.toLowerCase() || "low";
    if (p === "high" || p === "critical") return <span className="ds-badge ds-badge-high">{priority}</span>;
    if (p === "medium") return <span className="ds-badge ds-badge-medium">{priority}</span>;
    if (p === "low") return <span className="ds-badge ds-badge-low">{priority}</span>;
    return <span className="ds-badge ds-badge-closed">{priority}</span>;
  };

  const handleUserClick = (e, userObj) => {
    e.stopPropagation();
    if (!userObj) return;
    const fullUser = users?.find((u) => u.name === userObj.name) ?? userObj;
    if (userObj.role?.toLowerCase() === "admin") {
      setSelectedUser({ ...fullUser, _forcePanel: true });
    } else {
      setSelectedUser(fullUser);
    }
  };

  const gridLayout = {
    display: "grid",
    gridTemplateColumns: "100px 3fr 1fr 1.2fr 1.2fr 1fr 0.8fr 0.8fr",
    gap: "16px",
    alignItems: "center",
    padding: "16px 24px",
  };

  const cellStyle = {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: "0.85rem",
    color: "#374151"
  };

  return (
    <>
      <div className="ticket-rows">
        {tickets?.map((ticket) => (
          <div 
            key={ticket._id} 
            style={{ ...gridLayout, borderBottom: "1px solid #F3F4F6", cursor: 'pointer' }}
            className="ticket-table-row-hover"
            onClick={() => navigate(`/ticket/${ticket._id}`)}
          >
            {/* ID */}
            <span style={{ ...cellStyle, fontFamily: "monospace", color: "#6B7280" }}>
              #{ticket._id?.slice(-6)}
            </span>

            {/* Subject */}
            <span style={{ ...cellStyle, fontWeight: "600" }} title={ticket.name}>
              {ticket.name}
            </span>

            {/* Category */}
            <span style={cellStyle}>
              <span className="category-pill" style={{ fontSize: "0.75rem" }}>
                {ticket.category || "General"}
              </span>
            </span>

            {/* Created By */}
            <div 
              style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", overflow: "hidden" }}
              onClick={(e) => handleUserClick(e, ticket.created_by)}
            >
              <Avatar photo={ticket.created_by?.photo} name={ticket.created_by?.name} size={24} />
              <span style={cellStyle}>{ticket.created_by?.name || "System"}</span>
            </div>

            {/* Assigned To */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
              {ticket.assign_to?.name ? (
                <>
                  <Avatar photo={ticket.assign_to?.photo} name={ticket.assign_to?.name} size={24} />
                  <span style={cellStyle}>{ticket.assign_to.name}</span>
                </>
              ) : (
                <span style={{ ...cellStyle, color: "#9CA3AF", fontStyle: "italic" }}>Unassigned</span>
              )}
            </div>

            {/* Date - Changed to show time since creation */}
            <span style={{ ...cellStyle, color: "#6B7280" }}>
              {formatTimeSince(ticket.createdAt)}
            </span>

            {/* Priority */}
            <div>{getPriorityBadge(ticket.priority)}</div>

            {/* Status */}
            <div>{getStatusBadge(ticket.status)}</div>
          </div>
        ))}
      </div>

      <UserProfileModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser ?? {}}
        setUser={(updated) => {
          if (setUsers)
            setUsers((prev) => prev.map((u) => (u.name === updated.name ? updated : u)));
          setSelectedUser(updated);
        }}
        currentUser={currentUser}
        allTickets={allTickets}
      />
    </>
  );
};

export default TicketList;