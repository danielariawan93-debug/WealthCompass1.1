import React, { useState, useEffect } from "react";
import { getApps, initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBUKtd-3swn6ZDA3lqHa8nAnNPvZ3d7Va0",
  authDomain: "wealthcompass-fee04.firebaseapp.com",
  projectId: "wealthcompass-fee04",
  storageBucket: "wealthcompass-fee04.firebasestorage.app",
  messagingSenderId: "803676982970",
  appId: "1:803676982970:web:f31ccd09d4021b60e0bc83",
};
const fbApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(fbApp);
const auth = getAuth(fbApp);

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,5); }
function parseNum(v) { return parseFloat(String(v||"0").replace(/[^\d.]/g,""))||0; }
function fmtIDR(v) { return "Rp" + Math.round(v).toLocaleString("id-ID"); }

const DANA_WALLET_TYPES = ["Bank", "E-Wallet", "Tunai"];
const KREDIT_WALLET_TYPES = ["Paylater", "Kartu Kredit", "Rekening Koran"];

const AREA_DEFS = {
  kebutuhan: {
    label: "Kebutuhan", icon: "🏠", color: "#5b9cf6",
    cats: ["Makan & Minum","Belanja Dapur","Transportasi","Tagihan & Utilitas","Listrik & Air","Internet & Phone","Kesehatan","Pendidikan","Anak & Keluarga","Sewa / KPR","Kebutuhan Lainnya"],
  },
  keinginan: {
    label: "Keinginan", icon: "🛍️", color: "#f59e0b",
    cats: ["Makan di Luar","Hiburan","Belanja","Perawatan Diri","Liburan","Hobi & Game","Langganan (Netflix dll)","Keinginan Lainnya"],
  },
  tabungan: {
    label: "Tabungan & Investasi", icon: "💰", color: "#3ecf8e",
    cats: ["Dana Darurat","Investasi Saham/Reksa","Cicilan Aset","Asuransi","Tabungan Tujuan","Tabungan Lainnya"],
  },
};

const TX_INCOME_CATS = ["Gaji/Salary","Bonus","Freelance","Passive Income","Penjualan","Transfer Masuk","Lainnya"];

const CAT_ICONS = {
  "Makan & Minum":"🍜","Belanja Dapur":"🛒","Transportasi":"🚗","Tagihan & Utilitas":"💡",
  "Listrik & Air":"⚡","Internet & Phone":"📶","Kesehatan":"❤️","Pendidikan":"📚",
  "Anak & Keluarga":"👶","Sewa / KPR":"🏠","Kebutuhan Lainnya":"📦",
  "Makan di Luar":"🍽️","Hiburan":"🎬","Belanja":"🛍️","Perawatan Diri":"✨",
  "Liburan":"✈️","Hobi & Game":"🎮","Langganan (Netflix dll)":"📺","Keinginan Lainnya":"🌟",
  "Dana Darurat":"🛡️","Investasi Saham/Reksa":"📈","Cicilan Aset":"🏡","Asuransi":"☂️",
  "Tabungan Tujuan":"🎯","Tabungan Lainnya":"💰",
  "Gaji/Salary":"💼","Bonus":"🎁","Freelance":"💻","Passive Income":"📊",
  "Penjualan":"🏷️","Transfer Masuk":"↩️","Lainnya":"📦",
};

const TYPE_META = {
  income:       { label: "Pemasukan",    icon: "💰", color: "#3ecf8e" },
  expense:      { label: "Pengeluaran",  icon: "💸", color: "#f26b6b" },
  debt_payment: { label: "Bayar Hutang", icon: "💳", color: "#f59e0b" },
  transfer:     { label: "Transfer",     icon: "↔️", color: "#9b7ef8" },
};

const T = {
  bg: "#0d0f14", card: "#1c2130", surface: "#161a24",
  border: "#252b3b", accent: "#f59e0b", accentDim: "#f59e0b22", text: "#e8eaf0",
  muted: "#6b7280", textSoft: "#9aa3b0",
  green: "#3ecf8e", red: "#f26b6b",
  inputBg: "#1c2130",
};

