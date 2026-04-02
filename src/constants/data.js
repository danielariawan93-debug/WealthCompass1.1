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
    desc: "Paling aman dan likuid. Return mengikuti suku bunga.",
    expectedReturn: "3-6% p.a.",
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
    expectedReturn: "5-8% p.a.",
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
    expectedReturn: "6-10% p.a.",
  },
  {
    key: "mixed",
    label: "Komoditas & Campuran",
    shortLabel: "Properti/Emas/RDC",
    icon: "🏠",
    riskLevel: 4,
    riskLabel: "Sedang-Tinggi",
    riskColor: "#f59e0b",
    instruments: ["Properti", "Emas", "Perak", "RDC", "REITs"],
    desc: "Lindung nilai inflasi, kurang likuid.",
    expectedReturn: "8-15% p.a.",
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
    expectedReturn: "12-20% p.a.",
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
  {
    key: "property",
    label: "Properti",
    shortLabel: "Properti",
    icon: "🏡",
    riskLevel: 4,
    riskLabel: "Sedang-Tinggi",
    riskColor: "#34d399",
    instruments: ["Rumah", "Apartemen", "Ruko", "Tanah", "Kos-kosan"],
    desc: "Apresiasi jangka panjang + income sewa.",
    expectedReturn: "8-15% p.a. (apresiasi + yield)",
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
    instruments: ["Kos-kosan", "F&B / Kuliner", "Franchise", "PT / CV", "Usaha Jasa"],
    desc: "Passive income, valuasi profit multiplier.",
    expectedReturn: "Variatif (tergantung profitabilitas)",
    moduleKey: "realAssets",
  },
];

// -----------------------------------------------------------------------------
// RISK PROFILES & QUESTIONS
// -----------------------------------------------------------------------------
const RISK_PROFILES = {
  conservative: {
    label: "Konservatif", emoji: "🛡️", range: [7, 10], color: "#3ecf8e",
    alloc: { cash: 20, bond: 45, fixedincome_plus: 10, mixed: 10, equity: 5, crypto: 0 },
  },
  low_moderate: {
    label: "Moderate", emoji: "🌿", range: [11, 17], color: "#5b9cf6",
    alloc: { cash: 15, bond: 35, fixedincome_plus: 20, mixed: 15, equity: 15, crypto: 0 },
  },
  moderate_aggressive: {
    label: "Growth", emoji: "⚖️", range: [18, 24], color: "#f59e0b",
    alloc: { cash: 10, bond: 20, fixedincome_plus: 15, mixed: 20, equity: 30, crypto: 5 },
  },
  aggressive: {
    label: "Agresif", emoji: "🚀", range: [25, 28], color: "#f26b6b",
    alloc: { cash: 5, bond: 10, fixedincome_plus: 10, mixed: 15, equity: 45, crypto: 15 },
  },
};

const RISK_QUESTIONS = [
  {
    q: "Bagaimana pengalaman investasi Anda?",
    opts: [
      ["Saya mengetahui dan menggunakan tabungan/deposito", 1],
      ["Saya mengetahui dan memiliki poin A serta Reksadana Pasar Uang dan Obligasi", 2],
      ["Saya mengetahui dan memiliki poin B dan intrument lainya seperti Emas, ETF, Reksadana Campuran", 3],
      ["Saya Memiliki Instrument Saham, Reksadana Saham, Crypto dan instrument lain yang lebih volatil", 4],
    ],
  },
  {
    q: "Berapa lama horizon investasi Anda?",
    opts: [
      ["Kurang dari 1 tahun", 1],
      ["1-3 tahun", 2],
      ["3-5 tahun", 3],
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
      ["10-20%", 2],
      ["20-40%", 3],
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
