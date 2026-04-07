import React, { useState, useMemo } from "react";
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtRp(v) {
  const n = Math.abs(Number(v || 0));
  if (n >= 1e9) return "Rp " + (n / 1e9).toFixed(2) + "M";
  if (n >= 1e6) return "Rp " + (n / 1e6).toFixed(1) + "Jt";
  if (n >= 1e3) return "Rp " + (n / 1e3).toFixed(0) + "rb";
  return "Rp " + n.toLocaleString("id-ID");
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

const TX_INCOME_CATS = ["Gaji/Salary","Bonus","Freelance","Passive Income","Penjualan","Transfer Masuk","Lainnya"];
const TX_EXPENSE_CATS = ["Makan & Minum","Transportasi","Belanja","Tagihan & Utilitas","Hiburan","Kesehatan","Pendidikan","Perawatan Diri","Lainnya"];
const BUDGET_CATS = ["Makan & Minum","Transportasi","Belanja","Tagihan & Utilitas","Hiburan","Kesehatan","Pendidikan","Perawatan Diri","Lainnya"];
const CAT_ICONS = { "Makan & Minum":"🍜","Transportasi":"🚗","Belanja":"🛍️","Tagihan & Utilitas":"💡","Hiburan":"🎬","Kesehatan":"❤️","Pendidikan":"📚","Perawatan Diri":"✨","Lainnya":"📦","Gaji/Salary":"💼","Bonus":"🎁","Freelance":"💻","Passive Income":"📈","Penjualan":"🏷️","Transfer Masuk":"↩️" };
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
function WalletScene({ T, wallets, setWallets, transactions, assets, isPro, isProPlus }) {
  const maxWallets = isProPlus ? Infinity : isPro ? 10 : 3;
  const atLimit = wallets.length >= maxWallets;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Bank", icon: "🏦", color: "#5b9cf6", initialBalance: "" });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const cashAssets = (assets || []).filter(a => a.classKey === "cash");
  const totalBalance = wallets.reduce((s, w) => s + getWalletBalance(w, transactions), 0);

  const save = () => {
    if (!form.name.trim()) return;
    setWallets(prev => [...prev, {
      id: genId(), name: form.name.trim(), type: form.type,
      icon: form.icon, color: form.color,
      initialBalance: parseNum(form.initialBalance),
      createdAt: new Date().toISOString(),
    }]);
    setForm({ name: "", type: "Bank", icon: "🏦", color: "#5b9cf6", initialBalance: "" });
    setShowForm(false);
  };

  return (
    <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
      {/* Header summary */}
      <Card T={T} style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Total Saldo Semua Wallet</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: totalBalance >= 0 ? T.green : T.red }}>{fmtRp(totalBalance)}</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 12, color: T.muted }}>
          {wallets.length}/{maxWallets === Infinity ? "∞" : maxWallets} wallet
        </div>
      </Card>

      {/* Wallet list */}
      {wallets.length === 0 && !showForm && (
        <Card T={T} style={{ textAlign: "center", padding: "36px 20px", marginBottom: 16, border: `1px dashed ${T.border}` }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>👛</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 6 }}>Belum ada wallet</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Tambahkan rekening bank, e-wallet, atau dompet tunai untuk mulai mencatat transaksi.</div>
          <Btn T={T} variant="primary" onClick={() => setShowForm(true)}>+ Tambah Wallet Pertama</Btn>
        </Card>
      )}
      {wallets.map(w => {
        const bal = getWalletBalance(w, transactions);
        const txCount = transactions.filter(t => t.walletId === w.id || t.toWalletId === w.id).length;
        return (
          <Card T={T} key={w.id} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: w.color + "22", border: `1.5px solid ${w.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
              {w.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{w.name}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{w.type} · {txCount} transaksi</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: bal >= 0 ? T.green : T.red }}>{fmtRp(bal)}</div>
              <button
                onClick={() => { if (window.confirm(`Hapus wallet "${w.name}"?`)) setWallets(prev => prev.filter(x => x.id !== w.id)); }}
                style={{ fontSize: 10, color: T.muted, background: "none", border: "none", cursor: "pointer", marginTop: 4, padding: "2px 6px" }}
              >🗑 hapus</button>
            </div>
          </Card>
        );
      })}

      {/* Add wallet form */}
      {showForm ? (
        <Card T={T} style={{ marginBottom: 16 }}>
          <SectionTitle>Tambah Wallet Baru</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Inp T={T} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="Nama wallet (cth: BCA Utama)" />
            <Sel T={T} value={form.type} onChange={e => setF("type", e.target.value)}>
              {["Bank","E-Wallet","Tunai","Lainnya"].map(t => <option key={t}>{t}</option>)}
            </Sel>
            <Inp T={T} value={form.initialBalance} onChange={e => setF("initialBalance", e.target.value)} placeholder="Saldo awal (contoh: 5000000)" type="number" />
            <div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Ikon</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {WALLET_ICONS.map(ic => (
                  <button key={ic} onClick={() => setF("icon", ic)} style={{ fontSize: 20, padding: "6px 8px", borderRadius: 8, border: `2px solid ${form.icon === ic ? T.accent : T.border}`, background: form.icon === ic ? T.accentDim : T.surface, cursor: "pointer" }}>{ic}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Warna</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {WALLET_COLORS.map(c => (
                  <button key={c} onClick={() => setF("color", c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: `3px solid ${form.color === c ? T.text : "transparent"}`, cursor: "pointer" }} />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Btn T={T} variant="primary" onClick={save} style={{ flex: 1 }}>Simpan</Btn>
              <Btn T={T} onClick={() => setShowForm(false)} style={{ flex: 1 }}>Batal</Btn>
            </div>
          </div>
        </Card>
      ) : (
        wallets.length > 0 && (
          <Btn T={T} variant={atLimit ? "ghost" : "primary"} disabled={atLimit} onClick={() => setShowForm(true)} style={{ width: "100%", marginBottom: 16 }}>
            {atLimit ? `Batas ${maxWallets} wallet (upgrade untuk lebih)` : "+ Tambah Wallet"}
          </Btn>
        )
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

// ─── Budget Scene ─────────────────────────────────────────────────────────────
const AREA_DEFS = {
  kebutuhan: {
    label: "Kebutuhan", icon: "🏠", color: "#5b9cf6", recommended: 50,
    desc: "Pengeluaran wajib & primer",
    cats: ["Makan & Minum", "Transportasi", "Tagihan & Utilitas", "Kesehatan", "Pendidikan", "Kebutuhan Lainnya"],
  },
  keinginan: {
    label: "Keinginan", icon: "🛍️", color: "#f59e0b", recommended: 30,
    desc: "Lifestyle & kenyamanan",
    cats: ["Hiburan", "Belanja", "Perawatan Diri", "Makan di Luar", "Liburan", "Keinginan Lainnya"],
  },
  tabungan: {
    label: "Tabungan & Investasi", icon: "💰", color: "#3ecf8e", recommended: 20,
    desc: "Aset masa depan",
    cats: ["Dana Darurat", "Investasi Saham/Reksa", "Cicilan Aset", "Asuransi", "Tabungan Lainnya"],
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

  // Spending & limits per category
  const getSpent = (cat) =>
    transactions
      .filter(t => (t.type === "expense" || t.type === "debt_payment") && getMonth(t.date) === viewMonth && t.category === cat)
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

// ─── Transaksi Scene ──────────────────────────────────────────────────────────
function TransaksiScene({ T, transactions, setTransactions, wallets, debts, setDebts }) {
  const today = new Date().toISOString().slice(0, 10);
  const emptyForm = { type: "expense", date: today, amount: "", category: "Makan & Minum", walletId: "", toWalletId: "", debtId: "", description: "" };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState("all");
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // When type changes, reset category to sensible default
  const setType = (t) => {
    const cat = t === "income" ? "Gaji/Salary" : t === "expense" ? "Makan & Minum" : "";
    setForm(p => ({ ...p, type: t, category: cat, debtId: "", toWalletId: "" }));
  };

  const TYPE_META = {
    income: { label: "Pemasukan", icon: "💰", color: "#3ecf8e" },
    expense: { label: "Pengeluaran", icon: "💸", color: "#f26b6b" },
    debt_payment: { label: "Bayar Hutang", icon: "💳", color: "#f59e0b" },
    transfer: { label: "Transfer", icon: "↔️", color: "#9b7ef8" },
  };

  const save = () => {
    if (!form.amount || !form.walletId) return;
    const amt = parseNum(form.amount);
    if (amt <= 0) return;

    // For debt_payment: reduce outstanding in WP debts
    if (form.type === "debt_payment" && form.debtId && setDebts) {
      setDebts(prev => prev.map(d =>
        d.id === form.debtId
          ? { ...d, outstanding: Math.max(0, parseNum(d.outstanding) - amt).toString() }
          : d
      ));
    }

    setTransactions(prev => [...prev, {
      id: genId(),
      date: form.date || today,
      type: form.type,
      category: form.type === "debt_payment"
        ? (debts.find(d => d.id === form.debtId)?.name || "Bayar Hutang")
        : form.type === "transfer" ? "Transfer" : form.category,
      amount: amt,
      walletId: form.walletId,
      toWalletId: form.type === "transfer" ? form.toWalletId : "",
      debtId: form.debtId,
      description: form.description.trim(),
    }]);
    setForm({ ...emptyForm, walletId: form.walletId });
    setShowForm(false);
  };

  const del = (id) => { if (window.confirm("Hapus transaksi ini?")) setTransactions(prev => prev.filter(t => t.id !== id)); };

  const filtered = [...transactions]
    .filter(t => filter === "all" || t.type === filter)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 60);

  const walletName = (id) => wallets.find(w => w.id === id)?.name || "—";

  return (
    <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[["all","Semua"],["income","Pemasukan"],["expense","Pengeluaran"],["debt_payment","Bayar Hutang"],["transfer","Transfer"]].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${filter===k ? T.accent : T.border}`, background: filter===k ? T.accentDim : T.surface, color: filter===k ? T.accent : T.textSoft, fontSize: 11, cursor: "pointer", fontWeight: filter===k ? 700 : 400 }}>{l}</button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <Card T={T} style={{ marginBottom: 16 }}>
          <SectionTitle>Catat Transaksi Baru</SectionTitle>
          {/* Type tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {Object.entries(TYPE_META).map(([k,m]) => (
              <button key={k} onClick={() => setType(k)} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: `1px solid ${form.type===k ? m.color : T.border}`, background: form.type===k ? m.color+"22" : T.surface, color: form.type===k ? m.color : T.textSoft, fontSize: 11, cursor: "pointer", fontWeight: form.type===k ? 700 : 400, textAlign: "center" }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <Inp T={T} type="date" value={form.date} onChange={e => setF("date", e.target.value)} style={{ flex: 1 }} />
              <Inp T={T} type="number" value={form.amount} onChange={e => setF("amount", e.target.value)} placeholder="Jumlah (Rp)" style={{ flex: 2 }} />
            </div>
            {/* Category / Debt selector */}
            {form.type === "income" && (
              <Sel T={T} value={form.category} onChange={e => setF("category", e.target.value)}>
                {TX_INCOME_CATS.map(c => <option key={c}>{c}</option>)}
              </Sel>
            )}
            {form.type === "expense" && (
              <Sel T={T} value={form.category} onChange={e => setF("category", e.target.value)}>
                {TX_EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
              </Sel>
            )}
            {form.type === "debt_payment" && (
              <Sel T={T} value={form.debtId} onChange={e => setF("debtId", e.target.value)}>
                <option value="">-- Pilih Hutang --</option>
                {(debts || []).map(d => <option key={d.id} value={d.id}>{d.name} (sisa {fmtRp(d.outstanding)})</option>)}
              </Sel>
            )}
            {/* Source wallet */}
            <Sel T={T} value={form.walletId} onChange={e => setF("walletId", e.target.value)}>
              <option value="">-- Dari Wallet --</option>
              {wallets.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
            </Sel>
            {/* Transfer: destination wallet */}
            {form.type === "transfer" && (
              <Sel T={T} value={form.toWalletId} onChange={e => setF("toWalletId", e.target.value)}>
                <option value="">-- Ke Wallet --</option>
                {wallets.filter(w => w.id !== form.walletId).map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
              </Sel>
            )}
            <Inp T={T} value={form.description} onChange={e => setF("description", e.target.value)} placeholder="Keterangan (opsional)" />
            <div style={{ display: "flex", gap: 8 }}>
              <Btn T={T} variant="primary" onClick={save} style={{ flex: 1 }} disabled={!form.amount || !form.walletId}>Simpan</Btn>
              <Btn T={T} onClick={() => setShowForm(false)} style={{ flex: 1 }}>Batal</Btn>
            </div>
          </div>
        </Card>
      )}

      {/* No wallets warning */}
      {wallets.length === 0 && (
        <Card T={T} style={{ textAlign: "center", padding: "24px 16px", marginBottom: 14, border: `1px dashed ${T.border}` }}>
          <div style={{ fontSize: 12, color: T.muted }}>Tambah wallet terlebih dahulu di menu <strong style={{ color: T.accent }}>Wallet</strong> sebelum mencatat transaksi.</div>
        </Card>
      )}

      {/* Transaction list */}
      {filtered.length === 0 && !showForm ? (
        <Card T={T} style={{ textAlign: "center", padding: "36px 16px", border: `1px dashed ${T.border}` }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>💸</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 6 }}>Belum ada transaksi</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Catat pemasukan, pengeluaran, atau pembayaran hutang Anda.</div>
          {wallets.length > 0 && <Btn T={T} variant="primary" onClick={() => setShowForm(true)}>+ Catat Pertama</Btn>}
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(t => {
            const meta = TYPE_META[t.type] || TYPE_META.expense;
            const isIncome = t.type === "income";
            return (
              <Card T={T} key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {CAT_ICONS[t.category] || meta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.category}{t.description ? ` · ${t.description}` : ""}
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                    {new Date(t.date).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })} · {walletName(t.walletId)}{t.toWalletId ? ` → ${walletName(t.toWalletId)}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: isIncome ? T.green : T.red }}>
                    {isIncome ? "+" : "-"}{fmtRp(t.amount)}
                  </div>
                  <button onClick={() => del(t.id)} style={{ fontSize: 9, color: T.muted, background: "none", border: "none", cursor: "pointer", marginTop: 3 }}>🗑</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* FAB */}
      {wallets.length > 0 && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{ position: "fixed", bottom: 24, right: 24, width: 52, height: 52, borderRadius: "50%", background: T.accent, color: "#000", border: "none", fontSize: 22, cursor: "pointer", boxShadow: `0 4px 20px ${T.accent}66`, zIndex: 50, fontWeight: 700 }}
        >+</button>
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
  const getExpense = (m) => transactions.filter(t => (t.type === "expense" || t.type === "debt_payment") && getMonth(t.date) === m).reduce((s, t) => s + Number(t.amount || 0), 0);

  const income  = getIncome(viewMonth);
  const expense = getExpense(viewMonth);
  const net     = income - expense;

  // Category breakdown for selected month
  const catMap = {};
  transactions.filter(t => (t.type === "expense" || t.type === "debt_payment") && getMonth(t.date) === viewMonth)
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

// ─── Main ArthaJourneyApp ────────────────────────────────────────────────────
export default function ArthaJourneyApp({
  user, T, isPro, isProPlus, pulseCredits,
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

  const renderScene = () => {
    switch (tab) {
      case "wallet":
        return <WalletScene T={T} wallets={ajWallets} setWallets={setAjWallets} transactions={ajTransactions} assets={assets} isPro={isPro} isProPlus={isProPlus} />;
      case "budget":
        return <BudgetScene T={T} budgets={ajBudgets} setBudgets={setAjBudgets} transactions={ajTransactions} assets={assets} activeIncomes={activeIncomes} monthlyFixedIncome={monthlyFixedIncome} />;
      case "transaksi":
        return <TransaksiScene T={T} transactions={ajTransactions} setTransactions={setAjTransactions} wallets={ajWallets} debts={debts} setDebts={setDebts} />;
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
