import React, { useState } from "react";
import { Card, TBtn } from "./ui";

const PLANS = {
  pro: [
    { id: "monthly",  label: "Bulanan",  price: "$1.99",  sub: "/bulan",  saving: "",         pulse: 25,  days: 30  },
    { id: "biannual", label: "6 Bulan",  price: "$10.99", sub: "/6 bln",  saving: "Hemat 8%", pulse: 150, days: 180 },
    { id: "annual",   label: "Tahunan",  price: "$19.99", sub: "/tahun",  saving: "Hemat 16%",pulse: 300, days: 365, popular: true },
  ],
  proplus: [
    { id: "monthly",  label: "Bulanan",  price: "$4.99",  sub: "/bulan",  saving: "",          pulse: 100,  days: 30  },
    { id: "biannual", label: "6 Bulan",  price: "$26.99", sub: "/6 bln",  saving: "Hemat 10%", pulse: 600,  days: 180 },
    { id: "annual",   label: "Tahunan",  price: "$47.99", sub: "/tahun",  saving: "Hemat 20%", pulse: 1200, days: 365, popular: true },
  ],
};

const TIER_META = {
  pro: {
    color: "#d4a843",
    badge: "⭐ PRO",
    features: [
      "50 aset · 15 utang · 10 tujuan",
      "Upload PDF 7x/bulan + Pulse",
      "Net Worth 1 tahun",
      "AI Advisor (1 Pulse/chat)",
      "Tema Custom",
      "Modul Properti & Bisnis",
    ],
  },
  proplus: {
    color: "#9b7ef8",
    badge: "💎 PRO+",
    features: [
      "Semua Fitur Pro",
      "Aset, utang & tujuan tak terbatas",
      "Upload PDF 20x/bulan + Pulse",
      "Net Worth 5 tahun / MAX",
      "AI Advisor Claude Sonnet (1 Pulse/chat)",
      "Peer Benchmarking",
      "Export laporan PDF",
    ],
  },
};

