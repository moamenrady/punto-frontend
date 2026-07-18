import React, { useMemo } from "react";
import { Search, Sparkles, Users, MessageCircle, AlertCircle, RefreshCw, Pin } from "lucide-react";
import Avatar from "../Avatar";

/**
 * ChatSidebar — left-hand rail for the Chat & Messaging page.
 *
 * Shows, top to bottom:
 *   1. A pinned "AI Assistant" entry (always visible, never filtered out).
 *   2. "Groups" — every team the current user belongs to.
 *   3. "Direct Messages" — 1-on-1 chats the user has started.
 *
 * Props:
 *  - user            – logged-in user
 *  - isDark          – dark-mode flag
 *  - teams           – Team[] (already filtered to "teams I'm a member of")
 *  - teamsLoading    – bool
 *  - teamsError      – string | null
 *  - onRetryTeams    – fn() – refetch teams
 *  - dmContacts      – User[] – people the user has started a DM with
 *  - selected        – { type: 'ai'|'team'|'dm', id: string } | null
 *  - onSelectAI      – fn()
 *  - onSelectTeam    – fn(team)
 *  - onSelectDM      – fn(contact)
 */
const ChatSidebar = ({
  user,
  isDark = false,
  teams = [],
  teamsLoading = false,
  teamsError = null,
  onRetryTeams,
  dmContacts = [],
  selected = null,
  onSelectAI,
  onSelectTeam,
  onSelectDM,
  onProfileClick,
}) => {
  const [search, setSearch] = React.useState("");

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => t.name?.toLowerCase().includes(q));
  }, [teams, search]);

  const filteredDms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dmContacts;
    return dmContacts.filter((c) => c.name?.toLowerCase().includes(q));
  }, [dmContacts, search]);

  const bg = isDark ? "bg-[#0f1117]" : "bg-white";
  const border = isDark ? "border-[#1e2336]" : "border-gray-200";
  const textP = isDark ? "text-gray-100" : "text-gray-900";
  const textM = isDark ? "text-gray-500" : "text-gray-400";
  const inputBg = isDark ? "bg-[#1a1f2e] border-[#1e2336] text-gray-100 placeholder:text-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400";
  const hoverBg = isDark ? "hover:bg-[#1a1f2e]" : "hover:bg-gray-50";
  const sectionLabel = isDark ? "text-gray-500" : "text-gray-400";

  const isAiSelected = selected?.type === "ai";

  const rowBase = "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors";
  const activeRow = isDark ? "bg-indigo-500/15 border border-indigo-500/30" : "bg-indigo-50 border border-indigo-200";
  const idleRow = "border border-transparent";

  return (
    <div className={`flex flex-col h-full w-full ${bg} border-r ${border}`}>
      {/* Header */}
      <div className={`px-4 py-4 border-b ${border} shrink-0`}>
        <h2 className={`text-[15px] font-semibold ${textP}`}>Messages</h2>
        <div className="relative mt-3">
          <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textM}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups or people…"
            className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-colors ${inputBg}`}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
        {/* Pinned AI Assistant */}
        <div>
          <div className={`flex items-center gap-1.5 px-2 mb-1.5 text-[11px] font-bold uppercase tracking-wider ${sectionLabel}`}>
            <Pin size={11} /> Pinned
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={onSelectAI}
            onKeyDown={(e) => e.key === "Enter" && onSelectAI?.()}
            className={`${rowBase} ${isAiSelected ? activeRow : `${idleRow} ${hoverBg}`}`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold truncate ${isAiSelected ? "text-indigo-600" : textP} ${isAiSelected && isDark ? "!text-indigo-300" : ""}`}>
                AI Assistant
              </p>
              <p className={`text-[12px] truncate ${textM}`}>Ask questions, run tasks</p>
            </div>
          </div>
        </div>

        {/* Groups */}
        <div>
          <div className={`flex items-center justify-between px-2 mb-1.5`}>
            <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${sectionLabel}`}>
              <Users size={11} /> Groups
            </span>
            {teams.length > 0 && (
              <span className={`text-[11px] font-semibold ${sectionLabel}`}>{teams.length}</span>
            )}
          </div>

          {teamsLoading ? (
            <div className="space-y-2 px-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`h-12 rounded-xl animate-pulse ${isDark ? "bg-[#1a1f2e]" : "bg-gray-100"}`} />
              ))}
            </div>
          ) : teamsError ? (
            <div className={`mx-2 rounded-xl border px-3 py-3 text-center ${isDark ? "border-red-900 bg-red-950/30" : "border-red-200 bg-red-50"}`}>
              <AlertCircle size={16} className={`mx-auto mb-1.5 ${isDark ? "text-red-400" : "text-red-500"}`} />
              <p className={`text-[12px] mb-2 ${isDark ? "text-red-300" : "text-red-600"}`}>{teamsError}</p>
              <button
                onClick={onRetryTeams}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className={`text-[12.5px] ${textM}`}>
                {search ? "No groups match your search." : "You're not part of any groups yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTeams.map((team) => {
                const isActive = selected?.type === "team" && selected?.id === team._id;
                const memberCount = team.members?.length ?? 0;
                return (
                  <div
                    key={team._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectTeam?.(team)}
                    onKeyDown={(e) => e.key === "Enter" && onSelectTeam?.(team)}
                    className={`${rowBase} ${isActive ? activeRow : `${idleRow} ${hoverBg}`}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${isDark ? "bg-[#1e2336] text-indigo-300" : "bg-indigo-100 text-indigo-600"}`}>
                      {team.name?.charAt(0)?.toUpperCase() || "T"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isActive && !isDark ? "text-indigo-700" : isActive && isDark ? "text-indigo-300" : textP}`}>
                        {team.name}
                      </p>
                      <p className={`text-[12px] truncate ${textM}`}>
                        {memberCount} member{memberCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Direct Messages */}
        <div>
          <div className={`flex items-center gap-1.5 px-2 mb-1.5 text-[11px] font-bold uppercase tracking-wider ${sectionLabel}`}>
            <MessageCircle size={11} /> Direct Messages
          </div>

          {filteredDms.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className={`text-[12.5px] ${textM}`}>
                {search
                  ? "No direct messages match your search."
                  : "No direct messages yet. Open a group and tap a member to start one."}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredDms.map((contact) => {
                const isActive = selected?.type === "dm" && selected?.id === contact._id;
                return (
                  <div
                    key={contact._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectDM?.(contact)}
                    onKeyDown={(e) => e.key === "Enter" && onSelectDM?.(contact)}
                    className={`${rowBase} ${isActive ? activeRow : `${idleRow} ${hoverBg}`}`}
                  >
                    <Avatar photo={contact.photo} name={contact.name} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isActive && !isDark ? "text-indigo-700" : isActive && isDark ? "text-indigo-300" : textP}`}>
                        {contact.name}
                      </p>
                      <p className={`text-[12px] truncate ${textM}`}>{contact.email || contact.role || "Direct message"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Current user footer */}
      {user && (
        <div className={`px-3 py-3 border-t ${border} shrink-0`}>
          <div
            role={onProfileClick ? "button" : undefined}
            tabIndex={onProfileClick ? 0 : undefined}
            onClick={onProfileClick}
            onKeyDown={(e) => e.key === "Enter" && onProfileClick?.()}
            className={`flex items-center gap-3 px-2 py-2 rounded-xl ${hoverBg} ${onProfileClick ? "cursor-pointer" : ""}`}
          >
            <Avatar photo={user.avatar || user.photo} name={user.name} size={34} />
            <div className="min-w-0 flex-1">
              <p className={`text-[13px] font-semibold truncate ${textP}`}>{user.name}</p>
              <p className={`text-[11px] truncate capitalize ${textM}`}>{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
