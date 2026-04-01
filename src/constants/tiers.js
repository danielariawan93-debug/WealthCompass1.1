const FREE_UPLOAD_LIMIT = 3;

// ─── TIER CONFIGURATION ───────────────────────────────────────────────────────
const TIERS = {
  free: {
    id: "free",
    label: "Free",
    color: "#9aa3b0",
    badge: "FREE",
    maxAssets: 10,
    maxDebts: 5,
    maxGoals: 2,
    freeUploads: 3,        // lifetime
    freeUploadsType: "lifetime",
    netWorthDays: 30,
    realAssetsModule: false,
    customTheme: false,
  },
  pro: {
    id: "pro",
    label: "Pro",
    color: "#d4a843",
    badge: "⭐ PRO",
    maxAssets: 50,
    maxDebts: 15,
    maxGoals: 10,
    freeUploads: 7,        // per month
    freeUploadsType: "monthly",
    netWorthDays: 365,
    realAssetsModule: true,
    customTheme: true,
  },
  proplus: {
    id: "proplus",
    label: "Pro+",
    color: "#9b7ef8",
    badge: "💎 PRO+",
    maxAssets: Infinity,
    maxDebts: Infinity,
    maxGoals: Infinity,
    freeUploads: 20,       // per month
    freeUploadsType: "monthly",
    netWorthDays: Infinity,
    realAssetsModule: true,
    customTheme: true,
  },
};

const getTier = (isPro, isProPlus) =>
  isProPlus ? TIERS.proplus : isPro ? TIERS.pro : TIERS.free;

// ─── PULSE CREDIT PACKAGES ────────────────────────────────────────────────────
// Free accounts start with 3 Pulse (set in DEFAULT_ACCOUNT_STATE).
// Pro subscriptions: 20 Pulse × months. Pro+: 80 Pulse × months.
const PULSE_PACKAGES = [
  { id: "p15",  pulse: 15,  price: 0.99, label: "15 Pulse"  },
  { id: "p40",  pulse: 40,  price: 1.99, label: "40 Pulse"  },
  { id: "p125", pulse: 125, price: 4.99, label: "125 Pulse" },
  { id: "p350", pulse: 350, price: 9.99, label: "350 Pulse" },
];

// ─── UPLOAD HELPERS (use account state, not localStorage) ─────────────────────
// Returns true if the user still has free upload quota remaining.
function canUploadFree(tier, uploadCount, monthlyUploadCount, monthlyUploadMonth) {
  if (!tier) return uploadCount < 3;
  if (tier.id === "free") return uploadCount < tier.freeUploads;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const current = monthlyUploadMonth === thisMonth ? monthlyUploadCount : 0;
  return current < tier.freeUploads;
}

// Returns number of free uploads remaining (ignores paid Pulse).
function uploadsRemaining(tier, uploadCount, monthlyUploadCount, monthlyUploadMonth) {
  if (!tier) return Math.max(0, 3 - uploadCount);
  if (tier.id === "free") return Math.max(0, tier.freeUploads - uploadCount);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const current = monthlyUploadMonth === thisMonth ? monthlyUploadCount : 0;
  return Math.max(0, tier.freeUploads - current);
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

export {
  getTier,
  FREE_UPLOAD_LIMIT,
  TIERS,
  PULSE_PACKAGES,
  canUploadFree,
  uploadsRemaining,
  DEBT_TYPES,
};
