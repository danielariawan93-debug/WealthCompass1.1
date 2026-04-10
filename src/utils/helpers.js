// =============================================================================
// helpers.js - Semua fungsi utility dan kalkulasi murni (pure functions)
// Aturan: tidak ada React, tidak ada side-effects, tidak ada localStorage.
// Semua fungsi di sini hanya menerima input dan mengembalikan output.
// =============================================================================

import { RATES, CURRENCIES, RISK_PROFILES, SECTOR_MULTIPLES } from "../constants/data";

// -----------------------------------------------------------------------------
// CURRENCY HELPERS
// -----------------------------------------------------------------------------
const toIDR   = (amt, from) => amt * (RATES[from] || 1);
const fromIDR = (amt, to)   => amt / (RATES[to]   || 1);

// Module-level singleton: when true, fMoney returns full nominal (Rp 5.200.000)
let _moneyFull = false;
function setMoneyFull(v) { _moneyFull = !!v; }

function fMoney(idr, code = "IDR") {
  const v = fromIDR(idr || 0, code);
  const s = CURRENCIES.find((c) => c.code === code)?.symbol || "Rp";
  if (_moneyFull) {
    // Full nominal format: Rp 5.200.000 (IDR) or $1,234.56 (foreign)
    if (code === "IDR") return `${s}${Math.round(v).toLocaleString("id-ID")}`;
    return `${s}${v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (code === "IDR") {
    if (v >= 1e12) return `${s}${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9)  return `${s}${(v / 1e9).toFixed(2)}M`;
    if (v >= 1e6)  return `${s}${(v / 1e6).toFixed(1)}Jt`;
    if (v >= 1e3)  return `${s}${(v / 1e3).toFixed(0)}Rb`;
    return `${s}${Math.round(v).toLocaleString()}`;
  }
  if (v >= 1e6) return `${s}${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${s}${(v / 1e3).toFixed(1)}K`;
  return `${s}${v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Masked money: returns '••••••' when hide=true
const fM = (idr, code = "IDR", hide = false) =>
  hide ? "••••••" : fMoney(idr, code);

// Parse number from potentially formatted string
const parseVal = (s) => {
  const v = parseFloat(String(s).replace(/[^0-9.]/g, ""));
  return isNaN(v) ? 0 : v;
};

// Get IDR value from an asset object (live price takes priority)
const getIDR = (a) => a.liveValue ?? a.valueIDR ?? 0;

// Income frequency multipliers (to annual)
const FREQ_MULT = { monthly: 12, semiannual: 2, quarterly: 4, annual: 1 };

// Shared label style constants
const LS  = { color: "#9aa3b0", fontSize: 10, marginBottom: 4 };
const LS2 = (T) => ({ color: T.textSoft, fontSize: 10, marginBottom: 4 });

// -----------------------------------------------------------------------------
// PORTFOLIO HEALTH SCORE
// -----------------------------------------------------------------------------
function calcHealthScore(assets, riskProfile) {
  if (!assets?.length)
    return { score: 0, diversification: 0, liquidity: 0, alignment: 0, concentration: 0 };
  const getIDRLocal = (a) => a.liveValue ?? a.valueIDR ?? 0;
  const total = assets.reduce((s, a) => s + getIDRLocal(a), 0);

  // Diversification: 8 asset classes total
  const classSet = new Set(assets.map((a) => a.classKey));
  const diversification = Math.min((classSet.size / 8) * 100, 100);

  // Concentration: penalize when top class > 60% of portfolio
  const classValues = {};
  assets.forEach((a) => { classValues[a.classKey] = (classValues[a.classKey] || 0) + getIDRLocal(a); });
  const maxPct = total > 0 ? (Math.max(...Object.values(classValues)) / total) * 100 : 0;
  const concentration = maxPct > 60 ? Math.max(0, 100 - (maxPct - 60) * 2.5) : 100;

  // Liquidity: bell-curve optimal range 10–30% (penalise too low OR too high)
  const liquidityAmt = assets
    .filter((a) => ["cash", "bond"].includes(a.classKey))
    .reduce((s, a) => s + getIDRLocal(a), 0);
  const liquidityPct = total > 0 ? (liquidityAmt / total) * 100 : 0;
  const liquidityScore = liquidityPct < 5
    ? liquidityPct * 8
    : liquidityPct <= 30
    ? 40 + (liquidityPct - 5) * 2.4
    : Math.max(0, 100 - (liquidityPct - 30) * 1.5);

  // Risk alignment (0 when no profile set)
  const riskTarget = RISK_PROFILES[riskProfile]?.alloc || {};
  let diff = 0;
  Object.entries(riskTarget).forEach(([k, v]) => {
    const val = assets.filter((a) => a.classKey === k).reduce((s, a) => s + getIDRLocal(a), 0);
    diff += Math.abs((total > 0 ? (val / total) * 100 : 0) - v);
  });
  const alignment = riskProfile ? Math.max(0, 100 - diff / 2) : 0;

  const score = Math.round(
    diversification * 0.25 +
    alignment      * 0.35 +
    liquidityScore * 0.20 +
    concentration  * 0.20
  );
  return { score, diversification, liquidity: liquidityPct, alignment, concentration };
}

// -----------------------------------------------------------------------------
// WEALTH SEGMENT
// -----------------------------------------------------------------------------
function getWealthSegment(totalIDR) {
  if (totalIDR >= 500e9) return { label: "Ultra High Net Worth", short: "UHNW", color: "#f0c040", min: "Rp500M+",      icon: "💎" };
  if (totalIDR >= 100e9) return { label: "Very High Net Worth",  short: "VHNW", color: "#9b7ef8", min: "Rp100M-500M",  icon: "🏆" };
  if (totalIDR >= 10e9)  return { label: "High Net Worth",       short: "HNW",  color: "#f26b6b", min: "Rp10M-100M",   icon: "⭐" };
  if (totalIDR >= 2e9)   return { label: "Affluent",             short: "Affluent", color: "#5b9cf6", min: "Rp2M-10M",  icon: "🌟" };
  if (totalIDR >= 500e6) return { label: "Upper Mass",           short: "Upper Mass", color: "#3ecf8e", min: "Rp500Jt-2M", icon: "📈" };
  return                        { label: "Mass Market",           short: "Mass", color: "#9aa3b0", min: "<Rp500Jt",     icon: "🌱" };
}

// -----------------------------------------------------------------------------
// FUTURE VALUE (compound growth)
// -----------------------------------------------------------------------------
const fv = (pv, rate, years) => pv * Math.pow(1 + rate, years);

// -----------------------------------------------------------------------------
// INSURANCE CALCULATORS
// Dipindahkan dari InsuranceScene.js
// -----------------------------------------------------------------------------

// 1. Jiwa - Income Replacement + Debt + Legacy - Liquid Assets
function calcLife({ annualIncome, yearsToCover, totalDebt, legacyTarget, liquidAssets, educItems }) {
  const incomeNeed = annualIncome * yearsToCover;
  const debtNeed   = totalDebt;
  const legacyNeed = legacyTarget;
  const educNeed   = educItems.reduce((s, e) => {
    const yrs = Math.max(0, 18 - e.childAge);
    return s + fv(e.annualCost, 0.08, yrs) * 4;
  }, 0);
  const existing = liquidAssets;
  const gross    = incomeNeed + debtNeed + legacyNeed + educNeed;
  const net      = Math.max(0, gross - existing);
  return { incomeNeed, debtNeed, legacyNeed, educNeed, existing, gross, net };
}

// 2. Kesehatan - gap antara kebutuhan dan coverage yang ada
function calcHealthInsurance({ roomRatePerDay, daysPerYear, annualCoverageExisting }) {
  const annualNeed = roomRatePerDay * daysPerYear;
  const gap        = Math.max(0, annualNeed - annualCoverageExisting);
  return { annualNeed, gap };
}

// 3. Properti - nilai bangunan saja (tanah tidak ikut)
function calcPropertyInsurance({ buildingValue }) {
  return { need: buildingValue };
}

// 4. Kendaraan - all risk ~3.5% / TLO ~0.8%
function calcVehicleInsurance({ vehicleValue, coverageType }) {
  const rate    = coverageType === "allrisk" ? 0.035 : 0.008;
  const premium = vehicleValue * rate;
  return { need: vehicleValue, estimatedPremium: premium };
}

// 5. Pendidikan - future cost berdasarkan usia anak + inflasi 8%/thn
function calcEducationInsurance({ childAge, annualCostNow, targetLevel }) {
  const yearsLeft         = Math.max(0, 18 - childAge);
  const futureCostPerYear = fv(annualCostNow, 0.08, yearsLeft);
  const years             = targetLevel === "s2" ? 6 : targetLevel === "d3" ? 3 : 4;
  const totalFund         = futureCostPerYear * years;
  const monthsLeft        = yearsLeft * 12;
  const monthlySaving     = monthsLeft > 0 ? totalFund / monthsLeft : totalFund;
  return { futureCostPerYear, totalFund, monthlySaving, yearsLeft };
}

// 6. Jiwa Kredit - dari outstanding KPR/KTA
function calcCreditInsurance({ totalMortgage, totalInstallment }) {
  return { need: totalMortgage + totalInstallment };
}

// -----------------------------------------------------------------------------
// BUSINESS VALUATION CALCULATORS
// Dipindahkan dari RealAssetsScene.js
// -----------------------------------------------------------------------------

// Valuasi bisnis operasional (F&B, Jasa, Kos, dll) - profit multiplier
function calcValuationOperational(netProfitMonthly, ownershipPct, bizType) {
  const mult        = SECTOR_MULTIPLES[bizType] || SECTOR_MULTIPLES.lainnya;
  const annualProfit = netProfitMonthly * 12;
  const ownership   = ownershipPct / 100;
  return {
    annualProfit,
    low:     annualProfit * mult.low  * ownership,
    mid:     annualProfit * mult.mid  * ownership,
    high:    annualProfit * mult.high * ownership,
    multLow: mult.low,
    multMid: mult.mid,
    multHigh: mult.high,
  };
}

// Valuasi bisnis investor / penanaman modal PT-CV - full investment engine
function calcValuationInvestor({ monthlyProfit, ownershipPct, investmentAmount, sector }) {
  const ownership   = ownershipPct / 100;
  const annualProfit = monthlyProfit * 12;
  const mult        = SECTOR_MULTIPLES[sector] || SECTOR_MULTIPLES.investor_pt_cv;
  const valPT       = {
    low:  annualProfit * mult.low,
    mid:  annualProfit * mult.mid,
    high: annualProfit * mult.high,
  };
  const equity = {
    low:  valPT.low  * ownership,
    mid:  valPT.mid  * ownership,
    high: valPT.high * ownership,
  };
  const entryValuation = investmentAmount / ownership;
  const growth = {
    low:  valPT.low  / entryValuation,
    mid:  valPT.mid  / entryValuation,
    high: valPT.high / entryValuation,
  };
  const paybackMonths =
    monthlyProfit * ownership > 0
      ? investmentAmount / (monthlyProfit * ownership)
      : 0;
  return { annualProfit, valPT, equity, entryValuation, growth, paybackMonths, ownership };
}

// -----------------------------------------------------------------------------
// DEBT CALCULATORS
// Dipindahkan dari DebtScene.js
// -----------------------------------------------------------------------------

// Hitung angsuran bulanan dari outstanding + bunga + tenor
function calcMonthlyPayment(outstanding, annualRate, tenorMonths) {
  if (annualRate <= 0) return outstanding / Math.max(tenorMonths, 1);
  const r = annualRate / 100 / 12;
  const n = tenorMonths;
  return outstanding * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// Hitung outstanding dari angsuran + bunga + sisa tenor (kebalikan dari atas)
function calcOutstandingFromPayment(monthlyPayment, annualRate, remainingMonths) {
  if (annualRate <= 0) return monthlyPayment * remainingMonths;
  const r = annualRate / 100 / 12;
  const n = remainingMonths;
  if (r === 0) return monthlyPayment * n;
  return monthlyPayment * (1 - Math.pow(1 + r, -n)) / r;
}

// Hitung sisa bulan dari end year-month string ("YYYY-MM")
function monthsRemaining(endYearMonth) {
  if (!endYearMonth) return 0;
  const [y, m] = endYearMonth.split("-").map(Number);
  const now    = new Date();
  return Math.max(0, (y - now.getFullYear()) * 12 + (m - now.getMonth() - 1));
}

// -----------------------------------------------------------------------------
// EXPORTS
// -----------------------------------------------------------------------------
export {
  // Currency
  toIDR,
  fromIDR,
  fMoney,
  fM,
  setMoneyFull,
  parseVal,
  getIDR,
  FREQ_MULT,
  LS,
  LS2,
  // Portfolio
  calcHealthScore,
  getWealthSegment,
  // Math
  fv,
  // Insurance calcs
  calcLife,
  calcHealthInsurance,
  calcPropertyInsurance,
  calcVehicleInsurance,
  calcEducationInsurance,
  calcCreditInsurance,
  // Business valuation calcs
  calcValuationOperational,
  calcValuationInvestor,
  // Debt calcs
  calcMonthlyPayment,
  calcOutstandingFromPayment,
  monthsRemaining,
};
