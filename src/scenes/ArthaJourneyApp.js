import React, { useState, useMemo, useEffect } from "react";
import { FeaturePopup } from "../components/FeaturePopup";
import SettingsPopup from "./SettingsPopup";
import { recalcAllCreditDebts } from "../utils/creditSync";

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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtRp(v) {
  const num = Number(v || 0);
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1e9) return sign + "Rp " + (abs / 1e9).toFixed(2) + "M";
  if (abs >= 1e6) return sign + "Rp " + (abs / 1e6).toFixed(1) + "Jt";
  if (abs >= 1e3) return sign + "Rp " + (abs / 1e3).toFixed(0) + "rb";
  return sign + "Rp " + abs.toLocaleString("id-ID");
}
function getMonth(dateStr) {
  return (dateStr ? new Date(dateStr) : new Date()).toISOString().slice(0, 7);
}
function monthLabel(m) {
  const [y, mo] = m.split("-");
  return ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"][parseInt(mo) - 1] + " " + y;
}
function prevMonth(m) {
  const [y, mo] = m.split("-").map(Number);
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
}
function nextMonth(m) {
  const [y, mo] = m.split("-").map(Number);
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
}
function getWalletBalance(wallet, transactions) {
  let bal = Number(wallet.initialBalance || 0);
  for (const t of transactions) {
    if (t.walletId === wallet.id) {
      if (t.type === "income") bal += Number(t.amount || 0);
      else bal -= Number(t.amount || 0);
    }
    if (t.toWalletId === wallet.id && t.type === "transfer") bal += Number(t.amount || 0);
  }
  return bal;
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
function parseNum(v) { return parseFloat(String(v || "0").replace(/[^\d.]/g, "")) || 0; }

// Dynamic Pulse cost: based on number of parsed items (transactions / assets)
const calcPulseCost = (count) => count > 50 ? 3 : count > 20 ? 2 : 1;

const TX_INCOME_CATS = ["Gaji/Salary","Bonus","Freelance","Passive Income","Penjualan","Transfer Masuk","Lainnya"];
const TX_EXPENSE_CATS = ["Makan & Minum","Transportasi","Belanja","Tagihan & Utilitas","Hiburan","Kesehatan","Pendidikan","Perawatan Diri","Lainnya"];
const BUDGET_CATS = ["Makan & Minum","Transportasi","Belanja","Tagihan & Utilitas","Hiburan","Kesehatan","Pendidikan","Perawatan Diri","Lainnya"];
const CAT_ICONS = {
  // Kebutuhan
  "Makan & Minum":"🍜","Transportasi":"🚗","Tagihan & Utilitas":"💡","Kesehatan":"❤️","Pendidikan":"📚",
  "Belanja Dapur":"🛒","Anak & Keluarga":"👶","Sewa / KPR":"🏠","Internet & Phone":"📶",
  "Listrik & Air":"⚡","Kebutuhan Lainnya":"📦",
  // Keinginan
  "Hiburan":"🎬","Belanja":"🛍️","Perawatan Diri":"✨","Makan di Luar":"🍽️","Liburan":"✈️",
  "Hobi & Game":"🎮","Langganan (Netflix dll)":"📺","Keinginan Lainnya":"🌟",
  // Tabungan
  "Dana Darurat":"🛡️","Investasi Saham/Reksa":"📈","Cicilan Aset":"🏡","Asuransi":"☂️",
  "Tabungan Tujuan":"🎯","Tabungan Lainnya":"💰",
  // Income
  "Gaji/Salary":"💼","Bonus":"🎁","Freelance":"💻","Passive Income":"📊","Penjualan":"🏷️","Transfer Masuk":"↩️",
  "Bayar Hutang":"💳","Transfer":"↔️","Lainnya":"📦",
};
const WALLET_ICONS = ["🏦","📱","💵","👛","💳","💰","🏧","💼"];
const WALLET_COLORS = ["#5b9cf6","#3ecf8e","#f59e0b","#9b7ef8","#f26b6b","#34d399","#60a5fa","#fb923c"];

// ─── Shared UI primitives ────────────────────────────────────────────────────
function Btn({ T, children, onClick, variant = "ghost", style = {}, disabled = false }) {
  const base = {
    padding: "9px 16px", borderRadius: 9, cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 12, fontWeight: 600, border: "none", transition: "opacity .15s",
    opacity: disabled ? 0.5 : 1, ...style,
  };
  if (variant === "primary") return <button onClick={onClick} disabled={disabled} style={{ ...base, background: T.accent, color: "#000" }}>{children}</button>;
  if (variant === "danger")  return <button onClick={onClick} disabled={disabled} style={{ ...base, background: "#f26b6b22", color: "#f26b6b", border: "1px solid #f26b6b44" }}>{children}</button>;
  return <button onClick={onClick} disabled={disabled} style={{ ...base, background: T.accentDim, color: T.accent, border: `1px solid ${T.accent}44` }}>{children}</button>;
}
function Inp({ T, value, onChange, placeholder, type = "text", style = {} }) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 9, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, outline: "none", ...style }}
    />
  );
}
function Sel({ T, value, onChange, children, style = {} }) {
  return (
    <select value={value} onChange={onChange} style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, outline: "none", ...style }}>
      {children}
    </select>
  );
}
function Card({ T, children, style = {} }) {
  return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px", ...style }}>{children}</div>;
}
function SectionTitle({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#888", marginBottom: 12 }}>{children}</div>;
}

// ─── Placeholder for BudgetScene helper ────────────────────────────────────────────────────────────
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
const DANA_WALLET_TYPES   = ["Bank", "E-Wallet", "Tunai"];
const KREDIT_WALLET_TYPES = ["Paylater", "Kartu Kredit", "Rekening Koran"];
// CREDIT_WALLET_TYPES kept for creditSync.js backward compat (Rekening Koran excluded —
// it maps to WP "krek" debt type via WALLET_TYPE_DEBT_KEY extension below)
const CREDIT_WALLET_TYPES = ["Paylater", "Kartu Kredit", "Rekening Koran"];
const WALLET_TYPE_DEBT_KEY = { "Paylater": "paylater", "Kartu Kredit": "cc", "Rekening Koran": "krek" };
const EMPTY_WALLET_FORM = { name: "", type: "Bank", icon: "🏦", color: "#5b9cf6", initialBalance: "", debtId: "", limit: "" };

function WalletScene({ T, wallets, setWallets, transactions, assets, debts = [], setDebts = () => {}, isPro, isProPlus }) {
  // Per-category limits: Free 3 Dana + 2 Kredit, Pro 7 + 7, Pro+ unlimited
  const maxDana    = isProPlus ? Infinity : isPro ? 7 : 3;
  const maxKredit  = isProPlus ? Infinity : isPro ? 7 : 2;
  const maxDebts   = isProPlus ? Infinity : isPro ? 15 : 5;
  const danaCount   = wallets.filter(w => DANA_WALLET_TYPES.includes(w.type)).length;
  const kreditCount = wallets.filter(w => KREDIT_WALLET_TYPES.includes(w.type)).length;
  const atDanaLimit   = danaCount >= maxDana;
  const atKreditLimit = kreditCount >= maxKredit;
  const atDebtLimit   = debts.length >= maxDebts;

  // "dana" | "kredit" | null — which section's add-form is open
  const [showFormFor, setShowFormFor] = useState(null);
  const [form, setForm] = useState(EMPTY_WALLET_FORM);
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openForm = (section) => {
    const defaultType = section === "kredit" ? "Paylater" : "Bank";
    setForm({ ...EMPTY_WALLET_FORM, type: defaultType });
    setShowFormFor(section);
  };
  const closeForm = () => { setShowFormFor(null); setForm(EMPTY_WALLET_FORM); };

  const cashAssets    = (assets || []).filter(a => a.classKey === "cash");
  // Any wallet type not in KREDIT_WALLET_TYPES is treated as Dana (incl. "Lainnya")
  const danaWallets   = wallets.filter(w => !KREDIT_WALLET_TYPES.includes(w.type));
  const kreditWallets = wallets.filter(w =>  KREDIT_WALLET_TYPES.includes(w.type));
  const totalDanaBalance = danaWallets.reduce((s, w) => s + getWalletBalance(w, transactions), 0);

  const isCredit = CREDIT_WALLET_TYPES.includes(form.type);

  // Revolving debts relevant to the selected credit wallet type
  const revolvingDebts = (debts || []).filter(d => {
    const key = WALLET_TYPE_DEBT_KEY[form.type];
    return key && d.type === key;
  });

  // Reset credit fields when type changes
  const handleTypeChange = (v) => setForm(p => ({ ...p, type: v, debtId: "", limit: "", initialBalance: "" }));

  const canSave = form.name.trim() &&
    (!isCredit || form.debtId) &&
    (form.debtId !== "new" || (parseNum(form.limit) > 0 && !atDebtLimit));

  const save = () => {
    if (!canSave) return;

    let debtId = form.debtId;
    let creditLimit = 0;

    if (isCredit) {
      if (form.debtId === "new") {
        const newDebt = {
          id: genId(),
          name: form.name.trim(),
          type: WALLET_TYPE_DEBT_KEY[form.type],
          category: "konsumtif",
          outstanding: "0",
          limit: parseNum(form.limit),
          interestRate: form.type === "Paylater" ? "24" : "27",
          inputMode: "B",
          tenorMonths: "12",
          monthlyPayment: "0",
          createdAt: new Date().toISOString(),
        };
        setDebts(prev => [...prev, newDebt]);
        debtId = newDebt.id;
        creditLimit = newDebt.limit;
      } else {
        const linked = debts.find(d => d.id === form.debtId);
        creditLimit = linked?.limit || parseNum(linked?.outstanding || "0");
      }
    }

    setWallets(prev => [...prev, {
      id: genId(),
      name: form.name.trim(),
      type: form.type,
      icon: form.icon,
      color: form.color,
      initialBalance: isCredit ? 0 : parseNum(form.initialBalance),
      ...(isCredit && { debtId, limit: creditLimit }),
      createdAt: new Date().toISOString(),
    }]);
    closeForm();
  };

  // Reusable wallet card renderer
  const renderWalletCard = (w) => {
    const bal      = getWalletBalance(w, transactions);
    const txCount  = transactions.filter(t => t.walletId === w.id || t.toWalletId === w.id).length;
    const isWCredit = KREDIT_WALLET_TYPES.includes(w.type);
    const used     = isWCredit ? Math.abs(bal) : 0;
    const lim      = isWCredit ? (w.limit || 0) : 0;
    const avail    = isWCredit ? Math.max(0, lim - used) : 0;
    const usePct   = lim > 0 ? Math.min(100, (used / lim) * 100) : 0;
    const barColor = usePct >= 90 ? "#f26b6b" : usePct >= 70 ? "#f59e0b" : "#3ecf8e";
    return (
      <Card T={T} key={w.id} style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: w.color + "22", border: `1.5px solid ${w.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            {w.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{w.name}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{w.type} · {txCount} transaksi</div>
          </div>
          <div style={{ textAlign: "right" }}>
            {isWCredit ? (
              <>
                <div style={{ fontSize: 11, color: T.muted }}>Tersedia</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: avail > 0 ? T.green : T.red }}>{fmtRp(avail)}</div>
              </>
            ) : (
              <div style={{ fontWeight: 700, fontSize: 15, color: bal >= 0 ? T.green : T.red }}>
                {bal < 0 && <span style={{ fontSize: 12 }}>−</span>}{fmtRp(Math.abs(bal))}
              </div>
            )}
            <button
              onClick={() => { if (window.confirm(`Hapus wallet "${w.name}"?`)) setWallets(prev => prev.filter(x => x.id !== w.id)); }}
              style={{ fontSize: 10, color: T.muted, background: "none", border: "none", cursor: "pointer", marginTop: 4, padding: "2px 6px" }}
            >🗑 hapus</button>
          </div>
        </div>
        {isWCredit && lim > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ height: 5, background: T.border, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: usePct + "%", background: barColor, borderRadius: 4, transition: "width .3s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: T.muted }}>
              <span style={{ color: barColor }}>Terpakai {fmtRp(used)}</span>
              <span>Limit {fmtRp(lim)}</span>
            </div>
          </div>
        )}
      </Card>
    );
  };

  // Reusable add-wallet form (shown inline inside each section)
  const renderAddForm = (section) => {
    const isDanaForm   = section === "dana";
    const typeOptions  = isDanaForm
      ? ["Bank", "E-Wallet", "Tunai", "Lainnya"]
      : (isPro || isProPlus)
          ? ["Paylater", "Kartu Kredit", "Rekening Koran"]
          : ["Paylater", "Kartu Kredit"];
    return (
      <Card T={T} style={{ marginBottom: 10, border: `1px solid ${isDanaForm ? T.accent : "#f59e0b"}44` }}>
        <SectionTitle>Tambah {isDanaForm ? "Akun Dana" : "Akun Kredit"}</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Inp T={T} value={form.name} onChange={e => setF("name", e.target.value)} placeholder={`Nama (cth: ${isDanaForm ? "BCA Utama" : "CC BCA"})`} />
          <Sel T={T} value={form.type} onChange={e => handleTypeChange(e.target.value)}>
            {typeOptions.map(t => <option key={t}>{t}</option>)}
          </Sel>
          {isCredit && (
            <div style={{ background: T.surface, borderRadius: 10, padding: "12px 14px", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>💳 Hubungkan dengan hutang revolving di Wealth Kompas</div>
              <Sel T={T} value={form.debtId} onChange={e => setF("debtId", e.target.value)}>
                <option value="">— Pilih hutang —</option>
                {revolvingDebts.map(d => (
                  <option key={d.id} value={d.id}>{d.name || form.type} · {d.limit ? "Limit " + fmtRp(d.limit) : fmtRp(d.outstanding || 0)}</option>
                ))}
                <option value="new">+ Tambah hutang baru</option>
              </Sel>
              {form.debtId === "new" && (
                <div style={{ marginTop: 10 }}>
                  {atDebtLimit ? (
                    <div style={{ padding: "10px 12px", background: T.red + "22", border: `1px solid ${T.red}44`, borderRadius: 8, fontSize: 12, color: T.red }}>
                      ⛔ Batas {maxDebts} hutang tercapai.{!isProPlus && <span style={{ color: T.accent }}> Upgrade untuk menambah.</span>}
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Plafon / Limit ({form.type})</div>
                      <Inp T={T} type="number" value={form.limit} onChange={e => setF("limit", e.target.value)}
                        placeholder={`Limit kredit (cth: ${form.type === "Paylater" ? "3.000.000" : "10.000.000"})`} />
                      <div style={{ fontSize: 10, color: T.muted, marginTop: 5 }}>
                        Hutang {form.type} dibuat otomatis di Wealth Kompas
                      </div>
                    </>
                  )}
                </div>
              )}
              {form.debtId && form.debtId !== "new" && (() => {
                const d = debts.find(x => x.id === form.debtId);
                return d ? <div style={{ marginTop: 8, fontSize: 11, color: T.muted }}>✅ Linked · {d.limit ? `Limit ${fmtRp(d.limit)}` : ""}</div> : null;
              })()}
            </div>
          )}
          {!isCredit && (
            <Inp T={T} value={form.initialBalance} onChange={e => setF("initialBalance", e.target.value)} placeholder="Saldo awal (contoh: 5000000)" type="number" />
          )}
          <div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Ikon</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {WALLET_ICONS.map(ic => <button key={ic} onClick={() => setF("icon", ic)} style={{ fontSize: 20, padding: "6px 8px", borderRadius: 8, border: `2px solid ${form.icon === ic ? T.accent : T.border}`, background: form.icon === ic ? T.accentDim : T.surface, cursor: "pointer" }}>{ic}</button>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Warna</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {WALLET_COLORS.map(c => <button key={c} onClick={() => setF("color", c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: `3px solid ${form.color === c ? T.text : "transparent"}`, cursor: "pointer" }} />)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <Btn T={T} variant="primary" onClick={save} disabled={!canSave} style={{ flex: 1, opacity: canSave ? 1 : 0.5 }}>Simpan</Btn>
            <Btn T={T} onClick={closeForm} style={{ flex: 1 }}>Batal</Btn>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
      <FeaturePopup T={T} featureKey="aj_wallet" icon="🏦" title="Kelola Wallet Anda"
        content="Di halaman ini Anda dapat mengatur Akun Dana (Bank, E-Wallet, Tunai) dan Akun Kredit (Kartu Kredit, Paylater). Setiap transaksi terhubung ke wallet untuk akurasi pencatatan." />
      {/* Header summary — Akun Dana balance */}
      <Card T={T} style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Total Saldo Akun Dana</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: totalDanaBalance >= 0 ? T.green : T.red }}>
            {totalDanaBalance < 0 && <span style={{ fontSize: 14, marginRight: 2 }}>−</span>}
            {fmtRp(Math.abs(totalDanaBalance))}
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: T.muted, lineHeight: 1.8 }}>
          <div>🏦 {danaCount}/{maxDana === Infinity ? "∞" : maxDana} Dana</div>
          <div>💳 {kreditCount}/{maxKredit === Infinity ? "∞" : maxKredit} Kredit</div>
        </div>
      </Card>

      {/* ── Akun Dana Section ──────────────────────────── */}
      <div style={{ borderLeft: `3px solid ${T.accent}`, paddingLeft: 10, marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>🏦 Akun Dana</div>
        <div style={{ fontSize: 11, color: T.muted }}>Tunai · Bank · E-Wallet · Transfer antar akun dana</div>
      </div>
      {danaWallets.length === 0 && showFormFor !== "dana" && (
        <div style={{ textAlign: "center", padding: "16px", fontSize: 12, color: T.muted, marginBottom: 8 }}>
          Belum ada Akun Dana — tambahkan untuk mulai mencatat transaksi.
        </div>
      )}
      {danaWallets.map(renderWalletCard)}
      {showFormFor === "dana" ? renderAddForm("dana") : (
        <button
          onClick={() => { if (!atDanaLimit) openForm("dana"); }}
          disabled={atDanaLimit}
          style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1px dashed ${atDanaLimit ? T.border : T.accent}`, background: "transparent", color: atDanaLimit ? T.muted : T.accent, cursor: atDanaLimit ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600, marginBottom: 16 }}
        >
          {atDanaLimit ? `Batas ${maxDana} Akun Dana (upgrade untuk lebih)` : "+ Tambah Akun Dana"}
        </button>
      )}

      {/* ── Akun Kredit Section ────────────────────────── */}
      <div style={{ borderLeft: "3px solid #f59e0b", paddingLeft: 10, marginBottom: 6, marginTop: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>💳 Akun Kredit</div>
        <div style={{ fontSize: 11, color: T.muted }}>Paylater · Kartu Kredit{(isPro || isProPlus) ? " · Rekening Koran" : ""} · Wajib link ke Hutang di Wealth Kompas</div>
      </div>
      {kreditWallets.length === 0 && showFormFor !== "kredit" && (
        <div style={{ textAlign: "center", padding: "16px", fontSize: 12, color: T.muted, marginBottom: 8 }}>
          Belum ada Akun Kredit.
        </div>
      )}
      {kreditWallets.map(renderWalletCard)}
      {showFormFor === "kredit" ? renderAddForm("kredit") : (
        <button
          onClick={() => { if (!atKreditLimit) openForm("kredit"); }}
          disabled={atKreditLimit}
          style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1px dashed ${atKreditLimit ? T.border : "#f59e0b"}`, background: "transparent", color: atKreditLimit ? T.muted : "#f59e0b", cursor: atKreditLimit ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600, marginBottom: 16 }}
        >
          {atKreditLimit ? `Batas ${maxKredit} Akun Kredit (upgrade untuk lebih)` : "+ Tambah Akun Kredit"}
        </button>
      )}

      {/* WealthPulse cash assets reference */}
      {cashAssets.length > 0 && (
        <Card T={T} style={{ marginBottom: 16 }}>
          <SectionTitle>Aset Tunai dari WealthPulse (referensi)</SectionTitle>
          {cashAssets.map(a => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, color: T.textSoft }}>{a.name || "Dana Tunai"}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>
                {fmtRp(a.valueIDR || (a.value * (a.currency === "IDR" ? 1 : 17000)) || 0)}
              </span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: T.muted, marginTop: 8 }}>Data dari WealthPulse · bukan bagian dari Wallet AJ</div>
        </Card>
      )}
    </div>
  );
}

// ─── CategoryPicker ───────────────────────────────────────────────────────────
function CategoryPicker({ T, value, onChange, type = "expense" }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const areas = Object.entries(AREA_DEFS).map(([key, def]) => ({
    key, label: def.label, icon: def.icon, color: def.color,
    cats: def.cats.filter(c => !c.endsWith("Lainnya")),
  }));

  const displayLabel = value ? `${CAT_ICONS[value] || "📦"} ${value}` : "Pilih kategori...";

  const matchesSearch = (c) => !search || c.toLowerCase().includes(search.toLowerCase());

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen(o => !o); setSearch(""); }}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: `1px solid ${open ? T.accent : T.border}`, background: T.surface, color: value ? T.text : T.muted, textAlign: "left", cursor: "pointer", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box" }}
      >
        <span>{displayLabel}</span>
        <span style={{ fontSize: 10, color: T.muted }}>▾</span>
      </button>

      {open && (
        <div style={{ position: "absolute", zIndex: 200, top: "calc(100% + 4px)", left: 0, right: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, maxHeight: 300, overflowY: "auto", boxShadow: "0 8px 32px #0008" }}>
          {/* Search bar */}
          <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, background: T.card, zIndex: 1 }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Cari kategori..." autoFocus
              style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.accent}`, background: T.surface, color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {type === "income" ? (
            TX_INCOME_CATS.filter(matchesSearch).map(cat => (
              <button key={cat} onClick={() => { onChange(cat); setOpen(false); }}
                style={{ width: "100%", padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, background: value === cat ? T.accentDim : "transparent", border: "none", borderBottom: `1px solid ${T.border}44`, color: T.text, cursor: "pointer", fontSize: 13, textAlign: "left" }}>
                <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{CAT_ICONS[cat] || "💰"}</span>
                <span style={{ flex: 1 }}>{cat}</span>
                {value === cat && <span style={{ color: T.accent, fontSize: 14 }}>✓</span>}
              </button>
            ))
          ) : (
            areas.map(area => {
              const cats = area.cats.filter(matchesSearch);
              if (cats.length === 0) return null;
              return (
                <div key={area.key}>
                  <div style={{ padding: "7px 14px 6px", background: area.color + "30", fontSize: 10, fontWeight: 800, color: area.color, letterSpacing: 1.5, textTransform: "uppercase", position: "sticky", top: 45, zIndex: 1 }}>
                    {area.icon} {area.label}
                  </div>
                  {cats.map(cat => (
                    <button key={cat} onClick={() => { onChange(cat); setOpen(false); }}
                      style={{ width: "100%", padding: "10px 14px 10px 20px", display: "flex", alignItems: "center", gap: 10, background: value === cat ? T.accentDim : "transparent", border: "none", borderBottom: `1px solid ${T.border}33`, color: T.text, cursor: "pointer", fontSize: 13, textAlign: "left" }}>
                      <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{CAT_ICONS[cat] || "📦"}</span>
                      <span style={{ flex: 1 }}>{cat}</span>
                      {value === cat && <span style={{ color: T.accent, fontSize: 14 }}>✓</span>}
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
      {/* Overlay to close */}
      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />}
    </div>
  );
}

// ─── Budget Scene ─────────────────────────────────────────────────────────────
const AREA_DEFS = {
  kebutuhan: {
    label: "Kebutuhan", icon: "🏠", color: "#5b9cf6", recommended: 50,
    desc: "Pengeluaran wajib & primer",
    cats: ["Makan & Minum","Belanja Dapur","Transportasi","Tagihan & Utilitas","Listrik & Air","Internet & Phone","Kesehatan","Pendidikan","Anak & Keluarga","Sewa / KPR","Kebutuhan Lainnya"],
  },
  keinginan: {
    label: "Keinginan", icon: "🛍️", color: "#f59e0b", recommended: 30,
    desc: "Lifestyle & kenyamanan",
    cats: ["Makan di Luar","Hiburan","Belanja","Perawatan Diri","Liburan","Hobi & Game","Langganan (Netflix dll)","Keinginan Lainnya"],
  },
  tabungan: {
    label: "Tabungan & Investasi", icon: "💰", color: "#3ecf8e", recommended: 20,
    desc: "Aset masa depan",
    cats: ["Dana Darurat","Investasi Saham/Reksa","Cicilan Aset","Asuransi","Tabungan Tujuan","Tabungan Lainnya"],
  },
};

const CAT_AREA_MAP = {};
Object.entries(AREA_DEFS).forEach(([area, def]) => def.cats.forEach(c => { CAT_AREA_MAP[c] = area; }));
function inferArea(cat) {
  return CAT_AREA_MAP[cat] || "kebutuhan";
}
function isLainnya(cat) { return cat?.endsWith("Lainnya"); }

// Budget card extracted as component to fix useState-in-map
function BudgetCard({ T, b, spent, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(b.limit));
  const pct = b.limit > 0 ? Math.min((spent / b.limit) * 100, 100) : 0;
  const barColor = pct > 90 ? T.red : pct > 60 ? T.orange : T.green;
  return (
    <div style={{ padding: "12px 14px", background: T.surface, borderRadius: 10, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 16 }}>{CAT_ICONS[b.category] || "📦"}</span>
          <span style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{b.category}</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {editing ? (
            <>
              <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
                style={{ width: 90, padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.accent}`, background: T.surface, color: T.text, fontSize: 12 }} />
              <button onClick={() => { onEdit(b.id, editVal); setEditing(false); }}
                style={{ fontSize: 14, color: T.green, background: "none", border: "none", cursor: "pointer" }}>✓</button>
              <button onClick={() => setEditing(false)}
                style={{ fontSize: 12, color: T.muted, background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </>
          ) : (
            <button onClick={() => { setEditing(true); setEditVal(String(b.limit)); }}
              style={{ fontSize: 11, color: T.muted, background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>
              ✏️ {fmtRp(b.limit)}
            </button>
          )}
          <button onClick={() => onDelete(b.id)}
            style={{ fontSize: 11, color: T.muted, background: "none", border: "none", cursor: "pointer", padding: "3px 4px" }}>🗑</button>
        </div>
      </div>
      <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden", marginBottom: 5 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3, transition: "width .3s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <span style={{ color: barColor }}>{fmtRp(spent)} terpakai</span>
        <span style={{ color: T.muted }}>{pct.toFixed(0)}% dari {fmtRp(b.limit)}</span>
      </div>
    </div>
  );
}

const FREQ_MULT_BG = { monthly: 12, quarterly: 4, annually: 1, semiannual: 2, weekly: 52, daily: 365 };

function BudgetScene({ T, budgets, setBudgets, transactions, assets, activeIncomes, monthlyFixedIncome }) {
  const [viewMonth, setViewMonth] = useState(getMonth());
  const [showAddArea, setShowAddArea] = useState(null); // "kebutuhan"|"keinginan"|"tabungan"|null
  const [newCat, setNewCat] = useState("");
  const [customCat, setCustomCat] = useState("");
  const [newLim, setNewLim] = useState("");

  const monthBudgets = budgets.filter(b => b.month === viewMonth);
  const usedCats = new Set(monthBudgets.map(b => b.category));

  // Income from WealthPulse
  const passiveMonthly = (assets || [])
    .filter(a => a.income?.amount > 0 && !(a.classKey === "business" && a.incomeType === "active"))
    .reduce((s, a) => s + a.income.amount * (FREQ_MULT_BG[a.income.frequency] || 12) / 12, 0);
  const activeMonthly = (activeIncomes || []).reduce((s, a) => s + (a.amount || 0), 0);
  const fixedMonthly = parseNum(monthlyFixedIncome || "0");
  const totalActiveIncome = activeMonthly + fixedMonthly;
  const totalIncome = passiveMonthly + totalActiveIncome;

  // Spending & limits per category — debt_payment excluded (not a real expense)
  const getSpent = (cat) =>
    transactions
      .filter(t => t.type === "expense" && getMonth(t.date) === viewMonth && t.category === cat)
      .reduce((s, t) => s + Number(t.amount || 0), 0);

  const totalBudget = monthBudgets.reduce((s, b) => s + Number(b.limit || 0), 0);
  const totalSpent  = monthBudgets.reduce((s, b) => s + getSpent(b.category), 0);
  const budgetPct   = totalIncome > 0 ? Math.round((totalBudget / totalIncome) * 100) : 0;
  const surplus     = totalIncome - totalBudget;

  const addBudget = () => {
    const finalCat = isLainnya(newCat) ? (customCat.trim() || newCat) : newCat;
    if (!finalCat || !newLim) return;
    setBudgets(prev => [...prev, {
      id: genId(), category: finalCat, limit: parseNum(newLim),
      month: viewMonth, area: showAddArea,
    }]);
    setNewCat(""); setCustomCat(""); setNewLim(""); setShowAddArea(null);
  };

  const delBudget = (id) => setBudgets(prev => prev.filter(b => b.id !== id));
  const editBudgetLimit = (id, val) => setBudgets(prev => prev.map(b => b.id === id ? { ...b, limit: parseNum(val) } : b));

  const getBudgetsForArea = (area) => monthBudgets.filter(b => (b.area || inferArea(b.category)) === area);
  const getAreaTotal = (area) => getBudgetsForArea(area).reduce((s, b) => s + Number(b.limit || 0), 0);
  const getAreaSpent = (area) => getBudgetsForArea(area).reduce((s, b) => s + getSpent(b.category), 0);

  // Available cats for an area (not yet added this month)
  const getAvailCats = (area) => AREA_DEFS[area].cats.filter(c => {
    if (isLainnya(c)) return true; // always allow Lainnya (custom)
    return !usedCats.has(c);
  });

  return (
    <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
      <FeaturePopup T={T} featureKey="aj_budget" icon="📊" title="Atur Budget Bulanan"
        content="Di halaman ini Anda dapat menetapkan batas pengeluaran per kategori setiap bulan. Budget otomatis terbuat saat Anda mencatat transaksi, dan progres terlihat secara real-time." />
      {/* Month picker */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <button onClick={() => setViewMonth(prevMonth(viewMonth))} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 14px", color: T.textSoft, cursor: "pointer", fontSize: 15 }}>‹</button>
        <div style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 14, color: T.text }}>{monthLabel(viewMonth)}</div>
        <button onClick={() => setViewMonth(nextMonth(viewMonth))} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 14px", color: T.textSoft, cursor: "pointer", fontSize: 15 }}>›</button>
      </div>

      {/* Income summary from WealthPulse */}
      <Card T={T} style={{ marginBottom: 14 }}>
        <SectionTitle>Estimasi Pendapatan Bulanan (dari WealthPulse)</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div style={{ background: "#3ecf8e18", border: "1px solid #3ecf8e33", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#3ecf8e", fontWeight: 700, marginBottom: 4 }}>💰 Passive Income</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#3ecf8e" }}>{fmtRp(passiveMonthly)}</div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
              {(assets || []).filter(a => a.income?.amount > 0).length} aset menghasilkan
            </div>
          </div>
          <div style={{ background: "#f59e0b18", border: "1px solid #f59e0b33", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, marginBottom: 4 }}>💼 Active Income</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#f59e0b" }}>{fmtRp(totalActiveIncome)}</div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
              {(activeIncomes || []).length} sumber aktif{fixedMonthly > 0 ? " + gaji tetap" : ""}
            </div>
          </div>
        </div>
        <div style={{ padding: "10px 12px", background: T.surface, borderRadius: 9, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: T.textSoft }}>Total Income / bln</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{fmtRp(totalIncome)}</span>
        </div>
      </Card>

      {/* Budget vs income insight */}
      {totalIncome > 0 && (
        <Card T={T} style={{ marginBottom: 14, border: `1px solid ${surplus >= 0 ? T.green + "44" : T.red + "44"}`, background: surplus >= 0 ? T.green + "08" : T.red + "08" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Alokasi Budget</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: surplus >= 0 ? T.green : T.red }}>{budgetPct}% dari income</span>
          </div>
          <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", width: `${Math.min(budgetPct, 100)}%`, background: surplus >= 0 ? T.green : T.red, borderRadius: 4 }} />
          </div>
          {surplus >= 0 ? (
            <div style={{ fontSize: 12, color: T.green, lineHeight: 1.6 }}>
              ✅ <strong>Pertahankan!</strong> Sisa <strong>{fmtRp(surplus)}/bln</strong> dapat dialokasikan untuk menambah aset pasif — reksa dana, saham dividen, atau properti.
            </div>
          ) : (
            <div style={{ fontSize: 12, color: T.red, lineHeight: 1.6 }}>
              ⚠️ Budget melebihi income sebesar <strong>{fmtRp(Math.abs(surplus))}/bln</strong>. Perlu mengurangi anggaran atau menambah sumber pendapatan.
            </div>
          )}
        </Card>
      )}

      {/* Overall summary */}
      {monthBudgets.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[["Budget", totalBudget, T.accent], ["Terpakai", totalSpent, totalSpent > totalBudget ? T.red : T.green], ["Sisa Budget", totalBudget - totalSpent, totalBudget - totalSpent >= 0 ? T.green : T.red]].map(([l, v, c]) => (
            <div key={l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: T.muted, marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{fmtRp(v)}</div>
            </div>
          ))}
        </div>
      )}

      {/* 3 Area sections */}
      {Object.entries(AREA_DEFS).map(([areaKey, areaDef]) => {
        const areaBudgets = getBudgetsForArea(areaKey);
        const areaTotal   = getAreaTotal(areaKey);
        const areaSpent   = getAreaSpent(areaKey);
        const isOpen = showAddArea === areaKey;
        const availCats = getAvailCats(areaKey);

        return (
          <Card T={T} key={areaKey} style={{ marginBottom: 14, borderTop: `3px solid ${areaDef.color}` }}>
            {/* Area header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>
                  {areaDef.icon} {areaDef.label}
                  <span style={{ fontSize: 10, color: areaDef.color, fontWeight: 400, marginLeft: 8 }}>50/30/20 rec: {areaDef.recommended}%</span>
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{areaDef.desc}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: areaDef.color }}>{fmtRp(areaTotal)}</div>
                {totalIncome > 0 && <div style={{ fontSize: 9, color: T.muted }}>{Math.round((areaTotal / totalIncome) * 100)}% income</div>}
              </div>
            </div>

            {/* Budget entries for this area */}
            {areaBudgets.length === 0 && !isOpen && (
              <div style={{ padding: "12px 0", textAlign: "center", fontSize: 12, color: T.muted, borderBottom: `1px dashed ${T.border}`, marginBottom: 10 }}>
                Belum ada anggaran untuk area ini
              </div>
            )}
            {areaBudgets.map(b => (
              <BudgetCard key={b.id} T={T} b={b} spent={getSpent(b.category)} onDelete={delBudget} onEdit={editBudgetLimit} />
            ))}

            {/* Area total spent bar */}
            {areaBudgets.length > 0 && areaTotal > 0 && (
              <div style={{ marginTop: 4, marginBottom: 10 }}>
                <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min((areaSpent / areaTotal) * 100, 100)}%`, background: areaDef.color, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 4, textAlign: "right" }}>{fmtRp(areaSpent)} terpakai dari {fmtRp(areaTotal)}</div>
              </div>
            )}

            {/* Add form (expanded inline) */}
            {isOpen ? (
              <div style={{ background: T.surface, borderRadius: 10, padding: "12px", border: `1px solid ${areaDef.color}44` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: areaDef.color, marginBottom: 8 }}>+ Tambah Anggaran {areaDef.label}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Sel T={T} value={newCat} onChange={e => { setNewCat(e.target.value); setCustomCat(""); }}>
                    <option value="">-- Pilih Kategori --</option>
                    {availCats.map(c => <option key={c} value={c}>{isLainnya(c) ? "✏️ Tulis Sendiri..." : c}</option>)}
                  </Sel>
                  {isLainnya(newCat) && (
                    <Inp T={T} value={customCat} onChange={e => setCustomCat(e.target.value)} placeholder="Nama kategori (cth: Rokok, Kopi, Gym...)" />
                  )}
                  <Inp T={T} type="number" value={newLim} onChange={e => setNewLim(e.target.value)} placeholder="Limit anggaran (Rp)" />
                  {totalIncome > 0 && newLim && (
                    <div style={{ fontSize: 11, color: T.muted }}>
                      = {Math.round((parseNum(newLim) / totalIncome) * 100)}% dari total income bulanan
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn T={T} variant="primary" onClick={addBudget} disabled={!newCat || !newLim || (isLainnya(newCat) && !customCat.trim())} style={{ flex: 1 }}>Simpan</Btn>
                    <Btn T={T} onClick={() => { setShowAddArea(null); setNewCat(""); setCustomCat(""); setNewLim(""); }} style={{ flex: 1 }}>Batal</Btn>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setShowAddArea(areaKey); setNewCat(""); setCustomCat(""); setNewLim(""); }}
                style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1px dashed ${areaDef.color}66`, background: "transparent", color: areaDef.color, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >
                + Tambah ke {areaDef.label}
              </button>
            )}
          </Card>
        );
      })}

      {/* 50/30/20 guide */}
      <Card T={T} style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <SectionTitle>Panduan Alokasi 50/30/20</SectionTitle>
        {Object.entries(AREA_DEFS).map(([k, a]) => {
          const actual = totalIncome > 0 ? Math.round((getAreaTotal(k) / totalIncome) * 100) : 0;
          const diff = actual - a.recommended;
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 16, width: 24 }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: T.textSoft }}>{a.label}</span>
                  <span style={{ color: Math.abs(diff) <= 5 ? T.green : T.orange, fontWeight: 600 }}>
                    {actual}% <span style={{ color: T.muted, fontWeight: 400 }}>/ rec {a.recommended}%</span>
                  </span>
                </div>
                <div style={{ height: 5, background: T.border, borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${Math.min(actual, 100)}%`, background: a.color, borderRadius: 3 }} />
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ fontSize: 11, color: T.muted, marginTop: 8, lineHeight: 1.6 }}>
          Metode 50/30/20: 50% Kebutuhan · 30% Keinginan · 20% Tabungan & Investasi
        </div>
      </Card>
    </div>
  );
}

// ─── Receipt Scanner (4-step flow) ────────────────────────────────────────────
function ReceiptScanner({ T, wallets, onDone, onClose, pulseCredits, setPulseCredits }) {
  const [step, setStep] = useState(1); // 1=upload, 2=scanning, 3=review, 4=assign
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanData, setScanData] = useState(null);
  const [items, setItems] = useState([]);
  const [walletId, setWalletId] = useState(wallets[0]?.id || "");
  const [error, setError] = useState("");
  const [pulseCost, setPulseCost] = useState(1); // determined after parsing

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const doScan = async () => {
    if (!file) return;
    if (pulseCredits < 1) { setError("Pulse tidak cukup. Beli Pulse untuk melanjutkan."); return; }
    setStep(2); setError("");

    const reader = new FileReader();
    reader.onerror = () => {
      setError("Gagal membaca file. Coba gunakan format JPG atau PNG.");
      setStep(1);
    };
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result.split(",")[1];
        const mimeType = file.type || "image/jpeg";
        const res = await fetch("/api/scan-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });
        if (!res.ok) {
          let msg = "Scan gagal (server error)";
          try { const body = await res.json(); msg = body.error || msg; } catch {}
          throw new Error(msg);
        }
        const data = await res.json();
        if (!data.items || data.items.length === 0) {
          throw new Error("Tidak ada item terdeteksi. Pastikan foto struk jelas, terang, dan tidak blur.");
        }
        setScanData(data);
        const parsed = (data.items || []).map((it, i) => ({
          id: String(i), name: it.name || "Item " + (i + 1),
          amount: Number(it.total || it.amount || 0), qty: Number(it.qty || 1),
          category: "", include: true,
        }));
        setItems(parsed);
        setPulseCost(calcPulseCost(parsed.length)); // determine cost now that we know count
        setStep(3);
      } catch (err) {
        setError("Scan gagal: " + (err.message || "Terjadi kesalahan. Coba lagi."));
        setStep(1);
      }
    };
    reader.readAsDataURL(file);
  };

  const setItem = (id, key, val) => setItems(prev => prev.map(it => it.id === id ? { ...it, [key]: val } : it));

  const finish = () => {
    if (pulseCredits < pulseCost) { setError(`Pulse tidak cukup. Dibutuhkan ${pulseCost} Pulse.`); return; }
    const txs = items.filter(i => i.include && i.amount > 0).map(i => ({
      id: genId(),
      date: scanData?.date || new Date().toISOString().slice(0, 10),
      type: "expense",
      category: i.category || "Makan & Minum",
      amount: Number(i.amount),
      walletId,
      description: i.name + (scanData?.storeName ? ` (${scanData.storeName})` : ""),
    }));
    setPulseCredits(prev => Math.max(0, prev - pulseCost));
    onDone(txs);
  };

  const totalSelected = items.filter(i => i.include).reduce((s, i) => s + Number(i.amount || 0), 0);
  const unassigned = items.filter(i => i.include && !i.category).length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#000a", display: "flex", alignItems: "flex-end" }}>
      <style>{`@keyframes wcPulse{0%,80%,100%{opacity:.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1.2)}}`}</style>
      <div style={{ width: "100%", maxHeight: "92vh", background: T.card, borderRadius: "20px 20px 0 0", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: T.card }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>📄 Scan Struk / Nota</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
              {step >= 3
                ? <span style={{ color: pulseCredits < pulseCost ? T.red : T.accent, fontWeight: 700 }}>⚡ {pulseCost} Pulse · sisa {pulseCredits}</span>
                : <span>⚡ 1–3 Pulse · sisa {pulseCredits} Pulse</span>
              }
            </div>
          </div>
          <button onClick={onClose} style={{ background: T.surface, border: "none", borderRadius: 20, padding: "6px 12px", color: T.textSoft, cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 0 }}>
          {["Upload","Scan AI","Review","Kategori"].map((s, i) => {
            const n = i + 1; const active = step === n; const done = step > n;
            return (
              <React.Fragment key={s}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? T.green : active ? T.accent : T.border, color: done || active ? "#000" : T.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: done ? 14 : 12, fontWeight: 700 }}>
                    {done ? "✓" : n}
                  </div>
                  <div style={{ fontSize: 9, color: active ? T.accent : T.muted, marginTop: 3, fontWeight: active ? 700 : 400 }}>{s}</div>
                </div>
                {i < 3 && <div style={{ height: 2, flex: 0.5, background: done ? T.green : T.border, marginBottom: 18 }} />}
              </React.Fragment>
            );
          })}
        </div>

        <div style={{ padding: "0 16px 32px" }}>
          {error && <div style={{ padding: "10px 14px", background: T.red + "20", border: `1px solid ${T.red}44`, borderRadius: 8, color: T.red, fontSize: 12, marginBottom: 12 }}>{error}</div>}

          {/* Step 1: Upload */}
          {step === 1 && (
            <div>
              {file ? (
                <div style={{ marginBottom: 14 }}>
                  {file.type === "application/pdf"
                    ? <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
                        <span style={{ fontSize: 32 }}>📄</span>
                        <div><div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{file.name}</div><div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>PDF · {(file.size/1024).toFixed(0)} KB</div></div>
                      </div>
                    : <img src={preview} alt="preview" style={{ width: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 10, border: `1px solid ${T.border}` }} />
                  }
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button onClick={() => { setFile(null); setPreview(null); }} style={{ flex: 1, padding: "9px", borderRadius: 9, border: `1px solid ${T.border}`, background: T.surface, color: T.textSoft, cursor: "pointer", fontSize: 12 }}>Ganti File</button>
                    <button onClick={doScan} disabled={pulseCredits < 1} style={{ flex: 2, padding: "9px", borderRadius: 9, border: "none", background: pulseCredits < 1 ? T.border : T.accent, color: pulseCredits < 1 ? T.muted : "#000", cursor: pulseCredits < 1 ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}>
                      ⚡ Scan Sekarang (1 Pulse)
                    </button>
                  </div>
                </div>
              ) : (
                <label style={{ display: "block", padding: "36px 20px", border: `2px dashed ${T.accent}66`, borderRadius: 14, textAlign: "center", cursor: "pointer", background: T.accentDim + "40" }}>
                  <input type="file" accept="image/*,.pdf,application/pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                  <div style={{ fontSize: 48, marginBottom: 10 }}>📸</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 6 }}>Foto atau PDF Struk / Nota</div>
                  <div style={{ fontSize: 12, color: T.muted }}>Tap untuk pilih file dari galeri atau file manager</div>
                  <div style={{ marginTop: 10, fontSize: 11, color: T.accent }}>Format: JPG, PNG, WebP, PDF</div>
                </label>
              )}
              {/* Wallet selector */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Dari Wallet</div>
                <Sel T={T} value={walletId} onChange={e => setWalletId(e.target.value)}>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
                </Sel>
              </div>
            </div>
          )}

          {/* Step 2: Scanning */}
          {step === 2 && (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>🤖</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 8 }}>AI sedang membaca struk...</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>Mendeteksi nama toko, tanggal, dan daftar item</div>
              {/* Loading dots */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: "50%", background: T.accent,
                    animation: `wcPulse 1.2s ${i * 0.4}s ease-in-out infinite`,
                  }} />
                ))}
              </div>
              {/* Warning: don't close */}
              <div style={{ padding: "12px 16px", background: T.orange + "22", border: `1px solid ${T.orange}55`, borderRadius: 10, fontSize: 12, color: T.orange, lineHeight: 1.5 }}>
                ⚠️ <strong>Jangan tutup atau refresh browser</strong>
                <br />Proses sedang berjalan, harap tunggu sebentar...
              </div>
            </div>
          )}

          {/* Step 3: Review items */}
          {step === 3 && scanData && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <div style={{ flex: 1, background: T.surface, borderRadius: 9, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: T.muted }}>Toko</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginTop: 2 }}>{scanData.storeName || "—"}</div>
                </div>
                <div style={{ flex: 1, background: T.surface, borderRadius: 9, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: T.muted }}>Tanggal</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginTop: 2 }}>{scanData.date || "—"}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Item ({items.length})</div>
              {items.map(it => (
                <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${T.border}44` }}>
                  <input type="checkbox" checked={it.include} onChange={e => setItem(it.id, "include", e.target.checked)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <input value={it.name} onChange={e => setItem(it.id, "name", e.target.value)}
                    style={{ flex: 2, padding: "5px 8px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 12, outline: "none" }} />
                  <input type="number" value={it.amount} onChange={e => setItem(it.id, "amount", e.target.value)}
                    style={{ width: 90, padding: "5px 8px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 12, outline: "none", textAlign: "right" }} />
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontWeight: 700, fontSize: 13 }}>
                <span style={{ color: T.textSoft }}>Total ({items.filter(i=>i.include).length} item)</span>
                <span style={{ color: T.accent }}>{fmtRp(totalSelected)}</span>
              </div>
              <Btn T={T} variant="primary" onClick={() => setStep(4)} style={{ width: "100%", marginTop: 8 }}>Lanjut → Assign Kategori</Btn>
            </div>
          )}

          {/* Step 4: Assign categories */}
          {step === 4 && (
            <div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
                Pilih kategori untuk setiap item. {unassigned > 0 && <span style={{ color: T.orange }}>{unassigned} belum dikategorikan.</span>}
              </div>
              {items.filter(i => i.include).map(it => (
                <div key={it.id} style={{ marginBottom: 10, padding: "10px 12px", background: T.surface, borderRadius: 10, border: `1px solid ${it.category ? T.border : T.orange+"66"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{it.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>{fmtRp(it.amount)}</span>
                  </div>
                  <CategoryPicker T={T} value={it.category} onChange={v => setItem(it.id, "category", v)} type="expense" />
                </div>
              ))}
              <div style={{ marginTop: 14, padding: "12px 14px", background: T.accentDim, borderRadius: 10, display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: T.textSoft }}>Total transaksi</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.accent }}>{fmtRp(totalSelected)}</span>
              </div>
              <div style={{ padding: "8px 12px", background: pulseCredits < pulseCost ? T.red + "22" : T.surface, border: `1px solid ${pulseCredits < pulseCost ? T.red : T.border}`, borderRadius: 9, fontSize: 11, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: T.muted }}>Biaya analisis ({items.length} item)</span>
                <span style={{ fontWeight: 700, color: pulseCredits < pulseCost ? T.red : T.accent }}>⚡ {pulseCost} Pulse</span>
              </div>
              <Btn T={T} variant="primary" onClick={finish} disabled={pulseCredits < pulseCost} style={{ width: "100%", opacity: pulseCredits < pulseCost ? 0.5 : 1 }}>
                {pulseCredits < pulseCost ? `Pulse kurang (perlu ${pulseCost})` : `✅ Buat ${items.filter(i=>i.include).length} Transaksi`}
              </Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── E-Statement Scanner (3-stage CC flow) ────────────────────────────────────
