import React, { useState } from "react";
import { RISK_QUESTIONS, RISK_PROFILES, KONSUMTIF, DEBT_DEFAULT_RATES } from "../constants/data";

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
function fmtRp(n) { return "Rp " + Number(n || 0).toLocaleString("id-ID"); }
function curMonth() { return new Date().toISOString().slice(0, 7); }

const WALLET_ICONS  = ["🏦","💳","💵","🪙","💰","🏧","👛","📱"];
const WALLET_COLORS = ["#5b9cf6","#3ecf8e","#f59e0b","#f26b6b","#9b7ef8","#ec4899","#06b6d4","#84cc16"];

const ASSET_OPTIONS = [
  { key: "cash",      label: "Dana Tunai / Deposito", icon: "🏦" },
  { key: "bond",      label: "Obligasi / Sukuk",      icon: "📜" },
  { key: "equity",    label: "Saham / Reksa Dana",    icon: "📈" },
  { key: "property",  label: "Properti",              icon: "🏠" },
  { key: "crypto",    label: "Kripto",                icon: "₿"  },
  { key: "commodity", label: "Emas / Komoditas",      icon: "🥇" },
  { key: "other",     label: "Lainnya",               icon: "📦" },
];

const INCOME_TYPES = [
  { key: "gaji",      label: "Gaji / Salary"         },
  { key: "freelance", label: "Freelance / Honorarium" },
  { key: "bisnis",    label: "Pendapatan Bisnis"      },
  { key: "investasi", label: "Hasil Investasi"        },
  { key: "lainnya",   label: "Lainnya"                },
];