function CategoryPicker({ value, onChange, type = "expense" }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const areas = Object.entries(AREA_DEFS).map(([key, def]) => ({
    key, label: def.label, icon: def.icon, color: def.color,
    cats: def.cats.filter(c => !c.endsWith("Lainnya")),
  }));

  const displayLabel = value ? `${CAT_ICONS[value] || "📦"} ${value}` : "Pilih kategori...";
  const matchesSearch = (c) => !search || c.toLowerCase().includes(search.toLowerCase());

  return (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <button
        onClick={() => { setOpen(o => !o); setSearch(""); }}
        style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${open ? T.accent : T.border}`, background: T.inputBg, color: value ? T.text : T.muted, textAlign: "left", cursor: "pointer", fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box" }}
      >
        <span>{displayLabel}</span>
        <span style={{ fontSize: 10, color: T.muted }}>▾</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
          <div style={{ position: "absolute", zIndex: 200, top: "calc(100% + 4px)", left: 0, right: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, maxHeight: 280, overflowY: "auto", boxShadow: "0 8px 32px #0008" }}>
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
                  {value === cat && <span style={{ color: T.accent }}>✓</span>}
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
                        {value === cat && <span style={{ color: T.accent }}>✓</span>}
                      </button>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function QuickInputApp() {
  const [authState, setAuthState] = useState("checking");
  const [uid, setUid] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [debts, setDebts] = useState([]);
  const [form, setForm] = useState({
    type: "expense",
    walletId: "",
    toWalletId: "",
    debtId: "",
    category: "Makan & Minum",
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0,10),
  });
  const [staging, setStaging] = useState([]);
  const [confirm, setConfirm] = useState(false);
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Input Cepat – Artha Journey";
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setAuthState("noauth"); return; }
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? (snap.data().data || {}) : {};
        setWallets(data.ajWallets || []);
        setDebts(data.debts || []);
        const danaWallets = (data.ajWallets || []).filter(w => DANA_WALLET_TYPES.includes(w.type));
        const firstWallet = danaWallets[0]?.id || (data.ajWallets || [])[0]?.id || "";
        setForm(p => ({ ...p, walletId: firstWallet }));
      } catch {}
      setAuthState("ok");
    });
    return () => unsub();
  }, []);

  const setType = (t) => {
    const cat = t === "income" ? "Gaji/Salary" : t === "expense" ? "Makan & Minum" : "";
    setForm(p => ({ ...p, type: t, category: cat, debtId: "", toWalletId: "" }));
  };

  const walletName = (id) => wallets.find(w => w.id === id)?.name || id;

  const addToStaging = () => {
    const amt = parseNum(form.amount);
    if (!amt) { setError("Jumlah wajib diisi."); return; }
    if (!form.walletId) { setError("Pilih wallet."); return; }
    if (form.type === "transfer" && !form.toWalletId) { setError("Pilih wallet tujuan."); return; }
    if (form.type === "debt_payment" && !form.debtId) { setError("Pilih hutang yang dibayar."); return; }
    setError("");
    const debtName = debts.find(d => d.id === form.debtId)?.name || "Bayar Hutang";
    const tx = {
      id: genId(),
      date: form.date,
      type: form.type,
      category: form.type === "debt_payment" ? debtName
              : form.type === "transfer" ? "Transfer"
              : form.category,
      amount: amt,
      walletId: form.walletId,
      toWalletId: form.type === "transfer" ? form.toWalletId : "",
      debtId: form.type === "debt_payment" ? form.debtId : "",
      description: form.description,
    };
    setStaging(prev => [...prev, tx]);
    setForm(p => ({ ...p, amount: "", description: "", debtId: "" }));
  };

  const removeFromStaging = (id) => setStaging(prev => prev.filter(t => t.id !== id));

  const handleSubmit = async () => {
    if (!uid || staging.length === 0) return;
    setSubmitting(true);
    try {
      const snap = await getDoc(doc(db, "users", uid));
      const existing = snap.exists() ? (snap.data().data || {}) : {};
      const currentTxs = existing.ajTransactions || [];
      const merged = [...currentTxs, ...staging];
      await setDoc(
        doc(db, "users", uid),
        { data: { ...existing, ajTransactions: merged }, updatedAt: Date.now() },
        { merge: true }
      );
      setStaging([]);
      setConfirm(false);
      setToast("success");
      setTimeout(() => setToast(""), 2500);
    } catch {
      setToast("error");
      setTimeout(() => setToast(""), 2500);
    }
    setSubmitting(false);
  };

  const inpStyle = {
    width: "100%", boxSizing: "border-box",
    background: T.inputBg, border: `1px solid ${T.border}`,
    color: T.text, borderRadius: 10, padding: "11px 14px",
    fontSize: 14, outline: "none", marginBottom: 10,
  };
  const selStyle = { ...inpStyle, marginBottom: 10 };

  const amtColor = (type) => TYPE_META[type]?.color || T.red;

  const totalExpense = staging.filter(t => t.type === "expense" || t.type === "debt_payment").reduce((s,t) => s + t.amount, 0);
  const totalIncome  = staging.filter(t => t.type === "income").reduce((s,t) => s + t.amount, 0);

  // --- Checking state ---
  if (authState === "checking") {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: T.muted, fontSize: 14 }}>Memuat...</div>
      </div>
    );
  }

  // --- No auth state ---
  if (authState === "noauth") {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: T.card, borderRadius: 16, padding: 28, textAlign: "center", maxWidth: 320, width: "100%" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <div style={{ color: T.text, fontSize: 15, marginBottom: 8, fontWeight: "bold" }}>Belum Login</div>
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>Silakan login ke WealthCompass terlebih dahulu</div>
          <button
            onClick={() => { window.location.href = "/"; }}
            style={{ width: "100%", padding: "12px 0", borderRadius: 10, background: T.accent, color: "#000", border: "none", cursor: "pointer", fontSize: 14, fontWeight: "bold" }}
          >
            Buka WealthCompass
          </button>
        </div>
      </div>
    );
  }

  // --- Authenticated state ---
  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } input::placeholder { color: ${T.muted}; } select option { background: ${T.card}; }`}</style>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: T.card, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🧭</span>
          <span style={{ color: T.accent, fontSize: 15, fontWeight: "bold" }}>Input Cepat</span>
        </div>
        <button
          onClick={() => { window.location.href = "/"; }}
          style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 13 }}
        >
          ← App
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 16px 120px" }}>

        {/* Type selector — 4 buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {Object.entries(TYPE_META).map(([k, m]) => (
            <button key={k} onClick={() => setType(k)}
              style={{ padding: "10px 4px", borderRadius: 10, border: `1px solid ${form.type===k ? m.color : T.border}`, background: form.type===k ? m.color+"22" : T.surface, color: form.type===k ? m.color : T.muted, fontSize: 10, cursor: "pointer", fontWeight: form.type===k ? 700 : 400, textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
              <div>{m.label}</div>
            </button>
          ))}
        </div>

        {/* Date + Amount row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input type="date" value={form.date} onChange={e => setForm(p=>({...p, date: e.target.value}))}
            style={{ ...inpStyle, flex: 1, marginBottom: 0 }} />
          <input type="number" value={form.amount} onChange={e => setForm(p=>({...p, amount: e.target.value}))}
            placeholder="Jumlah (Rp)" style={{ ...inpStyle, flex: 2, marginBottom: 0 }} />
        </div>

        {/* Category picker */}
        {form.type === "expense" && (
          <CategoryPicker value={form.category} onChange={v => setForm(p=>({...p, category: v}))} type="expense" />
        )}
        {form.type === "income" && (
          <CategoryPicker value={form.category} onChange={v => setForm(p=>({...p, category: v}))} type="income" />
        )}

        {/* Debt selector */}
        {form.type === "debt_payment" && (
          <select value={form.debtId} onChange={e => setForm(p=>({...p, debtId: e.target.value}))} style={selStyle}>
            <option value="">-- Pilih Hutang --</option>
            {debts.map(d => <option key={d.id} value={d.id}>{d.name} (sisa Rp{Math.round(d.outstanding||0).toLocaleString("id-ID")})</option>)}
          </select>
        )}

        {/* Wallet selector */}
        {(() => {
          const danaOnly = form.type === "transfer" || form.type === "debt_payment";
          const srcWallets = danaOnly ? wallets.filter(w => DANA_WALLET_TYPES.includes(w.type)) : wallets;
          return (
            <select value={form.walletId} onChange={e => setForm(p=>({...p, walletId: e.target.value}))} style={selStyle}>
              <option value="">{danaOnly ? "-- Dari Akun Dana --" : "-- Dari Wallet --"}</option>
              {srcWallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          );
        })()}

        {/* To wallet (transfer only) */}
        {form.type === "transfer" && (
          <select value={form.toWalletId} onChange={e => setForm(p=>({...p, toWalletId: e.target.value}))} style={selStyle}>
            <option value="">-- Ke Akun Dana --</option>
            {wallets.filter(w => DANA_WALLET_TYPES.includes(w.type) && w.id !== form.walletId)
              .map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        )}

        {/* Description */}
        <input type="text" value={form.description} onChange={e => setForm(p=>({...p, description: e.target.value}))}
          placeholder="Keterangan (opsional)" style={inpStyle} />

        {error && <div style={{ color: T.red, fontSize: 12, marginBottom: 10 }}>{error}</div>}

        <button
          onClick={addToStaging}
          style={{ width: "100%", padding: "12px 0", borderRadius: 10, background: T.surface, border: `1px solid ${T.accent}`, color: T.accent, cursor: "pointer", fontSize: 14, fontWeight: "bold", marginBottom: 20 }}
        >
          + Tambah ke Daftar
        </button>

        {/* Staging list */}
        {staging.length > 0 && (
          <div>
            <div style={{ color: T.textSoft, fontSize: 10, letterSpacing: 1.5, marginBottom: 8 }}>
              DAFTAR ({staging.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {staging.map(tx => (
                <div key={tx.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: T.card, borderRadius: 10, border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{CAT_ICONS[tx.category] || "📦"}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: T.text, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.category}</div>
                      <div style={{ color: T.muted, fontSize: 11 }}>{walletName(tx.walletId)} · {tx.date}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ color: amtColor(tx.type), fontSize: 13, fontWeight: "bold" }}>
                      {tx.type === "income" ? "+" : tx.type === "transfer" ? "~" : "-"}{fmtIDR(tx.amount)}
                    </span>
                    <button onClick={() => removeFromStaging(tx.id)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, color: T.muted, cursor: "pointer", fontSize: 14, padding: "3px 8px", lineHeight: 1 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: T.card, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <span style={{ color: T.muted, fontSize: 12 }}>Total</span>
              <div style={{ textAlign: "right" }}>
                {totalIncome > 0 && <div style={{ color: T.green, fontSize: 12 }}>+{fmtIDR(totalIncome)}</div>}
                {totalExpense > 0 && <div style={{ color: T.red, fontSize: 12 }}>-{fmtIDR(totalExpense)}</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit — sticky bottom */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: T.card, borderTop: `1px solid ${T.border}` }}>
        <button
          onClick={() => staging.length > 0 && setConfirm(true)}
          disabled={staging.length === 0}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 11,
            background: staging.length > 0 ? T.accent : T.surface,
            color: staging.length > 0 ? "#000" : T.muted,
            border: "none", cursor: staging.length > 0 ? "pointer" : "default",
            fontSize: 14, fontWeight: "bold", transition: "all 0.15s",
          }}
        >
          Submit ({staging.length}) Transaksi →
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirm && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 500 }} onClick={() => setConfirm(false)} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 501, background: T.card, borderRadius: 16, padding: 20, width: "min(90vw, 380px)", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ color: T.accent, fontSize: 14, fontWeight: "bold", marginBottom: 14 }}>Konfirmasi Simpan</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {staging.map(tx => (
                <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: T.surface, borderRadius: 9 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 16 }}>{CAT_ICONS[tx.category] || "📦"}</span>
                    <div>
                      <div style={{ color: T.text, fontSize: 13 }}>{tx.category}</div>
                      <div style={{ color: T.muted, fontSize: 11 }}>{tx.date}</div>
                    </div>
                  </div>
                  <span style={{ color: amtColor(tx.type), fontSize: 13, fontWeight: "bold" }}>
                    {tx.type === "income" ? "+" : tx.type === "transfer" ? "~" : "-"}{fmtIDR(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
            {(totalExpense > 0 || totalIncome > 0) && (
              <div style={{ padding: "10px 12px", background: T.surface, borderRadius: 9, marginBottom: 14 }}>
                {totalIncome > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: T.green, fontSize: 13 }}>
                    <span>Total Pemasukan</span><span>+{fmtIDR(totalIncome)}</span>
                  </div>
                )}
                {totalExpense > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: T.red, fontSize: 13, marginTop: totalIncome > 0 ? 6 : 0 }}>
                    <span>Total Pengeluaran</span><span>-{fmtIDR(totalExpense)}</span>
                  </div>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirm(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 9, background: T.surface, border: `1px solid ${T.border}`, color: T.muted, cursor: "pointer", fontSize: 13 }}>Batal</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ flex: 2, padding: "11px 0", borderRadius: 9, background: T.accent, color: "#000", border: "none", cursor: "pointer", fontSize: 13, fontWeight: "bold" }}
              >
                {submitting ? "Menyimpan..." : "✓ Simpan Sekarang"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 600, padding: "11px 22px", borderRadius: 10, fontSize: 13, fontWeight: "bold", pointerEvents: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", background: toast === "success" ? "#22c55e" : T.red, color: "#fff" }}>
          {toast === "success" ? "✓ Tersimpan! Buka app untuk lihat." : "Gagal menyimpan. Coba lagi."}
        </div>
      )}
    </div>
  );
}
