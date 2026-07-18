import React, { useCallback, useEffect, useState } from 'react';
import { SystemAdmin } from '../services/aiOpsService';
import HelpSolveModal from './HelpSolveModal';

// ── Status presentation map ──────────────────────────────────────────────
const STATUS_META = {
  safe: {
    label: 'Safe',
    dot: '🟢',
    border: '#22C55E',
    bg: '#ECFDF5',
    chipBg: '#DCFCE7',
    chipText: '#16A34A',
    accent: '#16A34A',
  },
  critical: {
    label: 'Critical',
    dot: '🔴',
    border: '#EF4444',
    bg: '#FEF2F2',
    chipBg: '#FEE2E2',
    chipText: '#DC2626',
    accent: '#DC2626',
  },
  empty: {
    label: 'Out of Stock',
    dot: '⚫',
    border: '#111827',
    bg: '#111827',
    chipBg: '#1F2937',
    chipText: '#F87171',
    accent: '#F87171',
    dark: true,
  },
  insufficient_data: {
    label: 'Gathering Data',
    dot: '⚪',
    border: '#D1D5DB',
    bg: '#F9FAFB',
    chipBg: '#F3F4F6',
    chipText: '#6B7280',
    accent: '#9CA3AF',
  },
};

const STATUS_PRIORITY = { empty: 0, critical: 1, insufficient_data: 2, safe: 3 };

const getStatusMeta = (status) => STATUS_META[status] ?? STATUS_META.insufficient_data;

