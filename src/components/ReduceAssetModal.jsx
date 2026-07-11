import React, { useState } from 'react';

const reasons = ['Damaged', 'Deployed', 'Lost', 'Maintenance', 'Expired'];

const statusBadgeStyle = {
  'In Stock':     { background: '#D1FAE5', color: '#065F46' },
  'Low Stock':    { background: '#FEF3C7', color: '#92400E' },
  'Out of Stock': { background: '#FEE2E2', color: '#DC2626' },
};

const ReduceAssetModal = ({ asset, onClose, onConfirm }) => {
  const [quantityToReduce, setQuantityToReduce] = useState(1);
  const [reason, setReason] = useState('');

  const status = asset.status ?? 'In Stock';
  const canSubmit = quantityToReduce > 0 && quantityToReduce <= asset.quantity && !!reason;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm(asset.id, quantityToReduce, reason);
  };

  return (
    <div className="ds-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="ds-modal">

        <div className="ds-modal-header">
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8A9FE8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
              Reduce Stock
            </div>
            <h2 className="ds-modal-title">{asset.name}</h2>
          </div>
          <button className="ds-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="ds-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Current info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#EEF1FD', border: '1px solid #C7D2F8', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Current Qty
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#8A9FE8', lineHeight: 1 }}>
                {asset.quantity}
                <span style={{ fontSize: '0.85rem', marginLeft: 4, fontWeight: 500 }}>{asset.unit ?? 'pcs'}</span>
              </div>
            </div>
            <div style={{ background: '#F9FAFB', border: '1px solid #E9EBF0', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Status
              </div>
              <span className="ds-badge" style={statusBadgeStyle[status] ?? statusBadgeStyle['In Stock']}>{status}</span>
            </div>
          </div>

          {/* Quantity input */}
          <div className="ds-form-group">
            <label className="ds-label">Quantity to reduce</label>
            <input
              type="number"
              min="1"
              max={asset.quantity}
              value={quantityToReduce}
              onChange={(e) => setQuantityToReduce(Number(e.target.value))}
              className="ds-input"
            />
            <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Min: 1 · Max: {asset.quantity}</span>
          </div>

          {/* Reason select */}
          <div className="ds-form-group">
            <label className="ds-label">Reason for reduction <span style={{ color: '#EF4444' }}>*</span></label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="ds-select">
              <option value="">Select a reason...</option>
              {reasons.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        <div className="ds-modal-footer">
          <button className="ds-btn ds-btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="ds-btn ds-btn-primary"
            style={{ opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
          >
            Confirm Reduce
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReduceAssetModal;
