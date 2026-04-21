import React, { useState, useEffect } from "react";

const TX_INCOME_CATS = ["Gaji/Salary","Bonus","Freelance","Passive Income","Penjualan","Transfer Masuk","Lainnya"];
const TX_EXPENSE_CATS = ["Makan & Minum","Transportasi","Belanja","Tagihan & Utilitas","Hiburan","Kesehatan","Pendidikan","Perawatan Diri","Lainnya"];
const CAT_ICONS = {
  "Makan & Minum":"🍜","Transportasi":"🚗","Tagihan & Utilitas":"💡","Kesehatan":"❤️","Pendidikan":"📚",
  "Belanja":"🛍️","Hiburan":"🎬","Perawatan Diri":"✨","Gaji/Salary":"💼","Bonus":"🎁",
  "Freelance":"💻","Passive Income":"📊","Penjualan":"🏷️","Transfer Masuk":"↩️","Lainnya":"📦",
};
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,5); }
function parseNum(v) { return parseFloat(String(v||"0").replace(/[^\d.]/g,""))||0; }

const EMPTY_FORM = {
  type: "expense",
  walletId: "",
  toWalletId: "",
  category: "Makan & Minum",
  amount: "",
  description: "",
  date: new Date().toISOString().slice(0,10),
};

export default function QuickTxWidget({ wallets = [], setAjTransactions, T, visible = true }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM, walletId: wallets[0]?.id || "" });
  const [staging, setStaging] = useState([]);
  const [confirm, setConfirm] = useState(false);
  const [toast, setToast] = useState(false);
  const [error, setError] = useState("");

  // Auto-set walletId when wallets load
  useEffect(() => {
    if (wallets.length && !form.walletId) {
      setForm(p => ({ ...p, walletId: wallets[0].id }));
    }
  }, [wallets]); // eslint-disable-line

  // Reset category when type changes
  useEffect(() => {
    if (form.type === "expense") setForm(p => ({ ...p, category: TX_EXPENSE_CATS[0] }));
    else if (form.type === "income") setForm(p => ({ ...p, category: TX_INCOME_CATS[0] }));
  }, [form.type]); // eslint-disable-line

  const walletName = (id) => wallets.find(w => w.id === id)?.name || id;

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const addToStaging = () => {
    const amt = parseNum(form.amount);
    if (!amt) { setError("Jumlah wajib diisi."); return; }
    if (!form.walletId) { setError("Pilih wallet terlebih dahulu."); return; }
    if (form.type === "transfer" && !form.toWalletId) { setError("Pilih wallet tujuan."); return; }
    setError("");
    const tx = {
      id: genId(),
      date: form.date,
      type: form.type,
      category: form.type === "income" ? form.category : form.type === "transfer" ? "Transfer" : form.category,
      amount: amt,
      walletId: form.walletId,
      ...(form.type === "transfer" && { toWalletId: form.toWalletId }),
      description: form.description,
    };
    setStaging(prev => [...prev, tx]);
    setForm(p => ({ ...EMPTY_FORM, date: p.date, walletId: p.walletId, type: p.type, category: p.category }));
  };

  const removeFromStaging = (id) => setStaging(prev => prev.filter(tx => tx.id !== id));

  const handleSubmit = () => {
    setAjTransactions(prev => [...prev, ...staging]);
    setStaging([]);
    setConfirm(false);
    setOpen(false);
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  const totalExpense = staging.filter(t => t.type === "expense").reduce((s,t) => s + t.amount, 0);
  const totalIncome = staging.filter(t => t.type === "income").reduce((s,t) => s + t.amount, 0);

  const fmtIDR = (v) => "Rp" + Math.round(v).toLocaleString("id-ID");

  const TYPE_LABELS = { expense: "Pengeluaran", income: "Pemasukan", transfer: "Transfer" };
  const amtColor = (type) => type === "income" ? (T.green || "#3ecf8e") : type === "transfer" ? (T.accent || "#5b9cf6") : (T.red || "#f26b6b");

  const catOptions = form.type === "income" ? TX_INCOME_CATS : form.type === "expense" ? TX_EXPENSE_CATS : [];

  const inputStyle = {
    width: "100%", background: T.inputBg || T.surface, border: `1px solid ${T.border}`,
    color: T.text, borderRadius: 9, padding: "9px 12px", fontSize: 13,
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle = { color: T.textSoft || T.muted, fontSize: 10, marginBottom: 4, display: "block" };
  const toggleBtnStyle = (active, color) => ({
    flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${active ? color : T.border}`,
    background: active ? color + "22" : T.surface, color: active ? color : T.muted,
    cursor: "pointer", fontSize: 12, fontWeight: active ? "bold" : "normal",
    transition: "all 0.15s",
  });

  if (!visible) return null;

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Input Transaksi Cepat"
          style={{
            position: "fixed", bottom: 80, right: 16, zIndex: 300,
            width: 52, height: 52, borderRadius: "50%",
            background: T.accent, color: "#000",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
            transition: "transform 0.15s",
          }}
        >
          ✚
        </button>
      )}

      {/* Bottom Sheet */}
      {open && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400 }}
          />
          {/* Sheet */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0,
              maxWidth: 520, margin: "0 auto",
              borderRadius: "20px 20px 0 0", background: T.card,
              maxHeight: "85vh", overflowY: "auto",
              zIndex: 401, padding: "0 0 24px",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 16px 12px", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, background: T.card, zIndex: 1 }}>
              <div>
                <div style={{ color: T.accent, fontSize: 14, fontWeight: "bold" }}>
                  ⚡ Input Cepat
                </div>
                {staging.length > 0 && (
                  <div style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>
                    ({staging.length} transaksi)
                  </div>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18, padding: "4px 8px" }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "14px 16px" }}>
              {/* Type toggle */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[["expense","Pengeluaran","#f26b6b"],["income","Pemasukan","#3ecf8e"],["transfer","Transfer","#5b9cf6"]].map(([v,l,c]) => (
                  <button key={v} onClick={() => set("type", v)} style={toggleBtnStyle(form.type === v, c)}>{l}</button>
                ))}
              </div>

              {/* Wallet */}
              <div style={{ display: "grid", gridTemplateColumns: form.type === "transfer" ? "1fr 1fr" : "1fr", gap: 8, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>{form.type === "transfer" ? "Dari Wallet" : "Wallet"}</label>
                  <select value={form.walletId} onChange={e => set("walletId", e.target.value)} style={inputStyle}>
                    {wallets.length === 0 && <option value="">Belum ada wallet</option>}
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                {form.type === "transfer" && (
                  <div>
                    <label style={labelStyle}>Ke Wallet</label>
                    <select value={form.toWalletId} onChange={e => set("toWalletId", e.target.value)} style={inputStyle}>
                      <option value="">Pilih wallet</option>
                      {wallets.filter(w => w.id !== form.walletId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Category */}
              {form.type !== "transfer" && (
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Kategori</label>
                  <select value={form.category} onChange={e => set("category", e.target.value)} style={inputStyle}>
                    {catOptions.map(c => <option key={c} value={c}>{CAT_ICONS[c] || "📦"} {c}</option>)}
                  </select>
                </div>
              )}

              {/* Amount */}
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Jumlah (IDR)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => set("amount", e.target.value)}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Catatan (opsional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Tambahan keterangan..."
                  style={inputStyle}
                />
              </div>

              {/* Date */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Tanggal</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => set("date", e.target.value)}
                  style={inputStyle}
                />
              </div>

              {error && <div style={{ color: T.red || "#f26b6b", fontSize: 11, marginBottom: 8 }}>{error}</div>}

              <button
                onClick={addToStaging}
                style={{
                  width: "100%", padding: "11px 0", borderRadius: 10,
                  background: T.accentDim || T.surface, border: `1px solid ${T.accent}`,
                  color: T.accent, cursor: "pointer", fontSize: 13, fontWeight: "bold",
                }}
              >
                + Tambah ke Daftar
              </button>

              {/* Staging list */}
              {staging.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ color: T.textSoft || T.muted, fontSize: 10, letterSpacing: 1.5, marginBottom: 8 }}>
                    DAFTAR TRANSAKSI ({staging.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {staging.map(tx => (
                      <div key={tx.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 11px", background: T.surface, borderRadius: 9, border: `1px solid ${T.border}` }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
                          <span style={{ fontSize: 16, flexShrink: 0 }}>{CAT_ICONS[tx.category] || "📦"}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: T.text, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.category}</div>
                            <div style={{ color: T.muted, fontSize: 10 }}>{walletName(tx.walletId)} · {tx.date}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span style={{ color: amtColor(tx.type), fontSize: 12, fontWeight: "bold" }}>
                            {tx.type === "income" ? "+" : tx.type === "transfer" ? "~" : "-"}{fmtIDR(tx.amount)}
                          </span>
                          <button onClick={() => removeFromStaging(tx.id)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 5, color: T.muted, cursor: "pointer", fontSize: 13, padding: "2px 6px", lineHeight: 1 }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Total row */}
                  <div style={{ marginTop: 8, padding: "8px 11px", background: T.surface, borderRadius: 9, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${T.border}` }}>
                    <span style={{ color: T.muted, fontSize: 11 }}>Total</span>
                    <div style={{ textAlign: "right" }}>
                      {totalIncome > 0 && <div style={{ color: T.green || "#3ecf8e", fontSize: 11 }}>+{fmtIDR(totalIncome)}</div>}
                      {totalExpense > 0 && <div style={{ color: T.red || "#f26b6b", fontSize: 11 }}>-{fmtIDR(totalExpense)}</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit button — sticky bottom */}
            <div style={{ padding: "0 16px", position: "sticky", bottom: 0, background: T.card, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
              <button
                onClick={() => staging.length > 0 && setConfirm(true)}
                disabled={staging.length === 0}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 11,
                  background: staging.length > 0 ? T.accent : T.surface,
                  color: staging.length > 0 ? "#000" : T.muted,
                  border: "none", cursor: staging.length > 0 ? "pointer" : "default",
                  fontSize: 13, fontWeight: "bold", transition: "all 0.15s",
                }}
              >
                Submit ({staging.length}) Transaksi →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {confirm && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 500 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 501, background: T.card, borderRadius: 16, padding: 20, width: "min(90vw, 380px)", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ color: T.accent, fontSize: 14, fontWeight: "bold", marginBottom: 12 }}>Konfirmasi Simpan</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {staging.map(tx => (
                <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", background: T.surface, borderRadius: 8 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 14 }}>{CAT_ICONS[tx.category] || "📦"}</span>
                    <div>
                      <div style={{ color: T.text, fontSize: 12 }}>{tx.category}</div>
                      <div style={{ color: T.muted, fontSize: 10 }}>{TYPE_LABELS[tx.type]} · {tx.date}</div>
                    </div>
                  </div>
                  <span style={{ color: amtColor(tx.type), fontSize: 12, fontWeight: "bold" }}>
                    {tx.type === "income" ? "+" : tx.type === "transfer" ? "~" : "-"}{fmtIDR(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
            {(totalExpense > 0 || totalIncome > 0) && (
              <div style={{ padding: "8px 10px", background: T.surface, borderRadius: 8, marginBottom: 14 }}>
                {totalIncome > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: T.green || "#3ecf8e", fontSize: 12 }}>
                    <span>Total Pemasukan</span><span>+{fmtIDR(totalIncome)}</span>
                  </div>
                )}
                {totalExpense > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: T.red || "#f26b6b", fontSize: 12, marginTop: totalIncome > 0 ? 4 : 0 }}>
                    <span>Total Pengeluaran</span><span>-{fmtIDR(totalExpense)}</span>
                  </div>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirm(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 9, background: T.surface, border: `1px solid ${T.border}`, color: T.muted, cursor: "pointer", fontSize: 12 }}>Batal</button>
              <button onClick={handleSubmit} style={{ flex: 2, padding: "10px 0", borderRadius: 9, background: T.accent, color: "#000", border: "none", cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>✓ Simpan Sekarang</button>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 600, background: "#22c55e", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: "bold", pointerEvents: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
          ✓ Transaksi tersimpan!
        </div>
      )}
    </>
  );
}
