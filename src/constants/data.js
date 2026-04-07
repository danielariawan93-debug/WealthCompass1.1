// =============================================================================
// data.js - SINGLE SOURCE OF TRUTH untuk semua konstanta aplikasi
// Aturan: file ini hanya berisi konstanta (array/object).
// Tidak boleh ada fungsi bisnis, tier logic, atau helper di sini.
// =============================================================================

// -----------------------------------------------------------------------------
// CURRENCY
// -----------------------------------------------------------------------------
const RATES = { IDR: 1, USD: 17000, CNY: 2400, EUR: 19000 };

const CURRENCIES = [
  { code: "IDR", symbol: "Rp", label: "Rupiah" },
  { code: "USD", symbol: "$",  label: "US Dollar" },
  { code: "CNY", symbol: "¥",  label: "Yuan Tiongkok" },
  { code: "EUR", symbol: "€",  label: "Euro" },
];

// -----------------------------------------------------------------------------
// ASSET CLASSES
// -----------------------------------------------------------------------------
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
    desc: "Aset paling likuid dan stabil. Digunakan untuk kebutuhan jangka pendek dan buffer likuiditas.",
    expectedReturn: "3–6% p.a.",
  },
  {
    key: "bond",
    label: "Pendapatan Stabil",
    shortLabel: "Obligasi",
    icon: "📜",
    riskLevel: 2,
    riskLabel: "Rendah",
    riskColor: "#5b9cf6",
    instruments: ["Obligasi Pemerintah", "FR", "Sukuk", "SBR", "ORI"],
    desc: "Memberikan pendapatan stabil dengan risiko rendah. Cocok sebagai fondasi portofolio.",
    expectedReturn: "5–8% p.a.",
  },
  {
    key: "fixedincome_plus",
    label: "Pendapatan Tetap",
    shortLabel: "FI Plus",
    icon: "📊",
    riskLevel: 3,
    riskLabel: "Sedang",
    riskColor: "#9b7ef8",
    instruments: ["Corporate Bond", "RDPT", "ETF Obligasi"],
    desc: "Obligasi dengan potensi return lebih tinggi, namun memiliki risiko kredit dan volatilitas lebih besar.",
    expectedReturn: "6–10% p.a.",
  },
  {
    key: "mixed",
    label: "Emas & Komoditas",
    shortLabel: "Emas, Perak, ETF Komoditas",
    icon: "🪙",
    riskLevel: 3,
    riskLabel: "Sedang",
    riskColor: "#f59e0b",
    instruments: ["Emas", "Perak", "ETF Komoditas"],
    desc: "Berfungsi sebagai lindung nilai terhadap inflasi dan ketidakpastian ekonomi.",
    expectedReturn: "6–10% p.a.",
    liveType: "gold",
  },
  {
    key: "equity",
    label: "Ekuitas",
    shortLabel: "Saham",
    icon: "📈",
    riskLevel: 5,
    riskLabel: "Tinggi",
    riskColor: "#f26b6b",
    instruments: ["Saham", "Reksa Dana Saham", "ETF Saham"],
    desc: "Aset pertumbuhan utama dengan potensi return tinggi dan volatilitas signifikan.",
    expectedReturn: "10–18% p.a.",
  },
  {
    key: "crypto",
    label: "Aset Kripto",
    shortLabel: "Kripto",
    icon: "₿",
    riskLevel: 6,
    riskLabel: "Sangat Tinggi",
    riskColor: "#f87239",
    instruments: ["Bitcoin", "Ethereum", "Altcoin"],
    desc: "Aset spekulatif dengan volatilitas ekstrem. Hanya cocok sebagai porsi kecil (satellite).",
    expectedReturn: "Sangat fluktuatif",
    liveType: "crypto",
  },

  // NON-REBALANCE (REAL ASSETS)
  {
    key: "property",
    label: "Properti",
    shortLabel: "Properti",
    icon: "🏡",
    riskLevel: 4,
    riskLabel: "Sedang-Tinggi",
    riskColor: "#34d399",
    instruments: ["Rumah", "Apartemen", "Tanah", "Ruko"],
    desc: "Aset jangka panjang dengan potensi apresiasi dan income sewa, namun tidak likuid.",
    expectedReturn: "8–15% p.a.",
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
    instruments: ["Usaha pribadi", "Franchise", "PT / CV"],
    desc: "Aset dengan potensi return tinggi namun bergantung pada performa operasional dan tidak likuid.",
    expectedReturn: "Variatif",
    moduleKey: "realAssets",
  },
];

