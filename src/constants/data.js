// ─── CURRENCY ─────────────────────────────────────────────────────────────────
const RATES = { IDR: 1, USD: 16800, CNY: 2400, EUR: 19000 };
const CURRENCIES = [
  { code: "IDR", symbol: "Rp", label: "Rupiah" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "CNY", symbol: "¥", label: "Yuan Tiongkok" },
  { code: "EUR", symbol: "€", label: "Euro" },
];
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
// Masked money helper — fM(val, cur, hide) → '••••••' when hide=true
const fM = (idr, code = "IDR", hide = false) =>
  hide ? "••••••" : fMoney(idr, code);

// ─── GLOBAL HELPERS (shared across all scenes) ───────────────────────────────
const getIDR = (a) => a.liveValue ?? a.valueIDR ?? 0;
const FREQ_MULT = { monthly: 12, semiannual: 2, quarterly: 4, annual: 1 };

// ─── SHARED STYLE CONSTANTS ──────────────────────────────────────────────────
const LS = { color: "#9aa3b0", fontSize: 10, marginBottom: 4 };
const LS2 = (T) => ({ color: T.textSoft, fontSize: 10, marginBottom: 4 });

// ─── ASSET CLASSES ────────────────────────────────────────────────────────────
const ASSET_CLASSES = [
  {
    key: "cash",
    label: "Dana Tunai & Setara",
    shortLabel: "Dana Tunai",
    icon: "🏦",
    riskLevel: 1,
    riskLabel: "Sangat Rendah",
    riskColor: "#3ecf8e",
    instruments: ["Tabungan", "Deposito", "Reksa Dana Pasar Uang"],
    desc: "Paling aman dan likuid. Return mengikuti suku bunga.",
    expectedReturn: "3–6% p.a.",
  },
  {
    key: "bond",
    label: "Pendapatan Stabil",
    shortLabel: "Obligasi/Sukuk",
    icon: "📜",
    riskLevel: 2,
    riskLabel: "Rendah",
    riskColor: "#5b9cf6",
    instruments: ["Obligasi Pemerintah", "Sukuk", "SBR", "ORI", "RDPT"],
    desc: "Return terencana dari kupon/bunga tetap. Cocok jangka menengah.",
    expectedReturn: "5–8% p.a.",
  },
  {
    key: "fixedincome_plus",
    label: "Pendapatan Tetap Plus",
    shortLabel: "RDPT/ETF Bond",
    icon: "📊",
    riskLevel: 3,
    riskLabel: "Sedang",
    riskColor: "#9b7ef8",
    instruments: ["ETF Obligasi", "Medium Term Notes", "Corporate Bond"],
    desc: "Fleksibel, return lebih tinggi dari obligasi.",
    expectedReturn: "6–10% p.a.",
  },
  {
    key: "mixed",
    label: "Komoditas & Campuran",
    shortLabel: "Properti/Emas/RDC",
    icon: "🏠",
    riskLevel: 4,
    riskLabel: "Sedang–Tinggi",
    riskColor: "#f59e0b",
    instruments: ["Properti", "Emas", "Perak", "RDC", "REITs"],
    desc: "Lindung nilai inflasi, kurang likuid.",
    expectedReturn: "8–15% p.a.",
    liveType: "gold",
  },
  {
    key: "equity",
    label: "Ekuitas",
    shortLabel: "Saham/RD Saham",
    icon: "📈",
    riskLevel: 5,
    riskLabel: "Tinggi",
    riskColor: "#f26b6b",
    instruments: ["Saham IDX", "Blue Chip", "Reksa Dana Saham", "ETF Saham"],
    desc: "Return tertinggi, volatilitas tinggi.",
    expectedReturn: "12–20% p.a.",
  },
  {
    key: "crypto",
    label: "Aset Kripto",
    shortLabel: "Kripto",
    icon: "₿",
    riskLevel: 6,
    riskLabel: "Sangat Tinggi",
    riskColor: "#f87239",
    instruments: ["Bitcoin", "Ethereum", "BNB", "Solana", "Altcoin"],
    desc: "Volatilitas ekstrem, potensi gain besar.",
    expectedReturn: "-80% hingga +500%",
    liveType: "crypto",
  },
  // ── Module: Real Assets (toggled via settings) ────────────────────────────
  {
    key: "property",
    label: "Properti",
    shortLabel: "Properti",
    icon: "🏡",
    riskLevel: 4,
    riskLabel: "Sedang–Tinggi",
    riskColor: "#34d399",
    instruments: ["Rumah", "Apartemen", "Ruko", "Tanah", "Kos-kosan"],
    desc: "Apresiasi jangka panjang + income sewa.",
    expectedReturn: "8–15% p.a. (apresiasi + yield)",
    moduleKey: "realAssets",
  },
  {
    key: "business",
    label: "Bisnis & Usaha",
    shortLabel: "Bisnis",
    icon: "🏢",
    riskLevel: 5,
    riskLabel: "Tinggi",
    riskColor: "#818cf8",
    instruments: [
      "Kos-kosan",
      "F&B / Kuliner",
      "Franchise",
      "PT / CV",
      "Usaha Jasa",
    ],
    desc: "Passive income, valuasi profit multiplier.",
    expectedReturn: "Variatif (tergantung profitabilitas)",
    moduleKey: "realAssets",
  },
];