const formatEmptyDate = (isoString) => {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * StockPredictionsPanel
 *
 * Displays GET /api/ai/stock-predictions as a "Wow" card grid above the
 * asset table: green/safe, red/critical, black/empty, gray/insufficient_data.
 * The backend auto-opens an IT ticket when it detects a "critical" item —
 * this panel only needs to surface the warning, never create tickets itself.
 *
 * Props:
 *  - onLoaded(predictions[]): fired after a successful fetch, so the parent
 *    page can raise a toast/notification (e.g. for critical items).
 */
const StockPredictionsPanel = ({ onLoaded }) => {
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [helpItem, setHelpItem] = useState(null); // { item_id, item_name } | null

  const fetchPredictions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await SystemAdmin.getStockPredictions();
      const items = res?.data ?? [];
      const sorted = [...items].sort((a, b) => {
        const pa = STATUS_PRIORITY[a.status] ?? 99;
        const pb = STATUS_PRIORITY[b.status] ?? 99;
        if (pa !== pb) return pa - pb;
        return (a.days_left ?? Infinity) - (b.days_left ?? Infinity);
      });
      setPredictions(sorted);
      setLastUpdated(new Date());
      onLoaded?.(sorted);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [onLoaded]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  return (
    <div className="ds-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #E9EBF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 8 }}>
            🤖 AI Stock Predictions
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: 0 }}>
            {lastUpdated
              ? `Forecast based on recent consumption — updated ${lastUpdated.toLocaleTimeString()}`
              : 'Forecasting depletion from recent consumption patterns...'}
          </p>
        </div>
        <button
          onClick={fetchPredictions}
          disabled={isLoading}
          className="ds-btn ds-btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={isLoading ? { animation: 'spPanelSpin 0.8s linear infinite' } : undefined}
          >
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      <div style={{ padding: 24 }}>
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1rem' }}>⚠️</span>
            <span style={{ fontSize: '0.875rem', color: '#DC2626', fontWeight: 500 }}>{error}</span>
            <button onClick={fetchPredictions} style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#8A9FE8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120, gap: 12 }}>
            <div style={{ width: 28, height: 28, border: '3px solid #E9EBF0', borderTop: '3px solid #8A9FE8', borderRadius: '50%', animation: 'spPanelSpin 0.8s linear infinite' }} />
            <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: 0 }}>Running AI forecast...</p>
          </div>
        ) : predictions.length === 0 && !error ? (
          <p style={{ color: '#9CA3AF', fontSize: '0.875rem', textAlign: 'center', margin: '20px 0' }}>
            No predictions available yet.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {predictions.map((item) => {
              const meta = getStatusMeta(item.status);
              const emptyDateLabel = formatEmptyDate(item.empty_date);
              const isDark = Boolean(meta.dark);

              return (
                <div
                  key={item.item_id}
                  style={{
                    background: meta.bg,
                    border: `1.5px solid ${meta.border}`,
                    borderRadius: 14,
                    padding: '18px 20px',
                    position: 'relative',
                    boxShadow: item.status === 'critical' ? '0 0 0 3px rgba(239,68,68,0.10)' : 'none',
                    animation: item.status === 'critical' ? 'spPanelPulse 2s ease-in-out infinite' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span
                      style={{
                        fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                        color: meta.chipText, background: meta.chipBg, borderRadius: 20, padding: '3px 10px',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      <span>{meta.dot}</span>{meta.label}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: isDark ? '#9CA3AF' : '#9CA3AF' }}>
                      Qty: {item.current_qty}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: '1.05rem', fontWeight: 800, margin: '0 0 8px',
                    color: isDark ? '#F9FAFB' : '#111827', lineHeight: 1.25,
                  }}>
                    {item.item_name}
                  </h3>

                  {item.status === 'insufficient_data' ? (
                    <p style={{ fontSize: '0.82rem', color: isDark ? '#D1D5DB' : '#6B7280', margin: 0, lineHeight: 1.5 }}>
                      Not enough withdrawal history yet — the AI needs a few more days of usage to predict this item accurately.
                    </p>
                  ) : (
                    <>
                      <p style={{ fontSize: '0.82rem', color: isDark ? '#D1D5DB' : '#374151', margin: '0 0 6px', lineHeight: 1.5 }}>
                        <strong style={{ color: meta.accent }}>
                          {item.days_left != null ? `${item.days_left} day${item.days_left === 1 ? '' : 's'}` : '—'}
                        </strong>{' '}
                        remaining before it runs out (at {item.daily_burn_rate ?? '—'} pcs/day).
                      </p>
                      {emptyDateLabel && (
                        <p style={{ fontSize: '0.78rem', color: isDark ? '#9CA3AF' : '#9CA3AF', margin: 0 }}>
                          Expected empty: <strong style={{ color: isDark ? '#F9FAFB' : '#111827' }}>{emptyDateLabel}</strong>
                        </p>
                      )}
                    </>
                  )}

                  {item.status === 'critical' && (
                    <div style={{
                      marginTop: 12, fontSize: '0.75rem', fontWeight: 700, color: '#DC2626',
                      background: '#FEE2E2', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      ⚠️ Order now — an IT ticket has been opened automatically.
                    </div>
                  )}

                  {item.status === 'empty' && (
                    <div style={{
                      marginTop: 12, fontSize: '0.75rem', fontWeight: 700, color: '#F87171',
                      background: '#1F2937', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      🚨 Out of stock — reorder immediately.
                    </div>
                  )}

                  {(item.status === 'critical' || item.status === 'empty') && (
                    <button
                      onClick={() => setHelpItem(item)}
                      className="ds-btn ds-btn-secondary"
                      style={{ marginTop: 12, width: '100%', justifyContent: 'center', color: '#534AB7', borderColor: '#C7D2F8', background: '#EEF1FD' }}
                    >
                      🧠 Help me solve
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <HelpSolveModal
        isOpen={Boolean(helpItem)}
        onClose={() => setHelpItem(null)}
        itemId={helpItem?.item_id}
        itemType="stock"
        itemLabel={helpItem?.item_name}
      />

      <style>{`
        @keyframes spPanelSpin { to { transform: rotate(360deg); } }
        @keyframes spPanelPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(239,68,68,0.10); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0.16); }
        }
      `}</style>
    </div>
  );
};

export default StockPredictionsPanel;
