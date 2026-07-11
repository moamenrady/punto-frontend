import React, { useState } from "react";

const UploadCSVModal = ({ onClose, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  };

  return (
    <div
      className="ds-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="ds-modal">
        <div className="ds-modal-header">
          <h2 className="ds-modal-title">Upload Inventory CSV</h2>
          <button className="ds-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div
          className="ds-modal-body"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `1.5px dashed ${dragOver ? "#8A9FE8" : "#D1D5DB"}`,
              borderRadius: 12,
              padding: "32px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? "#EEF1FD" : "#F9FAFB",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onClick={() => document.getElementById("csv-file-input").click()}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#EEF1FD",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8A9FE8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#111827",
                  margin: "0 0 4px",
                }}
              >
                {selectedFile
                  ? `✓ ${selectedFile.name}`
                  : "Drop CSV here or click to browse"}
              </p>
              <p style={{ fontSize: "0.78rem", color: "#9CA3AF", margin: 0 }}>
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                  : "Accepts .csv files only"}
              </p>
            </div>
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Format info */}
          <div
            style={{
              background: "#F9FAFB",
              border: "1px solid #E9EBF0",
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              Required CSV Format
            </div>
            <code
              style={{
                display: "block",
                background: "#EEF1FD",
                borderRadius: 6,
                padding: "8px 12px",
                fontSize: "0.78rem",
                color: "#8A9FE8",
                fontFamily: "monospace",
              }}
            >
              name, sku, vendor, category, unit, quantity, cost,
              minimumThreshold, currency
            </code>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#9CA3AF",
                margin: "8px 0 0",
              }}
            >
              Example: Dell Laptop, DL-2024-001, 10, 1200
            </p>
          </div>
        </div>

        <div className="ds-modal-footer">
          <button className="ds-btn ds-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedFile}
            onClick={() => onUpload(selectedFile)}
            className="ds-btn ds-btn-primary"
            style={{
              opacity: selectedFile ? 1 : 0.5,
              cursor: selectedFile ? "pointer" : "not-allowed",
            }}
          >
            Upload CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadCSVModal;
