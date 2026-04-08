import React, { useState } from "react";

/**
 * Hook: returns { visible, dismiss } for a one-time "first visit" popup per feature.
 * Uses localStorage key `wc_seen_popup_<featureKey>`.
 */
export function useFirstTimePopup(featureKey) {
  const key = `wc_seen_popup_${featureKey}`;
  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem(key); } catch { return false; }
  });
  const dismiss = () => {
    try { localStorage.setItem(key, "1"); } catch {}
    setVisible(false);
  };
  return { visible, dismiss };
}

/**
 * FeaturePopup — renders a one-time info popup for a submenu/feature page.
 *
 * Props:
 *   T            — theme object
 *   featureKey   — unique string key for this feature, e.g. "aj_wallet"
 *   title        — popup title
 *   content      — descriptive text
 *   icon         — emoji icon (default "💡")
 */
export function FeaturePopup({ T, featureKey, title, content, icon = "💡" }) {
  const { visible, dismiss } = useFirstTimePopup(featureKey);
  if (!visible) return null;

  return (
    <div
      onClick={dismiss}
      style={{
        position: "fixed", inset: 0, background: "#0007", zIndex: 900,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.card, borderRadius: 18, padding: "24px 20px",
          maxWidth: 380, width: "100%", boxShadow: "0 8px 32px #0006",
          border: `1px solid ${T.border}`,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>{icon}</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 13, color: T.textSoft, lineHeight: 1.6 }}>{content}</div>
        </div>
        <button
          onClick={dismiss}
          style={{
            width: "100%", padding: "11px", borderRadius: 10, border: "none",
            background: T.accent, color: "#000", fontWeight: 700, fontSize: 14,
            cursor: "pointer", marginTop: 4,
          }}
        >
          Mengerti
        </button>
      </div>
    </div>
  );
}
