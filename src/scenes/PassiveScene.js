import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import CalcScene from './CalcScene';
import { Card, SL, Chip, Bar, TInput, TSelect, TBtn, Donut, InfoBtn, LineChart } from '../components/ui';
import { fMoney, fM, parseVal, getIDR, FREQ_MULT, LS, LS2, getWealthSegment } from '../utils/helpers';
import { ASSET_CLASSES, RATES, CURRENCIES } from '../constants/data';

function DebtIncomeCard({
  assets,
  debts,
  dispCur,
  isPro,
  T,
  hideValues,
  setShowUpgrade,
  monthlyExpense = 0,
  activeIncomes = [],
}) {
  const fV = (v, c) => fM(v, c, hideValues);

  const totalAssets = assets.reduce((s, a) => s + getIDR(a), 0);
  const totalDebt = debts.reduce((s, d) => s + parseVal(d.outstanding), 0);
  const netWorth = totalAssets - totalDebt;

  // Split income: instruments vs property/business
  const instrIncomeAnnual = assets
    .filter((a) => a.income?.amount > 0 && !["property","business"].includes(a.classKey))
    .reduce((s, a) => s + a.income.amount * (FREQ_MULT[a.income.frequency] || 12), 0);
  const propBizIncomeAnnual = assets
    .filter((a) => a.income?.amount > 0 && ["property","business"].includes(a.classKey))
    .reduce((s, a) => s + a.income.amount * (FREQ_MULT[a.income.frequency] || 12), 0);

  // activeIncomes passed from App.js (per-user, not global localStorage)
  const activeIncomeMon = activeIncomes.reduce((s, a) => s + (a.amount || 0), 0);

  const passiveIncomeMon = (instrIncomeAnnual + propBizIncomeAnnual) / 12;
  const instrIncomeMon   = instrIncomeAnnual / 12;
  const propBizIncomeMon = propBizIncomeAnnual / 12;
  const totalDebtMon     = debts.reduce((s, d) => s + parseVal(d.monthlyPayment), 0);
  const biayaBulanan     = parseVal(monthlyExpense);

  // Total outflow vs inflow (passive + active)
  const totalOutflow = totalDebtMon + biayaBulanan;
  const totalInflow  = passiveIncomeMon + activeIncomeMon;
  const surplus      = totalInflow - totalOutflow;

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("wc_cashflow_collapsed") === "1"; }
    catch { return false; }
  });
  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("wc_cashflow_collapsed", next ? "1" : "0"); } catch {}
  };

  if (totalAssets === 0 && totalDebt === 0) return null;

  const surplusColor = surplus >= 0 ? T.green : T.red;

  return (
    <div
      style={{
        marginBottom: 14,
        borderRadius: 14,
        overflow: "hidden",
        border: `1px solid ${T.border}`,
      }}
    >
      {/* -- Collapsible header -- */}
      <div
        role="button"
        onClick={toggleCollapse}
        style={{
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          background: T.card,
          borderBottom: collapsed ? "none" : `1px solid ${T.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14 }}>⚖️</span>
          <div>
            <div style={{ color: T.text, fontSize: 13, fontWeight: "bold" }}>
              Ringkasan Arus Kas
            </div>
            <div style={{ color: surplusColor, fontSize: 11 }}>
              {surplus >= 0 ? "✓ Surplus " : "⚠ Defisit "}
              {fV(Math.abs(surplus), dispCur)}/bln
              {activeIncomeMon > 0 && (
                <span style={{ color: T.muted }}> · incl. active income</span>
              )}
            </div>
          </div>
        </div>
        <span
          style={{
            color: T.muted,
            fontSize: 16,
            transition: "transform 0.2s",
            transform: collapsed ? "none" : "rotate(180deg)",
          }}
        >
          ▾
        </span>
      </div>

      {!collapsed && (
        <>
      {/* FREE section - always visible: Aset vs Hutang */}
      <div style={{ padding: "14px 16px", background: T.card }}>
        <div
          style={{
            color: T.textSoft,
            fontSize: 10,
            letterSpacing: 2,
            marginBottom: 10,
          }}
        >
          RINGKASAN KEUANGAN
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <div
            style={{
              padding: "10px 12px",
              background: T.surface,
              borderRadius: 10,
            }}
          >
            <div style={{ color: T.muted, fontSize: 10, marginBottom: 3 }}>
              Total Aset
            </div>
            <div
              style={{
                color: T.accent,
                fontSize: 14,
                fontWeight: "bold",
                fontFamily: "'Playfair Display',serif",
              }}
            >
              {fV(totalAssets, dispCur)}
            </div>
          </div>
          <div
            style={{
              padding: "10px 12px",
              background: T.surface,
              borderRadius: 10,
            }}
          >
            <div style={{ color: T.muted, fontSize: 10, marginBottom: 3 }}>
              Total Hutang
            </div>
            <div
              style={{
                color: totalDebt > 0 ? T.red : T.muted,
                fontSize: 14,
                fontWeight: "bold",
                fontFamily: "'Playfair Display',serif",
              }}
            >
              {fV(totalDebt, dispCur)}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            background: netWorth >= 0 ? T.greenDim : T.redDim,
            borderRadius: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: T.textSoft, fontSize: 11 }}>
            Net Worth Bersih
          </span>
          <span
            style={{
              color: netWorth >= 0 ? T.green : T.red,
              fontSize: 13,
              fontWeight: "bold",
            }}
          >
            {fV(netWorth, dispCur)}
          </span>
        </div>
      </div>

      {/* PRO section - Hutang/bln vs Passive Income/bln */}
      {isPro ? (
        <div
          style={{
            padding: "12px 16px",
            background: T.surface,
            borderTop: `1px solid ${T.border}`,
          }}
        >
          <div
            style={{
              color: T.textSoft,
              fontSize: 10,
              letterSpacing: 2,
              marginBottom: 10,
            }}
          >
            ⭐ ARUS KAS BULANAN
          </div>
          {/* Pengurang */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ color: T.muted, fontSize: 9, letterSpacing: 1.5, marginBottom: 6 }}>PENGURANG</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ padding: "10px 12px", background: T.redDim, borderRadius: 10, border: `1px solid ${T.red}22` }}>
                <div style={{ color: T.muted, fontSize: 10, marginBottom: 3 }}>💸 Cicilan/Bulan</div>
                <div style={{ color: T.red, fontSize: 13, fontWeight: "bold" }}>{fV(totalDebtMon, dispCur)}</div>
                {totalDebtMon === 0 && <div style={{ color: T.muted, fontSize: 9 }}>Belum ada hutang</div>}
              </div>
              <div style={{ padding: "10px 12px", background: T.redDim, borderRadius: 10, border: `1px solid ${T.red}22` }}>
                <div style={{ color: T.muted, fontSize: 10, marginBottom: 3 }}>🏠 Biaya Bulanan</div>
                <div style={{ color: T.red, fontSize: 13, fontWeight: "bold" }}>
                  {biayaBulanan > 0 ? fV(biayaBulanan, dispCur) : <span style={{ color: T.muted, fontSize: 11 }}>-</span>}
                </div>
                {biayaBulanan === 0 && <div style={{ color: T.muted, fontSize: 9 }}>Isi di Passive Income</div>}
              </div>
            </div>
          </div>

          {/* Penambah */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: T.muted, fontSize: 9, letterSpacing: 1.5, marginBottom: 6 }}>PENAMBAH</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ padding: "10px 12px", background: T.greenDim, borderRadius: 10, border: `1px solid ${T.green}22` }}>
                <div style={{ color: T.muted, fontSize: 10, marginBottom: 3 }}>📈 Passive Income</div>
                <div style={{ color: T.green, fontSize: 13, fontWeight: "bold" }}>{fV(instrIncomeMon, dispCur)}</div>
                <div style={{ color: T.muted, fontSize: 9 }}>dari instrumen investasi</div>
              </div>
              <div style={{ padding: "10px 12px", background: T.greenDim, borderRadius: 10, border: `1px solid ${T.green}22` }}>
                <div style={{ color: T.muted, fontSize: 10, marginBottom: 3 }}>🏡 Properti & Bisnis</div>
                <div style={{ color: T.green, fontSize: 13, fontWeight: "bold" }}>
                  {propBizIncomeMon > 0 ? fV(propBizIncomeMon, dispCur) : <span style={{ color: T.muted, fontSize: 11 }}>-</span>}
                </div>
                <div style={{ color: T.muted, fontSize: 9 }}>sewa + profit usaha</div>
              </div>
            </div>
            {/* Active Income row */}
            <div style={{ marginTop: 8, padding: "10px 12px", background: T.greenDim, borderRadius: 10, border: `1px solid ${T.green}22`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: T.muted, fontSize: 10, marginBottom: 2 }}>💼 Active Income</div>
                <div style={{ color: T.muted, fontSize: 9 }}>
                  {activeIncomes.length > 0
                    ? activeIncomes.map(a => a.label).join(" · ")
                    : "Gaji / Freelance / Bisnis Aktif"}
                </div>
              </div>
              <div style={{ color: T.green, fontSize: 13, fontWeight: "bold" }}>
                {activeIncomeMon > 0 ? fV(activeIncomeMon, dispCur) : <span style={{ color: T.muted, fontSize: 11 }}>-</span>}
              </div>
            </div>
          </div>

          {/* Surplus / Defisit */}
          <div style={{ padding: "10px 12px", background: surplus >= 0 ? T.greenDim : T.redDim, borderRadius: 10,
              border: `1px solid ${surplus >= 0 ? T.green : T.red}33` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: T.textSoft, fontSize: 11, fontWeight: "bold" }}>
                {surplus >= 0 ? "✓ Surplus" : "⚠ Defisit"} Bulanan
              </span>
              <span style={{ color: surplus >= 0 ? T.green : T.red, fontSize: 14, fontWeight: "bold" }}>
                {surplus >= 0 ? "+" : ""}{fV(surplus, dispCur)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted }}>
              <span>Total masuk: {fV(totalInflow, dispCur)}</span>
              <span>Total keluar: {fV(totalOutflow, dispCur)}</span>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowUpgrade(true)}
          style={{
            width: "100%",
            padding: "10px 16px",
            background: T.accentDim,
            border: "none",
            borderTop: `1px solid ${T.border}`,
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: T.muted, fontSize: 11 }}>
            ⭐ Lihat cicilan vs passive income/bulan
          </span>
          <span style={{ color: T.accent, fontSize: 11, fontWeight: "bold" }}>
            Upgrade Pro →
          </span>
        </button>
      )}
        </>
      )}
    </div>
  );
}

// --- PASSIVE INCOME TRACKER (stub for Goals integration) --------------------
// Passive income is tracked per-asset via `income` field: {type, amount, frequency}
// type: 'dividend' | 'coupon' | 'deposit_interest' | 'rental'
// This appears as a summary card in the Portfolio scene

function PassiveIncomeSummary({
  assets,
  setAssets,
  dispCur,
  T,
  hideValues = false,
}) {
  const fV = (v, c) => fM(v, c, hideValues);
  const [expanded, setExpanded] = useState(false);

  const incomeAssets = assets.filter((a) => a.income && a.income.amount > 0);
  const totalAnnual = incomeAssets.reduce(
    (s, a) => s + a.income.amount * (FREQ_MULT[a.income.frequency] || 1),
    0
  );
  const totalMonthly = totalAnnual / 12;
  const totalIDR = assets.reduce((s, a) => s + getIDR(a), 0);
  const yieldPct = totalIDR > 0 ? (totalAnnual / totalIDR) * 100 : 0;

  if (incomeAssets.length === 0) return null;

  return (
    <Card T={T} glow={T.green} style={{ marginBottom: 16 }}>
      {/* Header - always visible */}
      <div
        role="button"
        onClick={() => setExpanded((p) => !p)}
        style={{
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14 }}>💰</span>
          <div>
            <div
              style={{
                color: T.green,
                fontSize: 14,
                fontWeight: "bold",
                fontFamily: "'Playfair Display', Georgia, serif",
              }}
            >
              {fV(totalMonthly, dispCur)}
              <span
                style={{ color: T.muted, fontSize: 11, fontWeight: "normal" }}
              >
                /bln
              </span>
            </div>
            <div style={{ color: T.muted, fontSize: 10 }}>
              Passive Income · {incomeAssets.length} aset · yield{" "}
              {yieldPct.toFixed(1)}%/thn
            </div>
          </div>
        </div>
        <span
          style={{
            color: T.muted,
            fontSize: 16,
            transition: "transform 0.2s",
            transform: expanded ? "rotate(180deg)" : "none",
          }}
        >
          ▾
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: `1px solid ${T.border}`,
          }}
        >
          {incomeAssets.map((a) => {
            const annualAmt =
              a.income.amount * (FREQ_MULT[a.income.frequency] || 1);
            return (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: `1px solid ${T.border}`,
                }}
              >
                <div>
                  <div style={{ color: T.text, fontSize: 12 }}>{a.name}</div>
                  <div
                    style={{
                      color: T.muted,
                      fontSize: 10,
                      textTransform: "capitalize",
                    }}
                  >
                    {a.income.type.replace("_", " ")} · {a.income.frequency}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{ color: T.green, fontSize: 12, fontWeight: "bold" }}
                  >
                    +{fV(a.income.amount, dispCur)}/
                    {a.income.frequency === "monthly"
                      ? "bln"
                      : a.income.frequency === "quarterly"
                      ? "kwartal"
                      : "thn"}
                  </div>
                  <div style={{ color: T.muted, fontSize: 10 }}>
                    {fV(annualAmt / 12, dispCur)}/bln
                  </div>
                </div>
              </div>
            );
          })}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10,
              paddingTop: 8,
            }}
          >
            <span style={{ color: T.textSoft, fontSize: 12 }}>
              Total Tahunan
            </span>
            <span style={{ color: T.green, fontSize: 13, fontWeight: "bold" }}>
              {fV(totalAnnual, dispCur)}/thn
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

// --- FINANCE TOOLS SCENE (Kalkulator + Passive Income sub-tabs) --------------
function PassiveIncomeScene({
  assets,
  setAssets,
  dispCur,
  T,
  hideValues = false,
  activeIncomes: activeIncomesProp = null,
  monthlyExpense: monthlyExpenseProp = undefined,
  setMonthlyExpense: setMonthlyExpenseProp = null,
  isPro = false,
  isProPlus = false,
}) {
  const fV = (v, c) => fM(v, c, hideValues);

  // Fix 3c: added 'semiannual' frequency
  const FREQ_LABELS = {
    monthly: "bln",
    semiannual: "smstr",
    quarterly: "kwartal",
    annual: "thn",
  };

  const INCOME_TYPES = [
    { value: "deposit_interest", label: "Bunga Bank", usePct: true },
    { value: "coupon", label: "Kupon Obligasi/Setara", usePct: true },
    { value: "dividend", label: "Dividen Saham/Setara", usePct: true },
    { value: "rental", label: "Sewa Properti", usePct: false },
    { value: "business", label: "Usaha/Bisnis", usePct: false },
    { value: "other", label: "Lainnya", usePct: false },
  ];

  // monthlyExpense from App.js prop (per-user) when available
  const [_localExpense, _setLocalExpense] = useState("");
  const monthlyExpense = monthlyExpenseProp !== undefined ? monthlyExpenseProp : _localExpense;
  const setMonthlyExpense = setMonthlyExpenseProp || _setLocalExpense;
  const [monthlyFixedIncome, setMonthlyFixedIncome] = useState("");

  // -- ACTIVE INCOME (from Real Assets bisnis only) --------------------------
  const activeIncomes = activeIncomesProp !== null ? activeIncomesProp : [];
  const totalActiveMonthly = activeIncomes.reduce((s, a) => s + (a.amount || 0), 0);
  // --------------------------------------------------------------------------

  const [collapsedGroups, setCollapsedGroups] = useState({});
  const toggleGroup = (key) => setCollapsedGroups(p => ({ ...p, [key]: !p[key] }));

  const [editIncomeId, setEditIncomeId] = useState(null);
  // Fix 3b: inputMode per-form ('nominal'|'pct')
  const [incomeForm, setIncomeForm] = useState({
    amount: "",
    pct: "",
    inputMode: "nominal",
    frequency: "monthly",
    type: "dividend",
  });

  const incomeAssets = assets.filter((a) => a.income && a.income.amount > 0);
  const totalAnnual = incomeAssets.reduce(
    (s, a) => s + a.income.amount * (FREQ_MULT[a.income.frequency] || 1),
    0
      );
  const totalMonthly = totalAnnual / 12;
  const expense = parseVal(monthlyExpense);
  // Combined cashflow = passive income + active income (gaji, dll)
  const fixedIncome = parseVal(monthlyFixedIncome);
  const totalCashflowMonthly = totalMonthly + totalActiveMonthly + fixedIncome;
  const coverage = expense > 0 ? (totalCashflowMonthly / expense) * 100 : 0;
  const passiveCoverage = expense > 0 ? (totalMonthly / expense) * 100 : 0;
  const gap = Math.max(0, expense - totalCashflowMonthly);
  const totalIDR = assets.reduce((s, a) => s + getIDR(a), 0);

  // Group assets by ASSET_CLASS for display (Fix 3a)
  const groupedAssets = ASSET_CLASSES.map((ac) => ({
    ...ac,
    items: assets.filter((a) => a.classKey === ac.key),
  })).filter((g) => g.items.length > 0);

  const saveIncome = (assetId, assetIDRVal) => {
    let amt = 0;
    if (incomeForm.inputMode === "pct" && incomeForm.pct) {
      // Fix 3b: convert % to nominal amount
      const pctVal = parseVal(incomeForm.pct);
      const annualAmt = assetIDRVal * (pctVal / 100);
      const paymentsPerYear = FREQ_MULT[incomeForm.frequency] || 1;
      amt = annualAmt / paymentsPerYear;
    } else {
      amt = parseVal(incomeForm.amount);
    }
    setAssets((p) =>
      p.map((a) =>
        a.id === assetId
          ? {
              ...a,
              income:
                amt > 0
                  ? {
                      amount: amt,
                      frequency: incomeForm.frequency,
                      type: incomeForm.type,
                    }
                  : undefined,
            }
          : a
      )
    );
    setEditIncomeId(null);
  };

  const openEdit = (asset) => {
    setEditIncomeId(asset.id);
    const assetIDR = getIDR(asset);
    const existAmt = asset.income?.amount || 0;
    const existFreq = asset.income?.frequency || "monthly";
    const existType = asset.income?.type || "dividend";
    // Pre-fill pct if we have amount and asset value
    const annualExist = existAmt * (FREQ_MULT[existFreq] || 1);
    const impliedPct =
      assetIDR > 0 ? ((annualExist / assetIDR) * 100).toFixed(2) : "";
    setIncomeForm({
      amount: String(existAmt || ""),
      pct: impliedPct,
      inputMode: "nominal",
      frequency: existFreq,
      type: existType,
    });
  };

  return (
    <div>
      {/* Summary header */}
      <Card
        T={T}
        glow={totalMonthly > 0 ? T.green : undefined}
        style={{ marginBottom: 16 }}
      >
        <SL T={T}>Passive Income Tracker</SL>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            {
              label: "Per Bulan",
              val: fV(totalMonthly, dispCur),
              color: T.green,
            },
            {
              label: "Per Tahun",
              val: fV(totalAnnual, dispCur),
              color: T.accent,
            },
            {
              label: "Yield Portofolio",
              val:
                totalIDR > 0
                  ? ((totalAnnual / totalIDR) * 100).toFixed(2) + "%"
                  : "-",
              color: T.blue,
            },
            {
              label: "Aset Aktif",
              val: `${incomeAssets.length} aset`,
              color: T.purple,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: "10px 12px",
                background: T.surface,
                borderRadius: 10,
                border: `1px solid ${T.border}`,
              }}
            >
              <div style={{ color: T.muted, fontSize: 10, marginBottom: 3 }}>
                {s.label}
              </div>
              <div
                style={{
                  color: s.color,
                  fontSize: 14,
                  fontWeight: "bold",
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}
              >
                {s.val}
              </div>
            </div>
          ))}
        </div>

        {/* Financial Freedom target */}
        <div
          style={{
            padding: "12px 14px",
            background: T.accentDim,
            borderRadius: 10,
            border: `1px solid ${T.accentSoft}`,
          }}
        >
          <div
            style={{
              color: T.accent,
              fontSize: 11,
              fontWeight: "bold",
              marginBottom: 8,
            }}
          >
            🎯 Target Financial Freedom
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: expense > 0 ? 12 : 0 }}>
            <div>
              <div style={{ color: T.textSoft, fontSize: 10, marginBottom: 4 }}>
                Pengeluaran Bulanan (IDR)
              </div>
              <input
                value={monthlyExpense}
                onChange={(e) => { setMonthlyExpense(e.target.value); }}
                placeholder="Contoh: 15000000"
                style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 9, padding: "9px 12px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <div style={{ color: T.textSoft, fontSize: 10, marginBottom: 4 }}>
                Penghasilan Tetap/Bulan (IDR)
              </div>
              <input
                value={monthlyFixedIncome}
                onChange={(e) => { setMonthlyFixedIncome(e.target.value); }}
                placeholder="Gaji, dll"
                style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 9, padding: "9px 12px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
              />
              {fixedIncome > 0 && (
                <div style={{ color: T.muted, fontSize: 9, marginTop: 2 }}>+{fV(fixedIncome, dispCur)}/bln masuk cashflow</div>
              )}
            </div>
          </div>
          {expense > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: T.muted,
                  marginBottom: 6,
                }}
              >
                <span>Coverage total cashflow</span>
                <span
                  style={{
                    color: coverage >= 100 ? T.green : T.orange,
                    fontWeight: "bold",
                  }}
                >
                  {coverage.toFixed(1)}%
                </span>
              </div>
              <Bar
                pct={Math.min(coverage, 100)}
                color={coverage >= 100 ? T.green : T.orange}
                h={8}
                T={T}
              />
              {/* Show passive-only coverage as secondary info */}
              {totalActiveMonthly > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted, marginTop: 5 }}>
                  <span>- dari passive income saja</span>
                  <span style={{ color: passiveCoverage >= 100 ? T.green : T.textSoft }}>
                    {passiveCoverage.toFixed(1)}%
                  </span>
                </div>
              )}
              <div style={{ marginTop: 10 }}>
                {coverage >= 100 ? (
                  <div
                    style={{ color: T.green, fontSize: 12, fontWeight: "bold" }}
                  >
                    🎉 Financial Freedom tercapai!
                  </div>
                ) : (
                  <div>
                    <div style={{ color: T.textSoft, fontSize: 12 }}>
                      Kekurangan:{" "}
                      <b style={{ color: T.red }}>{fV(gap, dispCur)}/bln</b>
                    </div>
                    <div style={{ color: T.muted, fontSize: 10, marginTop: 2 }}>
                      Butuh ≈{" "}
                      {fV(
                        (gap * 12) / Math.max(totalAnnual / totalIDR, 0.05),
                        dispCur
                      )}{" "}
                      aset tambahan pada yield saat ini
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>


      {/* Fix 3a: Assets grouped by category */}
      <Card T={T}>
        <SL T={T}>Atur Income per Aset</SL>
        <div
          style={{
            color: T.textSoft,
            fontSize: 12,
            marginBottom: 14,
            lineHeight: 1.6,
          }}
        >
          Isi nominal atau % per aset. Frekuensi sesuai instrumen. Kosongkan /
          isi 0 untuk hapus.
        </div>

        {groupedAssets.map((group) => (
          <div key={group.key} style={{ marginBottom: 18 }}>
            {/* Category header - collapsible, default closed */}
            <div
              role="button"
              onClick={() => toggleGroup(group.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: collapsedGroups[group.key] === false ? 8 : 0,
                padding: "6px 10px",
                background: T.surface,
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 14 }}>{group.icon}</span>
              <span style={{ color: group.riskColor, fontSize: 12, fontWeight: "bold" }}>
                {group.label}
              </span>
              <span style={{ color: T.muted, fontSize: 11, marginLeft: "auto" }}>
                {group.items.filter((a) => a.income?.amount > 0).length}/
                {group.items.length} aktif
              </span>
              <span style={{
                color: T.muted, fontSize: 11, marginLeft: 4,
                transition: "transform 0.2s", display: "inline-block",
                transform: collapsedGroups[group.key] === false ? "rotate(180deg)" : "none",
              }}>&#9662;</span>
            </div>

            {collapsedGroups[group.key] === false && group.items.map((a) => {
              const isEditing = editIncomeId === a.id;
              const hasIncome = a.income && a.income.amount > 0;
              const assetIDR = getIDR(a);
              const incType = INCOME_TYPES.find(
                (t) => t.value === (a.income?.type || "other")
              );
              const freqLabel = FREQ_LABELS[a.income?.frequency] || "bln";
              const annualAmt = hasIncome
                ? a.income.amount * (FREQ_MULT[a.income.frequency] || 1)
                : 0;
              const yieldPct =
                assetIDR > 0 && annualAmt > 0
                  ? ((annualAmt / assetIDR) * 100).toFixed(2)
                  : null;
              const currentType = INCOME_TYPES.find(
                (t) => t.value === incomeForm.type
              );

              return (
                <div
                  key={a.id}
                  style={{
                    marginBottom: 8,
                    padding: "11px 14px",
                    background: T.card,
                    borderRadius: 10,
                    border: `1px solid ${
                      hasIncome ? T.green + "44" : T.border
                    }`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: isEditing ? 12 : 0,
                    }}
                  >
                    <div>
                      <div
                        style={{ color: T.text, fontSize: 12, fontWeight: 500 }}
                      >
                        {a.name}
                      </div>
                      {hasIncome && !isEditing && (
                        <div
                          style={{ color: T.green, fontSize: 10, marginTop: 2 }}
                        >
                          +{fV(a.income.amount, dispCur)}/{freqLabel}
                          {yieldPct && (
                            <span style={{ color: T.muted }}>
                              {" "}
                              · {yieldPct}%/thn
                            </span>
                          )}
                          <span style={{ color: T.muted }}>
                            {" "}
                            · {incType?.label}
                          </span>
                        </div>
                      )}
                      {!hasIncome && !isEditing && (
                        <div style={{ color: T.muted, fontSize: 10 }}>
                          Belum ada income
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        isEditing ? setEditIncomeId(null) : openEdit(a)
                      }
                      style={{
                        background: isEditing
                          ? T.border
                          : hasIncome
                          ? T.greenDim
                          : T.accentDim,
                        color: isEditing
                          ? T.muted
                          : hasIncome
                          ? T.green
                          : T.accent,
                        border: "none",
                        borderRadius: 7,
                        padding: "5px 10px",
                        cursor: "pointer",
                        fontSize: 11,
                        flexShrink: 0,
                      }}
                    >
                      {isEditing ? "Batal" : hasIncome ? "✎ Edit" : "+ Tambah"}
                    </button>
                  </div>

                  {isEditing && (
                    <div>
                      {/* Row 1: Type + Frequency */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              color: T.textSoft,
                              fontSize: 10,
                              marginBottom: 4,
                            }}
                          >
                           Jenis Income
                          </div>
                          <select
                            value={incomeForm.type}
                            onChange={(e) =>
                              setIncomeForm((p) => ({
                                ...p,
                                type: e.target.value,
                              }))
                            }
                            style={{
                              width: "100%",
                              background: T.inputBg,
                              border: `1px solid ${T.border}`,
                              color: T.text,
                              borderRadius: 8,
                              padding: "8px 10px",
                              fontSize: 11,
                            }}
                          >
                            {INCOME_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          {/* Fix 3c: added semiannual */}
                          <div
                            style={{
                              color: T.textSoft,
                              fontSize: 10,
                              marginBottom: 4,
                            }}
                          >
                            Frekuensi Pembayaran
                          </div>
                          <select
                            value={incomeForm.frequency}
                            onChange={(e) =>
                              setIncomeForm((p) => ({
                                ...p,
                                frequency: e.target.value,
                              }))
                            }
                            style={{
                              width: "100%",
                              background: T.inputBg,
                              border: `1px solid ${T.border}`,
                              color: T.text,
                              borderRadius: 8,
                              padding: "8px 10px",
                              fontSize: 11,
                            }}
                          >
                            <option value="monthly">Bulanan</option>
                            <option value="quarterly">
                              Per Kwartal (3 bln)
                            </option>
                            <option value="semiannual">
                              Per Semester (6 bln)
                            </option>
                            <option value="annual">Tahunan</option>
                          </select>
                        </div>
                      </div>

                      {/* Fix 3b: Input mode toggle (nominal vs %) - only for interest/coupon/dividend */}
                      {currentType?.usePct && (
                        <div
                          style={{ display: "flex", gap: 6, marginBottom: 10 }}
                        >
                          {[
                            ["nominal", "Nominal (IDR)"],
                            ["pct", "% per Tahun"],
                          ].map(([m, l]) => (
                            <button
                              key={m}
                              onClick={() =>
                                setIncomeForm((p) => ({ ...p, inputMode: m }))
                              }
                              style={{
                                flex: 1,
                                padding: "7px 0",
                                borderRadius: 8,
                                border: `1px solid ${
                                  incomeForm.inputMode === m
                                    ? T.accent
                                    : T.border
                                }`,
                                background:
                                  incomeForm.inputMode === m
                                    ? T.accentDim
                                    : T.surface,
                                color:
                                  incomeForm.inputMode === m
                                    ? T.accent
                                    : T.muted,
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight:
                                  incomeForm.inputMode === m
                                    ? "bold"
                                    : "normal",
                              }}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Input field */}
                      <div style={{ marginBottom: 10 }}>
                        {incomeForm.inputMode === "pct" ? (
                          <div>
                            <div
                              style={{
                                color: T.textSoft,
                                fontSize: 10,
                                marginBottom: 4,
                              }}
                            >
                              % per Tahun (contoh: ORI 6.25%, deposito 5%)
                            </div>
                            <div style={{ position: "relative" }}>
                              <input
                                value={incomeForm.pct}
                                onChange={(e) =>
                                  setIncomeForm((p) => ({
                                    ...p,
                                    pct: e.target.value,
                                  }))
                                }
                                placeholder="Contoh: 6.25"
                                style={{
                                  width: "100%",
                                  background: T.inputBg,
                                  border: `1px solid ${T.accent}`,
                                  color: T.text,
                                  borderRadius: 8,
                                  padding: "9px 36px 9px 12px",
                                  fontSize: 12,
                                  outline: "none",
                                }}
                              />
                              <span
                                style={{
                                  position: "absolute",
                                  right: 12,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  color: T.muted,
                                  fontSize: 12,
                                }}
                              >
                                %
                              </span>
                            </div>
                            {parseVal(incomeForm.pct) > 0 && assetIDR > 0 && (
                              <div
                                style={{
                                  color: T.green,
                                  fontSize: 10,
                                  marginTop: 4,
                                }}
                              >
                                {assetIDR > 0
                                  ? `${fV(
                                      (assetIDR * parseVal(incomeForm.pct)) /
                                        100 /
                                        (FREQ_MULT[incomeForm.frequency] || 1),
                                      dispCur
                                    )}/pembayaran · ${fV(
                                      (assetIDR * parseVal(incomeForm.pct)) /
                                        100 /
                                        12,
                                      dispCur
                                    )}/bln`
                                  : ""}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div
                              style={{
                                color: T.textSoft,
                                fontSize: 10,
                                marginBottom: 4,
                              }}
                            >
                              Nominal per Pembayaran (IDR, isi 0 untuk hapus)
                            </div>
                            <input
                              value={incomeForm.amount}
                              onChange={(e) =>
                                setIncomeForm((p) => ({
                                  ...p,
                                  amount: e.target.value,
                                }))
                              }
                              placeholder="Contoh: 150000"
                              style={{
                                width: "100%",
                                background: T.inputBg,
                                border: `1px solid ${T.accent}`,
                                color: T.text,
                                borderRadius: 8,
                                padding: "9px 12px",
                                fontSize: 12,
                                outline: "none",
                              }}
                            />
                            {parseVal(incomeForm.amount) > 0 && (
                              <div
                                style={{
                                  color: T.green,
                                  fontSize: 10,
                                  marginTop: 4,
                                }}
                              >
                                ≈{" "}
                                {fV(
                                  (parseVal(incomeForm.amount) *
                                    (FREQ_MULT[incomeForm.frequency] || 1)) /
                                    12,
                                  dispCur
                                )}
                                /bln
                                {assetIDR > 0
                                  ? ` · ${(
                                      ((parseVal(incomeForm.amount) *
                                        (FREQ_MULT[incomeForm.frequency] ||
                                          1)) /
                                        assetIDR) *
                                      100
                                    ).toFixed(2)}%/thn`
                                  : ""}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => saveIncome(a.id, assetIDR)}
                        style={{
                          width: "100%",
                          padding: "9px 0",
                          borderRadius: 8,
                          border: "none",
                          background: T.accent,
                          color: "#000",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        ✓ Simpan
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {assets.length === 0 && (
          <div
            style={{
              color: T.muted,
              fontSize: 13,
              textAlign: "center",
              padding: 20,
            }}
          >
            Tambahkan aset di tab Portofolio terlebih dahulu.
          </div>
        )}
      </Card>
    </div>
  );
}

function FinanceToolsScene({
  assets,
  setAssets,
  dispCur,
  T,
  hideValues = false,
  activeIncomes = null,
  setActiveIncomes = null,
  isPro = false,
  isProPlus = false,
  monthlyExpense = undefined,
  setMonthlyExpense = null,
}) {
  const [subTab, setSubTab] = useState("calc");
  return (
    <div>
      {/* Sub-tab bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          ["calc", "◉ Kalkulator"],
          ["income", "💰 Passive Income"],
        ].map(([id, l]) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 9,
              border: `1px solid ${subTab === id ? T.accent : T.border}`,
              background: subTab === id ? T.accentDim : T.surface,
              color: subTab === id ? T.accent : T.muted,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: subTab === id ? "bold" : "normal",
              transition: "all 0.15s",
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {subTab === "calc" && (
        <CalcScene assets={assets} dispCur={dispCur} T={T} />
      )}
      {subTab === "income" && (
        <PassiveIncomeScene
          assets={assets}
          setAssets={setAssets}
          dispCur={dispCur}
          T={T}
          hideValues={hideValues}
          activeIncomes={activeIncomes}
          isPro={isPro}
          isProPlus={isProPlus}
          monthlyExpense={monthlyExpense}
          setMonthlyExpense={setMonthlyExpense}
        />
      )}
    </div>
  );
}


// -- ACTIVE INCOME SUMMARY (collapsible bar for Portfolio tab) -----------------
function ActiveIncomeSummary({ activeIncomes = [], dispCur, T, hideValues = false, setTab }) {
  const fV = (v, c) => fM(v, c, hideValues);
  const [expanded, setExpanded] = useState(false);
  const totalMonthly = activeIncomes.reduce((s, a) => s + (a.amount || 0), 0);
  const ACTIVE_ICONS = { salary:'💼', freelance:'🖥️', biz_active:'🏪', other:'💰' };

  if (activeIncomes.length === 0) return null;

  return (
    <Card T={T} glow={T.orange || T.accent} style={{ marginBottom: 16 }}>
      <div role="button" onClick={() => setExpanded(p => !p)} style={{ cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <span style={{ fontSize: 14 }}>💼</span>
          <div>
            <div style={{ color: T.orange || T.accent, fontSize: 14, fontWeight:'bold', fontFamily:"'Playfair Display', Georgia, serif" }}>
              {fV(totalMonthly, dispCur)}
              <span style={{ color: T.muted, fontSize: 11, fontWeight:'normal' }}>/bln</span>
            </div>
            <div style={{ color: T.muted, fontSize: 10 }}>
              Active Income · {activeIncomes.length} sumber
            </div>
          </div>
        </div>
        <span style={{ color: T.muted, fontSize: 16, transition:'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
          {activeIncomes.map((entry, i) => (
            <div key={entry.id || i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8, padding:'8px 10px', background: T.surface, borderRadius: 9 }}>
              <div style={{ display:'flex', gap: 8, alignItems:'center' }}>
                <span style={{ fontSize: 16 }}>{ACTIVE_ICONS[entry.type] || '💰'}</span>
                <div>
                  <div style={{ color: T.text, fontSize: 12, fontWeight: 500 }}>{entry.label}</div>
                  <div style={{ color: T.muted, fontSize: 10 }}>{entry.type === 'salary' ? 'Gaji' : entry.type === 'freelance' ? 'Freelance' : entry.type === 'biz_active' ? 'Bisnis Aktif' : 'Active Income'}</div>
                </div>
              </div>
              <div style={{ color: T.orange || T.accent, fontSize: 13, fontWeight:'bold' }}>+{fV(entry.amount, dispCur)}/bln</div>
            </div>
          ))}
          {setTab && (
            <button onClick={() => setTab('finance-tools')} style={{ width:'100%', marginTop: 8, padding:'8px 0', background:'none', border:`1px solid ${T.border}`, borderRadius: 8, color: T.muted, cursor:'pointer', fontSize: 11 }}>
              Kelola Active Income di Finance Tools →
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

export { DebtIncomeCard, PassiveIncomeSummary, ActiveIncomeSummary, PassiveIncomeScene, FinanceToolsScene };
                              
