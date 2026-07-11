import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Camera,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { createPortal } from "react-dom";

const priorityColor = {
  critical: "#EF4444",
  high: "#F59E0B",
  medium: "#3B82F6",
  low: "#10B981",
};
const priorityBg = {
  critical: "#FEF2F2",
  high: "#FFFBEB",
  medium: "#EFF6FF",
  low: "#F0FDF4",
};
const ACCENT_BG = "#F5F4FF";

// Derive dark-mode variants at call time
const getThemeTokens = (theme) => {
  const d = theme?.bg?.includes('12102A') || document.documentElement.classList.contains('dark');
  return {
    isDark: d,
    panelBg:  d ? '#111827' : '#ffffff',
    accentBg: d ? '#1a1f2e' : '#F5F4FF',
    cardBg:   d ? '#1a1f2e' : '#ffffff',
    cardBdr:  d ? '#1e2336' : '#EDE9FE',
    textP:    d ? '#e2e8f0' : '#1F2937',
    textM:    d ? '#94a3b8' : '#6B7280',
    inputBg:  d ? '#0f1117' : '#F9FAFB',
    inputBdr: d ? '#1e2336' : '#E5E7EB',
    rowBdr:   d ? '#1e2336' : '#F3F4F6',
  };
};

const TicketRow = ({ t, tk = {} }) => {
  const p = t.priority?.toLowerCase();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "11px 16px",
        borderRadius: "14px",
        border: `1px solid ${tk.cardBdr || "#EDE9FE"}`,
        backgroundColor: tk.cardBg || "#fff",
      }}
    >
      <div style={{ display: "flex", gap: "10px", minWidth: 0 }}>
        <span
          style={{
            color: "#7F6FF5",
            fontWeight: "900",
            fontSize: "12px",
            flexShrink: 0,
          }}
        >
          {t.id}
        </span>
        <span
          style={{
            fontWeight: "600",
            color: "#374151",
            fontSize: "12px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {t.title}
        </span>
      </div>
      <span
        style={{
          fontSize: "9px",
          fontWeight: "900",
          flexShrink: 0,
          marginLeft: "10px",
          padding: "3px 8px",
          borderRadius: "6px",
          color: priorityColor[p] ?? "#9CA3AF",
          backgroundColor: priorityBg[p] ?? "#F9FAFB",
        }}
      >
        {t.priority?.toUpperCase()}
      </span>
    </div>
  );
};

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  setUser,
  currentUser,
  allTickets,
  theme,
}) {
  const [formData, setFormData] = useState({ ...user });
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const canEdit =
    user?.email === currentUser?.email || user?._id === currentUser?._id;

  const handleSaveInfo = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`https://punto-production-21ed.up.railway.app/api/v1/users/me/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          dept: formData.dept,
          location: formData.location,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data?.doc) {
        setFormData(data.data.doc);
        if (setUser) setUser(data.data.doc);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // const handleAvatarUpload = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;
  //   const fData = new FormData();
  //   fData.append("photo", file);
  //   try {
  //     const res = await fetch(`http://localhost:5000/api/v1/users/me/avatar`, {
  //       method: "PATCH",
  //       headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  //       body: fData,
  //     });
  //     const data = await res.json();
  //     if (data?.data?.photo) {
  //       setFormData((prev) => ({ ...prev, photo: data.data.photo }));
  //       if (setUser) setUser(data.data.doc);
  //     }
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fData = new FormData();
    fData.append("photo", file);
    try {
      // 1. المسار الجديد
      const res = await fetch(
        `https://punto-production-21ed.up.railway.app/api/v1/users/me/profile/avatar`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: fData,
        },
      );
      const data = await res.json();

      // 2. قراءة الداتا من أوبجيكت اليوزر المحدث
      if (data?.data?.user?.photo) {
        setFormData((prev) => ({ ...prev, photo: data.data.user.photo }));
        if (setUser) setUser(data.data.user); // تمرير اليوزر كامل عشان الـ Context أو الستيت
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setFormData({ ...user });
    setIsEditing(false);
    if (isOpen) setShowAllTickets(false);
  }, [isOpen, user]);

  if (!isOpen) return null;

  const isMe = user?.name === currentUser?.name || user?._forcePanel === true;

  const userTickets =
    allTickets?.filter((t) => t.createdBy?.name === user?.name) || [];
  const activeList = userTickets.filter(
    (t) => t.status?.toLowerCase() !== "closed",
  );
  const openCount = activeList.length;
  const resolvedCount = userTickets.filter(
    (t) => t.status?.toLowerCase() === "closed",
  ).length;

  const tk = getThemeTokens(theme);

  if (isMe) {
    return createPortal(
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 99998,
                backgroundColor: "rgba(15,23,42,0.15)",
                backdropFilter: "blur(2px)",
              }}
            />
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                zIndex: 99999,
                width: "420px",
                backgroundColor: tk.panelBg,
                boxShadow: tk.isDark ? "-20px 0 60px rgba(0,0,0,0.5)" : "-20px 0 60px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
              }}
            >
              <AnimatePresence mode="wait">
                {!showAllTickets ? (
                  <motion.div
                    key="main"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.16 }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    {/* top */}
                    <div
                      style={{
                        backgroundColor: tk.accentBg,
                        padding: "36px 28px 28px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginBottom: "20px",
                        }}
                      >
                        <button
                          onClick={onClose}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#9CA3AF",
                          }}
                        >
                          <X size={22} />
                        </button>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "14px",
                        }}
                      >
                        <div
                          style={{ position: "relative", cursor: "pointer" }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div
                            style={{
                              width: "90px",
                              height: "90px",
                              borderRadius: "24px",
                              background:
                                "linear-gradient(135deg,#7F6FF5,#3ECFAA)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "38px",
                              fontWeight: "bold",
                              overflow: "hidden",
                              border: "3px solid white",
                              boxShadow: "0 8px 24px rgba(127,111,245,0.25)",
                            }}
                          >
                            {formData.photo ? (
                              <img
                                src={`https://punto-production-21ed.up.railway.app${formData.photo}`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                alt=""
                              />
                            ) : (
                              (formData.name?.charAt(0) ?? "U")
                            )}
                          </div>
                          {canEdit && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: 0,
                                right: 0,
                                backgroundColor: "white",
                                padding: "4px",
                                borderRadius: "8px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              }}
                            >
                              <Camera size={12} color="#7F6FF5" />
                            </div>
                          )}
                          <input
                            type="file"
                            ref={fileInputRef}
                            hidden
                            accept="image/*"
                            onChange={handleAvatarUpload}
                          />
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            <h2
                              style={{
                                fontSize: "22px",
                                fontWeight: "700",
                                color: "#111827",
                                margin: 0,
                              }}
                            >
                              {formData.name}
                            </h2>
                          </div>
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#9CA3AF",
                              margin: "4px 0 0",
                            }}
                          >
                            {formData.role}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* stats */}
                    <div
                      style={{
                        padding: "20px 28px 0",
                        display: "flex",
                        gap: "12px",
                      }}
                    >
                      {[
                        { val: resolvedCount, label: "Resolved" },
                        { val: openCount, label: "Open Tickets" },
                      ].map(({ val, label }) => (
                        <div
                          key={label}
                          style={{
                            flex: 1,
                            textAlign: "center",
                            padding: "18px 10px",
                            borderRadius: "18px",
                            border: "2.5px solid #7F6FF5",
                            boxShadow: "0 4px 15px rgba(127,111,245,0.12)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "32px",
                              fontWeight: "bold",
                              color: "#111827",
                            }}
                          >
                            {val}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#9CA3AF",
                              fontWeight: "bold",
                              marginTop: "2px",
                            }}
                          >
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        margin: "20px 28px 0",
                        borderBottom: "1px solid #F3F4F6",
                      }}
                    />

                    {/* personal info */}
                    <div style={{ padding: "20px 28px 0" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "16px",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "10px",
                            fontWeight: "800",
                            color: "#9CA3AF",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            margin: 0,
                          }}
                        >
                          Personal Info
                        </p>
                        {canEdit && (
                          <div style={{ display: "flex", gap: "8px" }}>
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => {
                                    setIsEditing(false);
                                    setFormData({ ...user }); // revert
                                  }}
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    color: "#6B7280",
                                    background: "#F3F4F6",
                                    border: "none",
                                    padding: "4px 10px",
                                    borderRadius: "12px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleSaveInfo}
                                  disabled={isSaving}
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    color: "#fff",
                                    background: "#7F6FF5",
                                    border: "none",
                                    padding: "4px 10px",
                                    borderRadius: "12px",
                                    cursor: "pointer",
                                    opacity: isSaving ? 0.7 : 1,
                                  }}
                                >
                                  {isSaving ? "Saving..." : "Save"}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setIsEditing(true)}
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  color: "#7F6FF5",
                                  background: "#EEECFF",
                                  border: "none",
                                  padding: "4px 10px",
                                  borderRadius: "12px",
                                  cursor: "pointer",
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {[
                        {
                          key: "email",
                          label: "Work Email",
                          val: formData.email,
                          icon: Mail,
                        },
                        {
                          key: "phone",
                          label: "Phone Number",
                          val: formData.phone,
                          icon: Phone,
                        },
                        {
                          key: "dept",
                          label: "Department",
                          val: formData.dept,
                          icon: Briefcase,
                        },
                        {
                          key: "location",
                          label: "Location",
                          val: formData.location,
                          icon: MapPin,
                        },
                      ].map((item) => (
                        <div key={item.label} style={{ marginBottom: "16px" }}>
                          <label
                            style={{
                              fontSize: "10px",
                              color: "#9CA3AF",
                              fontWeight: "bold",
                              display: "block",
                              marginBottom: "4px",
                            }}
                          >
                            {item.label}
                          </label>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <item.icon
                              size={15}
                              color="#8A9FE8"
                              style={{ flexShrink: 0 }}
                            />
                            {isEditing ? (
                              <input
                                value={item.val ?? ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    [item.key]: e.target.value,
                                  })
                                }
                                style={{
                                  fontSize: "13px",
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  border: "1px solid #DDD9FF",
                                  width: "100%",
                                  outline: "none",
                                  color: "#374151",
                                  fontWeight: "500",
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  fontWeight: "600",
                                  color: "#374151",
                                  fontSize: "14px",
                                }}
                              >
                                {item.val}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        margin: "4px 28px 0",
                        borderBottom: "1px solid #F3F4F6",
                      }}
                    />

                    {/* tickets */}
                    <div style={{ padding: "20px 28px 32px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "800",
                            color: "#9CA3AF",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                          }}
                        >
                          Active Tickets
                        </span>
                        {activeList.length > 3 && (
                          <button
                            onClick={() => setShowAllTickets(true)}
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#7F6FF5",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            View all ({activeList.length})
                          </button>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {activeList.length === 0 && (
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#D1D5DB",
                              fontStyle: "italic",
                            }}
                          >
                            No active tickets
                          </p>
                        )}
                        {activeList.slice(0, 3).map((t) => (
                          <TicketRow key={t.id} t={t} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="all"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.16 }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        padding: "32px 28px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <button
                          onClick={() => setShowAllTickets(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#7F6FF5",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <ArrowLeft size={16} /> Back
                        </button>
                        <span style={{ color: "#E5E7EB" }}>|</span>
                        <span
                          style={{
                            fontSize: "15px",
                            fontWeight: "700",
                            color: "#111827",
                          }}
                        >
                          All Tickets{" "}
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#9CA3AF",
                              fontWeight: "500",
                            }}
                          >
                            ({activeList.length})
                          </span>
                        </span>
                      </div>
                      <button
                        onClick={onClose}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#9CA3AF",
                        }}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div
                      style={{
                        margin: "0 28px",
                        borderBottom: "1px solid #F3F4F6",
                      }}
                    />
                    <div
                      style={{
                        padding: "20px 28px 32px",
                        flex: 1,
                        overflowY: "auto",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: ACCENT_BG,
                          borderRadius: "20px",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {activeList.map((t) => (
                          <TicketRow key={t.id} t={t} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body,
    );
  }

  /* POPUP MODAL */
  const statCard = {
    padding: "25px",
    borderRadius: "20px",
    flex: 1,
    textAlign: "center",
    border: "2.5px solid #7F6FF5",
    boxShadow: "0 4px 15px rgba(127,111,245,0.15)",
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        backgroundColor: "rgba(15,23,42,0.2)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: "#fff",
          borderRadius: "40px",
          width: "800px",
          boxShadow: "0 25px 70px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "40px 50px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
            <div
              style={{
                width: "95px",
                height: "95px",
                borderRadius: "25px",
                background: "linear-gradient(135deg,#7F6FF5,#3ECFAA)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "40px",
                fontWeight: "bold",
                overflow: "hidden",
                border: "2px solid white",
              }}
            >
              {formData.photo ? (
                <img
                  src={`https://punto-production-21ed.up.railway.app${formData.photo}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  alt=""
                />
              ) : (
                (formData.name?.charAt(0) ?? "U")
              )}
            </div>
            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <h2
                  style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  {formData.name}
                </h2>
              </div>
              <p
                style={{ color: "#9CA3AF", margin: "4px 0", fontSize: "16px" }}
              >
                {formData.role}
              </p>
            </div>
          </div>
          <X
            size={32}
            color="#D1D5DB"
            style={{ cursor: "pointer" }}
            onClick={onClose}
          />
        </div>

        <div style={{ borderBottom: "1px solid #F3F4F6", margin: "0 50px" }} />

        <AnimatePresence mode="wait">
          {!showAllTickets ? (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              style={{
                padding: "0 50px 40px 50px",
                display: "grid",
                gridTemplateColumns: "1fr 1.2fr",
                gap: "60px",
              }}
            >
              <div style={{ marginTop: "30px" }}>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "25px",
                  }}
                >
                  Personal Info
                </p>
                {[
                  { label: "Work Email", val: formData.email, icon: Mail },
                  { label: "Phone Number", val: formData.phone, icon: Phone },
                  { label: "Department", val: formData.dept, icon: Briefcase },
                  { label: "Location", val: formData.location, icon: MapPin },
                ].map((item) => (
                  <div key={item.label} style={{ marginBottom: "22px" }}>
                    <label
                      style={{
                        fontSize: "10px",
                        color: "#9CA3AF",
                        fontWeight: "bold",
                        display: "block",
                        marginBottom: "5px",
                      }}
                    >
                      {item.label}
                    </label>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <item.icon size={16} color="#8A9FE8" />
                      <span
                        style={{
                          fontWeight: "600",
                          color: "#374151",
                          fontSize: "15px",
                        }}
                      >
                        {item.val}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: "30px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "28px",
                }}
              >
                <div style={{ display: "flex", gap: "15px" }}>
                  <div style={statCard}>
                    <div
                      style={{
                        fontSize: "36px",
                        fontWeight: "bold",
                        color: "#111827",
                      }}
                    >
                      {resolvedCount}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#9CA3AF",
                        fontWeight: "bold",
                      }}
                    >
                      Resolved
                    </div>
                  </div>
                  <div style={statCard}>
                    <div
                      style={{
                        fontSize: "36px",
                        fontWeight: "bold",
                        color: "#111827",
                      }}
                    >
                      {openCount}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#9CA3AF",
                        fontWeight: "bold",
                      }}
                    >
                      Open tickets
                    </div>
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "800",
                        color: "#9CA3AF",
                        textTransform: "uppercase",
                      }}
                    >
                      Active Tickets
                    </span>
                    {activeList.length > 3 && (
                      <button
                        onClick={() => setShowAllTickets(true)}
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#7F6FF5",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        View all ({activeList.length})
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {activeList.length === 0 && (
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#D1D5DB",
                          fontStyle: "italic",
                        }}
                      >
                        No active tickets
                      </p>
                    )}
                    {activeList.slice(0, 3).map((t) => (
                      <TicketRow key={t.id} t={t} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="all"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.18 }}
              style={{ padding: "30px 50px 40px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "24px",
                }}
              >
                <button
                  onClick={() => setShowAllTickets(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#7F6FF5",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <span style={{ color: "#E5E7EB" }}>|</span>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  All Tickets{" "}
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#9CA3AF",
                      fontWeight: "500",
                    }}
                  >
                    ({activeList.length})
                  </span>
                </span>
              </div>
              <div
                style={{
                  backgroundColor: ACCENT_BG,
                  borderRadius: "20px",
                  padding: "20px",
                  maxHeight: "340px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {activeList.map((t) => (
                  <TicketRow key={t.id} t={t} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>,
    document.body,
  );
}
