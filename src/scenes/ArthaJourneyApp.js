import React, { useState } from "react";
import SettingsPopup from "./SettingsPopup";

// ─── Sidebar nav items for Artha Journey ────────────────────────────────────
const AJ_NAV = [
  { id: "wallet",    label: "Wallet",    icon: "👛", color: "#5b9cf6" },
  { id: "budget",    label: "Budget",    icon: "📊", color: "#f59e0b" },
  { id: "transaksi", label: "Transaksi", icon: "💰", color: "#3ecf8e" },
  { id: "hutang",    label: "Hutang",    icon: "💳", color: "#f26b6b" },
  { id: "tools",     label: "Tools",     icon: "🔧", color: "#9b7ef8" },
  { id: "report",    label: "Laporan",   icon: "📈", color: "#34d399" },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function AJSidebar({ tab, setTab, T, sideOpen, setSideOpen, setShowSettings }) {
  return (
    <div
      style={{
        width: sideOpen ? 180 : 52,
        minWidth: sideOpen ? 180 : 52,
        background: T.sidebar || T.card,
        borderRight: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s",
        overflow: "hidden",
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* App branding */}
      <div
        style={{
          padding: sideOpen ? "16px 14px 12px" : "16px 0 12px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: sideOpen ? "flex-start" : "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 20 }}>📒</span>
        {sideOpen && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "#3ecf8e", letterSpacing: 0.3 }}>
            Artha Journey
          </span>
        )}
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, paddingTop: 6 }}>
        {AJ_NAV.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              title={item.label}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: sideOpen ? "9px 14px" : "9px 0",
                justifyContent: sideOpen ? "flex-start" : "center",
                background: active ? item.color + "22" : "transparent",
                border: "none",
                borderLeft: active ? `3px solid ${item.color}` : "3px solid transparent",
                color: active ? item.color : T.textSoft,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {sideOpen && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Bottom buttons */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "6px 0" }}>
        <button
          onClick={() => setShowSettings(true)}
          title="Settings"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: sideOpen ? "9px 14px" : "9px 0",
            justifyContent: sideOpen ? "flex-start" : "center",
            background: "transparent",
            border: "none",
            color: T.textSoft,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          <span style={{ fontSize: 16 }}>⚙️</span>
          {sideOpen && <span>Settings</span>}
        </button>
        <button
          onClick={() => setSideOpen((p) => !p)}
          title={sideOpen ? "Collapse" : "Expand"}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: sideOpen ? "9px 14px" : "9px 0",
            justifyContent: sideOpen ? "flex-start" : "center",
            background: "transparent",
            border: "none",
            color: T.muted,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          <span style={{ fontSize: 14, transform: sideOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>→</span>
          {sideOpen && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );
}

// ─── Placeholder scene card ───────────────────────────────────────────────────
function PlaceholderScene({ icon, title, desc, features, ctaLabel, T, extra }) {
  return (
    <div style={{ padding: "24px 20px", maxWidth: 680, margin: "0 auto" }}>
      {/* Hero */}
      <div
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          padding: "28px 24px",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 14 }}>{icon}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: T.textSoft, lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }}>{desc}</div>
        {ctaLabel && (
          <button
            style={{
              marginTop: 18,
              padding: "10px 28px",
              borderRadius: 10,
              border: `1.5px solid ${T.accent}`,
              background: T.accentDim,
              color: T.accent,
              fontSize: 13,
              fontWeight: 600,
              cursor: "not-allowed",
              opacity: 0.7,
            }}
          >
            {ctaLabel} — Segera Hadir
          </button>
        )}
      </div>

      {/* Extra content slot */}
      {extra}

      {/* Features list */}
      {features?.length > 0 && (
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            padding: "18px 20px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: T.muted,
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Yang Akan Hadir
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {features.map((f) => (
              <div key={f.label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: T.textSoft, marginTop: 2 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Wallet Scene ─────────────────────────────────────────────────────────────
function WalletScene({ T, isPro, isProPlus }) {
  const walletLimit = isProPlus ? "∞" : isPro ? "10" : "3";
  return (
    <PlaceholderScene
      icon="👛"
      title="Wallet"
      desc="Kelola semua dompet digital, uang tunai, dan hutang revolving kamu dalam satu tempat."
      T={T}
      ctaLabel="+ Tambah Wallet"
      extra={
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12, color: T.textSoft }}>Batas Wallet Aktif</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: T.accent,
              background: T.accentDim,
              padding: "3px 10px",
              borderRadius: 20,
            }}
          >
            0 / {walletLimit}
          </span>
        </div>
      }
      features={[
        { icon: "🔄", label: "Import Dana Tunai dari Wealth Pulse", desc: "Sinkron otomatis aset kategori 'Dana Tunai' dari WC" },
        { icon: "💳", label: "Import Hutang Revolving dari Wealth Pulse", desc: "Kartu kredit dan pinjaman revolving tersinkron langsung" },
        { icon: "➕", label: "Tambah Wallet Manual", desc: "Input dompet digital, rekening bank, atau uang tunai sendiri" },
        { icon: "📊", label: "Saldo Real-time", desc: "Saldo otomatis terupdate setiap ada transaksi dicatat" },
      ]}
    />
  );
}

// ─── Budget Scene ─────────────────────────────────────────────────────────────
function BudgetScene({ T }) {
  return (
    <PlaceholderScene
      icon="📊"
      title="Budget"
      desc="Atur anggaran pengeluaran per kategori dan pantau realisasinya setiap bulan."
      T={T}
      ctaLabel="+ Buat Budget"
      features={[
        { icon: "🗂️", label: "Buat Kategori Budget", desc: "Bagi pengeluaran ke kategori sesuai kebutuhan (makan, transportasi, dll)" },
        { icon: "💰", label: "Alokasi Nominal", desc: "Tentukan batas anggaran per kategori setiap bulan" },
        { icon: "📈", label: "Tracking Realisasi vs Plan", desc: "Lihat seberapa jauh pengeluaran aktual vs yang direncanakan" },
        { icon: "🔔", label: "Alert Melebihi Budget", desc: "Notifikasi otomatis jika spending sudah melebihi batas anggaran" },
      ]}
    />
  );
}

// ─── Transaksi Scene ──────────────────────────────────────────────────────────
function TransaksiScene({ T, pulseCredits }) {
  return (
    <PlaceholderScene
      icon="💰"
      title="Transaksi"
      desc="Catat setiap transaksi keuanganmu — pengeluaran, pemasukan, pembayaran hutang, transfer dompet."
      T={T}
      ctaLabel="+ Catat Transaksi"
      extra={
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: T.muted }}>Pulse Credit tersedia</div>
            <div style={{ fontSize: 12, color: T.textSoft, marginTop: 2 }}>
              Digunakan untuk upload foto/PDF struk & AI kategorisasi
            </div>
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#f59e0b",
              background: "#f59e0b22",
              padding: "4px 12px",
              borderRadius: 20,
              whiteSpace: "nowrap",
            }}
          >
            ✦ {pulseCredits} Pulse
          </span>
        </div>
      }
      features={[
        { icon: "📷", label: "Upload Foto / PDF Struk", desc: "AI membaca struk otomatis dan mengisi detail transaksi (pakai Pulse Credit)" },
        { icon: "🤖", label: "AI Auto-Kategorisasi", desc: "Transaksi dikategorikan otomatis oleh AI, bisa diedit manual" },
        { icon: "💳", label: "Catat Pembayaran Hutang", desc: "Pilih hutang mana yang dibayar — nominal hutang di Wealth Pulse otomatis turun" },
        { icon: "↕️", label: "Transfer Antar Dompet", desc: "Catat perpindahan saldo antar wallet tanpa mempengaruhi total kekayaan" },
      ]}
    />
  );
}