function UpgradePanel({ show, onClose, onUpgrade, isPro, isProPlus, proExpiry, T }) {
  const [tierChoice, setTierChoice] = useState("pro");
  const [selected, setSelected] = useState("annual");

  const activePlans = PLANS[tierChoice];
  const meta = TIER_META[tierChoice];

  // Pro→Pro+ upgrade: same expiry period, charge only the difference
  const isUpgradeFromPro = tierChoice === "proplus" && isPro && !isProPlus && proExpiry?.expiryDate;
  const remainingMonths = isUpgradeFromPro
    ? Math.max(1, Math.ceil((new Date(proExpiry.expiryDate) - Date.now()) / (30 * 24 * 60 * 60 * 1000)))
    : 0;
  // Price difference per month: Pro+ $4.99 - Pro $1.99 = $3.00/month
  const upgradeDiffPrice = isUpgradeFromPro ? (3.0 * remainingMonths).toFixed(2) : null;
  const upgradeExtraPulse = isUpgradeFromPro ? 75 * remainingMonths : 0;

  return (
    <>
      {show && (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000 }} />
      )}
      <div style={{
        position: "fixed", top: 0, right: 0, height: "100vh", width: 320,
        background: T.surface, borderLeft: `1px solid ${T.border}`, zIndex: 1001,
        transform: show ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s ease",
        padding: 24, overflowY: "auto", boxShadow: `-8px 0 32px ${T.shadow}`,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ color: meta.color, fontSize: 16, fontWeight: "bold", fontFamily: "'Playfair Display', Georgia, serif" }}>
            {meta.badge} Upgrade
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 20 }}>×</button>
        </div>

        {/* Tier toggle */}
        <div style={{ display: "flex", background: T.surface, borderRadius: 10, padding: 4, marginBottom: 18 }}>
          {[["pro", "⭐ Pro", "#d4a843"], ["proplus", "💎 Pro+", "#9b7ef8"]].map(([id, label, color]) => (
            <button key={id} onClick={() => { setTierChoice(id); setSelected("annual"); }}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
                background: tierChoice === id ? color + "22" : "none",
                color: tierChoice === id ? color : T.muted,
                cursor: "pointer", fontWeight: tierChoice === id ? "bold" : "normal", fontSize: 13,
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Pro→Pro+ upgrade banner */}
        {isUpgradeFromPro && (
          <div style={{ background: "#9b7ef822", border: "1px solid #9b7ef833", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 11 }}>
            <div style={{ color: "#9b7ef8", fontWeight: "bold", marginBottom: 4 }}>💎 Upgrade dari Pro → Pro+</div>
            <div style={{ color: T.textSoft }}>
              Sisa {remainingMonths} bulan aktif. Bayar selisih <b style={{ color: "#9b7ef8" }}>${upgradeDiffPrice}</b>, dapat tambahan <b style={{ color: T.accent }}>+{upgradeExtraPulse} Pulse</b>.
            </div>
          </div>
        )}

        {/* Features */}
        <div style={{ background: meta.color + "18", border: `1px solid ${meta.color}33`, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
          <div style={{ color: meta.color, fontSize: 12, fontWeight: "bold", marginBottom: 8 }}>{meta.badge} Features:</div>
          {meta.features.map(f => (
            <div key={f} style={{ color: T.text, fontSize: 12, marginBottom: 4 }}>✓ {f}</div>
          ))}
        </div>

        {/* Plans — hidden when Pro→Pro+ upgrade (auto-use same period) */}
        {!isUpgradeFromPro && activePlans.map(p => (
          <div key={p.id} onClick={() => setSelected(p.id)}
            style={{
              padding: "14px 16px", borderRadius: 12, cursor: "pointer", marginBottom: 10,
              border: `2px solid ${selected === p.id ? meta.color : T.border}`,
              background: selected === p.id ? meta.color + "18" : T.card,
              position: "relative", transition: "all 0.15s",
            }}>
            {p.popular && (
              <div style={{ position: "absolute", top: -8, right: 12, background: meta.color, color: "#000", fontSize: 9, fontWeight: "bold", padding: "2px 8px", borderRadius: 10 }}>
                TERPOPULER
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: T.text, fontSize: 13, fontWeight: "bold" }}>{p.label}</div>
                {p.saving && <div style={{ color: T.green, fontSize: 10 }}>{p.saving}</div>}
                <div style={{ color: T.accent, fontSize: 10, marginTop: 3 }}>⚡ +{p.pulse} Pulse Credit</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: meta.color, fontSize: 18, fontWeight: "bold" }}>{p.price}</div>
                <div style={{ color: T.muted, fontSize: 10 }}>{p.sub}</div>
              </div>
            </div>
          </div>
        ))}

        {/* CTA button */}
        <button
          onClick={() => {
            if (isUpgradeFromPro) {
              onUpgrade("proplus", "monthly"); // planId doesn't matter; handleUpgrade detects Pro→Pro+
            } else {
              onUpgrade(tierChoice, selected);
            }
            onClose();
          }}
          style={{
            width: "100%", padding: 14, borderRadius: 9, border: "none",
            background: meta.color, color: "#000", cursor: "pointer",
            fontWeight: "bold", fontSize: 13, marginTop: 8,
          }}>
          {isUpgradeFromPro
            ? `Upgrade ke Pro+ — $${upgradeDiffPrice}`
            : `Mulai ${meta.badge} — ${activePlans.find(p => p.id === selected)?.price}`}
        </button>

        {/* Referral */}
        <div style={{ marginTop: 16, padding: "12px 14px", background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
          <div style={{ color: T.accent, fontSize: 11, fontWeight: "bold", marginBottom: 6 }}>🤝 Program Referral</div>
          <div style={{ color: T.textSoft, fontSize: 11, lineHeight: 1.7, marginBottom: 8 }}>
            Dapatkan <b style={{ color: T.green }}>$0.99</b> untuk setiap user yang subscribe via link kamu.
          </div>
          <div style={{ background: T.accentDim, border: `1px solid ${T.accentSoft}`, borderRadius: 8, padding: "8px 12px", fontSize: 10, color: T.muted }}>
            📊 Referral kamu: <b style={{ color: T.accent }}>0 user</b> · Kredit: <b style={{ color: T.green }}>$0.00</b>
            <br /><span style={{ color: T.blue, cursor: "pointer", marginTop: 4, display: "block" }}>Salin link referral kamu →</span>
          </div>
        </div>
        <div style={{ textAlign: "center", color: T.muted, fontSize: 10, marginTop: 10, lineHeight: 1.6 }}>
          Pembayaran aman via Stripe · Batalkan kapan saja
        </div>
      </div>
    </>
  );
}

export default UpgradePanel;