// Stage 1: Upload + select CC wallet → AI extracts transactions
// Stage 2: Review/categorize — expenses get category, credit_entries get type
// Stage 3: Confirm → bulk save transactions
function EStatementScanner({ T, wallets, debts, onDone, onClose, pulseCredits, setPulseCredits }) {
  const ccWallets = wallets.filter(w => CREDIT_WALLET_TYPES.includes(w.type));
  const [step, setStep]       = useState(1);
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [walletId, setWalletId] = useState(ccWallets[0]?.id || "");
  const [txList, setTxList]   = useState([]); // [{id,name,amount,date,txType,category,classifiedAs,toWalletId}]
  const [error, setError]     = useState("");
  const [pulseCost, setPulseCost] = useState(1); // determined after parsing

  const setTx = (id, key, val) =>
    setTxList(prev => prev.map(t => t.id === id ? { ...t, [key]: val } : t));

  const doScan = async () => {
    if (!file || pulseCredits < 1) {
      if (pulseCredits < 1) setError("Pulse tidak cukup. Beli Pulse untuk melanjutkan.");
      return;
    }
    setStep(2);
    setError("");
    try {
      const reader = new FileReader();
      await new Promise((resolve, reject) => {
        reader.onload = resolve;
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64 = reader.result.split(",")[1];
      const mimeType = file.type || "image/jpeg";
      const res = await fetch("/api/scan-statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType, mode: "transactions" }),
      });
      if (!res.ok) {
        let msg = "Scan gagal (server error)";
        try { const b = await res.json(); msg = b.error || msg; } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      const raw = data.transactions || [];
      if (raw.length === 0) throw new Error("Tidak ada transaksi terdeteksi. Pastikan gambar e-statement jelas dan terbaca.");
      setPulseCost(calcPulseCost(raw.length)); // set dynamic cost before showing review
      setTxList(raw.map((t, i) => ({
        id: String(i),
        name: t.name || "Transaksi " + (i + 1),
        amount: Number(t.amount) || 0,
        date: t.date || new Date().toISOString().slice(0, 10),
        txType: t.txType || "expense",     // "expense" | "credit_entry"
        include: true,
        category: t.txType === "expense" ? "Belanja" : "",
        classifiedAs: "",   // for credit_entry: "income" | "debt_payment" | "transfer"
        toWalletId: "",
      })));
      setStep(3);
    } catch (err) {
      setError("Scan gagal: " + (err.message || "Terjadi kesalahan."));
      setStep(1);
    }
  };

  const finish = () => {
    if (pulseCredits < pulseCost) { setError(`Pulse tidak cukup. Dibutuhkan ${pulseCost} Pulse.`); return; }
    const wallet = wallets.find(w => w.id === walletId);
    const linked = wallet?.debtId ? debts?.find(d => d.id === wallet.debtId) : null;
    const txs = txList.filter(t => t.include && t.amount > 0).map(t => {
      if (t.txType === "expense") {
        return { id: genId(), date: t.date, type: "expense", category: t.category || "Belanja", amount: t.amount, walletId, description: t.name };
      }
      // credit_entry — user classified as income / debt_payment / transfer
      const ca = t.classifiedAs || "income";
      if (ca === "income") {
        return { id: genId(), date: t.date, type: "income", category: "Transfer Masuk", amount: t.amount, walletId, description: t.name };
      }
      if (ca === "debt_payment") {
        return { id: genId(), date: t.date, type: "debt_payment", category: linked?.name || "Bayar Hutang", amount: t.amount, walletId, debtId: linked?.id || "", description: t.name };
      }
      // transfer
      return { id: genId(), date: t.date, type: "transfer", category: "Transfer", amount: t.amount, walletId: t.toWalletId || walletId, toWalletId: walletId, description: t.name };
    });
    setPulseCredits(prev => Math.max(0, prev - pulseCost));
    onDone(txs);
  };

  const unclassified = txList.filter(t => t.include && t.txType === "credit_entry" && !t.classifiedAs).length;
  const totalIncluded = txList.filter(t => t.include).reduce((s, t) => s + t.amount, 0);

  const CREDIT_ENTRY_OPTS = [
    { v: "income",        l: "💰 Pemasukan",        sub: "Pembayaran masuk / refund" },
    { v: "debt_payment",  l: "💳 Bayar Hutang",      sub: "Cicilan / pelunasan" },
    { v: "transfer",      l: "↔️ Transfer Wallet",   sub: "Dana dari wallet lain" },
  ];

  const inp = { width: "100%", background: T.inputBg || T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 9, padding: "8px 10px", fontSize: 12, outline: "none", boxSizing: "border-box" };
  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" };
  const sheet   = { background: T.card, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", paddingBottom: 24 };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={sheet}>
        <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: T.card }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>📄 Upload E-Statement CC</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
              {step >= 3
                ? <span style={{ color: pulseCredits < pulseCost ? T.red : T.accent, fontWeight: 700 }}>⚡ {pulseCost} Pulse · sisa {pulseCredits}</span>
                : <span>⚡ 1–3 Pulse · sisa {pulseCredits} Pulse</span>
              }
            </div>
          </div>
          <button onClick={onClose} style={{ background: T.surface, border: "none", borderRadius: 20, padding: "6px 12px", color: T.textSoft, cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 0 }}>
          {["Upload","Scan AI","Klasifikasi"].map((s, i) => {
            const n = i + 1; const active = step === n; const done = step > n;
            return (
              <React.Fragment key={s}>
                {i > 0 && <div style={{ flex: 1, height: 2, background: done ? T.accent : T.border, margin: "0 4px" }} />}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: done ? T.accent : active ? T.accentDim : T.surface, border: `2px solid ${active || done ? T.accent : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: done ? "#000" : active ? T.accent : T.muted }}>
                    {done ? "✓" : n}
                  </div>
                  <span style={{ fontSize: 9, color: active ? T.accent : T.muted, whiteSpace: "nowrap" }}>{s}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div style={{ padding: "0 20px" }}>
          {error && <div style={{ padding: "10px 14px", background: T.red + "20", border: `1px solid ${T.red}44`, borderRadius: 8, color: T.red, fontSize: 12, marginBottom: 12 }}>{error}</div>}

          {/* Step 1: Upload */}
          {step === 1 && (
            <div>
              {ccWallets.length > 1 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: T.muted, fontSize: 10, marginBottom: 4 }}>Wallet Kartu Kredit</div>
                  <select value={walletId} onChange={e => setWalletId(e.target.value)} style={inp}>
                    {ccWallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              )}
              {!file ? (
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px", borderRadius: 12, border: `2px dashed ${T.accentSoft || T.accent + "55"}`, background: T.surface, cursor: "pointer", gap: 8 }}>
                  <span style={{ fontSize: 36 }}>📄</span>
                  <span style={{ color: T.accent, fontSize: 13, fontWeight: 700 }}>Pilih E-Statement</span>
                  <span style={{ color: T.muted, fontSize: 11 }}>JPG, PNG, WebP, PDF</span>
                  <input type="file" accept="image/*,.pdf,application/pdf" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); if (f.type !== "application/pdf") { const r = new FileReader(); r.onload = ev => setPreview(ev.target.result); r.readAsDataURL(f); } } }} />
                </label>
              ) : (
                <div>
                  {file.type === "application/pdf"
                    ? <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
                        <span style={{ fontSize: 32 }}>📄</span>
                        <div><div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{file.name}</div><div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>PDF · {(file.size/1024).toFixed(0)} KB</div></div>
                      </div>
                    : <img src={preview} alt="preview" style={{ width: "100%", borderRadius: 10, maxHeight: 200, objectFit: "contain", background: T.surface }} />
                  }
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button onClick={() => { setFile(null); setPreview(null); }} style={{ flex: 1, padding: "9px", borderRadius: 9, border: `1px solid ${T.border}`, background: T.surface, color: T.textSoft, cursor: "pointer", fontSize: 12 }}>Ganti</button>
                    <button onClick={doScan} disabled={pulseCredits < 1} style={{ flex: 2, padding: "9px", borderRadius: 9, border: "none", background: pulseCredits < 1 ? T.border : T.accent, color: pulseCredits < 1 ? T.muted : "#000", cursor: pulseCredits < 1 ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}>
                      ⚡ Scan (1 Pulse)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Scanning */}
          {step === 2 && (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>🤖</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 8 }}>AI membaca e-statement...</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>Mengekstrak daftar transaksi, nominal, dan tanggal</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: T.accent, animation: `wcPulse 1.2s ${i*0.4}s ease-in-out infinite` }} />)}
              </div>
              <div style={{ padding: "12px 16px", background: T.orange + "22", border: `1px solid ${T.orange}55`, borderRadius: 10, fontSize: 12, color: T.orange, lineHeight: 1.5 }}>
                ⚠️ <strong>Jangan tutup browser</strong><br />Proses sedang berjalan...
              </div>
            </div>
          )}

          {/* Step 3: Review + Classify */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>
                {txList.length} transaksi ditemukan.{" "}
                {unclassified > 0 && <span style={{ color: T.orange }}>⚠ {unclassified} perlu diklasifikasi.</span>}
              </div>
              {txList.map(t => (
                <div key={t.id} style={{ marginBottom: 10, padding: "10px 12px", background: T.surface, borderRadius: 10, border: `1px solid ${t.include && t.txType === "credit_entry" && !t.classifiedAs ? T.orange + "88" : T.border}`, opacity: t.include ? 1 : 0.5 }}>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: t.include ? 8 : 0 }}>
                    <input type="checkbox" checked={t.include} onChange={e => setTx(t.id, "include", e.target.checked)} style={{ width: 15, height: 15, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <input value={t.name} onChange={e => setTx(t.id, "name", e.target.value)} style={{ width: "100%", background: "transparent", border: "none", color: T.text, fontSize: 12, fontWeight: 600, outline: "none", padding: 0 }} />
                      <div style={{ fontSize: 10, color: T.muted }}>{t.date}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <input type="number" value={t.amount} onChange={e => setTx(t.id, "amount", Number(e.target.value))}
                        style={{ width: 90, padding: "3px 6px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: t.txType === "credit_entry" ? T.green : T.red, fontSize: 12, textAlign: "right", outline: "none" }} />
                      <div style={{ fontSize: 9, color: t.txType === "credit_entry" ? T.green : T.muted, textAlign: "right", marginTop: 1 }}>
                        {t.txType === "credit_entry" ? "kredit" : "debit"}
                      </div>
                    </div>
                  </div>

                  {t.include && t.txType === "expense" && (
                    <CategoryPicker T={T} value={t.category} onChange={v => setTx(t.id, "category", v)} type="expense" />
                  )}

                  {t.include && t.txType === "credit_entry" && (
                    <div>
                      <div style={{ fontSize: 10, color: T.muted, marginBottom: 6 }}>Jenis transaksi masuk:</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {CREDIT_ENTRY_OPTS.map(opt => (
                          <button key={opt.v} onClick={() => setTx(t.id, "classifiedAs", opt.v)}
                            style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${t.classifiedAs === opt.v ? T.accent : T.border}`, background: t.classifiedAs === opt.v ? T.accentDim : T.surface, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: t.classifiedAs === opt.v ? T.accent : T.text }}>{opt.l}</span>
                            <span style={{ fontSize: 10, color: T.muted }}>{opt.sub}</span>
                          </button>
                        ))}
                      </div>
                      {t.classifiedAs === "transfer" && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>Wallet Sumber</div>
                          <select value={t.toWalletId} onChange={e => setTx(t.id, "toWalletId", e.target.value)} style={inp}>
                            <option value="">Pilih wallet...</option>
                            {wallets.filter(w => w.id !== walletId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Summary & confirm */}
              <div style={{ position: "sticky", bottom: 0, background: T.card, paddingTop: 12, paddingBottom: 4 }}>
                <div style={{ padding: "10px 14px", background: T.accentDim, borderRadius: 10, display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: T.textSoft }}>Total ({txList.filter(t => t.include).length} transaksi)</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.accent }}>{fmtRp(totalIncluded)}</span>
                </div>
                <div style={{ padding: "8px 12px", background: pulseCredits < pulseCost ? T.red + "22" : T.surface, border: `1px solid ${pulseCredits < pulseCost ? T.red : T.border}`, borderRadius: 9, fontSize: 11, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: T.muted }}>Biaya analisis ({txList.length} transaksi)</span>
                  <span style={{ fontWeight: 700, color: pulseCredits < pulseCost ? T.red : T.accent }}>⚡ {pulseCost} Pulse</span>
                </div>
                <button
                  onClick={finish}
                  disabled={unclassified > 0 || pulseCredits < pulseCost}
                  style={{ width: "100%", padding: "12px", borderRadius: 9, border: "none", background: (unclassified > 0 || pulseCredits < pulseCost) ? T.border : T.accent, color: (unclassified > 0 || pulseCredits < pulseCost) ? T.muted : "#000", cursor: (unclassified > 0 || pulseCredits < pulseCost) ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700 }}
                >
                  {pulseCredits < pulseCost ? `Pulse kurang (perlu ${pulseCost})` : unclassified > 0 ? `⚠ Klasifikasi ${unclassified} transaksi dulu` : `✅ Buat ${txList.filter(t=>t.include).length} Transaksi`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Transaksi Scene ──────────────────────────────────────────────────────────
function TransaksiScene({ T, transactions, setTransactions, wallets, setWallets, debts, setDebts, pulseCredits, setPulseCredits, openScannerOnMount, onScannerMounted }) {
  const today = new Date().toISOString().slice(0, 10);
  // Default to first Dana wallet (preferred source); fall back to any wallet
  const defaultWallet = (wallets.find(w => !KREDIT_WALLET_TYPES.includes(w.type)) || wallets[0])?.id || "";
  const emptyForm = { type: "expense", date: today, amount: "", category: "", walletId: defaultWallet, toWalletId: "", debtId: "", description: "" };
  const [showForm, setShowForm]           = useState(false);
  const [showScanner, setShowScanner]     = useState(false);

  // Auto-open scanner if requested by UploadCenter
  useEffect(() => {
    if (openScannerOnMount) { setShowScanner(true); onScannerMounted && onScannerMounted(); }
  }, [openScannerOnMount]); // eslint-disable-line
  const [showEStatement, setShowEStatement] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState("all");
  const [filterMonth, setFilterMonth] = useState(today.slice(0, 7)); // "YYYY-MM"
  const [page, setPage] = useState(1);
  const ccWallets = wallets.filter(w => CREDIT_WALLET_TYPES.includes(w.type));

  const PAGE_SIZE = 20;

  // Month navigation helpers
  const shiftMonth = (delta) => {
    const [y, m] = filterMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setFilterMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setPage(1);
  };
  const monthLabel = (() => {
    const [y, m] = filterMonth.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  })();
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // When wallets load after initial render, set default wallet
  React.useEffect(() => {
    if (defaultWallet && !form.walletId) setF("walletId", defaultWallet);
  }, [defaultWallet]); // eslint-disable-line

  const setType = (t) => {
    const cat = t === "income" ? "Gaji/Salary" : t === "expense" ? "Makan & Minum" : "";
    setForm(p => ({ ...p, type: t, category: cat, debtId: "", toWalletId: "" }));
  };

  const TYPE_META = {
    income:       { label: "Pemasukan",   icon: "💰", color: "#3ecf8e" },
    expense:      { label: "Pengeluaran", icon: "💸", color: "#f26b6b" },
    debt_payment: { label: "Bayar Hutang",icon: "💳", color: "#f59e0b" },
    transfer:     { label: "Transfer",    icon: "↔️", color: "#9b7ef8" },
  };

  const canSave = form.amount && parseNum(form.amount) > 0 && form.walletId &&
    (form.type === "debt_payment" ? form.debtId : form.type === "transfer" ? form.toWalletId : form.category);

  // Sync credit wallet expense → increment linked debt outstanding in WealthPulse
  // Auto-link credit wallet → debt on first use (finds matching debt by type/name)
  const autoLinkCreditWallet = (walletId) => {
    if (!setWallets || !debts) return;
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet || wallet.debtId || !CREDIT_WALLET_TYPES.includes(wallet.type)) return;
    const debtTypeKey = WALLET_TYPE_DEBT_KEY[wallet.type];
    const candidates = debts.filter(d => d.type === debtTypeKey);
    let match = candidates.length === 1 ? candidates[0] : null;
    if (!match && candidates.length > 1) {
      const wName = wallet.name.toLowerCase();
      match = candidates.find(d =>
        (d.name || "").toLowerCase().split(/\s+/).some(tok => wName.includes(tok) && tok.length > 2)
      ) || candidates.find(d => wName.includes((d.name || "").toLowerCase()));
    }
    if (match) setWallets(prev => prev.map(w => w.id === walletId ? { ...w, debtId: match.id } : w));
  };

  const save = () => {
    if (!canSave) return;
    const amt = parseNum(form.amount);
    // Auto-link credit wallet if not yet linked (enables recalc useEffect to find it)
    if (form.type === "expense") autoLinkCreditWallet(form.walletId);
    setTransactions(prev => [...prev, {
      id: genId(), date: form.date || today, type: form.type,
      category: form.type === "debt_payment"
        ? (debts.find(d => d.id === form.debtId)?.name || "Bayar Hutang")
        : form.type === "transfer" ? "Transfer" : form.category,
      amount: amt, walletId: form.walletId,
      toWalletId: form.type === "transfer" ? form.toWalletId : "",
      debtId: form.debtId, description: form.description.trim(),
    }]);
    setForm({ ...emptyForm, walletId: form.walletId });
    setShowForm(false);
  };

  // Outstanding recalc is handled by the useEffect in ArthaJourneyApp (Rule 2 & 4)
  const handleScanDone = (txs) => {
    setTransactions(prev => [...prev, ...txs]);
    setShowScanner(false);
  };

  const handleEStatementDone = (txs) => {
    setTransactions(prev => [...prev, ...txs]);
    setShowEStatement(false);
  };

  const del = (id) => {
    if (!window.confirm("Hapus transaksi ini?")) return;
    // Removing the tx triggers the recalc useEffect automatically (Rule 4)
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const monthTxs = transactions.filter(t => t.date && t.date.slice(0, 7) === filterMonth);
  // Monthly summary totals — debt_payment is a cash outflow but not an expense
  const monthIncome  = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
  const monthExpense = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
  const monthHutang  = monthTxs.filter(t => t.type === "debt_payment").reduce((s, t) => s + Number(t.amount || 0), 0);
  const monthNet     = monthIncome - monthExpense - monthHutang;

  const filtered = [...monthTxs]
    .filter(t => filter === "all" || t.type === filter)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const walletName = (id) => wallets.find(w => w.id === id)?.name || "—";

  return (
    <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto", paddingBottom: 80 }}>
      <FeaturePopup T={T} featureKey="aj_transaksi" icon="💸" title="Catat Transaksi"
        content="Di halaman ini Anda dapat mencatat pemasukan, pengeluaran, bayar hutang, dan transfer antar wallet. Gunakan Scan Struk 📸 untuk ekstrak otomatis dari nota belanja." />
      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, background: T.surface, borderRadius: 12, padding: "8px 12px" }}>
        <button onClick={() => shiftMonth(-1)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: T.text, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{monthLabel}</span>
        <button onClick={() => shiftMonth(1)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: T.text, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
      </div>

      {/* Monthly summary chips */}
      {monthTxs.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
          {[
            ["Pemasukan",    monthIncome,  T.green],
            ["Pengeluaran",  monthExpense, T.red],
            ["Bayar Hutang", monthHutang,  "#f59e0b"],
            ["Selisih",      monthNet,     monthNet >= 0 ? T.green : T.red],
          ].map(([l, v, c]) => (
            <div key={l} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: T.muted, marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: c }}>{l === "Selisih" && monthNet >= 0 ? "+" : ""}{fmtRp(v)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter chips + E-Statement shortcut */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {[["all","Semua"],["income","Pemasukan"],["expense","Pengeluaran"],["debt_payment","Bayar Hutang"],["transfer","Transfer"]].map(([k,l]) => (
          <button key={k} onClick={() => { setFilter(k); setPage(1); }} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${filter===k ? T.accent : T.border}`, background: filter===k ? T.accentDim : T.surface, color: filter===k ? T.accent : T.textSoft, fontSize: 11, cursor: "pointer", fontWeight: filter===k ? 700 : 400 }}>{l}</button>
        ))}
        {ccWallets.length > 0 && (
          <button
            onClick={() => setShowEStatement(true)}
            style={{ marginLeft: "auto", padding: "5px 10px", borderRadius: 20, border: `1px solid ${T.accent}44`, background: T.accentDim, color: T.accent, fontSize: 11, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
          >
            📄 E-Statement
          </button>
        )}
      </div>

      {/* Add transaction form */}
      {showForm && (
        <Card T={T} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <SectionTitle style={{ margin: 0 }}>Catat Transaksi Baru</SectionTitle>
            {/* Receipt scan shortcut (expense only) */}
            {form.type === "expense" && wallets.length > 0 && (
              <button
                onClick={() => { setShowForm(false); setShowScanner(true); }}
                style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, border: `1px solid ${T.accent}44`, background: T.accentDim, color: T.accent, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
              >
                📸 Scan Struk
              </button>
            )}
          </div>

          {/* Type tabs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 5, marginBottom: 12 }}>
            {Object.entries(TYPE_META).map(([k, m]) => (
              <button key={k} onClick={() => setType(k)} style={{ padding: "8px 4px", borderRadius: 8, border: `1px solid ${form.type===k ? m.color : T.border}`, background: form.type===k ? m.color+"22" : T.surface, color: form.type===k ? m.color : T.textSoft, fontSize: 10, cursor: "pointer", fontWeight: form.type===k ? 700 : 400, textAlign: "center" }}>
                <div style={{ fontSize: 16 }}>{m.icon}</div>
                <div style={{ marginTop: 2 }}>{m.label}</div>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {/* Date + Amount */}
            <div style={{ display: "flex", gap: 8 }}>
              <Inp T={T} type="date" value={form.date} onChange={e => setF("date", e.target.value)} style={{ flex: 1 }} />
              <Inp T={T} type="number" value={form.amount} onChange={e => setF("amount", e.target.value)} placeholder="Jumlah (Rp)" style={{ flex: 2 }} />
            </div>

            {/* Category — grouped picker for expense, flat for income */}
            {(form.type === "expense") && (
              <CategoryPicker T={T} value={form.category} onChange={v => setF("category", v)} type="expense" />
            )}
            {form.type === "income" && (
              <CategoryPicker T={T} value={form.category} onChange={v => setF("category", v)} type="income" />
            )}
            {form.type === "debt_payment" && (
              <Sel T={T} value={form.debtId} onChange={e => setF("debtId", e.target.value)}>
                <option value="">-- Pilih Hutang --</option>
                {(debts || []).map(d => <option key={d.id} value={d.id}>{d.name} (sisa {fmtRp(d.outstanding)})</option>)}
              </Sel>
            )}

            {/* Source wallet — Dana only for transfer & debt_payment */}
            {(() => {
              const danaOnly = form.type === "transfer" || form.type === "debt_payment";
              const srcWallets = danaOnly ? wallets.filter(w => !KREDIT_WALLET_TYPES.includes(w.type)) : wallets;
              return (
                <>
                  <Sel T={T} value={form.walletId} onChange={e => setF("walletId", e.target.value)}>
                    <option value="">-- {danaOnly ? "Dari Akun Dana" : "Dari Wallet"} --</option>
                    {srcWallets.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name} ({fmtRp(getWalletBalance(w, transactions))})</option>)}
                  </Sel>
                  {danaOnly && srcWallets.length === 0 && (
                    <div style={{ fontSize: 11, color: T.muted, padding: "6px 10px", background: T.surface, borderRadius: 8 }}>
                      Tambahkan Akun Dana (Bank/E-Wallet/Tunai) terlebih dahulu.
                    </div>
                  )}
                </>
              );
            })()}

            {/* Transfer to wallet — Dana only */}
            {form.type === "transfer" && (
              <Sel T={T} value={form.toWalletId} onChange={e => setF("toWalletId", e.target.value)}>
                <option value="">-- Ke Akun Dana --</option>
                {wallets.filter(w => !KREDIT_WALLET_TYPES.includes(w.type) && w.id !== form.walletId).map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
              </Sel>
            )}

            <Inp T={T} value={form.description} onChange={e => setF("description", e.target.value)} placeholder="Keterangan (opsional)" />

            <div style={{ display: "flex", gap: 8 }}>
              <Btn T={T} variant="primary" onClick={save} style={{ flex: 1 }} disabled={!canSave}>Simpan</Btn>
              <Btn T={T} onClick={() => setShowForm(false)} style={{ flex: 1 }}>Batal</Btn>
            </div>
          </div>
        </Card>
      )}

      {/* No-wallet warning */}
      {wallets.length === 0 && (
        <Card T={T} style={{ textAlign: "center", padding: "20px 16px", marginBottom: 14, border: `1px dashed ${T.border}` }}>
          <div style={{ fontSize: 12, color: T.muted }}>Tambah wallet terlebih dahulu di menu <strong style={{ color: T.accent }}>Wallet</strong> sebelum mencatat transaksi.</div>
        </Card>
      )}

      {/* Transaction list */}
      {filtered.length === 0 && !showForm ? (
        <Card T={T} style={{ textAlign: "center", padding: "36px 16px", border: `1px dashed ${T.border}` }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>💸</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 6 }}>Belum ada transaksi</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
            {filtered.length === 0 && transactions.length > 0
              ? `Tidak ada transaksi di ${monthLabel}.`
              : "Catat manual atau scan struk/nota."}
          </div>
          {wallets.length > 0 && transactions.length === 0 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <Btn T={T} variant="primary" onClick={() => setShowForm(true)}>+ Catat Manual</Btn>
              <Btn T={T} onClick={() => setShowScanner(true)}>📸 Scan Struk</Btn>
            </div>
          )}
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {paginated.map(t => {
            const meta = TYPE_META[t.type] || TYPE_META.expense;
            const isIncome = t.type === "income";
            return (
              <Card T={T} key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: meta.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {CAT_ICONS[t.category] || meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.category}{t.description ? ` · ${t.description}` : ""}
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                    {new Date(t.date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} · {walletName(t.walletId)}{t.toWalletId ? ` → ${walletName(t.toWalletId)}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: isIncome ? T.green : T.red }}>
                    {isIncome ? "+" : "-"}{fmtRp(t.amount)}
                  </div>
                  <button onClick={() => del(t.id)} style={{ fontSize: 9, color: T.muted, background: "none", border: "none", cursor: "pointer", marginTop: 3, padding: "2px 4px" }}>🗑</button>
                </div>
              </Card>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 0 4px", marginTop: 4 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.border}`, background: safePage <= 1 ? T.surface : T.card, color: safePage <= 1 ? T.muted : T.text, cursor: safePage <= 1 ? "not-allowed" : "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
              >‹</button>
              <span style={{ fontSize: 12, color: T.textSoft, fontWeight: 600, minWidth: 80, textAlign: "center" }}>
                Hal. {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.border}`, background: safePage >= totalPages ? T.surface : T.card, color: safePage >= totalPages ? T.muted : T.text, cursor: safePage >= totalPages ? "not-allowed" : "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
              >›</button>
            </div>
          )}
          {filtered.length > 0 && (
            <div style={{ textAlign: "center", fontSize: 10, color: T.muted, paddingBottom: 4 }}>
              {filtered.length} transaksi · menampilkan {((safePage-1)*PAGE_SIZE)+1}–{Math.min(safePage*PAGE_SIZE, filtered.length)}
            </div>
          )}
        </div>
      )}

      {/* FAB buttons */}
      {wallets.length > 0 && !showForm && (
        <div style={{ position: "fixed", bottom: 24, right: 16, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end", zIndex: 50 }}>
          <button
            onClick={() => setShowScanner(true)}
            style={{ width: 44, height: 44, borderRadius: "50%", background: T.card, border: `1px solid ${T.border}`, color: T.accent, fontSize: 20, cursor: "pointer", boxShadow: "0 2px 12px #0004" }}
            title="Scan Struk"
          >📸</button>
          <button
            onClick={() => { setForm({ ...emptyForm, walletId: defaultWallet }); setShowForm(true); }}
            style={{ width: 52, height: 52, borderRadius: "50%", background: T.accent, color: "#000", border: "none", fontSize: 24, cursor: "pointer", boxShadow: `0 4px 20px ${T.accent}66`, fontWeight: 700 }}
            title="Catat Transaksi"
          >+</button>
        </div>
      )}

      {/* Receipt Scanner modal */}
      {showScanner && (
        <ReceiptScanner
          T={T} wallets={wallets}
          pulseCredits={pulseCredits} setPulseCredits={setPulseCredits}
          onDone={handleScanDone}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* E-Statement Scanner modal (CC/Paylater only) */}
      {showEStatement && (
        <EStatementScanner
          T={T} wallets={wallets} debts={debts}
          pulseCredits={pulseCredits} setPulseCredits={setPulseCredits}
          onDone={handleEStatementDone}
          onClose={() => setShowEStatement(false)}
        />
      )}
    </div>
  );
}

// ─── Hutang Scene (Read-only) ─────────────────────────────────────────────────
function HutangScene({ T, debts }) {
  const fmt = (v) =>
    "Rp " +
    Number(v || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 });

  return (
    <div style={{ padding: "24px 20px", maxWidth: 680, margin: "0 auto" }}>
      <FeaturePopup T={T} featureKey="aj_hutang" icon="💳" title="Ringkasan Hutang"
        content="Di halaman ini Anda dapat melihat semua hutang yang diimpor dari Wealth Pulse, termasuk kartu kredit dan paylater yang sudah di-link ke wallet Anda." />
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
function ToolsScene({ T, transactions, wallets }) {
  const curMonth = getMonth();
  const lastMonth = prevMonth(curMonth);

  const monthTx = (m) => transactions.filter(t => getMonth(t.date) === m);
  const sumType = (txs, type) => txs.filter(t => t.type === type).reduce((s, t) => s + Number(t.amount || 0), 0);

  const curIncome  = sumType(monthTx(curMonth), "income");
  const curExpense = monthTx(curMonth).filter(t => t.type === "expense" || t.type === "debt_payment").reduce((s, t) => s + Number(t.amount || 0), 0);
  const curNet     = curIncome - curExpense;
  const lastIncome = sumType(monthTx(lastMonth), "income");
  const lastExpense = monthTx(lastMonth).filter(t => t.type === "expense" || t.type === "debt_payment").reduce((s, t) => s + Number(t.amount || 0), 0);

  const incomeDelta  = lastIncome > 0 ? ((curIncome - lastIncome) / lastIncome) * 100 : null;
  const expenseDelta = lastExpense > 0 ? ((curExpense - lastExpense) / lastExpense) * 100 : null;

  // Top expense categories this month
  const catMap = {};
  monthTx(curMonth).filter(t => t.type === "expense" || t.type === "debt_payment").forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount || 0);
  });
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCat = topCats[0]?.[1] || 1;

  // Total wallet balance
  const totalBal = wallets.reduce((s, w) => s + getWalletBalance(w, transactions), 0);

  const savingsRate = curIncome > 0 ? Math.round((curNet / curIncome) * 100) : 0;

  if (transactions.length === 0) {
    return (
      <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
        <Card T={T} style={{ textAlign: "center", padding: "40px 20px", border: `1px dashed ${T.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 6 }}>Belum ada data transaksi</div>
          <div style={{ fontSize: 12, color: T.muted }}>Catat transaksi terlebih dahulu untuk melihat analisis arus kas.</div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
      <FeaturePopup T={T} featureKey="aj_tools" icon="🔧" title="Tools Analisis"
        content="Di halaman ini Anda dapat melihat analisis arus kas bulanan, tabungan rate, dan breakdown pengeluaran per kategori untuk memahami pola keuangan Anda." />
      {/* Cash flow this month */}
      <Card T={T} style={{ marginBottom: 14 }}>
        <SectionTitle>Arus Kas — {monthLabel(curMonth)}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            ["💰 Pemasukan", curIncome, T.green, incomeDelta],
            ["💸 Pengeluaran", curExpense, T.red, expenseDelta],
            ["📊 Net", curNet, curNet >= 0 ? T.green : T.red, null],
          ].map(([label, val, color, delta]) => (
            <div key={label} style={{ background: T.surface, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: T.muted, marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color }}>{fmtRp(Math.abs(val))}</div>
              {delta !== null && <div style={{ fontSize: 9, color: delta >= 0 ? T.green : T.red, marginTop: 4 }}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(0)}% vs bulan lalu</div>}
            </div>
          ))}
        </div>
        {curIncome > 0 && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: savingsRate >= 20 ? T.green + "18" : T.orange + "18", borderRadius: 8, fontSize: 12, color: savingsRate >= 20 ? T.green : T.orange }}>
            Savings Rate: <strong>{savingsRate}%</strong> {savingsRate >= 20 ? "— Bagus! Pertahankan 🎉" : "— Target minimal 20%"}
          </div>
        )}
      </Card>

      {/* Wallet balances */}
      {wallets.length > 0 && (
        <Card T={T} style={{ marginBottom: 14 }}>
          <SectionTitle>Saldo Wallet</SectionTitle>
          {wallets.map(w => {
            const bal = getWalletBalance(w, transactions);
            return (
              <div key={w.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{w.icon}</span>
                  <span style={{ fontSize: 13, color: T.textSoft }}>{w.name}</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: 13, color: bal >= 0 ? T.green : T.red }}>{fmtRp(bal)}</span>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Total</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: totalBal >= 0 ? T.green : T.red }}>{fmtRp(totalBal)}</span>
          </div>
        </Card>
      )}

      {/* Top expense categories */}
      {topCats.length > 0 && (
        <Card T={T}>
          <SectionTitle>Top Pengeluaran Bulan Ini</SectionTitle>
          {topCats.map(([cat, val]) => (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: T.textSoft }}>{CAT_ICONS[cat] || "📦"} {cat}</span>
                <span style={{ fontWeight: 600, color: T.text }}>{fmtRp(val)}</span>
              </div>
              <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                <div style={{ height: "100%", width: `${(val / maxCat) * 100}%`, background: T.accent, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─── Report Scene ─────────────────────────────────────────────────────────────
function ReportScene({ T, transactions, budgets }) {
  const [viewMonth, setViewMonth] = useState(getMonth());

  // Build 6-month history
  const months6 = Array.from({ length: 6 }, (_, i) => {
    let m = getMonth();
    for (let j = 0; j < 5 - i; j++) m = prevMonth(m);
    return m;
  });

  const getIncome  = (m) => transactions.filter(t => t.type === "income" && getMonth(t.date) === m).reduce((s, t) => s + Number(t.amount || 0), 0);
  // debt_payment is excluded from expense — it's a cash outflow but not a spending category
  const getExpense = (m) => transactions.filter(t => t.type === "expense" && getMonth(t.date) === m).reduce((s, t) => s + Number(t.amount || 0), 0);

  const income  = getIncome(viewMonth);
  const expense = getExpense(viewMonth);
  const net     = income - expense;

  // Category breakdown for selected month — expense only, debt_payment excluded
  const catMap = {};
  transactions.filter(t => t.type === "expense" && getMonth(t.date) === viewMonth)
    .forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount || 0); });
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const maxCat = cats[0]?.[1] || 1;

  // Bar chart: 6-month trend
  const maxBar = Math.max(...months6.map(m => Math.max(getIncome(m), getExpense(m))), 1);

  if (transactions.length === 0) {
    return (
      <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
        <Card T={T} style={{ textAlign: "center", padding: "40px 20px", border: `1px dashed ${T.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 6 }}>Belum ada data laporan</div>
          <div style={{ fontSize: 12, color: T.muted }}>Mulai catat transaksi untuk melihat laporan keuangan bulanan.</div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
      <FeaturePopup T={T} featureKey="aj_report" icon="📈" title="Laporan Keuangan"
        content="Di halaman ini Anda dapat melihat laporan keuangan bulanan, tren 6 bulan, dan breakdown pengeluaran per kategori dengan visualisasi yang mudah dipahami." />
      {/* Month picker */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={() => setViewMonth(prevMonth(viewMonth))} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", color: T.textSoft, cursor: "pointer", fontSize: 14 }}>‹</button>
        <div style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 14, color: T.text }}>{monthLabel(viewMonth)}</div>
        <button onClick={() => setViewMonth(nextMonth(viewMonth))} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", color: T.textSoft, cursor: "pointer", fontSize: 14 }}>›</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[["💰 Pemasukan", income, T.green], ["💸 Pengeluaran", expense, T.red]].map(([l, v, c]) => (
          <Card T={T} key={l} style={{ textAlign: "center", padding: "14px 10px" }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 6 }}>{l}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: c }}>{fmtRp(v)}</div>
          </Card>
        ))}
        <Card T={T} style={{ textAlign: "center", padding: "14px 10px", gridColumn: "1/-1" }}>
          <div style={{ fontSize: 10, color: T.muted, marginBottom: 6 }}>📊 Net Cash Flow</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: net >= 0 ? T.green : T.red }}>{net >= 0 ? "+" : ""}{fmtRp(net)}</div>
          {income > 0 && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Savings rate: {Math.round((net / income) * 100)}%</div>}
        </Card>
      </div>

      {/* Expense by category */}
      {cats.length > 0 && (
        <Card T={T} style={{ marginBottom: 14 }}>
          <SectionTitle>Pengeluaran per Kategori</SectionTitle>
          {cats.map(([cat, val]) => (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: T.textSoft }}>{CAT_ICONS[cat] || "📦"} {cat}</span>
                <span style={{ fontWeight: 600, color: T.text }}>{fmtRp(val)} <span style={{ color: T.muted, fontWeight: 400 }}>({expense > 0 ? Math.round((val / expense) * 100) : 0}%)</span></span>
              </div>
              <div style={{ height: 7, background: T.border, borderRadius: 4 }}>
                <div style={{ height: "100%", width: `${(val / maxCat) * 100}%`, background: T.accent, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* 6-month trend */}
      <Card T={T}>
        <SectionTitle>Tren 6 Bulan Terakhir</SectionTitle>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, marginBottom: 8 }}>
          {months6.map(m => {
            const inc = getIncome(m); const exp = getExpense(m);
            return (
              <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 64 }}>
                  <div style={{ width: 8, height: `${(inc / maxBar) * 64}px`, background: T.green, borderRadius: "2px 2px 0 0", minHeight: inc > 0 ? 2 : 0 }} />
                  <div style={{ width: 8, height: `${(exp / maxBar) * 64}px`, background: T.red, borderRadius: "2px 2px 0 0", minHeight: exp > 0 ? 2 : 0 }} />
                </div>
                <div style={{ fontSize: 8, color: T.muted, textAlign: "center" }}>{monthLabel(m).slice(0, 3)}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 10, color: T.muted }}>
          <span><span style={{ display: "inline-block", width: 8, height: 8, background: T.green, borderRadius: 2, marginRight: 4 }} />Pemasukan</span>
          <span><span style={{ display: "inline-block", width: 8, height: 8, background: T.red, borderRadius: 2, marginRight: 4 }} />Pengeluaran</span>
        </div>
      </Card>

      {/* Monthly table */}
      <Card T={T} style={{ marginTop: 14 }}>
        <SectionTitle>Ringkasan Bulanan</SectionTitle>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ color: T.muted }}>
              {["Bulan","Pemasukan","Pengeluaran","Net"].map(h => <th key={h} style={{ textAlign: h === "Bulan" ? "left" : "right", padding: "4px 6px", fontWeight: 600, fontSize: 10 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {months6.map(m => {
              const inc = getIncome(m); const exp = getExpense(m); const n = inc - exp;
              return (
                <tr key={m} style={{ borderTop: `1px solid ${T.border}`, background: m === viewMonth ? T.accentDim : "transparent" }}>
                  <td style={{ padding: "7px 6px", color: m === viewMonth ? T.accent : T.textSoft, fontWeight: m === viewMonth ? 700 : 400 }}>{monthLabel(m)}</td>
                  <td style={{ padding: "7px 6px", textAlign: "right", color: T.green }}>{inc > 0 ? fmtRp(inc) : "—"}</td>
                  <td style={{ padding: "7px 6px", textAlign: "right", color: T.red }}>{exp > 0 ? fmtRp(exp) : "—"}</td>
                  <td style={{ padding: "7px 6px", textAlign: "right", color: n >= 0 ? T.green : T.red, fontWeight: 600 }}>{inc > 0 || exp > 0 ? fmtRp(n) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── Upload Center Modal ─────────────────────────────────────────────────────
function UploadCenterModal({ T, wallets, debts, setDebts, setTransactions, pulseCredits, setPulseCredits, setActiveApp, onClose, onOpenScanner }) {
  const [step, setStep]           = useState("choose"); // "choose"|"estatement_select"|"estatement_upload"|"scanning"|"review"
  const [fileB64, setFileB64]     = useState(null);
  const [fileName, setFileName]   = useState("");
  const [selectedDebtId, setSelectedDebtId] = useState("");
  const [txResult, setTxResult]   = useState(null);
  const [summaryResult, setSummaryResult] = useState(null);
  const [scanning, setScanning]   = useState(false);
  const [error, setError]         = useState("");
  const [txList, setTxList]       = useState([]); // for review/edit

  const ccDebts = (debts || []).filter(d => d.type === "cc" || d.type === "paylater" || d.type === "krek");

  const toB64 = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileB64(await toB64(file));
  };

  const runScan = async () => {
    if (!fileB64 || !selectedDebtId) return;
    setScanning(true);
    setError("");
    try {
      const pulseCost = 3; // 1 summary + 2 transactions
      if (pulseCredits < pulseCost) { setError(`Pulse tidak cukup (perlu ${pulseCost})`); setScanning(false); return; }

      const [txRes, sumRes] = await Promise.all([
        fetch("/api/scan-statement", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: fileB64, mode: "transactions" }) }).then(r => r.json()),
        fetch("/api/scan-statement", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: fileB64, mode: "summary" }) }).then(r => r.json()),
      ]);

      setPulseCredits(prev => (typeof prev === "function" ? prev : (fn) => fn)(p => Math.max(0, (typeof p === "number" ? p : 0) - pulseCost)));
      setTxResult(txRes);
      setSummaryResult(sumRes);
      const parsedTxs = (txRes.transactions || txRes.items || []).map(t => ({ ...t, include: true }));
      setTxList(parsedTxs);
      setStep("review");
    } catch (e) {
      setError("Gagal scan: " + e.message);
    } finally {
      setScanning(false);
    }
  };

  const confirm = () => {
    // Save transactions to AJ
    const debt = (debts || []).find(d => d.id === selectedDebtId);
    const ccWallet = (wallets || []).find(w => w.debtId === selectedDebtId);
    const txsToAdd = txList.filter(t => t.include).map(t => ({
      id: genId(),
      date: t.date || new Date().toISOString().slice(0, 10),
      type: t.type || "expense",
      category: t.category || "Belanja",
      amount: Number(t.amount) || 0,
      walletId: ccWallet?.id || "",
      toWalletId: "",
      debtId: t.type === "debt_payment" ? selectedDebtId : "",
      description: t.description || t.merchant || "",
    }));
    if (txsToAdd.length > 0) setTransactions(prev => [...prev, ...txsToAdd]);

    // Update debt summary in WP if summary found
    if (summaryResult && debt) {
      setDebts(prev => prev.map(d => {
        if (d.id !== selectedDebtId) return d;
        const updates = {};
        if (summaryResult.total_tagihan) updates.outstanding = String(Math.round(Number(summaryResult.total_tagihan)));
        if (summaryResult.limit) updates.plafon = String(Math.round(Number(summaryResult.limit)));
        if (summaryResult.tanggal_jatuh_tempo) updates.dueDate = summaryResult.tanggal_jatuh_tempo;
        return { ...d, ...updates };
      }));
    }
    onClose();
  };

  const overlay = { position: "fixed", inset: 0, background: "#0009", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
  const box = { background: T.card, borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", padding: 20 };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={box}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.text }}>📤 Upload Center</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        {step === "choose" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, color: T.textSoft, marginBottom: 4 }}>Pilih jenis upload:</div>
            {[
              { key: "struk",      icon: "📸", label: "Scan Struk / Nota",       desc: "AI ekstrak item belanja → Artha Journey",          color: "#3ecf8e" },
              { key: "estatement", icon: "💳", label: "E-Statement Kartu Kredit", desc: "Transaksi → AJ · Ringkasan tagihan → Wealth Kompas",color: "#f59e0b" },
              { key: "portfolio",  icon: "📄", label: "Portfolio Aset (PDF)",     desc: "Data aset → Wealth Pulse",                         color: "#5b9cf6" },
            ].map(opt => (
              <button key={opt.key} onClick={() => {
                if (opt.key === "struk") { onClose(); onOpenScanner(); }
                else if (opt.key === "portfolio") { setActiveApp && setActiveApp("wealthpulse"); onClose(); }
                else setStep("estatement_select");
              }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, border: `1px solid ${opt.color}44`, background: opt.color + "0d", cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 24 }}>{opt.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === "estatement_select" && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 10 }}>Pilih Kartu Kredit / Paylater</div>
            {ccDebts.length === 0 ? (
              <div style={{ fontSize: 12, color: T.muted, padding: "12px 0" }}>Belum ada hutang CC/Paylater di Wealth Kompas.</div>
            ) : (
              ccDebts.map(d => (
                <button key={d.id} onClick={() => { setSelectedDebtId(d.id); setStep("estatement_upload"); }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "12px 14px", marginBottom: 8, borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, cursor: "pointer" }}>
                  <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{d.name}</span>
                  <span style={{ fontSize: 11, color: T.muted }}>{d.type === "cc" ? "Kartu Kredit" : d.type === "paylater" ? "Paylater" : "Rekening Koran"}</span>
                </button>
              ))
            )}
            <button onClick={() => setStep("choose")} style={{ width: "100%", marginTop: 8, padding: "8px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontSize: 12 }}>← Kembali</button>
          </div>
        )}

        {step === "estatement_upload" && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 10 }}>
              Upload E-Statement · {(debts || []).find(d => d.id === selectedDebtId)?.name}
            </div>
            <label style={{ display: "block", padding: "24px", borderRadius: 12, border: `2px dashed ${T.border}`, background: T.surface, cursor: "pointer", textAlign: "center", marginBottom: 12 }}>
              <input type="file" accept="image/*,.pdf,application/pdf" onChange={handleFileChange} style={{ display: "none" }} />
              {fileB64 ? (
                <div style={{ fontSize: 12, color: T.green }}>✅ {fileName}</div>
              ) : (
                <>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📎</div>
                  <div style={{ fontSize: 12, color: T.muted }}>Klik atau drag gambar / PDF e-statement</div>
                </>
              )}
            </label>
            {error && <div style={{ fontSize: 12, color: T.red, marginBottom: 8 }}>{error}</div>}
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>
              Biaya: <strong style={{ color: "#f59e0b" }}>3 Pulse</strong> (scan transaksi + ringkasan tagihan)
              · Saldo: {pulseCredits} Pulse
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={runScan} disabled={!fileB64 || scanning} style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: (!fileB64 || scanning) ? T.border : T.accent, color: (!fileB64 || scanning) ? T.muted : "#000", cursor: (!fileB64 || scanning) ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13 }}>
                {scanning ? "⏳ Scanning..." : "🔍 Scan Sekarang"}
              </button>
              <button onClick={() => setStep("estatement_select")} style={{ padding: "10px 16px", borderRadius: 9, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontSize: 12 }}>←</button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div>
            {/* Summary card */}
            {summaryResult && (
              <div style={{ background: "#f59e0b0f", border: "1px solid #f59e0b44", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 6 }}>💎 Wealth Kompas Update</div>
                {summaryResult.total_tagihan && <div style={{ fontSize: 12, color: T.textSoft }}>Total Tagihan: <strong style={{ color: T.text }}>{fmtRp(summaryResult.total_tagihan)}</strong></div>}
                {summaryResult.tanggal_jatuh_tempo && <div style={{ fontSize: 12, color: T.textSoft, marginTop: 4 }}>Jatuh Tempo: <strong style={{ color: T.text }}>{summaryResult.tanggal_jatuh_tempo}</strong></div>}
                {summaryResult.limit && <div style={{ fontSize: 12, color: T.textSoft, marginTop: 4 }}>Limit: <strong style={{ color: T.text }}>{fmtRp(summaryResult.limit)}</strong></div>}
              </div>
            )}
            {/* Transaction list */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 8 }}>📒 Transaksi Artha Journey ({txList.filter(t => t.include).length}/{txList.length})</div>
            <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 12 }}>
              {txList.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                  <input type="checkbox" checked={!!t.include} onChange={e => setTxList(prev => prev.map((x, j) => j === i ? { ...x, include: e.target.checked } : x))} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description || t.merchant || t.category}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>{t.date} · {t.category}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.red, whiteSpace: "nowrap" }}>-{fmtRp(t.amount)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={confirm} style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: T.accent, color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                ✅ Simpan ({txList.filter(t => t.include).length} transaksi)
              </button>
              <button onClick={() => setStep("estatement_upload")} style={{ padding: "10px 14px", borderRadius: 9, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontSize: 12 }}>←</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ArthaJourneyApp ────────────────────────────────────────────────────
export default function ArthaJourneyApp({
  user, T, isPro, isProPlus, pulseCredits, setPulseCredits,
  assets, debts, setDebts, activeIncomes, monthlyFixedIncome,
  settings, setSettings, theme, setTheme, dispCur, setDispCur,
  fontScale, setFontScale, customPresetId, setCustomPresetId,
  setShowUpgrade, activeApp, setActiveApp, onLogout, logoutSaving,
  ajWallets = [], setAjWallets = () => {},
  ajTransactions = [], setAjTransactions = () => {},
  ajBudgets = [], setAjBudgets = () => {},
}) {
  const [tab, setTab] = useState("wallet");
  const [showSettings, setShowSettings] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const [showUploadCenter, setShowUploadCenter] = useState(false);
  const [uploadCenterOpenScanner, setUploadCenterOpenScanner] = useState(false);

  // ── Rule 2 & 4: Recalculate CC/Paylater outstanding after every transaction change ──
  // Full recalc (not increment/decrement) eliminates drift and handles all mutations:
  // create, delete, and edit. Billing-period aware via creditSync.js.
  useEffect(() => {
    if (!setDebts) return;
    setDebts(prev => recalcAllCreditDebts(prev, ajTransactions, ajWallets) || prev);
  }, [ajTransactions, ajWallets]); // eslint-disable-line

  // ── Auto Budget Sync: create/remove budget entries from expense transactions ──
  // Creates is_set:false budgets for new (month,category) pairs and removes stale
  // auto-budgets when all transactions for that pair are gone. Manual budgets
  // (is_set:true) are never auto-deleted. actual_spending stays dynamic (getSpent).
  useEffect(() => {
    // Collect unique (month, category) pairs from expense transactions
    const expensePairs = new Map(); // key: "month|category" → {month, category, area}
    for (const t of ajTransactions) {
      if (t.type !== "expense" || !t.category) continue; // debt_payment excluded from auto-budget
      const month = getMonth(t.date);
      const key = `${month}|${t.category}`;
      if (!expensePairs.has(key)) {
        expensePairs.set(key, { month, category: t.category, area: inferArea(t.category) });
      }
    }

    let changed = false;
    // Remove auto-budgets whose (month, category) no longer has transactions
    let synced = ajBudgets.filter(b => {
      if (b.is_set) return true; // manual budget: never auto-remove
      if (expensePairs.has(`${b.month}|${b.category}`)) return true;
      changed = true;
      return false;
    });

    // Auto-create budget entry for each new (month, category) pair
    for (const [key, { month, category, area }] of expensePairs) {
      const exists = synced.some(b => b.month === month && b.category === category);
      if (!exists) {
        synced = [...synced, { id: genId(), category, limit: 0, month, area, is_set: false }];
        changed = true;
      }
    }

    if (changed) setAjBudgets(synced);
  }, [ajTransactions]); // eslint-disable-line


  // ── Rule 1: Sync debt plafon (limit) → linked wallet limits ──────────────────────
  // Source of truth = debt.plafon (Wealth Pulse). Wallets are read-only derivates.
  useEffect(() => {
    if (!debts?.length || !ajWallets?.length) return;
    let changed = false;
    const updated = ajWallets.map(w => {
      if (!CREDIT_WALLET_TYPES.includes(w.type) || !w.debtId) return w;
      const debt = debts.find(d => d.id === w.debtId);
      if (!debt) return w;
      const newLimit = Number(debt.plafon) || w.limit;
      if (newLimit === w.limit) return w;
      changed = true;
      return { ...w, limit: newLimit };
    });
    if (changed) setAjWallets(updated);
  }, [debts]); // eslint-disable-line

  const renderScene = () => {
    switch (tab) {
      case "wallet":
        return <WalletScene T={T} wallets={ajWallets} setWallets={setAjWallets} transactions={ajTransactions} assets={assets} debts={debts} setDebts={setDebts} isPro={isPro} isProPlus={isProPlus} />;
      case "budget":
        return <BudgetScene T={T} budgets={ajBudgets} setBudgets={setAjBudgets} transactions={ajTransactions} assets={assets} activeIncomes={activeIncomes} monthlyFixedIncome={monthlyFixedIncome} />;
      case "transaksi":
        return <TransaksiScene T={T} transactions={ajTransactions} setTransactions={setAjTransactions} wallets={ajWallets} setWallets={setAjWallets} debts={debts} setDebts={setDebts} pulseCredits={pulseCredits} setPulseCredits={setPulseCredits || (() => {})} openScannerOnMount={uploadCenterOpenScanner} onScannerMounted={() => setUploadCenterOpenScanner(false)} />;
      case "hutang":
        return <HutangScene T={T} debts={debts} />;
      case "tools":
        return <ToolsScene T={T} transactions={ajTransactions} wallets={ajWallets} />;
      case "report":
        return <ReportScene T={T} transactions={ajTransactions} budgets={ajBudgets} />;
      default:
        return <WalletScene T={T} wallets={ajWallets} setWallets={setAjWallets} transactions={ajTransactions} assets={assets} isPro={isPro} isProPlus={isProPlus} />;
    }
  };

  const activeNav = AJ_NAV.find((n) => n.id === tab);

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, overflow: "hidden", fontFamily: "inherit", zoom: fontScale }}>
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
            {/* Upload Center button */}
            <button
              onClick={() => setShowUploadCenter(true)}
              title="Upload Center"
              style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.textSoft, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >📤</button>
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
            {/* Tier badge — clicking opens upgrade panel */}
            <button
              onClick={() => setShowUpgrade && setShowUpgrade(true)}
              title={isProPlus ? "Paket Pro+" : isPro ? "Paket Pro aktif" : "Upgrade ke Pro"}
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: isPro ? T.accent : T.muted,
                background: isPro ? T.accentDim : T.surface,
                border: `1px solid ${isPro ? T.accent : T.border}`,
                padding: "3px 10px",
                borderRadius: 20,
                cursor: "pointer",
              }}
            >
              {isProPlus ? "💎 PRO+" : isPro ? "⭐ PRO" : "Free ↑"}
            </button>
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

      {/* Upload Center */}
      {showUploadCenter && (
        <UploadCenterModal
          T={T}
          wallets={ajWallets}
          debts={debts}
          setDebts={setDebts}
          setTransactions={setAjTransactions}
          pulseCredits={pulseCredits}
          setPulseCredits={setPulseCredits}
          setActiveApp={setActiveApp}
          onClose={() => setShowUploadCenter(false)}
          onOpenScanner={() => { setTab("transaksi"); setUploadCenterOpenScanner(true); }}
        />
      )}
    </div>
  );
}