// ─── Progress bar ─────────────────────────────────────────────────────────────
function StepProgress({ step, total, T }) {
  const pct   = Math.round((step / total) * 100);
  const isAJ  = step <= 7;
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

// ─── Shared buttons ───────────────────────────────────────────────────────────
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

function SecondaryBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", padding: "10px", borderRadius: 10,
        border: "1px solid #555", background: "transparent",
        color: "#aaa", fontWeight: 600, fontSize: 13,
        cursor: "pointer", marginTop: 8,
      }}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function OnboardingFlow({
  T, onComplete,
  setAjWallets, setAjBudgets,
  setRiskProfile, setAssets, setGoals,
  setMonthlyIncome = () => {},
  setDebts = () => {},
}) {
  const [step, setStep] = useState(1);
  const TOTAL = 14;

  // Step 2 — income
  const [income,     setIncome]     = useState("");
  const [incomeType, setIncomeType] = useState("gaji");

  // Step 3 — wallet
  const [wName,    setWName]    = useState("");
  const [wType,    setWType]    = useState("Bank");
  const [wBalance, setWBalance] = useState("");
  const [wIcon,    setWIcon]    = useState("🏦");
  const [wColor,   setWColor]   = useState("#5b9cf6");

  // Step 4 — budget
  const [bKebutuhan, setBKebutuhan] = useState("");
  const [bKeinginan, setBKeinginan] = useState("");
  const [bInvestasi, setBInvestasi] = useState("");

  // Step 6 — settings demo clicked
  const [settingsClicked, setSettingsClicked] = useState(false);

  // Step 9 — risk profile
  const [riskAnswers, setRiskAnswers] = useState({});
  const riskAnswered = Object.keys(riskAnswers).length;
  const riskScore    = Object.values(riskAnswers).reduce((a, b) => a + b, 0);
  const riskAllDone  = riskAnswered === RISK_QUESTIONS.length;

  // Step 10 — asset
  const [aName,  setAName]  = useState("");
  const [aClass, setAClass] = useState("cash");
  const [aValue, setAValue] = useState("");

  // Step 11 — debt (optional)
  const [dName,   setDName]   = useState("");
  const [dType,   setDType]   = useState(KONSUMTIF[0]?.key || "kpr");
  const [dAmount, setDAmount] = useState("");
  const [dRate,   setDRate]   = useState(DEBT_DEFAULT_RATES[KONSUMTIF[0]?.key] || 9.5);
  const [debtSaved, setDebtSaved] = useState(false);

  // Step 13 — goal
  const [gName,   setGName]   = useState("");
  const [gTarget, setGTarget] = useState("");
  const [gDate,   setGDate]   = useState("");

  const next = () => setStep(s => s + 1);

  // ── Submit handlers ──

  const saveIncome = () => {
    if (!income || +income < 1) return;
    setMonthlyIncome(income);
    next();
  };

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
      { id: genId(), category: "Kebutuhan",       limit: k, month: m, area: "kebutuhan", is_set: true },
      { id: genId(), category: "Keinginan",        limit: w, month: m, area: "keinginan", is_set: true },
      { id: genId(), category: "Investasi/Saving", limit: i, month: m, area: "investasi", is_set: true },
    ]);
    next();
  };

  const saveRisk = () => {
    if (!riskAllDone) return;
    const key = Object.entries(RISK_PROFILES).find(
      ([, v]) => riskScore >= v.range[0] && riskScore <= v.range[1]
    )?.[0] || "moderate";
    setRiskProfile(key);
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

  const saveDebt = () => {
    if (!dName.trim() || !dAmount) return;
    const typeInfo = KONSUMTIF.find(d => d.key === dType);
    setDebts(prev => [...prev, {
      id: genId(), name: dName.trim(),
      type: dType,
      icon: typeInfo?.icon || "💳",
      totalAmount: parseFloat(dAmount) || 0,
      remainingAmount: parseFloat(dAmount) || 0,
      interestRate: parseFloat(dRate) || 0,
      mode: typeInfo?.mode || "amortizing",
      currency: "IDR",
      createdAt: new Date().toISOString(),
    }]);
    setDebtSaved(true);
    next();
  };

  const skipDebt = () => {
    setDebtSaved(false);
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
    next();
  };

  // ── Shared styles ──
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
  const lbl = { fontSize: 12, color: T.muted, fontWeight: 600, marginTop: 12, display: "block" };

  // ── Step renders ──
  const renderStep = () => {
    switch (step) {

      // ─ Step 1: Welcome AJ ──────────────────────────────────────────────
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

      // ─ Step 2: Set Monthly Income [NEW] ────────────────────────────────
      case 2:
        return (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 4 }}>💼 Pendapatan Bulanan</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
              Masukkan pendapatan bersih per bulan untuk membantu rekomendasi alokasi budget.
            </div>

            <label style={lbl}>Jenis Pendapatan *</label>
            <select style={inp} value={incomeType} onChange={e => setIncomeType(e.target.value)}>
              {INCOME_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>

            <label style={lbl}>Pendapatan Bersih / Bulan (Rp) *</label>
            <input
              style={inp} type="number" placeholder="cth: 8000000"
              value={income} onChange={e => setIncome(e.target.value)} min="1"
            />

            {income && +income > 0 && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: T.surface, borderRadius: 9, fontSize: 12 }}>
                <div style={{ color: T.muted, marginBottom: 6 }}>Rekomendasi alokasi 50/30/20:</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {[
                    ["🏠 Kebutuhan", 0.5,  "#3ecf8e"],
                    ["🎯 Keinginan",  0.3,  "#f59e0b"],
                    ["📈 Investasi",  0.2,  "#9b7ef8"],
                  ].map(([label, pct, color]) => (
                    <div key={label} style={{ textAlign: "center", padding: "6px 4px", background: T.card, borderRadius: 7 }}>
                      <div style={{ fontSize: 10, color: T.muted }}>{label}</div>
                      <div style={{ fontWeight: 700, color, fontSize: 11, marginTop: 3 }}>
                        {fmtRp(Math.round(+income * pct))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <PrimaryBtn onClick={saveIncome} disabled={!income || +income < 1} color={T.accent}>
              Simpan & Lanjut →
            </PrimaryBtn>
          </>
        );

      // ─ Step 3: Create Wallet ────────────────────────────────────────────
      case 3:
        return (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 4 }}>🏦 Tambah Wallet Pertama</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Buat wallet untuk mencatat saldo awal keuangan Anda.</div>

            <label style={lbl}>Nama Wallet *</label>
            <input style={inp} placeholder="cth: BCA Utama" value={wName} onChange={e => setWName(e.target.value)} />

            <label style={lbl}>Jenis Wallet</label>
            <select style={inp} value={wType} onChange={e => setWType(e.target.value)}>
              {["Bank","E-Wallet","Tunai"].map(t => <option key={t}>{t}</option>)}
            </select>

            <label style={lbl}>Saldo Awal (Rp)</label>
            <input style={inp} type="number" placeholder="cth: 5000000" value={wBalance} onChange={e => setWBalance(e.target.value)} />

            <label style={lbl}>Ikon</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
              {WALLET_ICONS.map(ic => (
                <button key={ic} onClick={() => setWIcon(ic)} style={{
                  fontSize: 22, padding: "7px 9px", borderRadius: 8, cursor: "pointer",
                  border: `2px solid ${wIcon === ic ? T.accent : T.border}`,
                  background: wIcon === ic ? T.accentDim : T.surface,
                }}>{ic}</button>
              ))}
            </div>

            <label style={lbl}>Warna</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
              {WALLET_COLORS.map(c => (
                <button key={c} onClick={() => setWColor(c)} style={{
                  width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer",
                  border: `3px solid ${wColor === c ? T.text : "transparent"}`,
                }} />
              ))}
            </div>

            <PrimaryBtn onClick={saveWallet} disabled={!wName.trim()} color={T.accent}>
              Simpan & Lanjut →
            </PrimaryBtn>
          </>
        );

      // ─ Step 4: Set Budget ───────────────────────────────────────────────
      case 4: {
        const incomeNum = parseFloat(income) || 0;
        return (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 4 }}>📊 Atur Budget Bulanan</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
              Alokasikan anggaran bulan ini. Rekomendasi: 50% Kebutuhan / 30% Keinginan / 20% Investasi.
            </div>
            {[
              ["🏠 Kebutuhan (Rp)", bKebutuhan, setBKebutuhan, "cth: 4000000", "#3ecf8e", 0.5],
              ["🎯 Keinginan (Rp)",  bKeinginan, setBKeinginan, "cth: 2400000", "#f59e0b", 0.3],
              ["📈 Investasi (Rp)",  bInvestasi,  setBInvestasi,  "cth: 1600000", "#9b7ef8", 0.2],
            ].map(([label, val, setter, ph, color, pct]) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <span style={{ fontSize: 12, color, fontWeight: 600 }}>{label} *</span>
                  {incomeNum > 0 && (
                    <button
                      onClick={() => setter(String(Math.round(incomeNum * pct)))}
                      style={{ fontSize: 10, color, background: "transparent", border: `1px solid ${color}44`, borderRadius: 5, padding: "2px 7px", cursor: "pointer" }}
                    >
                      {fmtRp(Math.round(incomeNum * pct))}
                    </button>
                  )}
                </div>
                <input style={inp} type="number" placeholder={ph} value={val} onChange={e => setter(e.target.value)} min="1" />
              </div>
            ))}
            <PrimaryBtn
              onClick={saveBudget}
              disabled={!bKebutuhan || !bKeinginan || !bInvestasi || +bKebutuhan < 1 || +bKeinginan < 1 || +bInvestasi < 1}
              color={T.accent}
            >
              Simpan & Lanjut →
            </PrimaryBtn>
          </>
        );
      }

      // ─ Step 5: Transaction Info ─────────────────────────────────────────
      case 5:
        return (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>💸</div>
              <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 8 }}>Halaman Transaksi</div>
              <div style={{ fontSize: 13, color: T.textSoft, lineHeight: 1.7 }}>
                Di halaman ini Anda dapat mencatat pemasukan dan pengeluaran harian untuk memantau kondisi keuangan secara real-time.
              </div>
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[["💰","Catat Pemasukan"],["💸","Catat Pengeluaran"],["💳","Bayar Hutang"],["🔄","Transfer Wallet"]].map(([ic, lb]) => (
                  <div key={lb} style={{ background: T.surface, borderRadius: 10, padding: "10px 8px", fontSize: 11, color: T.muted }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{ic}</div>{lb}
                  </div>
                ))}
              </div>
            </div>
            <PrimaryBtn onClick={next} color={T.accent}>Lanjut →</PrimaryBtn>
          </>
        );

      // ─ Step 6: Settings Guide ───────────────────────────────────────────
      case 6:
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
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "11px 22px", borderRadius: 10,
                    border: `2px solid ${T.accent}`, background: T.accentDim,
                    color: T.accent, fontWeight: 700, fontSize: 14, cursor: "pointer",
                  }}
                >
                  ⚙️ Buka Settings
                </button>
              ) : (
                <div style={{ background: "#3ecf8e22", border: "1px solid #3ecf8e44", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "#3ecf8e" }}>
                  ✅ Settings tersedia di sidebar — digunakan untuk tema, bahasa, dan berpindah app.
                </div>
              )}
            </div>
            <PrimaryBtn onClick={next} disabled={!settingsClicked} color={T.accent}>Lanjut →</PrimaryBtn>
          </>
        );

      // ─ Step 7: Switch to Wealth Pulse ───────────────────────────────────
      case 7:
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
            <PrimaryBtn onClick={next} color="#9b7ef8">Pindah ke Wealth Pulse →</PrimaryBtn>
          </>
        );

      // ─ Step 8: Welcome WP ───────────────────────────────────────────────
      case 8:
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

      // ─ Step 9: Risk Profile ─────────────────────────────────────────────
      case 9:
        return (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 4 }}>📋 Profil Risiko Investasi</div>
            <div style={{ fontSize: 12, color: T.textSoft, marginBottom: 10, padding: "8px 12px", background: "#9b7ef811", borderRadius: 8, borderLeft: "3px solid #9b7ef8", lineHeight: 1.6 }}>
              Jawab {RISK_QUESTIONS.length} pertanyaan dengan jujur untuk menentukan strategi investasi yang tepat.
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted, marginBottom: 4 }}>
              <span>{riskAnswered}/{RISK_QUESTIONS.length} terjawab</span>
              {riskAllDone && <span style={{ color: "#3ecf8e" }}>✓ Selesai · Skor: {riskScore.toFixed(0)}/28</span>}
            </div>
            <div style={{ height: 4, background: T.border, borderRadius: 4, marginBottom: 14 }}>
              <div style={{ height: "100%", width: `${(riskAnswered / RISK_QUESTIONS.length) * 100}%`, background: "#9b7ef8", borderRadius: 4, transition: "width .3s" }} />
            </div>
            {RISK_QUESTIONS.map((q, qi) => (
              <div key={qi} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <span style={{ color: "#9b7ef8", fontWeight: "bold", fontSize: 14, minWidth: 20 }}>{qi + 1}</span>
                  <span style={{ fontSize: 12, color: T.text, lineHeight: 1.6 }}>{q.q}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginLeft: 28 }}>
                  {q.opts.map(([optLabel, val], oi) => (
                    <button
                      key={oi}
                      onClick={() => setRiskAnswers(p => ({ ...p, [qi]: val }))}
                      style={{
                        padding: "8px 10px", borderRadius: 8, textAlign: "left", cursor: "pointer",
                        border: `1px solid ${riskAnswers[qi] === val ? "#9b7ef8" : T.border}`,
                        background: riskAnswers[qi] === val ? "#9b7ef811" : T.surface,
                        color: riskAnswers[qi] === val ? "#9b7ef8" : T.textSoft,
                        fontSize: 11, lineHeight: 1.5, transition: "all .15s",
                      }}
                    >
                      <span style={{ color: T.muted, fontSize: 9, marginRight: 4 }}>{["A","B","C","D"][oi]}</span>
                      {optLabel}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <PrimaryBtn onClick={saveRisk} disabled={!riskAllDone} color="#9b7ef8">
              {riskAllDone ? "Analisa & Lanjut →" : `${RISK_QUESTIONS.length - riskAnswered} pertanyaan lagi`}
            </PrimaryBtn>
          </>
        );

      // ─ Step 10: Add First Asset ─────────────────────────────────────────
      case 10:
        return (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 4 }}>💎 Tambah Aset Pertama</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Catat satu aset yang Anda miliki saat ini.</div>

            <label style={lbl}>Jenis Aset *</label>
            <select style={inp} value={aClass} onChange={e => setAClass(e.target.value)}>
              {ASSET_OPTIONS.map(a => <option key={a.key} value={a.key}>{a.icon} {a.label}</option>)}
            </select>

            <label style={lbl}>Nama Aset *</label>
            <input style={inp} placeholder="cth: Deposito BCA, Saham BBCA" value={aName} onChange={e => setAName(e.target.value)} />

            <label style={lbl}>Nilai / Estimasi Nilai (Rp) *</label>
            <input style={inp} type="number" placeholder="cth: 10000000" value={aValue} onChange={e => setAValue(e.target.value)} />

            <PrimaryBtn onClick={saveAsset} disabled={!aName.trim() || !aValue} color="#9b7ef8">
              Simpan & Lanjut →
            </PrimaryBtn>
          </>
        );

      // ─ Step 11: Add First Debt (Optional) [NEW] ────────────────────────
      case 11:
        return (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 4 }}>💳 Catat Hutang (Opsional)</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
              Catat kewajiban finansial Anda untuk menghitung Net Worth yang akurat. Boleh dilewati.
            </div>

            <label style={lbl}>Jenis Hutang *</label>
            <select
              style={inp}
              value={dType}
              onChange={e => {
                setDType(e.target.value);
                setDRate(DEBT_DEFAULT_RATES[e.target.value] || 10);
              }}
            >
              {KONSUMTIF.map(d => <option key={d.key} value={d.key}>{d.icon} {d.label}</option>)}
            </select>

            <label style={lbl}>Nama / Keterangan *</label>
            <input style={inp} placeholder="cth: KPR BTN, CC BCA Visa" value={dName} onChange={e => setDName(e.target.value)} />

            <label style={lbl}>Sisa Hutang / Outstanding (Rp) *</label>
            <input style={inp} type="number" placeholder="cth: 150000000" value={dAmount} onChange={e => setDAmount(e.target.value)} />

            <label style={lbl}>Bunga per Tahun (%)</label>
            <input style={inp} type="number" placeholder="cth: 9.5" value={dRate} onChange={e => setDRate(e.target.value)} step="0.1" />

            <PrimaryBtn onClick={saveDebt} disabled={!dName.trim() || !dAmount} color="#9b7ef8">
              Simpan & Lanjut →
            </PrimaryBtn>
            <SecondaryBtn onClick={skipDebt}>Lewati — tidak ada hutang</SecondaryBtn>
          </>
        );

      // ─ Step 12: Setup Summary [NEW] ─────────────────────────────────────
      case 12: {
        const riskKey    = Object.entries(RISK_PROFILES).find(
          ([, v]) => riskScore >= v.range[0] && riskScore <= v.range[1]
        )?.[0] || "moderate";
        const riskInfo   = RISK_PROFILES[riskKey];
        const totalAsset = parseFloat(aValue) || 0;
        const totalDebt  = debtSaved ? (parseFloat(dAmount) || 0) : 0;
        const netWorth   = totalAsset - totalDebt;

        const rows = [
          { icon: "💼", label: "Pendapatan",   value: income ? fmtRp(income) + "/bln" : "—" },
          { icon: "🏦", label: "Wallet",        value: wName || "—" },
          { icon: "📊", label: "Budget Bulanan",value: bKebutuhan ? `${fmtRp(+bKebutuhan + +bKeinginan + +bInvestasi)}/bln` : "—" },
          { icon: "🎯", label: "Profil Risiko", value: riskInfo ? `${riskInfo.emoji} ${riskInfo.label}` : "—" },
          { icon: "💎", label: "Aset",          value: aName ? `${aName} · ${fmtRp(aValue)}` : "—" },
          { icon: "💳", label: "Hutang",        value: debtSaved ? `${dName} · ${fmtRp(dAmount)}` : "Tidak dicatat" },
        ];

        return (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 4 }}>✅ Ringkasan Setup</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Berikut yang sudah Anda siapkan. Satu langkah lagi!</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {rows.map(r => (
                <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: T.surface, borderRadius: 9 }}>
                  <span style={{ fontSize: 18, minWidth: 24 }}>{r.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: T.muted }}>{r.label}</div>
                    <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{r.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: "12px 14px", background: netWorth >= 0 ? "#3ecf8e11" : "#f26b6b11", borderRadius: 10, border: `1px solid ${netWorth >= 0 ? "#3ecf8e33" : "#f26b6b33"}`, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Estimasi Net Worth Awal</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: netWorth >= 0 ? "#3ecf8e" : "#f26b6b" }}>
                {fmtRp(netWorth)}
              </div>
            </div>

            <PrimaryBtn onClick={next} color="#9b7ef8">Lanjut ke Goal Terakhir →</PrimaryBtn>
          </>
        );
      }

      // ─ Step 13: Create First Goal ───────────────────────────────────────
      case 13:
        return (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 4 }}>🎯 Buat Goal Pertama</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Tentukan satu tujuan keuangan yang ingin Anda capai.</div>

            <label style={lbl}>Nama Goal *</label>
            <input style={inp} placeholder="cth: Dana Darurat, DP Rumah, Liburan" value={gName} onChange={e => setGName(e.target.value)} />

            <label style={lbl}>Target Nominal (Rp) *</label>
            <input style={inp} type="number" placeholder="cth: 50000000" value={gTarget} onChange={e => setGTarget(e.target.value)} />

            <label style={lbl}>Target Waktu (Bulan/Tahun)</label>
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

      // Step 14: Quick Input shortcut tip
      case 14: {
        const isIOS     = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isAndroid = /android/i.test(navigator.userAgent);
        const steps = isAndroid
          ? ['Tap menu di Chrome', '"Tambahkan ke layar utama"', 'Konfirmasi — shortcut siap!']
          : isIOS
          ? ['Tap ikon Share di Safari', '"Tambahkan ke Layar Utama"', 'Konfirmasi — shortcut siap!']
          : ['Buka /quick-input di browser mobile', 'Tambahkan ke home screen', 'Input transaksi tanpa buka app'];

        return (
          <>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>⚡</div>
              <div style={{ fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 6 }}>
                Tip: Input Cepat
              </div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
                Pasang shortcut ke home screen agar bisa catat transaksi langsung tanpa buka app.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {steps.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: T.surface, borderRadius: 9 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#3ecf8e22", color: "#3ecf8e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: 12, color: T.text }}>{s}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => window.open('/quick-input', '_blank')}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#3ecf8e", color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 8 }}
            >
              Buka &amp; Pasang Sekarang ↗
            </button>
            <button
              onClick={onComplete}
              style={{ width: "100%", padding: "11px", borderRadius: 10, border: `1px solid ${T.border}`, background: "none", color: T.muted, fontSize: 13, cursor: "pointer" }}
            >
              Lewati — Mulai Gunakan App
            </button>
          </>
        );
      }

      default: return null;
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000c",
      zIndex: 2000, display: "flex", alignItems: "center",
      justifyContent: "center", padding: 16, fontFamily: "inherit",
    }}>
      <div style={card}>
        <StepProgress step={step} total={TOTAL} T={T} />
        {renderStep()}
      </div>
    </div>
  );
}
