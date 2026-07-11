import React from "react";
import { useLocation } from "react-router-dom";
import { Sun, Moon, Bell, MessageSquare, FileText, Search, LayoutDashboard, Package, Settings, BarChart2, PenLine } from "lucide-react";
import Avatar from "./Avatar";

const Header = ({
  user,
  onProfileClick,
  theme,
  setTheme,
  searchQuery,
  setSearchQuery,
}) => {
  const location = useLocation();

  const ROLE_MAP = {
    admin:   { label: "Admin",   bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
    manager: { label: "Manager", bg: "#FFF7ED", color: "#D97706", border: "#FDE68A" },
    agent:   { label: "Agent",   bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
    member:  { label: "Member",  bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
    user:    { label: "User",    bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
  };
  const roleCfg   = ROLE_MAP[user?.role] || ROLE_MAP.user;
  const roleLabel = roleCfg.label;
  const roleBg    = roleCfg.bg;
  const roleColor = roleCfg.color;
  const roleBorder= roleCfg.border;

  const getPageInfo = (path) => {
    if (path.startsWith("/dashboard"))  return { title: "Project Management",            Icon: LayoutDashboard, placeholder: "Search Projects..." };
    if (path.startsWith("/stock"))      return { title: "Stock Management",      Icon: Package,         placeholder: "Search items, SKUs, or categories..." };
    if (path.startsWith("/chatmodal"))  return { title: "Chat System",           Icon: MessageSquare,   placeholder: "Search messages or channels..." };
    if (path.startsWith("/settings"))   return { title: "Settings",              Icon: Settings,        placeholder: "Search settings..." };
    if (path.startsWith("/reports"))    return { title: "Reports & Analytics",   Icon: BarChart2,       placeholder: "Search charts, team metrics, or analysis..." };
    if (path.startsWith("/control-panel"))    return { title: "Control Panel",   Icon: PenLine,       placeholder: "Search ..." };
    return                                     { title: "Ticketing System",      Icon: FileText,        placeholder: "Search by ID, title, category, or user..." };
  };

  const { title: pageTitle, Icon: PageIcon, placeholder: searchPlaceholder } = getPageInfo(location.pathname);

  const dark = theme === "dark";
  const hBg     = dark ? "#0f1117"            : "#FFFFFF";
  const hBorder = dark ? "#1e2336"            : "#E9EBF0";
  const hText   = dark ? "#e2e8f0"            : "#111827";
  const hMuted  = dark ? "#94a3b8"            : "#9CA3AF";
  const hIcon   = dark ? "#64748b"            : "#6B7280";
  const iBg     = dark ? "#1a1f2e"            : "#F9FAFB";
  const iBorder = dark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const btnBg   = dark ? "#1a1f2e"            : "#F9FAFB";
  const btnBdr  = dark ? "rgba(255,255,255,0.08)" : "#E9EBF0";

  return (
    <header
      className="top-header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        height: "70px",
        backgroundColor: hBg,
        borderBottom: `1px solid ${hBorder}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <PageIcon size={18} color="#8A9FE8" />
        <span
          style={{ fontSize: "0.95rem", fontWeight: 600, color: hText }}
        >
          {pageTitle}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          maxWidth: "500px",
          margin: "0 40px",
          position: "relative",
        }}
      >
        <Search
          size={18}
          color={hMuted}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 16px 10px 45px",
            borderRadius: "30px",
            border: `1px solid ${iBorder}`,
            backgroundColor: iBg,
            color: hText,
            fontSize: "0.85rem",
            outline: "none",
          }}
        />
      </div>

      <div
        className="header-actions"
        style={{ display: "flex", alignItems: "center", gap: 12 }}
      >
        {/* Read-only role badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: roleBg,
            padding: "5px 12px",
            borderRadius: "10px",
            border: `1px solid ${roleBorder}`,
          }}
        >
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: hMuted }}>
            ROLE:
          </span>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: roleColor,
            }}
          >
            {roleLabel}
          </span>
        </div>

        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="icon-btn"
          style={{
            padding: "8px",
            borderRadius: "12px",
            border: `1px solid ${btnBdr}`,
            background: btnBg,
            cursor: "pointer",
          }}
        >
          {theme === "light" ? (
            <Sun size={20} color={hIcon} />
          ) : (
            <Moon size={20} color={hIcon} />
          )}
        </button>

        <button
          className="icon-btn"
          style={{
            padding: "8px",
            borderRadius: "12px",
            border: `1px solid ${btnBdr}`,
            background: btnBg,
          }}
        >
          <MessageSquare size={20} color={hIcon} />
        </button>

        <button
          className="icon-btn"
          style={{
            padding: "8px",
            borderRadius: "12px",
            border: `1px solid ${btnBdr}`,
            background: btnBg,
          }}
        >
          <Bell size={20} color={hIcon} />
        </button>

        <div
          onClick={onProfileClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingLeft: 16,
            borderLeft: `1px solid ${hBorder}`,
            cursor: "pointer",
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "0.65rem",
                fontWeight: 800,
                color: hMuted,
                textTransform: "uppercase",
              }}
            >
              {roleLabel}
            </div>
            <div
              style={{ fontSize: "0.9rem", fontWeight: 700, color: hText }}
            >
              {user?.name}
            </div>
          </div>
          <Avatar photo={user?.avatar || user?.photo} name={user?.name} size={38} />
        </div>
      </div>
    </header>
  );
};

export default Header;
