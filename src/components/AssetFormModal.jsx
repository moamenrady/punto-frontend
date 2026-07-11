import React, { useEffect, useState } from 'react';

const CATEGORIES = [
  'Network Security',
  'Switching',
  'Routing',
  'Servers',
  'Storage',
  'Security Tokens',
  'Licenses',
  'Power',
  'Computers',
  'Accessories',
  'Cables',
  'Other',
];

const UNITS = ['pcs', 'units', 'licenses', 'boxes', 'meters', 'sets'];
const CURRENCIES = ['SAR', 'USD', 'EUR', 'GBP', 'AED'];

const REQUIRED_FIELDS = ['name', 'sku', 'vendor', 'category', 'quantity', 'unit', 'minimumThreshold', 'value', 'currency'];

const SKU_REGEX = /^[A-Za-z0-9][A-Za-z0-9\-_.]{1,49}$/;

const validate = (fields) => {
  const errors = {};

  if (!fields.name.trim()) {
    errors.name = 'Asset name is required.';
  } else if (fields.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (!fields.sku.trim()) {
    errors.sku = 'SKU is required.';
  } else if (!SKU_REGEX.test(fields.sku.trim())) {
    errors.sku = 'Enter a valid SKU (e.g., FG-60F-BDL). Letters, numbers, hyphens only.';
  }

  if (!fields.vendor.trim()) {
    errors.vendor = 'Vendor is required.';
  }

  if (!fields.category) {
    errors.category = 'Please select a category.';
  }

  const qty = Number(fields.quantity);
  if (fields.quantity === '' || isNaN(qty)) {
    errors.quantity = 'Quantity is required.';
  } else if (qty < 0) {
    errors.quantity = 'Quantity must be 0 or greater.';
  } else if (!Number.isInteger(qty)) {
    errors.quantity = 'Quantity must be a whole number.';
  }

  if (!fields.unit) {
    errors.unit = 'Please select a unit.';
  }

  const threshold = Number(fields.minimumThreshold);
  if (fields.minimumThreshold === '' || isNaN(threshold)) {
    errors.minimumThreshold = 'Minimum threshold is required.';
  } else if (threshold < 0) {
    errors.minimumThreshold = 'Threshold must be 0 or greater.';
  }

  const cost = Number(fields.value);
  if (fields.value === '' || isNaN(cost)) {
    errors.value = 'Unit cost is required.';
  } else if (cost <= 0) {
    errors.value = 'Cost must be greater than 0.';
  }

  if (!fields.currency) {
    errors.currency = 'Please select a currency.';
  }

  return errors;
};

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: `1.5px solid ${hasError ? '#EF4444' : '#E5E7EB'}`,
  fontSize: '0.875rem',
  outline: 'none',
  color: '#111827',
  background: '#fff',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
});

const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#374151',
  marginBottom: 5,
};

