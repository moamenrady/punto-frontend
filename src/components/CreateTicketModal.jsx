import { useState, useRef } from "react";

const PRIORITY_COLORS = { High: '#EF4444', Medium: '#F59E0B', Low: '#22C55E' };

export default function CreateTicketModal({ onClose, onSubmit, user }) {
  const [formData, setFormData] = useState({
    name: "", // Changed from 'title' to 'name' to match your Mongoose model
    category: "", 
    subcategory: "", 
    priority: "low", // Default to 'low' as per your model
    description: "", 
  });
  
  const [errors, setErrors] = useState({});
  const [dragging, setDragging] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef();

  const handleChange = (field) => (e) => {
    setFormData((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setAttachedFile(file);
  };

  const handleSubmit = async () => {
    // Validation
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

    // Prepare payload for backend
    // Note: 'created_by' is usually handled by the backend via JWT/Session
    const payload = {
      name: formData.name,
      description: formData.description,
      priority: formData.priority.toLowerCase(),
      status: "open",
      created_by: user?._id,
      category: formData.category,
      assign_to: null
    };

    try {
      const response = await fetch("https://punto-production-21ed.up.railway.app/api/v1/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (onSubmit) onSubmit(data.data); // Trigger list refresh
        if (onClose) onClose();
      } else {
        alert(data.message || "Failed to create ticket");
      }
    } catch (error) {
      console.error("API Error:", error);
      alert("Network error. Please try again.");
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
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <h2 className="ds-modal-title">Create New Ticket</h2>
          </div>
          <button className="ds-modal-close" onClick={onClose} disabled={isSubmitting}>×</button>
        </div>

        {/* Body */}
        <div className="ds-modal-body">

          {/* Automated User Information */}
          <div className="ds-user-card">
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              User Information
            </div>
            <div className="ds-user-grid">
              <div>
                <div className="ds-user-label">UserID:</div>
                <div className="ds-user-value">{user?._id || "Loading..."}</div>
              </div>
              <div>
                <div className="ds-user-label">Username:</div>
                <div className="ds-user-value">{user?.name || "Anonymous"}</div>
              </div>
              <div>
                <div className="ds-user-label">Email:</div>
                <div className="ds-user-value">{user?.email || "N/A"}</div>
              </div>
              <div>
                <div className="ds-user-label">Role:</div>
                <div className="ds-user-value" style={{ textTransform: 'capitalize' }}>{user?.role || "User"}</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', marginBottom: 14 }}>Ticket Details</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 148px', gap: 16, alignItems: 'start' }}>
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

              {/* Category */}
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
            </div>

            {/* Right: upload + assign */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label className="ds-label">Attach File</label>
              <div
                onDragOver={(e) => { e.preventDefault(); !isSubmitting && setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !isSubmitting && fileInputRef.current.click()}
                style={{
                  border: `1.5px dashed ${dragging ? '#8A9FE8' : '#D1D5DB'}`,
                  borderRadius: 10,
                  padding: '20px 12px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, cursor: isSubmitting ? 'not-allowed' : 'pointer', background: dragging ? '#EEF1FD' : '#F9FAFB',
                  minHeight: 110, textAlign: 'center', transition: 'border-color 0.15s, background 0.15s'
                }}
              >
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  style={{ display: 'none' }} 
                  onChange={(e) => setAttachedFile(e.target.files[0])} 
                  disabled={isSubmitting}
                />
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16"/>
                  <line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF', lineHeight: 1.4 }}>
                  {attachedFile ? attachedFile.name : 'Drag & Drop\nor Click to Upload'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ds-modal-footer">
          <button 
            className="ds-btn ds-btn-secondary" 
            onClick={onClose} 
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            className="ds-btn ds-btn-primary" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Submit Ticket"}
            {!isSubmitting && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>
              </svg>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}