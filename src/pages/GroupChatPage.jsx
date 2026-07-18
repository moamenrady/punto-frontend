import React, { useEffect, useState, useCallback } from "react";
import { projectService } from "../services/projectService";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatWindow from "../components/chat/ChatWindow";

/**
 * GroupChatPage — the Chat & Messaging page for the ticketing system.
 *
 * Composes ChatSidebar (groups the user belongs to + DMs + pinned AI
 * Assistant) with ChatWindow (the active conversation). This is the page
 * rendered at the `/chatmodal` route (imported in AppRouter/App.jsx as
 * `TeamChat`).
 *
 * Props:
 *  - user           – logged-in user
 *  - theme          – app-wide theme object ({ bg, textP, textM, border, ... })
 *  - onProfileClick – fn() – opens the user's profile modal
 */
const GroupChatPage = ({ user, theme, onProfileClick }) => {
  const isDark = Boolean(theme?.bg?.includes("12102A") || theme?.bg?.includes("dark"));

  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState(null);

  const [dmContacts, setDmContacts] = useState([]);
  const [selected, setSelected] = useState({ type: "ai" });
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const dmStorageKey = user?._id ? `dm_contacts_${user._id}` : null;

  // ── Load teams the current user belongs to ──────────────────────────────
  const loadTeams = useCallback(async () => {
    setTeamsLoading(true);
    setTeamsError(null);
    try {
      const allTeams = await projectService.getTeams();
      const myTeams = (Array.isArray(allTeams) ? allTeams : []).filter((team) =>
        (team.members ?? []).some((m) => {
          const memberId = m?.user?._id ?? m?.user ?? m?._id ?? m;
          return String(memberId) === String(user?._id);
        })
      );
      setTeams(myTeams);
    } catch (err) {
      setTeamsError(err.message || "Couldn't load your groups.");
      setTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (user?._id) loadTeams();
  }, [user?._id, loadTeams]);

  // ── Load previously-started DM contacts from localStorage ───────────────
  useEffect(() => {
    if (!dmStorageKey) return;
    try {
      const saved = localStorage.getItem(dmStorageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      setDmContacts(Array.isArray(parsed) ? parsed : []);
    } catch {
      setDmContacts([]);
    }
  }, [dmStorageKey]);

  const startDm = (contact) => {
    if (!contact?._id || contact._id === user?._id) return;
    setDmContacts((prev) => {
      const exists = prev.some((c) => c._id === contact._id);
      const updated = exists ? prev : [contact, ...prev];
      if (dmStorageKey) {
        try {
          localStorage.setItem(dmStorageKey, JSON.stringify(updated));
        } catch {
          /* non-fatal */
        }
      }
      return updated;
    });
    setSelected({ type: "dm", id: contact._id, contact });
    setMobileShowChat(true);
  };

  const handleSelectAI = () => {
    setSelected({ type: "ai", id: "ai" });
    setMobileShowChat(true);
  };

  const handleSelectTeam = (team) => {
    setSelected({ type: "team", id: team._id, team });
    setMobileShowChat(true);
  };

  const handleSelectDM = (contact) => startDm(contact);

  const handleBack = () => setMobileShowChat(false);

  const cardBg = isDark ? "bg-[#0f1117] border-[#1e2336]" : "bg-white border-gray-200";

  return (
    <div className={`w-full h-[calc(100vh-134px)] min-h-[520px] flex rounded-2xl border overflow-hidden shadow-sm ${cardBg}`}>
      <div className={`${mobileShowChat ? "hidden" : "flex"} md:flex w-full md:w-[300px] lg:w-[320px] shrink-0 h-full`}>
        <ChatSidebar
          user={user}
          isDark={isDark}
          teams={teams}
          teamsLoading={teamsLoading}
          teamsError={teamsError}
          onRetryTeams={loadTeams}
          dmContacts={dmContacts}
          selected={selected}
          onSelectAI={handleSelectAI}
          onSelectTeam={handleSelectTeam}
          onSelectDM={handleSelectDM}
          onProfileClick={onProfileClick}
        />
      </div>

      <div className={`${mobileShowChat ? "flex" : "hidden"} md:flex flex-1 h-full min-w-0`}>
        <ChatWindow
          chatType={selected?.type ?? null}
          team={selected?.type === "team" ? selected.team ?? teams.find((t) => t._id === selected.id) : undefined}
          contact={selected?.type === "dm" ? selected.contact ?? dmContacts.find((c) => c._id === selected.id) : undefined}
          user={user}
          isDark={isDark}
          onBack={handleBack}
          onStartDM={startDm}
        />
      </div>
    </div>
  );
};

export default GroupChatPage;
