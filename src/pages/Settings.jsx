import { useState, useEffect, useRef } from "react";
const token = () => localStorage.getItem("token");
const API = "https://punto-production-21ed.up.railway.app/api/v1";

// Mutable module-level theme — updated at top of Settings render
// so all sub-component closures see the current palette.
let C = {
  bg: "#F5F4FF",
  white: "#ffffff",
  border: "#E8E6FF",
  borderLight: "#F0EEFF",
  rowBorder: "#F5F4FF",
  primary: "#8A9FE8",
  primaryHov: "#7F77DD",
  accent: "#534AB7",
  accentBg: "#EEEEFF",
  accentBd: "#DDD9FF",
  text: "#1E1B3A",
  muted: "#9CA3AF",
  footerBg: "#FAFAFF",
};

const LIGHT_C = { ...C };
const DARK_C = {
  bg: "#080a10",
  white: "#111827",
  border: "#1e2336",
  borderLight: "#1e2336",
  rowBorder: "#1a1f2e",
  primary: "#8A9FE8",
  primaryHov: "#7F77DD",
  accent: "#a5b4fc",
  accentBg: "rgba(99,102,241,0.1)",
  accentBd: "rgba(99,102,241,0.25)",
  text: "#e2e8f0",
  muted: "#64748b",
  footerBg: "#0f1117",
};

function Toggle({ value, onChange, loading, defaultOn = false }) {
  const [on, setOn] = useState(value ?? defaultOn);

  // sync لو الـ value اتغير من برا
  useEffect(() => {
    if (value !== undefined) setOn(value);
  }, [value]);

  return (
    <button
      onClick={() => {
        if (loading) return;
        const next = !on;
        setOn(next);
        onChange?.(next);
      }}
      disabled={loading}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        backgroundColor: on ? C.primary : "#D1D5DB",
        opacity: loading ? 0.6 : 1,
        transition: "background-color .2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 16,
          height: 16,
          borderRadius: "50%",
          backgroundColor: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.2)",
          transform: on ? "translateX(24px)" : "translateX(4px)",
          transition: "transform .2s",
        }}
      />
    </button>
  );
}

function Badge({ type, children }) {
  const map = {
    green: { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
    red: { bg: "#FEF2F2", color: "#EF4444", border: "#FECACA" },
    purple: { bg: C.accentBg, color: C.accent, border: C.accentBd },
    amber: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  };
  const s = map[type] ?? map.purple;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 12px",
        borderRadius: 20,
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {children}
    </span>
  );
}

// Use ES5 getters so each property reads the CURRENT C at render time
// (C is mutated by the Settings component before sub-components are called).
const inp = Object.defineProperties({}, {
  width:           { get() { return "100%"; },                              enumerable: true },
  fontSize:        { get() { return 13; },                                  enumerable: true },
  padding:         { get() { return "10px 14px"; },                         enumerable: true },
  borderRadius:    { get() { return 10; },                                  enumerable: true },
  border:          { get() { return `1px solid ${C.accentBd}`; },           enumerable: true },
  backgroundColor: { get() { return C.white; },                             enumerable: true },
  color:           { get() { return C.text; },                              enumerable: true },
  outline:         { get() { return "none"; },                              enumerable: true },
  boxSizing:       { get() { return "border-box"; },                        enumerable: true },
});

