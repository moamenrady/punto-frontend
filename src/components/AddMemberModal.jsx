import React, { useState, useEffect, useRef } from "react";
import { projectService } from "../services/projectService";

/**
 * AddMemberModal
 * Props:
 *  isOpen        – boolean
 *  onClose       – fn
 *  project       – { _id, name, members: [{ _id, name, email, role }] }
 *  onMembersChange – fn(updatedProject) called after add/remove
 */
const AddMemberModal = ({ isOpen, onClose, project, onMembersChange }) => {
  const [query, setQuery] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState("");
  const [actionMap, setActionMap] = useState({});
  const [localMembers, setLocalMembers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setLocalMembers(project.members ?? []);
    }
  }, [isOpen]); // userId → 'adding'|'removing'
  const debounceRef = useRef(null);

  // Load all company users when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSearchErr("");
      setActionMap({});
      setLocalMembers(project?.members ?? []);
      (async () => {
        try {
          setSearching(true);
          const users = await projectService.searchUsers("");
          const filtered = users.filter(
            (u) => u.role !== "manager" && u.role !== "admin",
          );
          setAllUsers(filtered);
          setResults(filtered);
        } catch (e) {
          setSearchErr(e.message);
        } finally {
          setSearching(false);
        }
      })();
    }
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const memberIds = new Set(localMembers.map((m) => m._id ?? m));

  const handleSearch = (val) => {
    setQuery(val);
    setSearchErr("");

    // Exclude current project members from the search results
    const available = allUsers.filter(
      (u) =>
        !memberIds.has(u._id) && u.role !== "manager" && u.role !== "admin",
    );

    if (!val.trim()) {
      setResults(available);
      return;
    }
    // Filter locally from already-loaded users
    const lower = val.toLowerCase();
    const filtered = available.filter(
      (u) =>
        u.name?.toLowerCase().includes(lower) ||
        u.email?.toLowerCase().includes(lower),
    );
    setResults(filtered);
  };

  const handleAdd = async (user) => {
    setActionMap((prev) => ({ ...prev, [user._id]: "adding" }));
    try {
      const updated = await projectService.addMember(project._id, user._id);
      onMembersChange?.(updated);
      setLocalMembers(updated.members ?? []);
      setResults((prev) => prev.filter((u) => u._id !== user._id));
    } catch (e) {
      alert(e.message);
    } finally {
      setActionMap((prev) => {
        const n = { ...prev };
        delete n[user._id];
        return n;
      });
    }
  };

  const handleRemove = async (user) => {
    setActionMap((prev) => ({ ...prev, [user._id]: "removing" }));
    try {
      const updated = await projectService.removeMember(project._id, user._id);
      onMembersChange?.(updated);
      setLocalMembers(updated.members ?? []);
      setResults((prev) => [...prev, user]);
    } catch (e) {
      alert(e.message);
    } finally {
      setActionMap((prev) => {
        const n = { ...prev };
        delete n[user._id];
        return n;
      });
    }
  };

  const roleColor = (role) =>
    ({ admin: "#DC2626", manager: "#D97706", user: "#059669" })[role] ??
    "#6B7280";
  const roleBg = (role) =>
    ({ admin: "#FEE2E2", manager: "#FEF3C7", user: "#D1FAE5" })[role] ??
    "#F3F4F6";

  const UserRow = ({ user, isMember }) => {
    const busy = !!actionMap[user._id];
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 0",
          borderBottom: "1px solid #F3F4F6",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#8A9FE8,#6B82D8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.82rem",
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {user.name
            ?.split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "#111827",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.name}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: "#9CA3AF",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.email}
          </p>
        </div>
        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 20,
            background: roleBg(user.role),
            color: roleColor(user.role),
            flexShrink: 0,
          }}
        >
          {user.role ?? "user"}
        </span>
        {isMember ? (
          <button
            disabled={busy}
            onClick={() => handleRemove(user)}
            style={{
              padding: "5px 12px",
              fontSize: "0.78rem",
              fontWeight: 600,
              borderRadius: 6,
              border: "1px solid #FECACA",
              background: "#FEF2F2",
              color: "#DC2626",
              cursor: busy ? "wait" : "pointer",
              flexShrink: 0,
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "…" : "Remove"}
          </button>
        ) : (
          <button
            disabled={busy}
            onClick={() => handleAdd(user)}
            style={{
              padding: "5px 12px",
              fontSize: "0.78rem",
              fontWeight: 600,
              borderRadius: 6,
              border: "1px solid #C7D2F8",
              background: "#EEF1FD",
              color: "#534AB7",
              cursor: busy ? "wait" : "pointer",
              flexShrink: 0,
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "…" : "+ Add"}
          </button>
        )}
      </div>
    );
  };

  const currentMembers = localMembers.filter(
    (m) => m.role !== "manager" && m.role !== "admin",
  );

  return (
    <div
      className="ds-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="ds-modal" style={{ maxWidth: 520, width: "100%" }}>
        {/* Header */}
        <div className="ds-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#EEF1FD",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="#8A9FE8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h2 className="ds-modal-title" style={{ marginBottom: 0 }}>
                Manage Team
              </h2>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#9CA3AF" }}>
                {project.name}
              </p>
            </div>
          </div>
          <button className="ds-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div
          className="ds-modal-body"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Search */}
          <div>
            <label className="ds-label">Search users by name or email</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9CA3AF",
                  pointerEvents: "none",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                className="ds-input"
                style={{ paddingLeft: 32 }}
                placeholder="Type a name or email…"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            {searchErr && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "0.75rem",
                  color: "#DC2626",
                }}
              >
                {searchErr}
              </p>
            )}
          </div>

          {/* Search results / All users */}
          <div>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {query.trim() ? "Search Results" : "All Users"}
            </p>
            {searching ? (
              <p
                style={{
                  textAlign: "center",
                  color: "#9CA3AF",
                  fontSize: "0.85rem",
                  padding: "12px 0",
                }}
              >
                Loading…
              </p>
            ) : results.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "#9CA3AF",
                  fontSize: "0.85rem",
                  padding: "12px 0",
                }}
              >
                No users found
              </p>
            ) : (
              <div style={{ maxHeight: 220, overflowY: "auto" }}>
                {results.map((u) => (
                  <UserRow
                    key={u._id}
                    user={u}
                    isMember={memberIds.has(u._id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Current members */}
          <div>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Current Members ({currentMembers.length})
            </p>
            {currentMembers.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "#D1D5DB",
                  fontSize: "0.85rem",
                  padding: "16px 0",
                }}
              >
                No members yet — search above to add
              </p>
            ) : (
              currentMembers.map((m) => (
                <UserRow key={m._id} user={m} isMember={true} />
              ))
            )}
          </div>
        </div>

        <div className="ds-modal-footer">
          <button
            type="button"
            className="ds-btn ds-btn-secondary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
