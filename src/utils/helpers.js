import { RATES, CURRENCIES, RISK_PROFILES } from "../constants/data";

const toIDR = (amt, from) => amt * (RATES[from] || 1);
const fromIDR = (amt, to) => amt / (RATES[to] || 1);

function fMoney(idr, code = "IDR") {
  const v = fromIDR(idr || 0, code);
  const s = CURRENCIES.find((c) => c.code === code)?.symbol || "Rp";
  if (code === "IDR") {
    if (v >= 1e12) return `${s}${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9) return `${s}${(v / 1e9).toFixed(2)}M`;
    if (v >= 1e6) return `${s}${(v / 1e6).toFixed(1)}Jt`;
    if (v >= 1e3) return `${s}${(v / 1e3).toFixed(0)}Rb`;
    return `${s}${Math.round(v).toLocaleString()}`;
  }
  if (v >= 1e6) return `${s}${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${s}${(v / 1e3).toFixed(1)}K`;
  return `${s}${v.toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const parseVal = (s) => {
  const v = parseFloat(String(s).replace(/[^0-9.]/g, ""));
  return isNaN(v) ? 0 : v;
};

const fM = (idr, code = "IDR", hide = false) =>
  hide ? "••••••" : fMoney(idr, code);
const getIDR = (a) => a.liveValue ?? a.valueIDR ?? 0;
const FREQ_MULT = { monthly: 12, semiannual: 2, quarterly: 4, annual: 1 };
const LS = { color: "#9aa3b0", fontSize: 10, marginBottom: 4 };
const LS2 = (T) => ({ color: T.textSoft, fontSize: 10, marginBottom: 4 });

function calcHealthScore(assets, riskProfile) {
  if (!assets?.length)
    return { score: 0, diversification: 0, liquidity: 0, alignment: 0 };
  const getIDR = (a) => a.liveValue ?? a.valueIDR ?? 0;
  const total = assets.reduce((s, a) => s + getIDR(a), 0);
  const classSet = new Set(assets.map((a) => a.classKey));
  const diversification = Math.min((classSet.size / 6) * 100, 100);
  const liquidity = assets
    .filter((a) => ["cash", "bond"].includes(a.classKey))
    .reduce((s, a) => s + getIDR(a), 0);
  const liquidityPct = total > 0 ? (liquidity / total) * 100 : 0;
  const riskTarget = RISK_PROFILES[riskProfile]?.alloc || {};
  let diff = 0;
  Object.entries(riskTarget).forEach(([k, v]) => {
    const val = assets
      .filter((a) => a.classKey === k)
      .reduce((s, a) => s + getIDR(a), 0);
    const pct = total > 0 ? (val / total) * 100 : 0;
    diff += Math.abs(pct - v);
  });
  const alignment = riskProfile ? Math.max(0, 100 - diff / 2) : 50;
  const score = Math.round(
    diversification * 0.3 +
      alignment * 0.4 +
      liquidityPct * 0.15 +
      Math.min(diversification + liquidityPct, 100) * 0.15
  );
  return { score, diversification, liquidity: liquidityPct, alignment };
}

function getWealthSegment(totalIDR) {
  if (totalIDR >= 500e9)
    return {
      label: "Ultra High Net Worth",
      short: "UHNW",
      color: "#f0c040",
      min: "Rp500M+",
      icon: "💎",
    };
  if (totalIDR >= 100e9)
    return {
      label: "Very High Net Worth",
      short: "VHNW",
      color: "#9b7ef8",
      min: "Rp100M–500M",
      icon: "🏆",
    };
  if (totalIDR >= 10e9)
    return {
      label: "High Net Worth",
      short: "HNW",
      color: "#f26b6b",
      min: "Rp10M–100M",
      icon: "⭐",
    };
  if (totalIDR >= 2e9)
    return {
      label: "Affluent",
      short: "Affluent",
      color: "#5b9cf6",
      min: "Rp2M–10M",
      icon: "🌟",
    };
  if (totalIDR >= 500e6)
    return {
      label: "Upper Mass",
      short: "Upper Mass",
      color: "#3ecf8e",
      min: "Rp500Jt–2M",
      icon: "📈",
    };
  return {
    label: "Mass Market",
    short: "Mass",
    color: "#9aa3b0",
    min: "<Rp500Jt",
    icon: "🌱",
  };
}

export {
  fMoney,
  fM,
  parseVal,
  getIDR,
  FREQ_MULT,
  LS,
  LS2,
  calcHealthScore,
  getWealthSegment,
};
