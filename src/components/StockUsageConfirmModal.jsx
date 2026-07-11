import React, { useState } from "react";
import { deductStockItems } from "../services/stockDeductionHelper";

/**
 * StockUsageConfirmModal — "Automatic Stock Deduction" popup.
 *
 * Shown right after an employee marks a task complete, when
 * /api/ai/extract-stock-usage comes back with a non-empty used_items list.
 * On "Yes", deducts each item from the Node.js stock backend by name.
 *
 * Props:
 *  - isOpen, onClose
 *  - taskName – for context in the header
 *  - items    – [{ item_name, quantity }]
 *  - onDone(result) – called after a deduction attempt with { deducted, notFound, failed }
 */
const StockUsageConfirmModal = ({ isOpen, onClose, taskName, items = [], onDone }) => {
  const [isDeducting, setIsDeducting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeducting(true);
    setError(null);
    try {
      const result = await deductStockItems(items);
      onDone?.(result);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeducting(false);
    }
  };

  return (
    <div className="ds-overlay" onClick={(e) => e.target === e.currentTarget && !isDeducting && onClose?.()}>
      <div className="ds-modal" style={{ maxWidth: 440 }}>
        <div className="ds-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "1rem" }}>📦</span>
            </div>
            <h2 className="ds-modal-title" style={{ marginBottom: 0 }}>Deduct Stock?</h2>
          </div>
          {!isDeducting && <button className="ds-modal-close" onClick={onClose}>×</button>}
        </div>

        <div className="ds-modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#6B7280" }}>
            While reviewing <strong>"{taskName}"</strong>, the AI noticed these tools may have been withdrawn from stock. Deduct them now?
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "#F9FAFB", border: "1px solid #E9EBF0", borderRadius: 10, padding: "10px 14px" }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ fontWeight: 600, color: "#111827" }}>{it.item_name}</span>
                <span style={{ color: "#6B7280" }}>× {it.quantity}</span>
              </div>
            ))}
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", fontSize: "0.82rem", color: "#DC2626" }}>
              {error}
            </div>
          )}
        </div>

        <div className="ds-modal-footer">
          <button className="ds-btn ds-btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={onClose} disabled={isDeducting}>
            No, skip
          </button>
          <button className="ds-btn ds-btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={handleConfirm} disabled={isDeducting}>
            {isDeducting ? "Deducting..." : "Yes, deduct"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockUsageConfirmModal;