// ─── Hutang Scene (Read-only) ─────────────────────────────────────────────────
function HutangScene({ T, debts }) {
  const fmt = (v) =>
    "Rp " +
    Number(v || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 });

  return (
    <div style={{ padding: "24px 20px", maxWidth: 680, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>💳 Hutang</div>
          <div style={{ fontSize: 12, color: T.textSoft, marginTop: 2 }}>
            Diimpor dari Wealth Pulse · Read Only
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            padding: "3px 10px",
            borderRadius: 20,
            border: `1px solid ${T.border}`,
            color: T.muted,
            background: T.surface,
          }}
        >
          🔒 Read Only
        </span>
      </div>

      {debts && debts.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {debts.map((d) => (
            <div
              key={d.id}
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{d.name || d.label || "Hutang"}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                  {d.category || d.type || "—"} · {d.bank || ""}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f26b6b" }}>
                  {fmt(d.outstanding ?? d.nominal)}
                </div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>Sisa hutang</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            padding: "40px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>💳</div>
          <div style={{ fontSize: 14, color: T.textSoft, marginBottom: 6 }}>Belum ada hutang tersinkron</div>
          <div style={{ fontSize: 12, color: T.muted }}>
            Input hutang di Wealth Pulse terlebih dahulu,<br />
            lalu akan muncul di sini secara otomatis.
          </div>
        </div>
      )}

      {/* Info box */}
      <div
        style={{
          marginTop: 16,
          padding: "12px 16px",
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          fontSize: 12,
          color: T.textSoft,
          lineHeight: 1.55,
        }}
      >
        💡 Untuk membayar hutang, catat transaksi di menu <strong style={{ color: T.text }}>Transaksi</strong> dan pilih jenis "Bayar Hutang". Nominal hutang di Wealth Pulse akan otomatis berkurang.
      </div>
    </div>
  );
}

// ─── Tools Scene ─────────────────────────────────────────────────────────────
function ToolsScene({ T }) {
  const tools = [
    { icon: "💸", label: "Cek Arus Kas", desc: "Analisis total pemasukan vs pengeluaran periode tertentu" },
    { icon: "✦", label: "Ngobrol dengan AI", desc: "Diskusi keuangan dan minta saran dengan AI Advisor (pakai Pulse)" },
    { icon: "🔍", label: "Insight Pengeluaran & Pemasukan", desc: "Temukan pola belanja dan peluang penghematan" },
    { icon: "🏅", label: "Score Kesehatan Keuangan", desc: "Nilai kesehatan arus kas kamu berdasarkan pencatatan transaksi" },
  ];

  return (
    <div style={{ padding: "24px 20px", maxWidth: 680, margin: "0 auto" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>🔧 Tools</div>
      <div style={{ fontSize: 13, color: T.textSoft, marginBottom: 20 }}>
        Analisis dan insight mendalam tentang keuanganmu
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tools.map((t) => (
          <div
            key={t.label}
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 13,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: 0.7,
              cursor: "not-allowed",
            }}
          >
            <span style={{ fontSize: 26, flexShrink: 0 }}>{t.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{t.label}</div>
              <div style={{ fontSize: 12, color: T.textSoft, marginTop: 3 }}>{t.desc}</div>
            </div>
            <span
              style={{
                fontSize: 9,
                padding: "2px 8px",
                borderRadius: 20,
                border: `1px solid ${T.border}`,
                color: T.muted,
                whiteSpace: "nowrap",
              }}
            >
              Segera
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Report Scene ─────────────────────────────────────────────────────────────
function ReportScene({ T }) {
  return (
    <PlaceholderScene
      icon="📈"
      title="Laporan"
      desc="Ringkasan lengkap arus kas kamu dalam bentuk grafik dan laporan yang bisa diekspor."
      T={T}
      ctaLabel="Tarik Laporan"
      features={[
        { icon: "🥧", label: "Pie Chart Alokasi Pengeluaran", desc: "Visualisasi proporsi pengeluaran per kategori" },
        { icon: "📅", label: "Laporan Arus Kas Bulanan", desc: "Ringkasan pemasukan, pengeluaran, dan saldo per bulan" },
        { icon: "📤", label: "Export PDF / Excel", desc: "Unduh laporan untuk arsip atau keperluan pajak" },
        { icon: "🔝", label: "Tren Pengeluaran Terbesar", desc: "Identifikasi kategori dengan lonjakan pengeluaran terbesar" },
      ]}
    />
  );
}

// ─── Main ArthaJourneyApp ────────────────────────────────────────────────────
export default function ArthaJourneyApp({
  user,
  T,
  isPro,
  isProPlus,
  pulseCredits,
  assets,
  debts,
  settings,
  setSettings,
  theme,
  setTheme,
  dispCur,
  setDispCur,
  fontScale,
  setFontScale,
  customPresetId,
  setCustomPresetId,
  setShowUpgrade,
  activeApp,
  setActiveApp,
  onLogout,
  logoutSaving,
}) {
  const [tab, setTab] = useState("wallet");
  const [showSettings, setShowSettings] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);

  const renderScene = () => {
    switch (tab) {
      case "wallet":    return <WalletScene T={T} isPro={isPro} isProPlus={isProPlus} />;
      case "budget":    return <BudgetScene T={T} />;
      case "transaksi": return <TransaksiScene T={T} pulseCredits={pulseCredits} />;
      case "hutang":    return <HutangScene T={T} debts={debts} />;
      case "tools":     return <ToolsScene T={T} />;
      case "report":    return <ReportScene T={T} />;
      default:          return <WalletScene T={T} isPro={isPro} isProPlus={isProPlus} />;
    }
  };

  const activeNav = AJ_NAV.find((n) => n.id === tab);

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, overflow: "hidden", fontFamily: "inherit" }}>
      {/* Sidebar */}
      <AJSidebar
        tab={tab}
        setTab={setTab}
        T={T}
        sideOpen={sideOpen}
        setSideOpen={setSideOpen}
        setShowSettings={setShowSettings}
      />

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div
          style={{
            padding: "0 20px",
            height: 54,
            minHeight: 54,
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: T.card,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{activeNav?.icon || "📒"}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
              {activeNav?.label || "Artha Journey"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Pulse credits chip */}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#f59e0b",
                background: "#f59e0b22",
                border: "1px solid #f59e0b44",
                padding: "3px 10px",
                borderRadius: 20,
              }}
            >
              ✦ {pulseCredits} Pulse
            </span>
            {/* Tier badge */}
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: isPro ? T.accent : T.muted,
                background: isPro ? T.accentDim : T.surface,
                border: `1px solid ${isPro ? T.accent : T.border}`,
                padding: "3px 10px",
                borderRadius: 20,
              }}
            >
              {isProPlus ? "💎 PRO+" : isPro ? "⭐ PRO" : "Free"}
            </span>
          </div>
        </div>

        {/* Scene content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {renderScene()}
        </div>
      </div>

      {/* Settings popup (reuses WC SettingsPopup) */}
      <SettingsPopup
        show={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        setSettings={setSettings}
        theme={theme}
        setTheme={setTheme}
        dispCur={dispCur}
        setDispCur={setDispCur}
        isPro={isPro}
        setIsPro={() => {}}
        setShowUpgrade={setShowUpgrade}
        T={T}
        onLogout={onLogout}
        logoutSaving={logoutSaving}
        fontScale={fontScale}
        setFontScale={setFontScale}
        customPresetId={customPresetId}
        setCustomPresetId={setCustomPresetId}
        activeApp={activeApp}
        setActiveApp={setActiveApp}
      />
    </div>
  );
}