const errorStyle = {
  fontSize: '0.72rem',
  color: '#EF4444',
  marginTop: 4,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const FieldError = ({ msg }) =>
  msg ? (
    <p style={errorStyle}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {msg}
    </p>
  ) : null;

const AssetFormModal = ({ mode, asset, onClose, onSubmit }) => {
  const [fields, setFields] = useState({
    name: '',
    sku: '',
    vendor: '',
    category: CATEGORIES[0],
    quantity: '0',
    unit: UNITS[0],
    minimumThreshold: '5',
    value: '',
    currency: CURRENCIES[0],
    location: '',
  });

  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (asset) {
      setFields({
        name: asset.name ?? '',
        sku: asset.sku ?? '',
        vendor: asset.vendor ?? '',
        category: asset.category ?? CATEGORIES[0],
        quantity: String(asset.quantity ?? '0'),
        unit: asset.unit ?? UNITS[0],
        minimumThreshold: String(asset.minimumThreshold ?? '5'),
        value: String(asset.value ?? ''),
        currency: asset.currency ?? CURRENCIES[0],
        location: asset.location ?? '',
      });
    }
  }, [asset]);

  const set = (key, val) => setFields((prev) => ({ ...prev, [key]: val }));
  const touch = (key) => setTouched((prev) => ({ ...prev, [key]: true }));

  const errors = validate(fields);
  const showError = (key) => (touched[key] || submitAttempted) && errors[key];

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (Object.keys(errors).length > 0) return;
    onSubmit({
      id: asset?.id,
      ...fields,
      quantity: Number(fields.quantity),
      minimumThreshold: Number(fields.minimumThreshold),
      value: Number(fields.value),
    });
  };

  const isDisabled = submitAttempted && Object.keys(errors).length > 0;

  const focusStyle = {
    borderColor: '#8A9FE8',
  };

  const handleFocus = (e) => {
    if (!e.target.style.borderColor.includes('EF4444')) {
      e.target.style.borderColor = '#8A9FE8';
    }
  };
  const handleBlurInput = (e, key) => {
    touch(key);
    if (!errors[key]) e.target.style.borderColor = '#E5E7EB';
  };

  return (
    <div className="ds-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="ds-modal" style={{ maxWidth: 540, width: '100%' }}>

        {/* Header */}
        <div className="ds-modal-header">
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8A9FE8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
              {mode === 'edit' ? 'Edit Asset' : 'New Asset'}
            </div>
            <h2 className="ds-modal-title">{mode === 'edit' ? 'Update Asset Details' : 'Add Asset to Inventory'}</h2>
          </div>
          <button className="ds-modal-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="ds-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Asset Name */}
            <div>
              <label style={labelStyle}>Asset Name <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                value={fields.name}
                onChange={(e) => set('name', e.target.value)}
                onFocus={handleFocus}
                onBlur={(e) => handleBlurInput(e, 'name')}
                style={inputStyle(showError('name'))}
                placeholder="e.g., FortiGate 60F"
              />
              <FieldError msg={showError('name')} />
            </div>

            {/* SKU */}
            <div>
              <label style={labelStyle}>SKU <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                value={fields.sku}
                onChange={(e) => set('sku', e.target.value.toUpperCase())}
                onFocus={handleFocus}
                onBlur={(e) => handleBlurInput(e, 'sku')}
                style={{ ...inputStyle(showError('sku')), fontFamily: 'monospace' }}
                placeholder="e.g., FG-60F-BDL"
              />
              <FieldError msg={showError('sku')} />
            </div>

            {/* Vendor */}
            <div>
              <label style={labelStyle}>Vendor <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                value={fields.vendor}
                onChange={(e) => set('vendor', e.target.value)}
                onFocus={handleFocus}
                onBlur={(e) => handleBlurInput(e, 'vendor')}
                style={inputStyle(showError('vendor'))}
                placeholder="e.g., Fortinet"
              />
              <FieldError msg={showError('vendor')} />
            </div>

            {/* Category + Unit row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Category <span style={{ color: '#EF4444' }}>*</span></label>
                <select
                  value={fields.category}
                  onChange={(e) => set('category', e.target.value)}
                  onBlur={() => touch('category')}
                  style={{ ...inputStyle(showError('category')), appearance: 'auto' }}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <FieldError msg={showError('category')} />
              </div>
              <div>
                <label style={labelStyle}>Unit <span style={{ color: '#EF4444' }}>*</span></label>
                <select
                  value={fields.unit}
                  onChange={(e) => set('unit', e.target.value)}
                  onBlur={() => touch('unit')}
                  style={{ ...inputStyle(showError('unit')), appearance: 'auto' }}
                >
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <FieldError msg={showError('unit')} />
              </div>
            </div>

            {/* Quantity + Min Threshold row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Quantity <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={fields.quantity}
                  onChange={(e) => set('quantity', e.target.value)}
                  onFocus={handleFocus}
                  onBlur={(e) => handleBlurInput(e, 'quantity')}
                  style={inputStyle(showError('quantity'))}
                  placeholder="0"
                />
                <FieldError msg={showError('quantity')} />
              </div>
              <div>
                <label style={labelStyle}>Min. Threshold <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={fields.minimumThreshold}
                  onChange={(e) => set('minimumThreshold', e.target.value)}
                  onFocus={handleFocus}
                  onBlur={(e) => handleBlurInput(e, 'minimumThreshold')}
                  style={inputStyle(showError('minimumThreshold'))}
                  placeholder="5"
                />
                <FieldError msg={showError('minimumThreshold')} />
                <p style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: 3 }}>Alert triggers below this level</p>
              </div>
            </div>

            {/* Unit Cost + Currency row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
              <div>
                <label style={labelStyle}>Unit Cost <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={fields.value}
                  onChange={(e) => set('value', e.target.value)}
                  onFocus={handleFocus}
                  onBlur={(e) => handleBlurInput(e, 'value')}
                  style={inputStyle(showError('value'))}
                  placeholder="0.00"
                />
                <FieldError msg={showError('value')} />
              </div>
              <div style={{ paddingTop: 0 }}>
                <label style={labelStyle}>Currency <span style={{ color: '#EF4444' }}>*</span></label>
                <select
                  value={fields.currency}
                  onChange={(e) => set('currency', e.target.value)}
                  onBlur={() => touch('currency')}
                  style={{ ...inputStyle(showError('currency')), appearance: 'auto', minWidth: 90 }}
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Location (optional) */}
            <div>
              <label style={labelStyle}>Location <span style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
              <input
                value={fields.location}
                onChange={(e) => set('location', e.target.value)}
                onFocus={handleFocus}
                onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; }}
                style={inputStyle(false)}
                placeholder="e.g., Warehouse - Rack A2"
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="ds-modal-footer">
          <button className="ds-btn ds-btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            onClick={handleSubmit}
            className="ds-btn ds-btn-primary"
            style={{ opacity: (submitAttempted && Object.keys(errors).length > 0) ? 0.6 : 1 }}
          >
            {mode === 'edit' ? 'Save Changes' : 'Add Asset'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AddAssetModal = (props) => <AssetFormModal mode="add" {...props} />;
export const EditAssetModal = (props) => <AssetFormModal mode="edit" {...props} />;
export default AssetFormModal;