function Card({ children }) {
  return (
    <div
      style={{
        backgroundColor: C.white,
        borderRadius: 16,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(127,111,245,.07)",
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ title, desc }) {
  return (
    <div
      style={{
        padding: "18px 28px",
        borderBottom: `1px solid ${C.borderLight}`,
      }}
    >
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>
        {title}
      </p>
      {desc && (
        <p style={{ margin: "4px 0 0", fontSize: 12, color: C.muted }}>
          {desc}
        </p>
      )}
    </div>
  );
}

function Row({ label, desc, children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 28px",
        borderBottom: `1px solid ${C.rowBorder}`,
      }}
    >
      <div style={{ flex: 1, marginRight: 24 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: C.text }}>
          {label}
        </p>
        {desc && (
          <p style={{ margin: "3px 0 0", fontSize: 12, color: C.muted }}>
            {desc}
          </p>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function BtnPrimary({ children, style = {}, ...p }) {
  return (
    <button
      style={{
        padding: "9px 20px",
        borderRadius: 10,
        backgroundColor: C.primary,
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        border: "none",
        cursor: "pointer",
        ...style,
      }}
      {...p}
    >
      {children}
    </button>
  );
}

function BtnSecondary({ children, style = {}, ...p }) {
  return (
    <button
      style={{
        padding: "9px 20px",
        borderRadius: 10,
        backgroundColor: C.white,
        color: C.accent,
        fontSize: 13,
        fontWeight: 500,
        border: `1px solid ${C.accentBd}`,
        cursor: "pointer",
        ...style,
      }}
      {...p}
    >
      {children}
    </button>
  );
}

function BtnDanger({ children, style = {}, ...p }) {
  return (
    <button
      style={{
        padding: "9px 20px",
        borderRadius: 10,
        backgroundColor: "#FEF2F2",
        color: "#EF4444",
        fontSize: 13,
        fontWeight: 600,
        border: "1px solid #FECACA",
        cursor: "pointer",
        ...style,
      }}
      {...p}
    >
      {children}
    </button>
  );
}

function CardFooter({ children }) {
  return (
    <div
      style={{
        padding: "14px 28px",
        backgroundColor: C.footerBg,
        borderTop: `1px solid ${C.borderLight}`,
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <p
      style={{
        margin: "0 0 6px",
        fontSize: 11,
        fontWeight: 600,
        color: C.muted,
        textTransform: "uppercase",
        letterSpacing: ".05em",
      }}
    >
      {children}
    </p>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 999,
        padding: "12px 20px",
        borderRadius: 12,
        fontWeight: 600,
        fontSize: 13,
        backgroundColor: toast.type === "success" ? "#F0FDF4" : "#FEF2F2",
        color: toast.type === "success" ? "#16A34A" : "#EF4444",
        border: `1px solid ${toast.type === "success" ? "#BBF7D0" : "#FECACA"}`,
        boxShadow: "0 4px 12px rgba(0,0,0,.1)",
      }}
    >
      {toast.msg}
    </div>
  );
}

// ─────────────────────────────────────────
// PageProfile — مع API
// ─────────────────────────────────────────
function PageProfile({ refreshUser }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  function showToast(msg, type) {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function loadProfile() {
    return fetch(`${API}/users/me/profile`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setForm(d.data.doc);
        refreshUser(d.data.doc);
      });
  }

  useEffect(() => {
    loadProfile()
      .catch(() => showToast("فشل جلب البيانات", "error"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${API}/users/me/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          dept: form.dept,
          location: form.location,
        }),
      });
      const data = await res.json();
      setForm(data.data.doc);
      refreshUser(data.data.doc);
      showToast("success");
    } catch (err) {
      console.log("الغلـط فين يا مؤمن؟ =>", err.message); // هيطبع لك اسم الغلط في الـ Console
      showToast("error");
    } finally {
      setSaving(false);
    }
  }

  // async function handleAvatarUpload(e) {
  //   const file = e.target.files[0];
  //   if (!file) return;
  //   setAvatarLoading(true);
  //   const formData = new FormData();
  //   formData.append("photo", file);
  //   try {
  //     const res = await fetch(`${API}/users/me/avatar`, {
  //       method: "PATCH",
  //       headers: { Authorization: `Bearer ${token()}` },
  //       body: formData,
  //     });
  //     const data = await res.json();
  //     if (data?.data?.photo) {
  //       setForm((prev) => ({ ...prev, photo: data.data.photo }));
  //         refreshUser({ photo: data.data.photo, avatar: data.data.photo });
  //     }
  //     showToast("success");
  //   } catch {
  //     showToast("error");
  //   } finally {
  //     setAvatarLoading(false);
  //   }
  // }
  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    const formData = new FormData();
    formData.append("photo", file);
    try {
      // 1. المسار الجديد
      const res = await fetch(`${API}/users/me/profile/avatar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      const data = await res.json();

      // 2. قراءة الداتا من أوبجيكت اليوزر المحدث
      if (data?.data?.user?.photo) {
        setForm((prev) => ({ ...prev, photo: data.data.user.photo }));
        refreshUser({
          photo: data.data.user.photo,
          avatar: data.data.user.photo,
        });
      }
      showToast("success");
    } catch {
      showToast("error");
    } finally {
      setAvatarLoading(false);
    }
  }

  // async function handleRemoveAvatar() {
  //   setAvatarLoading(true);
  //   try {
  //     await fetch(`${API}/users/me/avatar`, {
  //       method: "DELETE",
  //       headers: { Authorization: `Bearer ${token()}` },
  //     });
  //     setForm((prev) => ({ ...prev, photo: "" }));
  //     refreshUser({ photo: "", avatar: "" });
  //     showToast("✓ تم مسح الصورة", "success");
  //   } catch {
  //     showToast("فشل مسح الصورة", "error");
  //   } finally {
  //     setAvatarLoading(false);
  //   }
  // }

  async function handleRemoveAvatar() {
    setAvatarLoading(true);
    try {
      // 1. المسار الجديد
      await fetch(`${API}/users/me/profile/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      setForm((prev) => ({ ...prev, photo: "" }));
      refreshUser({ photo: "", avatar: "" });
      showToast("✓ تم مسح الصورة", "success");
    } catch {
      showToast("فشل مسح الصورة", "error");
    } finally {
      setAvatarLoading(false);
    }
  }

  if (loading) return null;
  if (!form) return null;

  const initials =
    form.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase() ?? "U";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Toast toast={toast} />

      {/* الصورة */}
      <Card>
        <CardHeader
          title="Profile picture"
          desc="Update your photo displayed across the platform."
        />
        <div
          style={{
            padding: "20px 28px",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          {form.photo ? (
            <img
              src={`https://punto-production-21ed.up.railway.app${form.photo}`}
              alt="avatar"
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                flexShrink: 0,
                background: "linear-gradient(135deg,#7F6FF5,#3ECFAA)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {initials}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarUpload}
            />
            <BtnPrimary
              style={{ width: 140 }}
              onClick={() => fileRef.current.click()}
            >
              Upload photo
            </BtnPrimary>
            <BtnSecondary
              style={{ width: 140 }}
              onClick={handleRemoveAvatar}
              disabled={avatarLoading || !form.photo}
            >
              Remove photo
            </BtnSecondary>
          </div>
        </div>
      </Card>

      {/* البيانات */}
      <Card>
        <CardHeader
          title="Personal information"
          desc="Update your name, contact details and role."
        />
        <div
          style={{
            padding: "20px 28px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 18,
          }}
        >
          {[
            { label: "Full name", key: "name", type: "text" },
            { label: "Email", key: "email", type: "email" },
            { label: "Phone", key: "phone", type: "tel" },
            { label: "Department", key: "dept", type: "text" },
            { label: "Location", key: "location", type: "text" },
          ].map((f) => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              <input
                style={inp}
                type={f.type}
                value={form[f.key] ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <CardFooter>
          <BtnSecondary
            onClick={() => loadProfile().catch(() => showToast("فشل", "error"))}
          >
            Cancel
          </BtnSecondary>
          <BtnPrimary onClick={handleSave} disabled={saving}>
            Save changes
          </BtnPrimary>
        </CardFooter>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────
// باقي الصفحات — زي ما هي
// ─────────────────────────────────────────
function PageAccount() {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  async function handleUpdatePassword() {
    if (form.newPass !== form.confirm) {
      setToast({ msg: "Passwords don't match", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/users/updatePassword`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          currentPassword: form.current,
          newPassword: form.newPass,
          confirmPassword: form.confirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // حفظ التوكن الجديد
      localStorage.setItem("token", data.token);
      setForm({ current: "", newPass: "", confirm: "" });
      setToast({ msg: "Password updated successfully", type: "success" });
    } catch (err) {
      setToast({
        msg: err.message || "Failed to update password",
        type: "error",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Toast toast={toast} />
      <Card>
        <CardHeader
          title="Change password"
          desc="Use a strong password you don't use elsewhere."
        />
        <div
          style={{
            padding: "20px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {[
            {
              label: "Current password",
              key: "current",
              ph: "Enter current password",
            },
            { label: "New password", key: "newPass", ph: "Min. 8 characters" },
            {
              label: "Confirm new password",
              key: "confirm",
              ph: "Re-enter new password",
            },
          ].map((f) => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              <input
                style={inp}
                type="password"
                placeholder={f.ph}
                value={form[f.key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <CardFooter>
          <BtnPrimary onClick={handleUpdatePassword} disabled={saving}>
            {saving ? "Updating..." : "Update password"}
          </BtnPrimary>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader
          title="Two-factor authentication"
          desc="Add an extra layer of security to your account."
        />
        <Row label="Authenticator app" desc="Use Google Authenticator or Authy">
          <Badge type="green">Enabled</Badge>
          <BtnSecondary style={{ padding: "6px 14px", fontSize: 12 }}>
            Manage
          </BtnSecondary>
        </Row>
        <Row label="SMS backup code" desc="Receive a one-time code via SMS">
          <Badge type="red">Disabled</Badge>
          <BtnSecondary style={{ padding: "6px 14px", fontSize: 12 }}>
            Enable
          </BtnSecondary>
        </Row>
      </Card>
    </div>
  );
}

function PageNotifications() {
  const [settings, setSettings] = useState(null);
  const [savingKey, setSavingKey] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(msg, type) {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    fetch(`${API}/users/me/notifications`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => r.json())
      .then((d) => setSettings(d.data.doc))
      .catch(() => showToast("Failed to load", "error"));
  }, []);

  async function handleToggle(key, newValue) {
    // Optimistic update
    setSettings((prev) => ({ ...prev, [key]: newValue }));
    setSavingKey(key);
    try {
      const res = await fetch(`${API}/users/me/notifications`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ [key]: newValue }),
      });
      if (!res.ok) throw new Error();
      showToast("✓ Saved", "success");
    } catch {
      // Rollback
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
      showToast("Failed to save", "error");
    } finally {
      setSavingKey(null);
    }
  }

  if (!settings) return null;

  const ticketRows = [
    {
      key: "ticket_assigned",
      label: "New ticket assigned",
      desc: "When a ticket is assigned to you",
    },
    {
      key: "ticket_status",
      label: "Ticket status update",
      desc: "When a ticket's status changes",
    },
    {
      key: "sla_warning",
      label: "SLA breach warning",
      desc: "Alert 1 hour before SLA deadline",
    },
    {
      key: "new_comment",
      label: "New comment on ticket",
      desc: "When someone replies to your ticket",
    },
  ];

  const systemRows = [
    {
      key: "server_downtime",
      label: "Server downtime alert",
      desc: "Immediate alert on infrastructure failure",
    },
    {
      key: "security_incidents",
      label: "Security incidents",
      desc: "Unauthorized access or policy violations",
    },
    {
      key: "weekly_summary",
      label: "Weekly summary email",
      desc: "Sent every Sunday at 8:00 AM",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Toast toast={toast} />

      <Card>
        <CardHeader
          title="Ticket alerts"
          desc="Get notified about your support tickets."
        />
        {ticketRows.map((row) => (
          <Row key={row.key} label={row.label} desc={row.desc}>
            <Toggle
              value={settings[row.key]}
              loading={savingKey === row.key}
              onChange={(val) => handleToggle(row.key, val)}
            />
          </Row>
        ))}
      </Card>

      <Card>
        <CardHeader
          title="System alerts"
          desc="Critical and operational system notifications."
        />
        {systemRows.map((row) => (
          <Row key={row.key} label={row.label} desc={row.desc}>
            <Toggle
              value={settings[row.key]}
              loading={savingKey === row.key}
              onChange={(val) => handleToggle(row.key, val)}
            />
          </Row>
        ))}
      </Card>
    </div>
  );
}

function PagePermissions() {
  const perms = [
    {
      label: "Server management",
      desc: "Full read/write access to servers",
      type: "green",
      status: "Granted",
    },
    {
      label: "User management",
      desc: "Create, edit and deactivate user accounts",
      type: "green",
      status: "Granted",
    },
    {
      label: "Network configuration",
      desc: "Manage firewall, VLANs and routing",
      type: "green",
      status: "Granted",
    },
    {
      label: "Billing & invoices",
      desc: "View and export financial records",
      type: "red",
      status: "Denied",
    },
    {
      label: "Security audit logs",
      desc: "Read-only access to audit trails",
      type: "purple",
      status: "Read only",
    },
  ];
  return (
    <Card>
      <CardHeader
        title="Access control"
        desc="Your current system permissions — contact admin to request changes."
      />
      {perms.map((p) => (
        <Row key={p.label} label={p.label} desc={p.desc}>
          <Badge type={p.type}>{p.status}</Badge>
        </Row>
      ))}
    </Card>
  );
}

function PageAppearance() {
  const sel = { ...inp, width: "auto" };
  return (
    <Card>
      <CardHeader
        title="Display preferences"
        desc="Customize how the platform looks for you."
      />
      <Row label="Color theme" desc="Choose your preferred color mode">
        <select style={{ ...sel, width: 160 }}>
          <option>System default</option>
          <option>Light</option>
          <option>Dark</option>
        </select>
      </Row>
      <CardFooter>
        <BtnSecondary>Discard</BtnSecondary>
        <BtnPrimary>Save changes</BtnPrimary>
      </CardFooter>
    </Card>
  );
}

function PageDanger() {
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null); // "deactivate" | "delete" | null

  function showToast(msg, type) {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleDeactivate() {
    try {
      const res = await fetch(`${API}/users/me/account/deactivate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      showToast("✓ Account deactivated", "success");
      setTimeout(() => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }, 1500);
    } catch {
      showToast("Failed to deactivate", "error");
    } finally {
      setConfirm(null);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`${API}/users/me/account/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      showToast("✓ Account deleted", "success");
      setTimeout(() => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }, 1500);
    } catch {
      showToast("Failed to delete account", "error");
    } finally {
      setConfirm(null);
    }
  }

  async function handleExport() {
    try {
      const res = await fetch(`${API}/users/me/account/export`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      // تحميل الداتا كـ JSON file
      const blob = new Blob([JSON.stringify(data.data.doc, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-data.json";
      a.click();
      URL.revokeObjectURL(url);
      showToast("✓ Data exported", "success");
    } catch {
      showToast("Failed to export data", "error");
    }
  }

  const actions = [
    {
      label: "Deactivate account",
      desc: "Temporarily disable your account. You can reactivate anytime.",
      btn: "Deactivate",
      safe: false,
      onClick: () => setConfirm("deactivate"),
    },
    {
      label: "Export my data",
      desc: "Download a full archive of all your account data.",
      btn: "Export data",
      safe: true,
      onClick: handleExport,
    },
    {
      label: "Delete account",
      desc: "Permanently delete your account. This action cannot be undone.",
      btn: "Delete account",
      safe: false,
      onClick: () => setConfirm("delete"),
    },
  ];

  return (
    <div>
      <Toast toast={toast} />

      {/* Confirm Dialog */}
      {confirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            backgroundColor: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 28,
              width: 360,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 16,
                fontWeight: 700,
                color: "#1E1B3A",
              }}
            >
              {confirm === "delete" ? "Delete account?" : "Deactivate account?"}
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "#9CA3AF" }}>
              {confirm === "delete"
                ? "This action cannot be undone."
                : "You can reactivate your account anytime."}
            </p>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
            >
              <BtnSecondary onClick={() => setConfirm(null)}>
                Cancel
              </BtnSecondary>
              <BtnDanger
                onClick={confirm === "delete" ? handleDelete : handleDeactivate}
              >
                {confirm === "delete" ? "Delete" : "Deactivate"}
              </BtnDanger>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader
          title="Deactivate Or Delete"
          desc="These actions are permanent and cannot be reversed."
        />
        {actions.map((a, i) => (
          <div
            key={a.label}
            style={{
              borderBottom:
                i < actions.length - 1 ? `1px solid ${C.rowBorder}` : "none",
            }}
          >
            <Row label={a.label} desc={a.desc}>
              {a.safe ? (
                <BtnSecondary
                  style={{ padding: "6px 14px", fontSize: 12 }}
                  onClick={a.onClick}
                >
                  {a.btn}
                </BtnSecondary>
              ) : (
                <BtnDanger
                  style={{ padding: "6px 14px", fontSize: 12 }}
                  onClick={a.onClick}
                >
                  {a.btn}
                </BtnDanger>
              )}
            </Row>
          </div>
        ))}
      </Card>
    </div>
  );
}

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "account", label: "Account & security" },
  { id: "notifications", label: "Notifications" },
  { id: "permissions", label: "Permissions" },
  { id: "appearance", label: "Appearance" },
  { id: "danger", label: "Account Actions" },
];

export default function Settings({ refreshUser, isDarkMode }) {
  // Sync module-level C before any sub-component renders
  C = isDarkMode ? DARK_C : LIGHT_C;
  const [active, setActive] = useState("profile");

  const PAGES = {
    profile: <PageProfile refreshUser={refreshUser} />,
    account: <PageAccount />,
    notifications: <PageNotifications />,
    permissions: <PagePermissions />,
    appearance: <PageAppearance />,
    danger: <PageDanger />,
  };

  return (
    <div style={{ minHeight: "100%", padding: 32, backgroundColor: C.bg }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{ margin: 0, fontSize: 24, fontWeight: 700, color: C.text }}
          >
            Settings
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.muted }}>
            Manage your account and preferences.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 8,
            marginBottom: 24,
            gap: 4,
            boxShadow: "0 1px 4px rgba(127,111,245,.06)",
          }}
        >
          {TABS.map((t) => {
            const isDanger = t.id === "danger";
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  transition: "all .15s",
                  backgroundColor: isActive
                    ? isDanger
                      ? "#FEF2F2"
                      : C.primary
                    : "transparent",
                  color: isActive
                    ? isDanger
                      ? "#EF4444"
                      : "#fff"
                    : isDanger
                      ? "#F87171"
                      : C.muted,
                  boxShadow:
                    isActive && !isDanger
                      ? "0 4px 12px rgba(138,159,232,.3)"
                      : "none",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {PAGES[active]}
      </div>
    </div>
  );
}
