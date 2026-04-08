import React, { useState } from "react";

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
function fmtRp(n) { return "Rp " + Number(n || 0).toLocaleString("id-ID"); }
function curMonth() { return new Date().toISOString().slice(0, 7); }

const WALLET_ICONS = ["🏦","💳","💵","🪙","💰","🏧","👛","📱"];
const WALLET_COLORS = ["#5b9cf6","#3ecf8e","#f59e0b","#f26b6b","#9b7ef8","#ec4899","#06b6d4","#84cc16"];

const RISK_OPTIONS = [
  {
    key: "conservative",
    label: "Konservatif 🛡️",
    desc: "Prioritas keamanan modal. Cocok untuk jangka pendek ≤ 3 tahun.",
  },
  {
    key: "moderate",
    label: "Moderate 🌿",
    desc: "Keseimbangan pertumbuhan & keamanan. Jangka menengah 3–7 tahun.",
  },
  {
    key: "growth",
    label: "Growth ⚖️",
    desc: "Pertumbuhan lebih agresif, toleran fluktuasi. Jangka 5–10 tahun.",
  },
  {
    key: "aggressive",
    label: "Agresif 🚀",
    desc: "Maksimalkan return, siap risiko tinggi. Jangka panjang > 10 tahun.",
  },
];

const ASSET_OPTIONS = [
  { key: "cash",            label: "Dana Tunai / Deposito",  icon: "🏦" },
  { key: "bond",            label: "Obligasi / Sukuk",       icon: "📜" },
  { key: "equity",          label: "Saham / Reksa Dana",     icon: "📈" },
  { key: "property",        label: "Properti",               icon: "🏠" },
  { key: "crypto",          label: "Kripto",                 icon: "₿" },
  { key: "commodity",       label: "Emas / Komoditas",       icon: "🥇" },
  { key: "other",           label: "Lainnya",                icon: "📦" },
];

// ─── Progress bar ────────────────────────────────────────────────────────────
function StepProgress({ step, total, T }) {
  const pct = Math.round((step / total) * 100);
  const isAJ = step <= 6;
  const color = isAJ ? T.accent : "#9b7ef8";
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted, marginBottom: 6 }}>
        <span>{isAJ ? "🟢 Artha Journey" : "🟣 Wealth Pulse"} — Langkah {step}/{total}</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: 5, background: T.border, borderRadius: 4 }}>
        <div style={{ height: "100%", width: pct + "%", background: color, borderRadius: 4, transition: "width .4s" }} />
      </div>
    </div>
  );
}

