import { useState } from "react";

const PRIORITY_COLORS = { High: '#EF4444', Medium: '#F59E0B', Low: '#22C55E' };

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "Low");

/**
 * EditTicketModal — lets a ticket's creator (or IT/admin) update the core
 * fields after it's been submitted: title, category, priority, description.
 *
 * Mirrors <CreateTicketModal /> (same "ds-*" form styling, same fields) but
 * PATCHes the existing ticket instead of POSTing a new one, and is
 * pre-filled from the ticket passed in.
 *
 * Props:
 *  - ticket    – the ticket being edited ({ _id, name, category, priority, description })
 *  - isOpen, onClose
 *  - onSaved   – fn(updatedTicket) called after a successful save
 */
export default function EditTicketModal({ ticket, isOpen, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    priority: "Low",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [wasOpen, setWasOpen] = useState(isOpen);

  // Re-fill the form every time it transitions closed -> open, for whichever
  // ticket was passed in. (Adjusted during render on prop change rather than
  // in a useEffect, to avoid a cascading-render lint warning for a plain
  // reset-on-open case.)
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen && ticket) {
      setFormData({
        name: ticket.name || "",
        category: ticket.category || "",
        priority: cap(ticket.priority),
        description: ticket.description || "",
      });
      setErrors({});
      setSubmitError("");
    }
  }

  if (!isOpen) return null;

  const handleChange = (field) => (e) => {
    setFormData((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Ticket title is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.priority) newErrors.priority = "Priority is required";
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://punto-production-21ed.up.railway.app/api/v1/tickets/${ticket._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            category: formData.category,
            priority: formData.priority.toLowerCase(),
            description: formData.description.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        onSaved?.({
          ...ticket,
          name: formData.name.trim(),
          category: formData.category,
          priority: formData.priority.toLowerCase(),
          description: formData.description.trim(),
          ...(data?.data || {}),
        });
        onClose?.();
      } else {
        setSubmitError(data?.message || "Failed to update ticket. Please try again.");
      }
    } catch (err) {
      console.error("Edit ticket error:", err);
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ds-overlay" onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose?.()}>
      <div className="ds-modal ds-modal-lg">

        {/* Header */}
        <div className="ds-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EEF1FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A9FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <h2 className="ds-modal-title">Edit Ticket</h2>
          </div>
          <button className="ds-modal-close" onClick={onClose} disabled={isSubmitting}>×</button>
        </div>

        {/* Body */}
        <div className="ds-modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Title / Name */}
            <div className="ds-form-group">
              <label className="ds-label">Ticket Title</label>
              <input
                className={`ds-input${errors.name ? ' error' : ''}`}
                placeholder="Enter a brief summary of the issue..."
                value={formData.name}
                onChange={handleChange("name")}
                disabled={isSubmitting}
              />
              {errors.name && <span className="ds-error">{errors.name}</span>}
            </div>

            {/* Category + Priority */}
            <div className="ds-form-row">
              <div className="ds-form-group">
                <label className="ds-label">Category</label>
                <select
                  className={`ds-select${errors.category ? ' error' : ''}`}
                  value={formData.category}
                  onChange={handleChange("category")}
                  disabled={isSubmitting}
                >
                  <option value="" disabled hidden>Select Category</option>
                  <option>Network Issues</option>
                  <option>Hardware</option>
                  <option>Software</option>
                  <option>Account Access</option>
                </select>
                {errors.category && <span className="ds-error">{errors.category}</span>}
              </div>

              <div className="ds-form-group">
                <label className="ds-label">Priority</label>
                <div style={{ position: 'relative' }}>
                  {formData.priority && (
                    <span style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      width: 8, height: 8, borderRadius: '50%', pointerEvents: 'none',
                      background: PRIORITY_COLORS[formData.priority] || 'transparent'
                    }} />
                  )}
                  <select
                    className={`ds-select${errors.priority ? ' error' : ''}`}
                    style={formData.priority ? { paddingLeft: 26 } : {}}
                    value={formData.priority}
                    onChange={handleChange("priority")}
                    disabled={isSubmitting}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                {errors.priority && <span className="ds-error">{errors.priority}</span>}
              </div>
            </div>

            {/* Description */}
            <div className="ds-form-group">
              <label className="ds-label">Description</label>
              <textarea
                className={`ds-textarea${errors.description ? ' error' : ''}`}
                placeholder="Describe the issue in detail (min 10 chars)..."
                value={formData.description}
                onChange={handleChange("description")}
                disabled={isSubmitting}
              />
              {errors.description && <span className="ds-error">{errors.description}</span>}
            </div>

            {submitError && <span className="ds-error">{submitError}</span>}
          </div>
        </div>

        {/* Footer */}
        <div className="ds-modal-footer">
          <button className="ds-btn ds-btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="ds-btn ds-btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
            {!isSubmitting && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
