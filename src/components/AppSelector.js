import React, { useState } from "react";

export default function AppSelector({ user, T, onSelect, onLogout, logoutSaving }) {
  const [hoveredApp, setHoveredApp] = useState(null);

  const apps = [
    {
      id: "wealthcompass",
      icon: "💎",
      name: "Wealth Pulse",
      subtitle: "Manajemen Kekayaan & Investasi",
      desc: "Pantau portofolio, aset, hutang, dan tujuan keuanganmu dalam satu dashboard terpadu.",
      features: ["Portofolio & Rebalancing", "Tracking Hutang & Aset", "Goals & Net Worth", "AI Advisor"],
      accentColor: "#5b9cf6",
      accentDim: "#5b9cf622",
    },
    {
      id: "arthajourney",
      icon: "📒",
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
                  fontSize: 34,
                  marginBottom: 18,
                  transition: "background 0.18s, border-color 0.18s",
                }}
              >
                {app.icon}
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
      </div>
    </div>
  );
}