// -----------------------------------------------------------------------------
// RISK PROFILES & QUESTIONS
// -----------------------------------------------------------------------------
const RISK_PROFILES = {
  conservative: { label: "Konservatif", emoji: "🛡️", range: [7, 12], color: "#3ecf8e", alloc: { cash: 25, bond: 45, fixedincome_plus: 15, mixed: 10, equity: 5, crypto: 0 } },
  moderate: { label: "Moderate", emoji: "🌿", range: [13, 17], color: "#5b9cf6", alloc: { cash: 15, bond: 35, fixedincome_plus: 20, mixed: 10, equity: 18, crypto: 2 } },
  growth: { label: "Growth", emoji: "⚖️", range: [18, 22], color: "#f59e0b", alloc: { cash: 10, bond: 20, fixedincome_plus: 15, mixed: 10, equity: 40, crypto: 5 } },
  aggressive: { label: "Agresif", emoji: "🚀", range: [23, 28], color: "#f26b6b", alloc: { cash: 5, bond: 10, fixedincome_plus: 10, mixed: 5, equity: 60, crypto: 10 } },
};

 const RISK_QUESTIONS = [
  {
    q: "Seberapa jauh pengalaman Anda berinvestasi pada aset yang nilainya bisa naik turun (berisiko)?",
    opts: [
      ["Hanya tabungan atau deposito (tidak pernah mengalami naik-turun nilai)", 0.56],
      ["Pernah reksa dana pasar uang atau obligasi (risiko rendah)", 1.12],
      ["Pernah emas, reksa dana campuran, atau ETF (risiko menengah)", 1.68],
      ["Aktif di saham, crypto, atau aset berfluktuasi tinggi", 2.24],
    ],
  },
  {
    q: "Berapa lama dana ini bisa Anda biarkan tetap diinvestasikan tanpa digunakan?",
    opts: [
      ["Kurang dari 1 tahun", 0.84],
      ["1 – 3 tahun", 1.68],
      ["3 – 5 tahun", 2.52],
      ["Lebih dari 5 tahun", 3.36],
    ],
  },
  {
    q: "Apa tujuan utama Anda berinvestasi?",
    opts: [
      ["Menjaga nilai uang tetap aman", 0.56],
      ["Mendapatkan penghasilan rutin yang stabil", 1.12],
      ["Mendapatkan pertumbuhan dan penghasilan", 1.68],
      ["Maksimalkan pertumbuhan nilai aset dalam jangka panjang", 2.24],
    ],
  },
  {
    q: "Berapa penurunan nilai investasi (floating loss) yang masih bisa Anda terima TANPA mengganggu kebutuhan hidup atau rencana keuangan Anda?",
    opts: [
      ["Kurang dari 5% (tidak nyaman melihat penurunan kecil)", 1.40],
      ["Sekitar 5% – 15% masih bisa ditoleransi", 2.80],
      ["Sekitar 15% – 30% masih bisa diterima", 4.20],
      ["Lebih dari 30% masih siap dihadapi", 5.60],
    ],
  },
  {
    q: "Jika nilai investasi Anda turun 30% dalam waktu singkat, apa tindakan Anda?",
    opts: [
      ["Menjual seluruh investasi untuk menghindari kerugian lebih lanjut", 1.05],
      ["Menjual sebagian dan menunggu kondisi membaik", 2.10],
      ["Tetap bertahan tanpa perubahan", 3.15],
      ["Menambah investasi karena melihat peluang harga murah", 4.20],
    ],
  },
  {
    q: "Jika penghasilan utama Anda berhenti, berapa lama Anda bisa memenuhi kebutuhan hidup dari dana yang sudah tersedia?",
    opts: [
      ["Kurang dari 3 bulan", 1.40],
      ["3 – 6 bulan", 2.80],
      ["6 – 12 bulan", 4.20],
      ["Lebih dari 12 bulan", 5.60],
    ],
  },
  {
    q: "Setelah kebutuhan hidup dan kewajiban (cicilan, dll) terpenuhi, seberapa besar dana yang bisa Anda investasikan secara rutin?",
    opts: [
      ["Hampir tidak ada atau tidak konsisten", 1.19],
      ["Kecil (kurang dari 10% penghasilan)", 2.38],
      ["Cukup stabil (sekitar 10% – 30%)", 3.57],
      ["Besar dan sangat stabil (lebih dari 30%)", 4.76],
    ],
  },
];