const RISK_PROFILES = {
  conservative: {
    label: "Konservatif",
    emoji: "🛡️",
    range: [7, 10],
    color: "#3ecf8e",
    alloc: {
      cash: 20,
      bond: 45,
      fixedincome_plus: 10,
      mixed: 10,
      equity: 5,
      crypto: 0,
    },
  },
  low_moderate: {
    label: "Moderate",
    emoji: "🌿",
    range: [11, 17],
    color: "#5b9cf6",
    alloc: {
      cash: 15,
      bond: 35,
      fixedincome_plus: 20,
      mixed: 15,
      equity: 15,
      crypto: 0,
    },
  },
  moderate_aggressive: {
    label: "Growth",
    emoji: "⚖️",
    range: [18, 24],
    color: "#f59e0b",
    alloc: {
      cash: 10,
      bond: 20,
      fixedincome_plus: 15,
      mixed: 20,
      equity: 30,
      crypto: 5,
    },
  },
  aggressive: {
    label: "Agresif",
    emoji: "🚀",
    range: [25, 28],
    color: "#f26b6b",
    alloc: {
      cash: 5,
      bond: 10,
      fixedincome_plus: 10,
      mixed: 15,
      equity: 45,
      crypto: 15,
    },
  },
};

const RISK_QUESTIONS = [
  {
    q: "Bagaimana pengalaman investasi Anda?",
    opts: [
      ["Saya mengetahui dan menggunakan tabungan/deposito", 1],
      [
        "Saya mengetahui dan memiliki poin A serta Reksadana Pasar Uang dan Obligasi",
        2,
      ],
      [
        "Saya mengetahui dan memiliki poin B dan intrument lainya seperti Emas, ETF, Reksadana Campuran",
        3,
      ],
      [
        "Saya Memiliki Instrument Saham, Reksadana Saham, Crypto dan instrument lain yang lebih volatil",
        4,
      ],
    ],
  },
  {
    q: "Berapa lama horizon investasi Anda?",
    opts: [
      ["Kurang dari 1 tahun", 1],
      ["1–3 tahun", 2],
      ["3–5 tahun", 3],
      ["Lebih dari 5 tahun", 4],
    ],
  },
  {
    q: "Apa tujuan utama investasi Anda?",
    opts: [
      ["Menjaga Keamanan dana dan stabilitas nilai investasi", 1],
      ["Mendapatkan pendapatan pasif stabil", 2],
      ["Memperoleh pendapatan dan pertumbuhan nilai investasi", 3],
      ["Pertumbuhan nilai investasi secara maksimal jangka panjang", 4],
    ],
  },
  {
    q: "Berapa persen penghasilan yang bisa diinvestasikan per bulan?",
    opts: [
      ["< 10%", 1],
      ["10–20%", 2],
      ["20–40%", 3],
      ["> 40%", 4],
    ],
  },
  {
    q: "Jika portofolio turun 30% dalam 3 bulan, apa yang Anda lakukan?",
    opts: [
      ["Jual semua untuk menghindari kerugian lebih lanjut", 1],
      ["Jual sebagian dan menunggu kondisi pasar stabil", 2],
      ["Mempertahan investasi, tunggu pemulihan", 3],
      ["Tambah investasi untuk memanfaatkan peluang harga (buy the dip)", 4],
    ],
  },
  {
    q: "Jika investasi yang anda miliki memiliki penurunan nilai sekitar 25% dari nilai awal, dampaknya terhdapat kondisi keuangan anda adalah",
    opts: [
      ["Sangat berdampak dan menggangu kondisi keuangan saya", 1],
      ["Cukup nerdampak namun masih dapat saya tolerasni", 2],
      ["Tidak teralu berdampak pada kondisi keuangan saya", 3],
      ["Hampir tidak ada dampak pada kondisi keuangan saya", 4],
    ],
  },
  {
    q: "Jika ada peluang investasi dengan potensi return tinggi > 35% namun fluktuasinya lebih besar anda akan ?",
    opts: [
      ["Mengindarinya (safety)", 1],
      ["Mempertimbangkan dengan sangat hati-hati", 2],
      ["Mengalokasikan sebagian dana", 3],
      ["Mengalokasikan sebagian besar dana", 4],
    ],
  },
];

// ─── PRECIOUS METALS ─────────────────────────────────────────────────────────
const PRECIOUS_METALS = [
  {
    id: "gold",
    label: "Emas (XAU)",
    symbol: "g",
    unit: "gram",
    apiKey: "gold",
    icon: "🟡",
  },
  {
    id: "silver",
    label: "Perak (XAG)",
    symbol: "g",
    unit: "gram",
    apiKey: "silver",
    icon: "⬜",
  },
  {
    id: "other",
    label: "Logam Mulia Lain",
    symbol: "g",
    unit: "gram",
    apiKey: null,
    icon: "🔘",
  },
];

const CRYPTO_COINS = [
  { id: "bitcoin", symbol: "BTC", label: "Bitcoin", decimals: 8 },
  { id: "ethereum", symbol: "ETH", label: "Ethereum", decimals: 6 },
  { id: "binancecoin", symbol: "BNB", label: "BNB", decimals: 4 },
  { id: "solana", symbol: "SOL", label: "Solana", decimals: 4 },
  { id: "ripple", symbol: "XRP", label: "XRP", decimals: 2 },
];
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
    maxDebts: 3,
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
    maxDebts: 10,
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
    aiTokensPerDay: 200000,
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

export {
  RATES,
  CURRENCIES,
  toIDR,
  fromIDR,
  ASSET_CLASSES,
  RISK_PROFILES,
  RISK_QUESTIONS,
  PRECIOUS_METALS,
  CRYPTO_COINS,
  FREE_UPLOAD_LIMIT,
  DEBT_TYPES,
};