// ─── Shared button ────────────────────────────────────────────────────────────
function PrimaryBtn({ onClick, disabled, children, color }) {
  return (
    <button
      onClick={onClick}
      disabled={!!disabled}
      style={{
        width: "100%", padding: "12px", borderRadius: 10, border: "none",
        background: disabled ? "#444" : (color || "#3ecf8e"),
        color: disabled ? "#888" : "#000",
        fontWeight: 700, fontSize: 14, cursor: disabled ? "not-allowed" : "pointer",
        marginTop: 10, transition: "background .2s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function OnboardingFlow({ T, onComplete, setAjWallets, setAjBudgets, setRiskProfile, setAssets, setGoals }) {
  const [step, setStep] = useState(1);
  const TOTAL = 10;

  // Step 2 — wallet
  const [wName,    setWName]    = useState("");
  const [wType,    setWType]    = useState("Bank");
  const [wBalance, setWBalance] = useState("");
  const [wIcon,    setWIcon]    = useState("🏦");
  const [wColor,   setWColor]   = useState("#5b9cf6");

  // Step 3 — budget
  const [bKebutuhan,  setBKebutuhan]  = useState("");
  const [bKeinginan,  setBKeinginan]  = useState("");
  const [bInvestasi,  setBInvestasi]  = useState("");

  // Step 5 — settings demo clicked
  const [settingsClicked, setSettingsClicked] = useState(false);

  // Step 8 — risk profile
  const [riskKey, setRiskKey] = useState(null);

  // Step 9 — asset
  const [aName,  setAName]  = useState("");
  const [aClass, setAClass] = useState("cash");
  const [aValue, setAValue] = useState("");

  // Step 10 — goal
  const [gName,   setGName]   = useState("");
  const [gTarget, setGTarget] = useState("");
  const [gDate,   setGDate]   = useState("");

  const next = () => setStep(s => s + 1);

  // ── Step submit handlers ──

  const saveWallet = () => {
    if (!wName.trim()) return;
    setAjWallets(prev => [...prev, {
      id: genId(), name: wName.trim(), type: wType,
      icon: wIcon, color: wColor,
      initialBalance: parseFloat(wBalance) || 0,
      createdAt: new Date().toISOString(),
    }]);
    next();
  };

  const saveBudget = () => {
    const k = parseFloat(bKebutuhan), w = parseFloat(bKeinginan), i = parseFloat(bInvestasi);
    if (!k || !w || !i || k < 1 || w < 1 || i < 1) return;
    const m = curMonth();
    setAjBudgets(prev => [...prev,
      { id: genId(), category: "Kebutuhan",        limit: k, month: m, area: "kebutuhan",  is_set: true },
      { id: genId(), category: "Keinginan",         limit: w, month: m, area: "keinginan",  is_set: true },
      { id: genId(), category: "Investasi/Saving",  limit: i, month: m, area: "investasi",  is_set: true },
    ]);
    next();
  };

  const saveRisk = () => {
    if (!riskKey) return;
    setRiskProfile(riskKey);
    next();
  };

  const saveAsset = () => {
    if (!aName.trim() || !aValue) return;
    const cls = ASSET_OPTIONS.find(a => a.key === aClass);
    setAssets(prev => [...prev, {
      id: genId(), name: aName.trim(),
      classKey: aClass,
      value: parseFloat(aValue) || 0,
      currency: "IDR",
      valueIDR: parseFloat(aValue) || 0,
      icon: cls?.icon || "📦",
      createdAt: new Date().toISOString(),
    }]);
    next();
  };

  const saveGoal = () => {
    if (!gName.trim() || !gTarget) return;
    setGoals(prev => [...prev, {
      id: genId(), name: gName.trim(),
      targetAmount: parseFloat(gTarget) || 0,
      targetDate: gDate || "",
      currentAmount: 0,
      currency: "IDR",
      createdAt: new Date().toISOString(),
    }]);
    onComplete();
  };

  // ── Layout shell ──
  const card = {
    background: T.card, borderRadius: 20, padding: "28px 24px",
    maxWidth: 440, width: "100%", boxShadow: "0 12px 40px #0008",
    border: `1px solid ${T.border}`, maxHeight: "90vh", overflowY: "auto",
  };
  const inp = {
    width: "100%", padding: "10px 12px", borderRadius: 9,
    border: `1px solid ${T.border}`, background: T.surface,
    color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box",
    marginTop: 6,
  };
  const label = { fontSize: 12, color: T.muted, fontWeight: 600, marginTop: 12, display: "block" };

  // ── Step renders ──

  const renderStep = () => {
    switch (step) {
      // ─ Step 1: Welcome AJ ─────────────────────────────────────────────
      case 1:
        return (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🗺️</div>
              <div style={{ fontWeight: 800, fontSize: 20, color: T.text, marginBottom: 10 }}>
                Welcome to Artha Journey
              </div>
              <div style={{ fontSize: 14, color: T.textSoft, lineHeight: 1.7 }}>
                Artha Journey adalah tools pengelolaan keuangan harian yang membantu Anda mencatat transaksi, mengatur budget, dan memahami arus kas secara jelas dan terstruktur.
              </div>
            </div>
            <PrimaryBtn onClick={next} color={T.accent}>Mulai Setup →</PrimaryBtn>
          </>
        );

      // ─ Step 2: Create Wallet ──────────────────────────────────────────
      case 2:
        return (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 4 }}>🏦 Tambah Wallet Pertama</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Buat wallet untuk mencatat saldo awal keuangan Anda.</div>

            <label style={label}>Nama Wallet *</label>
            <input style={inp} placeholder="cth: BCA Utama" value={wName} onChange={e => setWName(e.target.value)} />

            <label style={label}>Jenis Wallet *</label>
            <select style={inp} value={wType} onChange={e => setWType(e.target.value)}>
              {["Bank","E-Wallet","Tunai"].map(t => <option key={t}>{t}</option>)}
            </select>

            <label style={label}>Saldo Awal (Rp) *</label>
            <input style={inp} type="number" placeholder="cth: 5000000" value={wBalance} onChange={e => setWBalance(e.target.value)} />

            <label style={label}>Ikon</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
              {WALLET_ICONS.map(ic => (
                <button key={ic} onClick={() => setWIcon(ic)} style={{ fontSize: 22, padding: "7px 9px", borderRadius: 8, border: `2px solid ${wIcon===ic ? T.accent : T.border}`, background: wIcon===ic ? T.accentDim : T.surface, cursor: "pointer" }}>{ic}</button>
              ))}
            </div>

            <label style={label}>Warna</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
              {WALLET_COLORS.map(c => (
                <button key={c} onClick={() => setWColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: `3px solid ${wColor===c ? T.text : "transparent"}`, cursor: "pointer" }} />
              ))}
            </div>

            <PrimaryBtn onClick={saveWallet} disabled={!wName.trim() || !wBalance} color={T.accent}>
              Simpan & Lanjut →
            </PrimaryBtn>
          </>
        );

      // ─ Step 3: Set Budget ─────────────────────────────────────────────
      case 3:
        return (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 4 }}>📊 Atur Budget Bulanan</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
              Alokasikan anggaran bulan ini. Rekomendasi: 50% Kebutuhan / 30% Keinginan / 20% Investasi.
            </div>
            {[
              ["🏠 Kebutuhan (Rp)", bKebutuhan, setBKebutuhan, "cth: 5000000", "#3ecf8e"],
              ["🎯 Keinginan (Rp)",  bKeinginan, setBKeinginan, "cth: 3000000", "#f59e0b"],
              ["📈 Investasi (Rp)",  bInvestasi, setBInvestasi, "cth: 2000000", "#9b7ef8"],
            ].map(([lbl, val, setter, ph, color]) => (
              <div key={lbl}>
                <label style={{ ...label, color }}>{lbl} *</label>
                <input style={inp} type="number" placeholder={ph} value={val} onChange={e => setter(e.target.value)} min="1" />
              </div>
            ))}
            <PrimaryBtn
              onClick={saveBudget}
              disabled={!bKebutuhan || !bKeinginan || !bInvestasi || +bKebutuhan<1 || +bKeinginan<1 || +bInvestasi<1}
              color={T.accent}
            >
              Simpan & Lanjut →
            </PrimaryBtn>
          </>
        );

      // ─ Step 4: Info Transaksi ─────────────────────────────────────────
      case 4:
        return (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>💸</div>
              <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 8 }}>Halaman Transaksi</div>
              <div style={{ fontSize: 13, color: T.textSoft, lineHeight: 1.7 }}>
                Di halaman ini Anda dapat mencatat pemasukan dan pengeluaran harian untuk memantau kondisi keuangan Anda secara real-time.
              </div>
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[["💰","Catat Pemasukan"],["💸","Catat Pengeluaran"],["💳","Bayar Hutang"],["🔄","Transfer Wallet"]].map(([ic,lb]) => (
                  <div key={lb} style={{ background: T.surface, borderRadius: 10, padding: "10px 8px", fontSize: 11, color: T.muted }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{ic}</div>{lb}
                  </div>
                ))}
              </div>
            </div>
            <PrimaryBtn onClick={next} color={T.accent}>Lanjut →</PrimaryBtn>
          </>
        );

      // ─ Step 5: Guided — Open Settings ────────────────────────────────
      case 5:
        return (
          <>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>⚙️</div>
              <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 8 }}>Mengenal Pengaturan</div>
              <div style={{ fontSize: 13, color: T.textSoft, lineHeight: 1.7, marginBottom: 14 }}>
                Klik tombol <strong style={{ color: T.accent }}>Settings</strong> untuk mengatur preferensi tampilan, bahasa, mata uang, dan beralih antar aplikasi.
              </div>
              {!settingsClicked ? (
                <button
                  onClick={() => setSettingsClicked(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 10, border: `2px solid ${T.accent}`, background: T.accentDim, color: T.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                >
                  ⚙️ Buka Settings
                </button>
              ) : (
                <div style={{ background: "#3ecf8e22", border: "1px solid #3ecf8e44", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "#3ecf8e" }}>
                  ✅ Settings tersedia di sidebar — digunakan untuk tema, bahasa, dan berpindah app.
                </div>
              )}
            </div>
            <PrimaryBtn onClick={next} disabled={!settingsClicked} color={T.accent}>
              Lanjut →
            </PrimaryBtn>
          </>
        );

      // ─ Step 6: Guided — Switch to Wealth Pulse ───────────────────────
      case 6:
        return (
          <>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 52, marginBottom: 10 }}>🌐</div>
              <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 8 }}>Beralih ke Wealth Pulse</div>
              <div style={{ fontSize: 13, color: T.textSoft, lineHeight: 1.7, marginBottom: 16 }}>
                Pilih <strong style={{ color: "#9b7ef8" }}>Wealth Pulse</strong> untuk beralih ke mode pengelolaan aset dan investasi.
              </div>
              <div style={{ background: "#9b7ef811", border: "1px solid #9b7ef844", borderRadius: 14, padding: "16px 14px", textAlign: "left" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#9b7ef8", marginBottom: 6 }}>🌐 Wealth Pulse</div>
                <div style={{ fontSize: 12, color: T.textSoft, lineHeight: 1.6 }}>
                  Tools monitoring aset dan investasi yang membantu Anda memahami pertumbuhan kekayaan, distribusi portofolio, serta strategi keuangan jangka panjang.
                </div>
              </div>
            </div>
            <PrimaryBtn onClick={next} color="#9b7ef8">
              Pindah ke Wealth Pulse →
            </PrimaryBtn>
          </>
        );

      // ─ Step 7: Welcome WP ─────────────────────────────────────────────
      case 7:
        return (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🌐</div>
              <div style={{ fontWeight: 800, fontSize: 20, color: T.text, marginBottom: 10 }}>
                Welcome to Wealth Pulse
              </div>
              <div style={{ fontSize: 14, color: T.textSoft, lineHeight: 1.7 }}>
                Wealth Pulse adalah tools monitoring aset dan investasi yang membantu Anda memahami pertumbuhan kekayaan, distribusi portofolio, serta strategi keuangan jangka panjang.
              </div>
            </div>
            <PrimaryBtn onClick={next} color="#9b7ef8">Mulai Setup Wealth Pulse →</PrimaryBtn>
          </>
        );

      // ─ Step 8: Risk Profile ───────────────────────────────────────────
      case 8:
        return (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 4 }}>📋 Profil Risiko</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
              Pilih profil yang paling sesuai dengan tujuan dan toleransi risiko investasi Anda.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {RISK_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setRiskKey(opt.key)}
                  style={{
                    padding: "12px 14px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                    border: `2px solid ${riskKey === opt.key ? "#9b7ef8" : T.border}`,
                    background: riskKey === opt.key ? "#9b7ef811" : T.surface,
                    transition: "all .15s",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
            <PrimaryBtn onClick={saveRisk} disabled={!riskKey} color="#9b7ef8">
              Simpan & Lanjut →
            </PrimaryBtn>
          </>
        );

      // ─ Step 9: Add Asset ──────────────────────────────────────────────
      case 9:
        return (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 4 }}>💎 Tambah Aset Pertama</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Catat satu aset yang Anda miliki saat ini.</div>

            <label style={label}>Jenis Aset *</label>
            <select style={inp} value={aClass} onChange={e => setAClass(e.target.value)}>
              {ASSET_OPTIONS.map(a => <option key={a.key} value={a.key}>{a.icon} {a.label}</option>)}
            </select>

            <label style={label}>Nama Aset *</label>
            <input style={inp} placeholder="cth: Deposito BCA, Saham BBCA" value={aName} onChange={e => setAName(e.target.value)} />

            <label style={label}>Nilai / Estimasi Nilai (Rp) *</label>
            <input style={inp} type="number" placeholder="cth: 10000000" value={aValue} onChange={e => setAValue(e.target.value)} />

            <PrimaryBtn onClick={saveAsset} disabled={!aName.trim() || !aValue} color="#9b7ef8">
              Simpan & Lanjut →
            </PrimaryBtn>
          </>
        );

      // ─ Step 10: Set Goal ──────────────────────────────────────────────
      case 10:
        return (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 4 }}>🎯 Buat Goal Pertama</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Tentukan satu tujuan keuangan yang ingin Anda capai.</div>

            <label style={label}>Nama Goal *</label>
            <input style={inp} placeholder="cth: Dana Darurat, DP Rumah, Liburan" value={gName} onChange={e => setGName(e.target.value)} />

            <label style={label}>Target Nominal (Rp) *</label>
            <input style={inp} type="number" placeholder="cth: 50000000" value={gTarget} onChange={e => setGTarget(e.target.value)} />

            <label style={label}>Target Waktu (Bulan/Tahun)</label>
            <input style={{ ...inp, colorScheme: "dark" }} type="month" value={gDate} onChange={e => setGDate(e.target.value)} />

            {gTarget && (
              <div style={{ marginTop: 10, fontSize: 12, color: T.muted }}>
                Target: <strong style={{ color: T.text }}>{fmtRp(gTarget)}</strong>
              </div>
            )}

            <PrimaryBtn onClick={saveGoal} disabled={!gName.trim() || !gTarget} color="#9b7ef8">
              ✅ Selesai Setup →
            </PrimaryBtn>
          </>
        );

      default: return null;
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "#000c",
        zIndex: 2000, display: "flex", alignItems: "center",
        justifyContent: "center", padding: 16, fontFamily: "inherit",
      }}
    >
      <div style={card}>
        <StepProgress step={step} total={TOTAL} T={T} />
        {renderStep()}
      </div>
    </div>
  );
}
