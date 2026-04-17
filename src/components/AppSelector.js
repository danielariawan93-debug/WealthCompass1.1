import React, { useState } from "react";
import TnCModal from "./TnCModal";

const WPLogo = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="0.5" y="0.5" width="23" height="23" rx="5" fill="#0d1117" stroke="#f59e0b" strokeWidth="1.2"/>
    <polyline points="0.5,13 2,13 2.8,10.5 3.8,15.5 4.6,13 5.5,13" stroke="#f59e0b" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
    <polyline points="5,5.5 7,16.5 9.5,10 12,16.5 14,5.5" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="15" y1="5.5" x2="15" y2="17" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M15,5.5 Q21.5,5.5 21.5,9.25 Q21.5,13 15,13" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <polyline points="21.5,13 22,13 22.5,11 23,15 23.5,13" stroke="#f59e0b" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
  </svg>
);

const AJLogo = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" stroke="#f59e0b" strokeWidth="1.6"/>
    <rect x="5.5" y="11.5" width="13" height="7" rx="1.5" stroke="#f59e0b" strokeWidth="1.2"/>
    <rect x="5.5" y="9.5" width="8.5" height="3" rx="1" stroke="#f59e0b" strokeWidth="1.1"/>
    <rect x="7" y="14" width="1.8" height="2.5" rx="0.4" fill="#f59e0b" opacity="0.6"/>
    <rect x="10" y="13" width="1.8" height="3.5" rx="0.4" fill="#f59e0b" opacity="0.8"/>
    <rect x="13" y="11.5" width="1.8" height="5" rx="0.4" fill="#f59e0b"/>
    <polyline points="14.5,11 16.5,9 18.5,11" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="16.5" y1="9" x2="16.5" y2="14" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round"/>
    <polyline points="1.5,12 3.5,12 4.2,10.5 5,13.5" stroke="#f59e0b" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
    <polyline points="19,12 20.5,12 21.2,10.5 22,13.5" stroke="#f59e0b" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
  </svg>
);

export default function AppSelector({ user, T, onSelect, onLogout, logoutSaving }) {
  const [hoveredApp, setHoveredApp] = useState(null);
  const [showTnC, setShowTnC] = useState(false);
  const [tncSection, setTncSection] = useState(null);

  const apps = [
    {
      id: "wealthcompass",
      Icon: WPLogo,
      name: "Wealth Pulse",
      subtitle: "Manajemen Kekayaan & Investasi",
      desc: "Pantau portofolio, aset, hutang, dan tujuan keuanganmu dalam satu dashboard terpadu.",
      features: ["Portofolio & Rebalancing", "Tracking Hutang & Aset", "Goals & Net Worth", "AI Advisor"],
      accentColor: "#f59e0b",
      accentDim: "#f59e0b22",
    },
    {
      id: "arthajourney",
      Icon: AJLogo,
      name: "Artha Journey",
      subtitle: "Pencatatan Keuangan & Budgeting",
      desc: "Catat setiap transaksi, kelola budget, dan pantau arus kas harianmu secara real-time.",
      features: ["Catat Transaksi Harian", "Budget per Kategori", "Sync Hutang dengan WC", "Laporan Arus Kas"],
      accentColor: "#3ecf8e",
      accentDim: "#3ecf8e22",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "inherit",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>
          Selamat datang kembali
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: T.text }}>
          Halo, {user?.name || user?.email?.split("@")[0] || "Pengguna"} 👋
        </div>
        <div style={{ fontSize: 14, color: T.textSoft, marginTop: 8 }}>
          Pilih aplikasi yang ingin kamu buka
        </div>
      </div>

      {/* App Cards */}
      <div
        style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          justifyContent: "center",
          width: "100%",
          maxWidth: 740,
        }}
      >
        {apps.map((app) => {
          const isHovered = hoveredApp === app.id;
          const Icon = app.Icon;
          return (
            <div
              key={app.id}
              onMouseEnter={() => setHoveredApp(app.id)}
              onMouseLeave={() => setHoveredApp(null)}
              onClick={() => onSelect(app.id)}
              style={{
                flex: "1 1 300px",
                maxWidth: 340,
                background: T.card,
                border: `1.5px solid ${isHovered ? app.accentColor : T.border}`,
                borderRadius: 18,
                padding: "28px 24px 24px",
                cursor: "pointer",
                transition: "border-color 0.18s, box-shadow 0.18s, transform 0.14s",
                boxShadow: isHovered
                  ? `0 8px 32px ${app.accentColor}28`
                  : "0 2px 12px rgba(0,0,0,0.18)",
                transform: isHovered ? "translateY(-3px)" : "none",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 18,
                  background: isHovered ? app.accentDim : T.surface,
                  border: `1.5px solid ${isHovered ? app.accentColor : T.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 18,
                  transition: "background 0.18s, border-color 0.18s",
                }}
              >
                <Icon size={42} />
              </div>

              {/* Title */}
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                {app.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: app.accentColor,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 10,
                }}
              >
                {app.subtitle}
              </div>
              <div style={{ fontSize: 13, color: T.textSoft, lineHeight: 1.55, marginBottom: 18, flex: 1 }}>
                {app.desc}
              </div>

              {/* Feature pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22 }}>
                {app.features.map((f) => (
                  <span
                    key={f}
                    style={{
                      fontSize: 10,
                      padding: "3px 9px",
                      borderRadius: 20,
                      background: isHovered ? app.accentDim : T.surface,
                      border: `1px solid ${isHovered ? app.accentColor + "66" : T.border}`,
                      color: isHovered ? app.accentColor : T.textSoft,
                      transition: "all 0.18s",
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>

              {/* CTA Button */}
              <button
                style={{
                  width: "100%",
                  padding: "11px 0",
                  borderRadius: 10,
                  border: "none",
                  background: isHovered ? app.accentColor : T.surface,
                  color: isHovered ? "#fff" : app.accentColor,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.18s, color 0.18s",
                  borderTop: isHovered ? "none" : `1px solid ${app.accentColor}55`,
                }}
              >
                Buka {app.name} →
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 36, textAlign: "center" }}>
        <button
          onClick={onLogout}
          disabled={logoutSaving}
          style={{
            background: "none",
            border: "none",
            color: T.muted,
            fontSize: 12,
            cursor: logoutSaving ? "not-allowed" : "pointer",
            opacity: logoutSaving ? 0.5 : 1,
            textDecoration: "underline",
          }}
        >
          {logoutSaving ? "Menyimpan data..." : "Keluar dari akun ini"}
        </button>
        <div style={{ marginTop: 12, fontSize: 10, color: T.muted, lineHeight: 2 }}>
          <span
            onClick={() => { setTncSection(0); setShowTnC(true); }}
            style={{ color: T.accent, cursor: "pointer", textDecoration: "underline", marginRight: 12 }}
          >
            Syarat & Ketentuan
          </span>
          <span
            onClick={() => { setTncSection(7); setShowTnC(true); }}
            style={{ color: T.accent, cursor: "pointer", textDecoration: "underline" }}
          >
            Kebijakan Privasi
          </span>
        </div>
      </div>

      <TnCModal show={showTnC} onClose={() => setShowTnC(false)} T={T} initialSection={tncSection} />
    </div>
  );
}