// -----------------------------------------------------------------------------
// PRECIOUS METALS & CRYPTO
// -----------------------------------------------------------------------------
const PRECIOUS_METALS = [
  { id: "gold",   label: "Emas (XAU)",        symbol: "g", unit: "gram", apiKey: "gold",   icon: "🟡" },
  { id: "silver", label: "Perak (XAG)",        symbol: "g", unit: "gram", apiKey: "silver", icon: "⬜" },
  { id: "other",  label: "Logam Mulia Lain",   symbol: "g", unit: "gram", apiKey: null,     icon: "🔘" },
];

const CRYPTO_COINS = [
  { id: "bitcoin",     symbol: "BTC", label: "Bitcoin",  decimals: 8 },
  { id: "ethereum",    symbol: "ETH", label: "Ethereum", decimals: 6 },
  { id: "binancecoin", symbol: "BNB", label: "BNB",      decimals: 4 },
  { id: "solana",      symbol: "SOL", label: "Solana",   decimals: 4 },
  { id: "ripple",      symbol: "XRP", label: "XRP",      decimals: 2 },
];

// -----------------------------------------------------------------------------
// DEBT TYPES
// Dibagi: KONSUMTIF (untuk kebutuhan pribadi) dan PRODUKTIF (untuk bisnis/investasi)
// DEBT_TYPES_LEGACY dipertahankan untuk backward-compatibility data lama yang tersimpan
// -----------------------------------------------------------------------------
const KONSUMTIF = [
  { key: "kpr",      label: "KPR / KPA",              icon: "🏠", rate: 9.5,  mode: "amortizing", info: "Kredit Pemilikan Rumah atau Apartemen untuk tempat tinggal pribadi." },
  { key: "kkb",      label: "KKB Kendaraan Pribadi",  icon: "🚗", rate: 10.0, mode: "amortizing", info: "Kredit kendaraan bermotor untuk penggunaan pribadi." },
  { key: "motor",    label: "Kredit Motor",            icon: "🛵", rate: 10.0, mode: "amortizing", info: "Cicilan sepeda motor untuk penggunaan pribadi." },
  { key: "cc",       label: "Kartu Kredit",            icon: "💳", rate: 27.0, mode: "revolving",  info: "Tagihan kartu kredit. Input tagihan yang belum lunas (bukan limit)." },
  { key: "paylater", label: "PayLater / BNPL",         icon: "📱", rate: 24.0, mode: "revolving",  info: "GoPay Later, OVO PayLater, Shopee PayLater, Akulaku, dll." },
  { key: "kta",      label: "KTA / Pinjaman Pribadi",  icon: "💰", rate: 18.0, mode: "amortizing", info: "Kredit tanpa agunan atau pinjaman personal dari bank maupun fintech." },
  { key: "p2p",      label: "Pinjaman P2P / Online",   icon: "📲", rate: 24.0, mode: "amortizing", info: "Pinjaman dari platform fintech lending." },
  { key: "keluarga", label: "Hutang ke Keluarga/Teman",icon: "🤝", rate: 0,    mode: "amortizing", info: "Pinjaman informal tanpa bunga atau bunga kesepakatan." },
];

