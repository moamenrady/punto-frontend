import React from 'react';

const statusBadgeStyle = {
  'In Stock':     { background: '#D1FAE5', color: '#065F46' },
  'Low Stock':    { background: '#FEF3C7', color: '#92400E' },
  'Out of Stock': { background: '#FEE2E2', color: '#DC2626' },
};

const ViewAssetModal = ({ asset, onClose }) => {
  if (!asset) return null;

  const status = asset.status ?? 'In Stock';
  const initials = asset.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="ds-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="ds-modal ds-modal-lg">
        {/* Header */}
        <div className="ds-modal-header">
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8A9FE8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Asset Details</div>
            <h2 className="ds-modal-title">{asset.name}</h2>
            <p style={{ fontSize: '0.78rem', color: '#6B7280', fontFamily: 'monospace', margin: 0 }}>{asset.sku}</p>
          </div>
          <button className="ds-modal-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="ds-modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Left Column */}
            <div className="ds-card" style={{ padding: 20 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 16,
                background: 'linear-gradient(135deg, #8A9FE8 0%, #6B82D8 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 800, color: '#fff',
                margin: '0 auto 20px'
              }}>
                {initials}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'SKU',      value: asset.sku,      mono: true },
                  { label: 'Vendor',   value: asset.vendor || '—' },
                  { label: 'Category', value: asset.category },
                  { label: 'Unit',     value: asset.unit || 'pcs' },
                  { label: 'Location', value: asset.location || '—' },
                  { label: 'Unit Cost', value: `${(asset.value ?? 0).toLocaleString()} ${asset.currency ?? 'SAR'}`, highlight: true },
                ].map(({ label, value, mono, highlight }) => (
                  <div key={label} style={{ background: '#F9FAFB', border: '1px solid #E9EBF0', borderRadius: 8, padding: '9px 14px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: highlight ? '1rem' : '0.875rem', fontWeight: 700, color: highlight ? '#8A9FE8' : '#111827', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="ds-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Quantity */}
                <div style={{ background: '#EEF1FD', border: '1px solid #C7D2F8', borderRadius: 10, padding: '16px 20px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Current Quantity</div>
                  <div style={{ fontSize: '3rem', fontWeight: 900, color: '#8A9FE8', lineHeight: 1 }}>
                    {asset.quantity}
                    <span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: 6, color: '#8A9FE8' }}>{asset.unit ?? 'pcs'}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#8A9FE8', marginTop: 6 }}>Min. threshold: {asset.minimumThreshold ?? 5}</div>
                </div>

                {/* Status */}
                <div style={{ background: '#F9FAFB', border: '1px solid #E9EBF0', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Stock Status</div>
                  <span className="ds-badge" style={statusBadgeStyle[status] ?? statusBadgeStyle['In Stock']}>
                    {status}
                  </span>
                </div>

                {/* Total Value */}
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Total Estimated Value</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706' }}>
                    {((asset.quantity ?? 0) * (asset.value ?? 0)).toLocaleString()}
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, marginLeft: 6 }}>{asset.currency ?? 'SAR'}</span>
                  </div>
                </div>
              </div>

              <button className="ds-btn ds-btn-secondary" style={{ marginTop: 16, justifyContent: 'center' }} onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAssetModal;
