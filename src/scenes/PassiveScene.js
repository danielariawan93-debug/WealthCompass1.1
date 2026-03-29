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
  monthlyFixedIncome = "",
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
    .filter((a) => a.income?.amount > 0 && ["property","business"].includes(a.classKey)
      // Exclude bisnis aktif yang sudah masuk ke activeIncomes (sync dari RealAssets)
      && !(a.classKey === "business" && a.incomeType === "active"))
    .reduce((s, a) => s + a.income.amount * (FREQ_MULT[a.income.frequency] || 12), 0);

  // activeIncomes passed from App.js (per-user, not global localStorage)
  const activeIncomeMon = activeIncomes.reduce((s, a) => s + (a.amount || 0), 0);
  const fixedIncomeMon  = parseVal(monthlyFixedIncome);

  const passiveIncomeMon = (instrIncomeAnnual + propBizIncomeAnnual) / 12;
  const instrIncomeMon   = instrIncomeAnnual / 12;
  const propBizIncomeMon = propBizIncomeAnnual / 12;
  // For revolving debts, recalculate bunga/bln = outstanding * rate/12
  const getDebtMonthly = (d) => {
    const REVOLVING_KEYS = ['cc','paylater','krek','margin'];
    if (REVOLVING_KEYS.includes(d.type)) {
      const rate = parseVal(d.interestRate) || 10;
      return parseVal(d.outstanding) * (rate / 100 / 12);
    }
    return parseVal(d.monthlyPayment);
  };
  const totalDebtMon = debts.reduce((s, d) => s + getDebtMonthly(d), 0);
  const biayaBulanan     = parseVal(monthlyExpense);

  // Total outflow vs inflow (passive + active)
  const totalOutflow = totalDebtMon + biayaBulanan;
  const totalInflow  = passiveIncomeMon + activeIncomeMon + fixedIncomeMon;
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
              {(activeIncomeMon > 0 || fixedIncomeMon > 0) && (
                <span style={{ color: T.muted }}>
                  {" · incl."}
                  {fixedIncomeMon > 0 ? " penghasilan tetap" : ""}
                  {activeIncomeMon > 0 && fixedIncomeMon > 0 ? " +" : ""}
                  {activeIncomeMon > 0 ? " bisnis aktif" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
        <span style={{ fontSize:10, padding:'3px 10px', borderRadius:10, background: T.surface, color: T.muted, border:`1px solid ${T.border}` }}>
          {collapsed ? 'Tampilkan' : 'Sembunyikan'}
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
            {/* Income rows: Penghasilan Tetap + Bisnis Aktif */}
            {(fixedIncomeMon > 0 || activeIncomeMon > 0) ? (
              <div style={{ marginTop: 8, padding: "10px 12px", background: T.greenDim, borderRadius: 10, border: `1px solid ${T.green}22` }}>
                {fixedIncomeMon > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: activeIncomeMon > 0 ? 6 : 0 }}>
                    <div>
                      <div style={{ color: T.muted, fontSize: 10, marginBottom: 2 }}>💼 Penghasilan Tetap</div>
                      <div style={{ color: T.muted, fontSize: 9 }}>Gaji / pendapatan rutin bulanan</div>
                    </div>
                    <div style={{ color: T.green, fontSize: 13, fontWeight: "bold" }}>{fV(fixedIncomeMon, dispCur)}</div>
                  </div>
                )}
                {activeIncomeMon > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ color: T.muted, fontSize: 10, marginBottom: 2 }}>🏪 Bisnis Aktif</div>
                      <div style={{ color: T.muted, fontSize: 9 }}>{activeIncomes.length > 0 ? activeIncomes.map(a => a.label).join(" · ") : "Dari Real Assets"}</div>
                    </div>
                    <div style={{ color: T.green, fontSize: 13, fontWeight: "bold" }}>{fV(activeIncomeMon, dispCur)}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: 8, padding: "10px 12px", background: T.greenDim, borderRadius: 10, border: `1px solid ${T.green}22`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: T.muted, fontSize: 10, marginBottom: 2 }}>💼 Penghasilan Aktif</div>
                  <div style={{ color: T.muted, fontSize: 9 }}>Isi di kalkulator Financial Freedom</div>
                </div>
                <span style={{ color: T.muted, fontSize: 11 }}>-</span>
              </div>
            )}
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
  activeIncomes = [],
}) {
  const fV = (v, c) => fM(v, c, hideValues);
  const [expanded, setExpanded] = useState(false);

  // Exclude bisnis aktif dari passive income (sudah masuk activeIncomes)
  // Bisnis dengan incomeType=active TIDAK boleh masuk passive income list
  const incomeAssets = assets.filter((a) =>
    a.income && a.income.amount > 0 &&
    !(a.classKey === "business" && a.incomeType === "active") &&
    !(a.classKey === "business" && activeIncomes.some(ai => ai.id === "biz_" + a.id))
  );
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
        <span style={{ fontSize:10, padding:'3px 10px', borderRadius:10, background: T.surface, color: T.muted, border:`1px solid ${T.border}` }}>
          {expanded ? 'Sembunyikan' : 'Tampilkan'}
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
  debts = [],
  dispCur,
  T,
  hideValues = false,
  activeIncomes: activeIncomesProp = null,
  monthlyExpense: monthlyExpenseProp = undefined,
  setMonthlyExpense: setMonthlyExpenseProp = null,
  monthlyFixedIncome: monthlyFixedIncomeProp = undefined,
  setMonthlyFixedIncome: setMonthlyFixedIncomeProp = null,
  isPro = false,
  isProPlus = false,
  setTab = null,
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
  const [_localFixed, _setLocalFixed] = useState("");
  const monthlyFixedIncome = monthlyFixedIncomeProp !== undefined ? monthlyFixedIncomeProp : _localFixed;
  const setMonthlyFixedIncome = setMonthlyFixedIncomeProp || _setLocalFixed;

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

  // Exclude bisnis aktif dari passive income (sudah masuk activeIncomes)
  const incomeAssets = assets.filter((a) =>
    a.income && a.income.amount > 0 &&
    !(a.classKey === "business" && a.incomeType === "active")
  );
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

  // Financial Freedom calculations
  const REVOLVING_KEYS = ['cc','paylater','krek','margin'];
  const totalDebtMonthly = debts.reduce((s, d) => {
    if (REVOLVING_KEYS.includes(d.type)) {
      const rate = parseVal(d.interestRate) || 10;
      return s + parseVal(d.outstanding) * (rate / 100 / 12);
    }
    return s + parseVal(d.monthlyPayment);
  }, 0);
  const targetFF = expense + totalDebtMonthly;
  const fiRatio  = targetFF > 0 ? (totalMonthly / targetFF) * 100 : 0;

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
      {/* -- FINANCIAL FREEDOM TRACKER CARD -- */}
      <Card T={T} style={{ marginBottom: 16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <span style={{ fontSize:16 }}>🎯</span>
          <span style={{ color:T.accent, fontSize:13, fontWeight:"bold", letterSpacing:0.5 }}>Target Financial Freedom</span>
        </div>

        {/* Row 1: Input Pengeluaran + Auto Target */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          {/* Pengeluaran bulanan - manual input */}
          <div>
            <div style={{ color:T.textSoft, fontSize:10, marginBottom:4, display:"flex", alignItems:"center", gap:4 }}>
              Pengeluaran Bulanan (IDR)
              <InfoBtn T={T} content={"Kebutuhan hidup bulanan: makan, transportasi, gaya hidup, tagihan rutin. Tidak termasuk cicilan hutang yang sudah tercatat di modul Hutang."} />
            </div>
            <input
              value={monthlyExpense}
              onChange={e => setMonthlyExpense(e.target.value)}
              placeholder="Contoh: 5000000"
              style={{ width:"100%", background:T.inputBg, border:`1px solid ${T.border}`, color:T.text, borderRadius:9, padding:"9px 12px", fontSize:12, outline:"none", boxSizing:"border-box" }}
            />
          </div>

          {/* Target FF - auto = hutang/bln + pengeluaran */}
          <div>
            <div style={{ color:T.textSoft, fontSize:10, marginBottom:4, display:"flex", alignItems:"center", gap:4 }}>
              Target Financial Freedom
              <InfoBtn T={T} content={"Auto-hitung: Pengeluaran Bulanan + Total Cicilan Hutang/Bulan. Ini adalah minimum passive income yang harus dicapai agar Anda bebas secara finansial tanpa bergantung pada pekerjaan."} />
            </div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:9, padding:"9px 12px" }}>
              <div style={{ color:T.green, fontSize:13, fontWeight:"bold" }}>{fV(targetFF, dispCur)}/bln</div>
              {totalDebtMonthly > 0 && (
                <div style={{ color:T.muted, fontSize:9, marginTop:2 }}>
                  Kebutuhan {fV(expense, dispCur)} + Hutang {fV(totalDebtMonthly, dispCur)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bar: Passive Income vs Target (FI Ratio) */}
        {targetFF > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.muted, marginBottom:5 }}>
              <span>Passive Income vs Target FF</span>
              <span style={{ color: fiRatio >= 100 ? T.green : fiRatio >= 50 ? T.orange : T.red, fontWeight:"bold" }}>
                {fiRatio.toFixed(1)}% FI Ratio
              </span>
            </div>
            <Bar pct={Math.min(fiRatio, 100)} color={fiRatio >= 100 ? T.green : fiRatio >= 50 ? T.orange : T.red} h={9} T={T} />
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.muted, marginTop:3 }}>
              <span>{fV(totalMonthly, dispCur)}/bln passive</span>
              <span>Target {fV(targetFF, dispCur)}/bln</span>
            </div>
          </div>
        )}

        {/* Status */}
        {targetFF > 0 && (
          <div style={{ padding:"10px 12px", borderRadius:9, background: fiRatio >= 100 ? T.greenDim : T.redDim, border:`1px solid ${fiRatio >= 100 ? T.green : T.red}33`, marginBottom:14 }}>
            {fiRatio >= 100 ? (
              <div style={{ color:T.green, fontSize:12, fontWeight:"bold" }}>
                🎉 Financial Freedom tercapai! Passive income Anda sudah menutupi seluruh kebutuhan hidup dan cicilan.
              </div>
            ) : (
              <div>
                <div style={{ color:T.red, fontSize:12, fontWeight:"bold", marginBottom:4 }}>
                  ⚠ Financial Freedom BELUM tercapai
                </div>
                <div style={{ color:T.textSoft, fontSize:11 }}>
                  Kurang <b style={{ color:T.red }}>{fV(Math.max(0, targetFF - totalMonthly), dispCur)}/bln</b> passive income lagi.
                  {totalIDR > 0 && totalAnnual > 0 && (
                    <span> Butuh tambahan aset ~{fV((Math.max(0, targetFF - totalMonthly) * 12) / (totalAnnual / totalIDR), dispCur)} pada yield saat ini.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ padding:"10px 12px", background:T.surface, borderRadius:9, border:`1px solid ${T.border}` }}>
          <div style={{ color:T.muted, fontSize:10, lineHeight:1.6 }}>
            <b style={{ color:T.textSoft }}>Financial Freedom</b> adalah kondisi saat aset produktif Anda menghasilkan pendapatan pasif yang cukup untuk menutup seluruh biaya hidup dan komitmen keuangan (termasuk cicilan hutang), sehingga bekerja menjadi sebuah pilihan, bukan lagi keharusan. Hutang konsumtif aktif memperbesar angka target yang harus dicapai.
          </div>
        </div>
      </Card>

      {/* -- SECTION 2: 4 Kotak Info -- */}
      <Card T={T} style={{ marginBottom:16 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {/* Total Passive Income/Bln */}
          <div style={{ padding:"10px 12px", background:T.surface, borderRadius:10, border:`1px solid ${T.border}` }}>
            <div style={{ color:T.muted, fontSize:10, marginBottom:3 }}>Total Passive Income/Bln</div>
            <div style={{ color:T.green, fontSize:14, fontWeight:"bold", fontFamily:"'Playfair Display', Georgia, serif" }}>{fV(totalMonthly, dispCur)}</div>
            <div style={{ color:T.muted, fontSize:9, marginTop:2 }}>{fV(totalAnnual, dispCur)}/thn</div>
          </div>

          {/* Total Pengeluaran/Bln */}
          <div style={{ padding:"10px 12px", background:T.surface, borderRadius:10, border:`1px solid ${T.border}` }}>
            <div style={{ color:T.muted, fontSize:10, marginBottom:3 }}>Total Pengeluaran/Bln</div>
            <div style={{ color:T.orange||T.accent, fontSize:14, fontWeight:"bold", fontFamily:"'Playfair Display', Georgia, serif" }}>{fV(targetFF, dispCur)}</div>
            {expense > 0 && <div style={{ color:T.muted, fontSize:9, marginTop:2 }}>Kebutuhan {fV(expense, dispCur)} + Hutang {fV(totalDebtMonthly, dispCur)}</div>}
          </div>

          {/* Yield Portofolio */}
          <div style={{ padding:"10px 12px", background:T.surface, borderRadius:10, border:`1px solid ${T.border}` }}>
            <div style={{ color:T.muted, fontSize:10, marginBottom:3, display:"flex", alignItems:"center", gap:4 }}>
              Yield Portofolio
              <InfoBtn T={T} content={"Cash Yield = Total Passive Income Tahunan dibagi Total Nilai Aset yang Produktif (yang sudah generate income). Hanya dihitung dari aset yang benar-benar menghasilkan cash flow. Benchmark: deposito 5-6%, obligasi 6-8%, properti sewa 8-12%, saham/dividen 3-6% p.a."} />
            </div>
            <div style={{ color:T.blue, fontSize:14, fontWeight:"bold", fontFamily:"'Playfair Display', Georgia, serif" }}>
              {totalIDR > 0 ? ((totalAnnual / totalIDR) * 100).toFixed(2) + "%" : "-"}
            </div>
            <div style={{ color:T.muted, fontSize:9, marginTop:2 }}>dari total portofolio</div>
          </div>

          {/* Total Aset Passive */}
          <div style={{ padding:"10px 12px", background:T.surface, borderRadius:10, border:`1px solid ${T.border}` }}>
            <div style={{ color:T.muted, fontSize:10, marginBottom:3 }}>Aset Passive Produktif</div>
            <div style={{ color:T.purple||T.accent, fontSize:14, fontWeight:"bold", fontFamily:"'Playfair Display', Georgia, serif" }}>{incomeAssets.length} aset</div>
            <div style={{ color:T.muted, fontSize:9, marginTop:2 }}>{fV(incomeAssets.reduce((s,a) => s + getIDR(a), 0), dispCur)} total nilai</div>
          </div>
        </div>
      </Card>

      {/* Active Income Section */}
      <Card T={T} style={{ marginBottom: 16 }}>
        <SL T={T}>Active Income</SL>
        <div style={{ color: T.textSoft, fontSize: 12, marginBottom: 14, lineHeight: 1.6 }}>
          {isPro
            ? "Pendapatan aktif otomatis dari bisnis & properti bertag Aktif di Real Assets."
            : "Pendapatan aktif (gaji, bisnis, dll) yang Anda terima setiap bulan."}
        </div>

        {/* Penghasilan Tetap - all tiers, always editable */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: T.textSoft, fontSize: 11, fontWeight: "bold", marginBottom: 8 }}>
            Penghasilan Tetap/Bulan (IDR)
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              value={monthlyFixedIncome}
              onChange={e => setMonthlyFixedIncome && setMonthlyFixedIncome(e.target.value)}
              placeholder="Gaji, honorarium, dll"
              style={{ flex: 1, background: T.inputBg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 9, padding: "10px 12px", fontSize: 12, outline: "none" }}
            />
            {fixedIncome > 0 && (
              <div style={{ color: T.green, fontSize: 12, fontWeight: "bold", flexShrink: 0 }}>
                +{fV(fixedIncome, dispCur)}/bln
              </div>
            )}
          </div>
          <div style={{ color: T.muted, fontSize: 10, marginTop: 4 }}>
            Isi gaji atau pendapatan aktif rutin. Otomatis tersimpan.
          </div>
        </div>

        {/* Pro/Pro+: Auto bisnis aktif from Real Assets */}
        {isPro && activeIncomes && activeIncomes.length > 0 && (
          <div>
            <div style={{ color: T.textSoft, fontSize: 11, fontWeight: "bold", marginBottom: 8 }}>
              Bisnis Aktif (dari Real Assets)
            </div>
            {/* Deduplicate by id to prevent double entries */}
            {activeIncomes.filter((entry, idx, arr) => arr.findIndex(e => e.id === entry.id) === idx).map((entry, i) => (
              <div key={entry.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: T.surface, borderRadius: 9, border: `1px solid ${T.border}`, marginBottom: 6 }}>
                <div>
                  <div style={{ color: T.text, fontSize: 12, fontWeight: 500 }}>{entry.label}</div>
                  <div style={{ color: T.muted, fontSize: 10 }}>Bisnis Aktif (tidak dapat diedit di sini)</div>
                </div>
                <div style={{ color: T.orange || T.accent, fontSize: 13, fontWeight: "bold" }}>+{fV(entry.amount || 0, dispCur)}/bln</div>
              </div>
            ))}
            {!isProPlus && (
              <div style={{ color: T.muted, fontSize: 10, marginTop: 6 }}>
                Edit di menu Properti &amp; Bisnis
              </div>
            )}
          </div>
        )}

        {isPro && (!activeIncomes || activeIncomes.length === 0) && (
          <div style={{ color: T.muted, fontSize: 11, padding: "8px 0" }}>
            Belum ada bisnis bertag Aktif. Tambahkan di Properti &amp; Bisnis.
          </div>
        )}
      </Card>

      {/* Fix 3a: Assets grouped by category */}
      <Card T={T}>
        <SL T={T}>Passive Income per Aset</SL>
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
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:9, background: T.surface, color: T.muted, border:`1px solid ${T.border}` }}>
                {collapsedGroups[group.key] === false ? 'Sembunyikan' : 'Tampilkan'}
              </span>
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
                    {(isPro || isProPlus) && ["property","business"].includes(a.classKey) ? (
                      <button
                        onClick={() => setTab && setTab("real-assets")}
                        style={{ background: T.accentDim, color: T.accent, border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 11, flexShrink: 0 }}
                        title="Edit di Properti & Bisnis"
                      >
                        ✎ Edit di P&amp;B
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          isEditing ? setEditIncomeId(null) : openEdit(a)
                        }
                        style={{
                          background: isEditing ? T.border : hasIncome ? T.greenDim : T.accentDim,
                          color: isEditing ? T.muted : hasIncome ? T.green : T.accent,
                          border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 11, flexShrink: 0,
                        }}
                      >
                        {isEditing ? "Batal" : hasIncome ? "✎ Edit" : "+ Tambah"}
                      </button>
                    )}
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
  debts = [],
  dispCur,
  T,
  hideValues = false,
  activeIncomes = null,
  setActiveIncomes = null,
  isPro = false,
  isProPlus = false,
  monthlyExpense = undefined,
  setMonthlyExpense = null,
  monthlyFixedIncome = undefined,
  setMonthlyFixedIncome = null,
  setTab = null,
}) {
  const [subTab, setSubTab] = useState("calc");
  return (
    <div>
      {/* Sub-tab bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          ["calc", "◉ Kalkulator"],
          ["income", "📊 Financial Freedom Tracker"],
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
          debts={debts}
          dispCur={dispCur}
          T={T}
          hideValues={hideValues}
          activeIncomes={activeIncomes}
          isPro={isPro}
          isProPlus={isProPlus}
          monthlyExpense={monthlyExpense}
          setMonthlyExpense={setMonthlyExpense}
          monthlyFixedIncome={monthlyFixedIncome}
          setMonthlyFixedIncome={setMonthlyFixedIncome}
          setTab={setTab}
        />
      )}
    </div>
  );
}


// -- ACTIVE INCOME SUMMARY (collapsible bar for Portfolio tab) -----------------
function ActiveIncomeSummary({ activeIncomes = [], monthlyFixedIncome = "", dispCur, T, hideValues = false, setTab }) {
  const fV = (v, c) => fM(v, c, hideValues);
  const [expanded, setExpanded] = useState(false);
  const fixedAmt = parseVal(monthlyFixedIncome);
  const bizMonthly = activeIncomes.reduce((s, a) => s + (a.amount || 0), 0);
  const totalMonthly = bizMonthly + fixedAmt;
  const ACTIVE_ICONS = { salary:'💼', freelance:'🖥️', biz_active:'🏪', other:'💰' };

  if (totalMonthly === 0) return null;

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
              Active Income · {activeIncomes.length + (fixedAmt > 0 ? 1 : 0)} sumber
            </div>
          </div>
        </div>
        <span style={{ fontSize:10, padding:'3px 10px', borderRadius:10, background: T.surface, color: T.muted, border:`1px solid ${T.border}` }}>
          {expanded ? 'Sembunyikan' : 'Tampilkan'}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
          {fixedAmt > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8, padding:'8px 10px', background: T.surface, borderRadius: 9 }}>
              <div style={{ display:'flex', gap: 8, alignItems:'center' }}>
                <span style={{ fontSize: 16 }}>💼</span>
                <div>
                  <div style={{ color: T.text, fontSize: 12, fontWeight: 500 }}>Penghasilan Tetap</div>
                  <div style={{ color: T.muted, fontSize: 10 }}>Gaji / pendapatan rutin bulanan</div>
                </div>
              </div>
              <div style={{ color: T.orange || T.accent, fontSize: 13, fontWeight:'bold' }}>+{fV(fixedAmt, dispCur)}/bln</div>
            </div>
          )}
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
                              