const PRODUKTIF = [
  { key: "kur",        label: "KUR (Kredit Usaha Rakyat)", icon: "🏛️", rate: 6.0,  mode: "amortizing", info: "Program pemerintah berbunga rendah untuk UMKM." },
  { key: "kmk",        label: "Kredit Modal Kerja",        icon: "⚙️", rate: 10.5, mode: "amortizing", info: "Pinjaman untuk modal operasional bisnis." },
  { key: "krek",       label: "Rekening Koran / PRK",      icon: "🔄", rate: 10.5, mode: "revolving",  info: "Fasilitas kredit revolving. Bayar bunga saja, pokok fleksibel." },
  { key: "ki",         label: "Kredit Investasi",          icon: "📈", rate: 10.0, mode: "amortizing", info: "Pinjaman untuk pembelian aset produktif jangka panjang." },
  { key: "kkb_niaga",  label: "KKB Kendaraan Niaga",       icon: "🚚", rate: 9.0,  mode: "amortizing", info: "Kredit kendaraan operasional bisnis." },
  { key: "kpr_invest", label: "KPR Properti Investasi",    icon: "🏢", rate: 9.5,  mode: "amortizing", info: "KPR untuk properti yang disewakan atau dijadikan aset investasi." },
  { key: "margin",     label: "Margin Trading / Efek",     icon: "📊", rate: 12.0, mode: "revolving",  info: "Fasilitas margin dari sekuritas untuk pembelian saham/efek." },
];

// Default interest rates per debt type key
const DEBT_DEFAULT_RATES = {
  kpr: 9.5, kkb: 10, motor: 10, cc: 27, paylater: 24, kta: 18, p2p: 24, keluarga: 0,
  kur: 6, kmk: 10.5, krek: 10.5, ki: 10, kkb_niaga: 9, kpr_invest: 9.5, margin: 12,
};

// Legacy type list - used for backward-compatibility with older saved data
const DEBT_TYPES = [
  { key: "kpr",     label: "KPR / Mortgage",         icon: "🏠", color: "#5b9cf6", rate: 9.5  },
  { key: "vehicle", label: "Cicilan Kendaraan",       icon: "🚗", color: "#f59e0b", rate: 8.0  },
  { key: "kta",     label: "Pinjaman Pribadi / KTA",  icon: "💳", color: "#9b7ef8", rate: 18.0 },
  { key: "cc",      label: "Kartu Kredit",            icon: "💰", color: "#f26b6b", rate: 26.0 },
  { key: "paylater",label: "PayLater",                icon: "📱", color: "#f87239", rate: 30.0 },
  { key: "other",   label: "Lainnya",                 icon: "📄", color: "#9aa3b0", rate: 10.0 },
];

// All debt types combined (for lookup by key)
const ALL_DEBT_TYPES = [...KONSUMTIF, ...PRODUKTIF];

// -----------------------------------------------------------------------------
// BUSINESS TYPES & VALUATION MULTIPLES (Real Assets)
// -----------------------------------------------------------------------------
const BUSINESS_TYPES = [
  { value: "kos",          label: "Kos / Penginapan / Sejenis", icon: "🏠", multiplier: 1.5 },
  { value: "fnb",          label: "F&B / Kuliner",              icon: "🍽️", multiplier: 1.1 },
  { value: "retail",       label: "Toko / Retail",              icon: "🛍️", multiplier: 1.0 },
  { value: "jasa",         label: "Jasa / Servis",              icon: "🔧", multiplier: 1.2 },
  { value: "online",       label: "Bisnis Online",              icon: "💻", multiplier: 1.3 },
  { value: "pt_cv_owner",  label: "Pemilik Perusahaan",         icon: "🏢", multiplier: 1.35 },
  { value: "investor_pt_cv",label: "Penanaman Modal PT / CV",   icon: "📈", multiplier: 1.2 },
  { value: "lainnya",      label: "Lainnya",                    icon: "📦", multiplier: 1.0 },
];

