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

const TX_EXPENSE_CATS = ["Makan & Minum","Transportasi","Belanja","Tagihan & Utilitas","Hiburan","Kesehatan","Pendidikan","Perawatan Diri","Lainnya"];
const TX_INCOME_CATS = ["Gaji/Salary","Bonus","Freelance","Passive Income","Penjualan","Transfer Masuk","Lainnya"];
const CAT_ICONS = {
  "Makan & Minum":"🍜","Transportasi":"🚗","Tagihan & Utilitas":"💡","Kesehatan":"❤️","Pendidikan":"📚",
  "Belanja":"🛍️","Hiburan":"🎬","Perawatan Diri":"✨","Gaji/Salary":"💼","Bonus":"🎁",
  "Freelance":"💻","Passive Income":"📊","Penjualan":"🏷️","Transfer Masuk":"↩️","Lainnya":"📦",
};

const T = {
  bg: "#0d0f14", card: "#1c2130", surface: "#161a24",
  border: "#252b3b", accent: "#f59e0b", text: "#e8eaf0",
  muted: "#6b7280", textSoft: "#9aa3b0",
  green: "#3ecf8e", red: "#f26b6b",
  inputBg: "#1c2130",
};

export default function QuickInputApp() {
  const [authState, setAuthState] = useState("checking");
  const [uid, setUid] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [form, setForm] = useState({
    type: "expense",
    walletId: "",
    toWalletId: "",
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
        const firstWallet = (data.ajWallets || [])[0]?.id || "";
        setForm(p => ({ ...p, walletId: firstWallet }));
      } catch {}
      setAuthState("ok");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (form.type === "expense") setForm(p => ({ ...p, category: TX_EXPENSE_CATS[0] }));
    else if (form.type === "income") setForm(p => ({ ...p, category: TX_INCOME_CATS[0] }));
  }, [form.type]); // eslint-disable-line

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const walletName = (id) => wallets.find(w => w.id === id)?.name || id;

  const addToStaging = () => {
    const amt = parseNum(form.amount);
    if (!amt) { setError("Jumlah wajib diisi."); return; }
    if (!form.walletId) { setError("Pilih wallet."); return; }
    if (form.type === "transfer" && !form.toWalletId) { setError("Pilih wallet tujuan."); return; }
    setError("");
    const tx = {
      id: genId(),
      date: form.date,
      type: form.type,
      category: form.type === "transfer" ? "Transfer" : form.category,
      amount: amt,
      walletId: form.walletId,
      ...(form.type === "transfer" && { toWalletId: form.toWalletId }),
      description: form.description,
    };
    setStaging(prev => [...prev, tx]);
    setForm(p => ({ ...p, amount: "", description: "" }));
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

  const amtColor = (type) => type === "income" ? T.green : type === "transfer" ? T.accent : T.red;

  const totalExpense = staging.filter(t => t.type === "expense").reduce((s,t) => s + t.amount, 0);
  const totalIncome  = staging.filter(t => t.type === "income").reduce((s,t) => s + t.amount, 0);

  const catOptions = form.type === "income" ? TX_INCOME_CATS : TX_EXPENSE_CATS;

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

        {/* Type toggle */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[["expense","Pengeluaran"],["income","Pemasukan"],["transfer","Transfer"]].map(([v,l]) => (
            <button
              key={v}
              onClick={() => set("type", v)}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 9, fontSize: 12, fontWeight: "bold",
                border: "none", cursor: "pointer",
                background: form.type === v ? T.accent : T.surface,
                color: form.type === v ? "#000" : T.muted,
                transition: "all 0.15s",
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Wallet */}
        {wallets.length === 0 ? (
          <div style={{ color: T.muted, fontSize: 13, marginBottom: 10, padding: "11px 14px", background: T.surface, borderRadius: 10 }}>
            Buat wallet di Artha Journey dulu
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: form.type === "transfer" ? "1fr 1fr" : "1fr", gap: 8, marginBottom: 0 }}>
            <div>
              <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 4 }}>
                {form.type === "transfer" ? "Dari Wallet" : "Wallet"}
              </div>
              <select value={form.walletId} onChange={e => set("walletId", e.target.value)} style={selStyle}>
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            {form.type === "transfer" && (
              <div>
                <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 4 }}>Ke Wallet</div>
                <select value={form.toWalletId} onChange={e => set("toWalletId", e.target.value)} style={selStyle}>
                  <option value="">Pilih wallet</option>
                  {wallets.filter(w => w.id !== form.walletId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Category */}
        {form.type !== "transfer" && (
          <>
            <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 4 }}>Kategori</div>
            <select value={form.category} onChange={e => set("category", e.target.value)} style={selStyle}>
              {catOptions.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
            </select>
          </>
        )}

        {/* Amount */}
        <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 4 }}>Jumlah (IDR)</div>
        <input
          type="number"
          value={form.amount}
          onChange={e => set("amount", e.target.value)}
          placeholder="0"
          style={inpStyle}
        />

        {/* Description */}
        <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 4 }}>Catatan (opsional)</div>
        <input
          type="text"
          value={form.description}
          onChange={e => set("description", e.target.value)}
          placeholder="Tambahan keterangan..."
          style={inpStyle}
        />

        {/* Date */}
        <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 4 }}>Tanggal</div>
        <input
          type="date"
          value={form.date}
          onChange={e => set("date", e.target.value)}
          style={inpStyle}
        />

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
