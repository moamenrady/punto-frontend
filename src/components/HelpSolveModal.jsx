import React, { useState } from "react";
import { AiFeatures } from "../services/aiOpsService";
import Markdown from "../utils/markdown";

/**
 * HelpSolveModal — "Help me solve" button target.
 *
 * Drop into any task or ticket details view. Opens with a small optional
 * notes field, then calls POST /api/ai/help-solve and renders the
 * Markdown solution it returns.
 *
 * Props:
 *  - isOpen, onClose
 *  - itemId    – task or ticket id
 *  - itemType  – 'task' | 'ticket'
 *  - itemLabel – display name shown in the header (optional)
 */
const HelpSolveModal = ({ isOpen, onClose, itemId, itemType, itemLabel }) => {
  const [details, setDetails] = useState("");
  const [step, setStep] = useState("compose"); // 'compose' | 'loading' | 'result' | 'error'
  const [solution, setSolution] = useState("");
  const [error, setError] = useState(null);
  const [wasOpen, setWasOpen] = useState(isOpen);

  // Reset the form each time the modal transitions closed -> open.
  // (Adjusting state during render on prop change, per React's guidance —
  // avoids the cascading-render issue of doing this in a useEffect.)
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setStep("compose");
      setDetails("");
      setSolution("");
      setError(null);
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setStep("loading");
    setError(null);
    try {
      const data = await AiFeatures.helpSolve({ itemId, itemType, details });
      const text =
        typeof data === "string"
          ? data
          : data?.solution ?? data?.response ?? data?.message ?? data?.answer ?? "";
      if (!text) {
        setError("The assistant didn't return a solution. Try again with a bit more detail.");
        setStep("error");
        return;
      }
      setSolution(text);
      setStep("result");
    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  return (
    <div className="ds-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="ds-modal" style={{ maxWidth: 560 }}>
        <div className="ds-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#EEF1FD", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#8A9FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h2 className="ds-modal-title" style={{ marginBottom: 0 }}>AI Solution</h2>
              {itemLabel && <p style={{ margin: 0, fontSize: "0.78rem", color: "#9CA3AF" }}>{itemLabel}</p>}
            </div>
          </div>
          <button className="ds-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="ds-modal-body">
          {step === "compose" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#6B7280" }}>
                Not sure how to fix this? Add any extra notes (optional) and let the AI walk you through it.
              </p>
              <textarea
                className="ds-textarea"
                style={{ width: "100%", minHeight: 90 }}
                placeholder="e.g. I already restarted the router but the issue persists..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
          )}

          {step === "loading" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 140, gap: 12 }}>
              <div style={{ width: 32, height: 32, border: "3px solid #E9EBF0", borderTop: "3px solid #8A9FE8", borderRadius: "50%", animation: "hsSpin 0.8s linear infinite" }} />
              <p style={{ color: "#9CA3AF", fontSize: "0.85rem", margin: 0 }}>Thinking through a solution...</p>
            </div>
          )}

          {step === "error" && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1rem" }}>⚠️</span>
              <span style={{ fontSize: "0.875rem", color: "#DC2626", fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {step === "result" && (
            <div style={{ background: "#F9FAFB", border: "1px solid #E9EBF0", borderRadius: 10, padding: "16px 18px", maxHeight: 420, overflowY: "auto" }}>
              <Markdown text={solution} />
            </div>
          )}
        </div>

        <div className="ds-modal-footer">
          {step === "compose" && (
            <>
              <button className="ds-btn ds-btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>
                Cancel
              </button>
              <button className="ds-btn ds-btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={handleSubmit}>
                Get AI Solution
              </button>
            </>
          )}
          {(step === "error") && (
            <>
              <button className="ds-btn ds-btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>
                Close
              </button>
              <button className="ds-btn ds-btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={handleSubmit}>
                Try Again
              </button>
            </>
          )}
          {step === "result" && (
            <>
              <button className="ds-btn ds-btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setStep("compose")}>
                Ask Again
              </button>
              <button className="ds-btn ds-btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>
                Done
              </button>
            </>
          )}
          {step === "loading" && (
            <button className="ds-btn ds-btn-secondary" style={{ flex: 1, justifyContent: "center" }} disabled>
              Working...
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes hsSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default HelpSolveModal;