const SECTOR_MULTIPLES = {
  kos:            { low: 3,   mid: 4,   high: 5,   label: "Kos/Penginapan"   },
  fnb:            { low: 1,   mid: 1.5, high: 2,   label: "F&B/Kuliner"      },
  retail:         { low: 1,   mid: 1.5, high: 2.5, label: "Retail/Toko"      },
  jasa:           { low: 1.5, mid: 2.5, high: 3,   label: "Jasa/Servis"      },
  online:         { low: 2,   mid: 3,   high: 5,   label: "Bisnis Online"     },
  pt_cv_owner:    { low: 1.5, mid: 2,   high: 3,   label: "Pemilik PT/CV"    },
  investor_pt_cv: { low: 5,   mid: 8,   high: 15,  label: "Penanaman Modal"  },
  lainnya:        { low: 1,   mid: 2,   high: 3,   label: "Lainnya"          },
  // Investor sector-specific multiples
  tech:           { low: 5,   mid: 10,  high: 20,  label: "Tech/Digital"     },
  properti:       { low: 3,   mid: 5,   high: 8,   label: "Properti"         },
  manufaktur:     { low: 1.5, mid: 3,   high: 5,   label: "Manufaktur"       },
  other:          { low: 2,   mid: 4,   high: 6,   label: "Lainnya"          },
};

// -----------------------------------------------------------------------------
// INSURANCE TYPES
// -----------------------------------------------------------------------------
const INSURANCE_TYPES = [
  { key: "life",     label: "Jiwa",        icon: "❤️",  color: "#f26b6b" },
  { key: "health",   label: "Kesehatan",   icon: "🏥",  color: "#3ecf8e" },
  { key: "property", label: "Properti",    icon: "🏠",  color: "#5b9cf6" },
  { key: "vehicle",  label: "Kendaraan",   icon: "🚗",  color: "#f59e0b" },
  { key: "credit",   label: "Jiwa Kredit", icon: "💳",  color: "#9b7ef8" },
  { key: "travel",   label: "Perjalanan",  icon: "✈️",  color: "#34d399" },
];

// Liquid asset classes for insurance calculations (truly cashable assets)
const LIQUID_ASSET_KEYS = ["cash", "bond", "fixedincome_plus"];

// Frequency labels for display
const FREQ_LABELS = { monthly: "bln", quarterly: "kwartal", semiannual: "smstr", annual: "thn" };

// Insurance Pro tier polis limit
const INSURANCE_PRO_LIMIT = 5;

// -----------------------------------------------------------------------------
// MISC
// -----------------------------------------------------------------------------
const FREE_UPLOAD_LIMIT = 3;


// -----------------------------------------------------------------------------
// INCOME TYPES (PassiveScene - jenis pendapatan per aset)
// -----------------------------------------------------------------------------
const INCOME_TYPES = [
  { value: "deposit_interest", label: "Bunga Bank",           icon: "🏦", usePct: true  },
  { value: "coupon",           label: "Kupon Obligasi/Setara", icon: "📜", usePct: true  },
  { value: "dividend",         label: "Dividen Saham/Setara",  icon: "📈", usePct: true  },
  { value: "rental",           label: "Sewa Properti",         icon: "🏠", usePct: false },
  { value: "business",         label: "Usaha/Bisnis",          icon: "🏪", usePct: false },
  { value: "other",            label: "Lainnya",               icon: "💰", usePct: false },
];

// -----------------------------------------------------------------------------
// EXPORTS
// -----------------------------------------------------------------------------
export {
  // Currency
  RATES,
  CURRENCIES,
  // Assets
  ASSET_CLASSES,
  // Risk
  RISK_PROFILES,
  RISK_QUESTIONS,
  // Commodities
  PRECIOUS_METALS,
  CRYPTO_COINS,
  // Debt
  KONSUMTIF,
  PRODUKTIF,
  DEBT_DEFAULT_RATES,
  DEBT_TYPES,        // legacy backward-compat
  ALL_DEBT_TYPES,
  // Business / Real Assets
  BUSINESS_TYPES,
  SECTOR_MULTIPLES,
  // Insurance
  INSURANCE_TYPES,
  LIQUID_ASSET_KEYS,
  FREQ_LABELS,
  INSURANCE_PRO_LIMIT,
  // Misc
  FREE_UPLOAD_LIMIT,
  INCOME_TYPES,
};
