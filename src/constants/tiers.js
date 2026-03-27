const FREE_UPLOAD_LIMIT = 3;

// ─── TIER CONFIGURATION ───────────────────────────────────────────────────────
const TIERS = {
  free: {
    id: "free",
    label: "Free",
    color: "#9aa3b0",
    badge: "FREE",
    aiTokensPerDay: 10000, // ~5 short chats
    maxAssets: 10,
    maxDebts: 5,
    maxGoals: 2,
    pdfUploads: 3, // lifetime
    netWorthDays: 30,
    realAssetsModule: false,
    customTheme: false,
  },
  pro: {
    id: "pro",
    label: "Pro",
    color: "#d4a843",
    badge: "⭐ PRO",
    aiTokensPerDay: 50000, // ~30–40 messages
    maxAssets: 50,
    maxDebts: 15,
    maxGoals: 10,
    pdfUploads: 7, // per month
    netWorthDays: 365,
    realAssetsModule: true,
    customTheme: true,
  },
  proplus: {
    id: "proplus",
    label: "Pro+",
    color: "#9b7ef8",
    badge: "💎 PRO+",
    aiTokensPerDay: 1000000,
    maxAssets: Infinity,
    maxDebts: Infinity,
    maxGoals: Infinity,
    pdfUploads: Infinity,
    netWorthDays: Infinity,
    realAssetsModule: true,
    customTheme: true,
  },
};
const getTier = (isPro, isProPlus) =>
  isProPlus ? TIERS.proplus : isPro ? TIERS.pro : TIERS.free;
const estimateTokens = (text) => Math.ceil((text || "").length / 4);
// Get today's AI token usage from localStorage
const AI_TOKEN_KEY = "wc_ai_tokens";
function getAIUsage() {
  try {
    const d = JSON.parse(localStorage.getItem(AI_TOKEN_KEY) || "{}");
    const today = new Date().toDateString();
    return d.date === today ? d.used || 0 : 0;
  } catch {
    return 0;
  }
}
function addAIUsage(tokens) {
  try {
    const today = new Date().toDateString();
    const d = JSON.parse(localStorage.getItem(AI_TOKEN_KEY) || "{}");
    const used = (d.date === today ? d.used || 0 : 0) + tokens;
    localStorage.setItem(AI_TOKEN_KEY, JSON.stringify({ date: today, used }));
  } catch {}
}

// PDF upload tracking — Free: lifetime, Pro: monthly, Pro+: unlimited
const PDF_UPLOAD_KEY = "wc_pdf_uploads";
function getPDFUsage() {
  try {
    const d = JSON.parse(localStorage.getItem(PDF_UPLOAD_KEY) || "{}");
    const thisMonth = new Date().toISOString().slice(0, 7); // "2026-03"
    return {
      lifetime: d.lifetime || 0,
      monthly: d.month === thisMonth ? d.monthly || 0 : 0,
      month: thisMonth,
    };
  } catch {
    return { lifetime: 0, monthly: 0, month: "" };
  }
}
function addPDFUsage() {
  try {
    const d = JSON.parse(localStorage.getItem(PDF_UPLOAD_KEY) || "{}");
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthly = d.month === thisMonth ? (d.monthly || 0) + 1 : 1;
    localStorage.setItem(
      PDF_UPLOAD_KEY,
      JSON.stringify({
        lifetime: (d.lifetime || 0) + 1,
        monthly,
        month: thisMonth,
      })
    );
  } catch {}
}
function canUploadPDF(tier, uploadCount) {
  if (tier.id === "proplus") return true;
  if (tier.id === "pro") return getPDFUsage().monthly < 7;
  return uploadCount < 3; // free: lifetime
}
function pdfUploadsRemaining(tier, uploadCount) {
  if (tier.id === "proplus") return Infinity;
  if (tier.id === "pro") return Math.max(0, 7 - getPDFUsage().monthly);
  return Math.max(0, 3 - uploadCount);
}

// ─── DEBT TYPES ───────────────────────────────────────────────────────────────
const DEBT_TYPES = [
  {
    key: "kpr",
    label: "KPR / Mortgage",
    icon: "🏠",
    color: "#5b9cf6",
    rate: 9.5,
  },
  {
    key: "vehicle",
    label: "Cicilan Kendaraan",
    icon: "🚗",
    color: "#f59e0b",
    rate: 8.0,
  },
  {
    key: "kta",
    label: "Pinjaman Pribadi / KTA",
    icon: "💳",
    color: "#9b7ef8",
    rate: 18.0,
  },
  {
    key: "cc",
    label: "Kartu Kredit",
    icon: "💰",
    color: "#f26b6b",
    rate: 26.0,
  },
  {
    key: "paylater",
    label: "PayLater",
    icon: "📱",
    color: "#f87239",
    rate: 30.0,
  },
  { key: "other", label: "Lainnya", icon: "📄", color: "#9aa3b0", rate: 10.0 },
];

// ─── HEALTH SCORE ─────────────────────────────────────────────────────────────

export { getTier, estimateTokens, FREE_UPLOAD_LIMIT, TIERS, AI_TOKEN_KEY, getAIUsage, addAIUsage, PDF_UPLOAD_KEY, getPDFUsage, addPDFUsage, canUploadPDF, pdfUploadsRemaining };
