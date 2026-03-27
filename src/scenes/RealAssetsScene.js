import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  Card,
  SL,
  Chip,
  Bar,
  TInput,
  TSelect,
  TBtn,
  Donut,
  InfoBtn,
  LineChart,
} from "../components/ui";
import {
  fMoney,
  fM,
  parseVal,
  getIDR,
  FREQ_MULT,
  LS,
  LS2,
  getWealthSegment,
} from "../utils/helpers";

const BUSINESS_TYPES = [
  {
    value: "kos",
    label: "Kos / Penginapan / Sejenis",
    icon: "🏠",
    multiplier: 1.5,
  },
  { value: "fnb", label: "F&B / Kuliner", icon: "🍽️", multiplier: 1.1 },
  { value: "retail", label: "Toko / Retail", icon: "🛍️", multiplier: 1.0 },
  { value: "jasa", label: "Jasa / Servis", icon: "🔧", multiplier: 1.2 },
  { value: "online", label: "Bisnis Online", icon: "💻", multiplier: 1.3 },
  {
    value: "pt_cv_owner",
    label: "Pemilik Perusahaan",
    icon: "🏢",
    multiplier: 1.35,
  },
  {
    value: "investor_pt_cv",
    label: "Penanaman Modal PT / CV",
    icon: "📈",
    multiplier: 1.2,
  },
  { value: "lainnya", label: "Lainnya", icon: "📦", multiplier: 1.0 },
];

function PropertyForm({ onSave, onCancel, T, editData }) {
  const thisYear = new Date().getFullYear();
  const [f, setF] = useState(
    editData || {
      name: "",
      location: "",
      purchasePrice: "",
      purchaseYear: String(thisYear),
      currentValue: "",
      kprOutstanding: "0",
      kprBank: "",
      kprRate: "9.5",
      rentalIncome: "0",
      rentalFreq: "monthly",
      appreciationRate: "8",
      buildingDepreciation: "2",
      hasKPR: false,
    }
  );

  const purchaseVal = parseVal(f.purchasePrice);
  const currentVal = parseVal(f.currentValue) || purchaseVal;
  const kpr = parseVal(f.kprOutstanding);
  const netEquity = currentVal - kpr;
  const gain = currentVal - purchaseVal;
  const gainPct = purchaseVal > 0 ? (gain / purchaseVal) * 100 : 0;
  const yrs = thisYear - parseInt(f.purchaseYear || thisYear);
  const annualGain = yrs > 0 ? gainPct / yrs : 0;
  const annualRental =
    parseVal(f.rentalIncome) * (FREQ_MULT[f.rentalFreq] || 12);
  const rentalYield = currentVal > 0 ? (annualRental / currentVal) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        <div style={{ gridColumn: "span 2" }}>
          <div style={{ ...LS }}>
            Nama Properti <span style={{ color: T.red }}>*</span>
          </div>
          <input
            value={f.name}
            onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))}
            placeholder="Rumah Jl. Sudirman No.12"
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1px solid ${T.border}`,
              color: T.text,
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 12,
              outline: "none",
            }}
          />
        </div>
        <div>
          <div style={LS}>Lokasi</div>
          <input
            value={f.location}
            onChange={(e) => setF((p) => ({ ...p, location: e.target.value }))}
            placeholder="Jakarta Selatan"
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1px solid ${T.border}`,
              color: T.text,
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 12,
              outline: "none",
            }}
          />
        </div>
        <div>
          <div style={LS}>Tahun Beli</div>
          <input
            value={f.purchaseYear}
            onChange={(e) =>
              setF((p) => ({ ...p, purchaseYear: e.target.value }))
            }
            type="number"
            min="1980"
            max={thisYear}
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1px solid ${T.border}`,
              color: T.text,
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 12,
              outline: "none",
            }}
          />
        </div>
        <div>
          <div style={{ ...LS }}>
            Harga Beli (IDR) <span style={{ color: T.red }}>*</span>
          </div>
          <input
            value={f.purchasePrice}
            onChange={(e) =>
              setF((p) => ({ ...p, purchasePrice: e.target.value }))
            }
            placeholder="500000000"
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1px solid ${T.border}`,
              color: T.text,
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 12,
              outline: "none",
            }}
          />
        </div>
        <div>
          <div style={LS}>Nilai Pasar Saat Ini (IDR)</div>
          <input
            value={f.currentValue}
            onChange={(e) =>
              setF((p) => ({ ...p, currentValue: e.target.value }))
            }
            placeholder="estimasi harga saat ini"
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1px solid ${T.border}`,
              color: T.text,
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 12,
              outline: "none",
            }}
          />
        </div>
        <div>
          <div
            style={{
              ...LS,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              Sisa KPR / Hutang (IDR){" "}
              <span style={{ color: T.muted, fontWeight: "normal" }}>
                (opsional)
              </span>
            </span>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                cursor: "pointer",
                fontSize: 10,
                color: f.hasKPR ? T.accent : T.muted,
              }}
            >
              <input
                type="checkbox"
                checked={f.hasKPR || false}
                onChange={(e) =>
                  setF((p) => ({ ...p, hasKPR: e.target.checked }))
                }
                style={{ cursor: "pointer" }}
              />
              📋 Dalam cicilan / KPR
            </label>
          </div>
          <input
            value={f.kprOutstanding}
            onChange={(e) =>
              setF((p) => ({ ...p, kprOutstanding: e.target.value }))
            }
            placeholder="Contoh: 500000000"
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1px solid ${f.hasKPR ? T.accent : T.border}`,
              color: T.text,
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 12,
              outline: "none",
            }}
          />
        </div>
        {f.hasKPR && parseVal(f.kprOutstanding) > 0 && (
          <>
            <div>
              <div style={LS}>Bank / Lembaga KPR</div>
              <input
                value={f.kprBank || ""}
                onChange={(e) =>
                  setF((p) => ({ ...p, kprBank: e.target.value }))
                }
                placeholder="Contoh: BCA, BTN"
                style={{
                  width: "100%",
                  background: T.inputBg,
                  border: `1px solid ${T.accent}`,
                  color: T.text,
                  borderRadius: 9,
                  padding: "10px 12px",
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>
            <div>
              <div style={LS}>Bunga KPR/thn (%)</div>
              <input
                value={f.kprRate || ""}
                onChange={(e) =>
                  setF((p) => ({ ...p, kprRate: e.target.value }))
                }
                type="number"
                placeholder=""
                style={{
                  width: "100%",
                  background: T.inputBg,
                  border: `1px solid ${T.accent}`,
                  color: T.text,
                  borderRadius: 9,
                  padding: "10px 12px",
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>
            <div
              style={{
                gridColumn: "span 2",
                padding: "8px 12px",
                background: T.accentDim,
                borderRadius: 8,
                fontSize: 11,
                color: T.accent,
              }}
            >
              ✓ KPR akan otomatis tercatat di Debt Tracker saat disimpan
            </div>
          </>
        )}
        <div>
          <div style={LS}>Income Sewa</div>
          <input
            value={f.rentalIncome}
            onChange={(e) =>
              setF((p) => ({ ...p, rentalIncome: e.target.value }))
            }
            placeholder="0 (jika kosong)"
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1px solid ${T.border}`,
              color: T.text,
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 12,
              outline: "none",
            }}
          />
        </div>
        <div>
          <div style={LS}>Frekuensi Sewa</div>
          <select
            value={f.rentalFreq}
            onChange={(e) =>
              setF((p) => ({ ...p, rentalFreq: e.target.value }))
            }
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1px solid ${T.border}`,
              color: T.text,
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 12,
            }}
          >
            <option value="monthly">Bulanan</option>
            <option value="quarterly">Per Kwartal</option>
            <option value="annual">Tahunan</option>
          </select>
        </div>
        <div>
          <div style={LS}>Apresiasi/thn (%)</div>
          <input
            value={f.appreciationRate}
            onChange={(e) =>
              setF((p) => ({ ...p, appreciationRate: e.target.value }))
            }
            type="number"
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1px solid ${T.border}`,
              color: T.text,
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 12,
              outline: "none",
            }}
          />
        </div>
        <div>
          <div style={LS}>Depresiasi Bgn/thn (%)</div>
          <input
            value={f.buildingDepreciation}
            onChange={(e) =>
              setF((p) => ({ ...p, buildingDepreciation: e.target.value }))
            }
            type="number"
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1px solid ${T.border}`,
              color: T.text,
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 12,
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Live preview */}
      {purchaseVal > 0 && (
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
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
            }}
          >
            {[
              {
                l: "Net Equity",
                v: fMoney(netEquity),
                c: netEquity > 0 ? T.green : T.red,
              },
              {
                l: "Capital Gain",
                v: `${gainPct > 0 ? "+" : ""}${gainPct.toFixed(
                  1
                )}% (${yrs}thn)`,
                c: gain > 0 ? T.green : T.red,
              },
              {
                l: "Rental Yield",
                v: rentalYield > 0 ? `${rentalYield.toFixed(1)}%/thn` : "-",
                c: T.blue,
              },
              {
                l: "Total Return/thn",
                v: `≈${(annualGain + rentalYield).toFixed(1)}%`,
                c: T.accent,
              },
              {
                l: "Proyeksi 5thn",
                v: fMoney(
                  currentVal *
                    Math.pow(1 + parseVal(f.appreciationRate) / 100, 5)
                ),
                c: T.blue,
              },
              {
                l: "Depresiasi Bgn/thn",
                v: `-${f.buildingDepreciation || 0}% (informasi)`,
                c: T.muted,
              },
            ].map((s) => (
              <div key={s.l}>
                <div style={{ color: T.muted, fontSize: 9 }}>{s.l}</div>
                <div style={{ color: s.c, fontSize: 12, fontWeight: "bold" }}>
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          onClick={() => {
            if (!f.name || !f.purchasePrice) {
              alert("⚠ Nama Properti dan Harga Beli wajib diisi");
              return;
            }
            const cv = parseVal(f.currentValue) || parseVal(f.purchasePrice);
            onSave({
              classKey: "property",
              name: f.name,
              valueIDR: cv,
              propertyData: { ...f, currentValue: String(cv) },
              kprSync:
                f.hasKPR && parseVal(f.kprOutstanding) > 0
                  ? {
                      name: `KPR ${f.name}${
                        f.kprBank ? " - " + f.kprBank : ""
                      }`,
                      type: "kpr",
                      outstanding: String(parseVal(f.kprOutstanding)),
                      interestRate: f.kprRate || "9.5",
                      monthlyPayment: String(
                        Math.round(
                          (parseVal(f.kprOutstanding) *
                            (parseFloat(f.kprRate || 9.5) / 100 / 12)) /
                            (1 -
                              Math.pow(
                                1 + parseFloat(f.kprRate || 9.5) / 100 / 12,
                                -240
                              ))
                        )
                      ),
                      notes: `Auto dari properti: ${f.name}`,
                    }
                  : null,
              income:
                parseVal(f.rentalIncome) > 0
                  ? {
                      amount: parseVal(f.rentalIncome),
                      frequency: f.rentalFreq,
                      type: "rental",
                    }
                  : undefined,
            });
          }}
          style={{
            flex: 1,
            padding: "11px 0",
            borderRadius: 9,
            border: "none",
            background: T.accent,
            color: "#000",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 13,
          }}
        >
          ✓ Simpan Properti
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "11px 16px",
            borderRadius: 9,
            border: `1px solid ${T.border}`,
            background: "none",
            color: T.muted,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Batal
        </button>
      </div>
    </div>
  );
}


// =========================================================
// VALUATION ENGINE
// =========================================================

const SECTOR_MULTIPLES = {
  kos:          { low: 3,   mid: 4,   high: 5,   label: "Kos/Penginapan" },
  fnb:          { low: 1,   mid: 1.5, high: 2,   label: "F&B/Kuliner" },
  retail:       { low: 1,   mid: 1.5, high: 2.5, label: "Retail/Toko" },
  jasa:         { low: 1.5, mid: 2.5, high: 3,   label: "Jasa/Servis" },
  online:       { low: 2,   mid: 3,   high: 5,   label: "Bisnis Online" },
  pt_cv_owner:  { low: 1.5, mid: 2,   high: 3,   label: "Pemilik PT/CV" },
  investor_pt_cv:{ low: 5,  mid: 8,  high: 15,   label: "Penanaman Modal" },
  lainnya:      { low: 1,   mid: 2,   high: 3,   label: "Lainnya" },
};

function calcValuationOperational(netProfitMonthly, ownershipPct, bizType) {
  const mult = SECTOR_MULTIPLES[bizType] || SECTOR_MULTIPLES.lainnya;
  const annualProfit = netProfitMonthly * 12;
  const ownership = ownershipPct / 100;
  return {
    annualProfit,
    low:  annualProfit * mult.low  * ownership,
    mid:  annualProfit * mult.mid  * ownership,
    high: annualProfit * mult.high * ownership,
    multLow: mult.low, multMid: mult.mid, multHigh: mult.high,
  };
}

function calcValuationInvestor({ monthlyProfit, ownershipPct, investmentAmount }) {
  const ownership = ownershipPct / 100;
  const annualProfit = monthlyProfit * 12;
  const mult = SECTOR_MULTIPLES.investor_pt_cv;
  const valPT = { low: annualProfit * mult.low, mid: annualProfit * mult.mid, high: annualProfit * mult.high };
  const equity = { low: valPT.low * ownership, mid: valPT.mid * ownership, high: valPT.high * ownership };
  const entryValuation = investmentAmount / ownership;
  const growth = { low: valPT.low / entryValuation, mid: valPT.mid / entryValuation, high: valPT.high / entryValuation };
  const netMargin = monthlyProfit > 0 ? (monthlyProfit / monthlyProfit) : 0;
  const paybackMonths = (monthlyProfit * ownership) > 0 ? investmentAmount / (monthlyProfit * ownership) : 0;
  return { annualProfit, valPT, equity, entryValuation, growth, paybackMonths, ownership };
}

// =========================================================
// INFO TOOLTIP
// =========================================================
function InfoTip({ text, T }) {
  const [show, setShow] = React.useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 4 }}>
      <button onClick={() => setShow(p => !p)} style={{ width: 14, height: 14, borderRadius: "50%", background: T.border, color: T.muted, border: "none", cursor: "pointer", fontSize: 9, fontWeight: "bold", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>i</button>
      {show && (
        <>
          <div onClick={() => setShow(false)} style={{ position: "fixed", inset: 0, zIndex: 999 }} />
          <div style={{ position: "absolute", left: 18, top: -8, zIndex: 1000, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 13px", width: 230, boxShadow: `0 6px 20px ${T.shadow}`, fontSize: 11, color: T.textSoft, lineHeight: 1.6 }}>
            {text}
            <button onClick={() => setShow(false)} style={{ position: "absolute", top: 5, right: 8, background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 12 }}>x</button>
          </div>
        </>
      )}
    </span>
  );
}

// =========================================================
// BUSINESS FORM (new)
// =========================================================
function BusinessForm({ onSave, onCancel, T, editData, hideValues = false, properties = [] }) {
  const [f, setF] = React.useState(editData || {
    name: "", type: "fnb",
    netProfitMonthly: "",
    ownershipPct: "100",
    incomeType: "active",
    // kos specific
    buildingLinked: false,
    linkedPropertyId: "",
    buildingValue: "",
    // investor specific
    investmentAmount: "",
    dividendAmount: "",
    dividendFreq: "monthly",
    knowsProfit: false,
    profitPTMonthly: "",
    sector: "jasa",
    notes: "",
  });

  const setFF = (k, v) => setF(p => ({ ...p, [k]: v }));

  const [showCalc, setShowCalc] = React.useState(false);

  const isKos       = f.type === "kos";
  const isInvestor  = f.type === "investor_pt_cv";
  const isOperational = !isInvestor;

  const netProfit   = parseVal(f.netProfitMonthly);
  const ownership   = parseVal(f.ownershipPct) || 100;
  const modal       = parseVal(f.investmentAmount);
  const divAmount   = parseVal(f.dividendAmount);
  const divFreqMult = { monthly: 12, quarterly: 4, annual: 1 }[f.dividendFreq] || 12;
  const divMonthly  = divAmount * divFreqMult / 12;

  // Valuasi
  let valResult = null;
  let valueForNetWorth = 0;
  let incomeMonthly = 0;

  if (isInvestor) {
    if (f.knowsProfit && parseVal(f.profitPTMonthly) > 0) {
      valResult = calcValuationInvestor({ monthlyProfit: parseVal(f.profitPTMonthly), ownershipPct: ownership, investmentAmount: modal });
      valueForNetWorth = valResult.equity.mid;
      incomeMonthly = divMonthly || parseVal(f.profitPTMonthly) * (ownership / 100);
    } else {
      valueForNetWorth = modal;
      incomeMonthly = divMonthly;
    }
  } else {
    if (netProfit > 0) {
      valResult = calcValuationOperational(netProfit, ownership, f.type);
      const buildingVal = isKos && f.buildingLinked ? (f.linkedPropertyId ? 0 : parseVal(f.buildingValue)) : 0;
      valueForNetWorth = valResult.mid + buildingVal;
      incomeMonthly = netProfit * (ownership / 100);
    }
  }

  const canSave = f.name && (isInvestor ? (modal > 0 || divAmount > 0) : netProfit > 0);

  const handleSave = () => {
    if (!canSave) return;
    const linkedProp = isKos && f.buildingLinked && f.linkedPropertyId
      ? properties.find(p => p.id === f.linkedPropertyId)
      : null;
    const newPropertyData = isKos && f.buildingLinked && !f.linkedPropertyId && parseVal(f.buildingValue) > 0
      ? { name: f.name + " - Bangunan", classKey: "property", valueIDR: parseVal(f.buildingValue), propertyData: { name: f.name + " - Bangunan", currentValue: f.buildingValue } }
      : null;

    onSave({
      classKey: "business",
      name: f.name,
      valueIDR: valueForNetWorth,
      businessData: f,
      income: incomeMonthly > 0 ? { amount: incomeMonthly, frequency: "monthly", type: "business" } : undefined,
      incomeType: f.incomeType,
      newPropertyData,
    });
  };

  // Input field style
  const inp = { width: "100%", background: T.inputBg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 9, padding: "10px 12px", fontSize: 12, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* TYPE SELECTOR */}
      <div>
        <div style={{ color: T.muted, fontSize: 10, marginBottom: 6 }}>Jenis Bisnis</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
          {BUSINESS_TYPES.map(bt => (
            <button key={bt.value} onClick={() => setFF("type", bt.value)} style={{
              padding: "9px 10px", borderRadius: 9, textAlign: "left", cursor: "pointer", fontSize: 11, display: "flex", gap: 6, alignItems: "center",
              border: `1px solid ${f.type === bt.value ? T.purple : T.border}`,
              background: f.type === bt.value ? T.purple + "18" : T.surface,
              color: f.type === bt.value ? T.purple : T.muted,
            }}>
              <span>{bt.icon}</span><span>{bt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* NAME */}
      <div>
        <div style={{ color: T.muted, fontSize: 10, marginBottom: 4 }}>Nama Bisnis <span style={{ color: T.red }}>*</span></div>
        <input value={f.name} onChange={e => setFF("name", e.target.value)} placeholder="Contoh: Warung Bu Sari" style={inp} />
      </div>

      {/* ACTIVE / PASSIVE */}
      <div>
        <div style={{ color: T.muted, fontSize: 10, marginBottom: 6, display: "flex", alignItems: "center" }}>
          Tipe Pendapatan
          <InfoTip T={T} text={"Aktif: bisnis bergantung pada keterlibatan langsung Anda. Jika Anda berhenti, bisnis terganggu. Pendapatan masuk Active Income.

Pasif: bisnis berjalan dengan manajemen/sistem sendiri. Anda hanya menerima return. Pendapatan masuk Passive Income."} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["active", "Aktif", "Saya terlibat langsung"], ["passive", "Pasif", "Ada manajemen/sistem"]].map(([v, l, sub]) => (
            <div key={v} onClick={() => setFF("incomeType", v)} style={{
              flex: 1, padding: "10px 12px", borderRadius: 9, cursor: "pointer",
              border: `1px solid ${f.incomeType === v ? T.accent : T.border}`,
              background: f.incomeType === v ? T.accentDim : T.surface,
            }}>
              <div style={{ color: f.incomeType === v ? T.accent : T.text, fontSize: 12, fontWeight: "bold" }}>{l}</div>
              <div style={{ color: T.muted, fontSize: 10 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* OWNERSHIP */}
      <div>
        <div style={{ color: T.muted, fontSize: 10, marginBottom: 4 }}>Kepemilikan (%)</div>
        <input value={f.ownershipPct} onChange={e => setFF("ownershipPct", e.target.value)} type="number" min="1" max="100" style={inp} />
      </div>

      {/* ---- OPERATIONAL INPUTS (F&B, Jasa, Retail, Online, Kos, PT Owner, Lainnya) ---- */}
      {isOperational && (
        <>
          <div>
            <div style={{ color: T.muted, fontSize: 10, marginBottom: 4, display: "flex", alignItems: "center" }}>
              Net Profit / Bulan (IDR) <span style={{ color: T.red, marginLeft: 2 }}>*</span>
              <InfoTip T={T} text={"Net Profit = pendapatan setelah dikurangi SEMUA biaya operasional (HPP, gaji karyawan, sewa, utilitas, dll).

Jika bisnis dijalankan sendiri, kurangi juga estimasi gaji pasar untuk posisi Anda agar valuasi lebih akurat.

Contoh: Omset Rp45jt - biaya ops Rp27.75jt - gaji Anda Rp5jt = Net Profit Rp12.25jt"} />
            </div>
            <input value={f.netProfitMonthly} onChange={e => setFF("netProfitMonthly", e.target.value)} placeholder="Contoh: 12250000" style={inp} />
            {netProfit > 0 && <div style={{ color: T.muted, fontSize: 9, marginTop: 3 }}>= {fMoney(netProfit * 12)} / tahun</div>}
          </div>

          {/* KOS: building link */}
          {isKos && (
            <div style={{ padding: "12px 14px", background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <div style={{ color: T.textSoft, fontSize: 11, fontWeight: "bold", marginBottom: 10 }}>
                Aset Bangunan
                <InfoTip T={T} text={"Nilai bangunan untuk valuasi kos berbasis aset. Jika bangunan sudah diinput di Real Assets, pilih dari daftar agar tidak double-count di Net Worth."} />
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {[[true, "Sudah di Real Assets"], [false, "Belum/input manual"]].map(([v, l]) => (
                  <button key={String(v)} onClick={() => setFF("buildingLinked", v)} style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", fontSize: 11,
                    border: `1px solid ${f.buildingLinked === v ? T.accent : T.border}`,
                    background: f.buildingLinked === v ? T.accentDim : T.surface,
                    color: f.buildingLinked === v ? T.accent : T.muted,
                  }}>{l}</button>
                ))}
              </div>
              {f.buildingLinked && properties.length > 0 && (
                <select value={f.linkedPropertyId} onChange={e => setFF("linkedPropertyId", e.target.value)} style={{ ...inp }}>
                  <option value="">Pilih properti...</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {fMoney(getIDR(p))}</option>
                  ))}
                </select>
              )}
              {f.buildingLinked && properties.length === 0 && (
                <div style={{ color: T.muted, fontSize: 11 }}>Belum ada properti di Real Assets. Input manual di bawah.</div>
              )}
              {(!f.buildingLinked || (f.buildingLinked && !f.linkedPropertyId)) && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ color: T.muted, fontSize: 10, marginBottom: 4 }}>Nilai Bangunan (IDR)</div>
                  <input value={f.buildingValue} onChange={e => setFF("buildingValue", e.target.value)} placeholder="Contoh: 800000000" style={inp} />
                  {!f.buildingLinked && parseVal(f.buildingValue) > 0 && (
                    <div style={{ color: T.blue, fontSize: 10, marginTop: 3 }}>Akan otomatis ditambahkan ke Real Assets</div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ---- INVESTOR INPUTS ---- */}
      {isInvestor && (
        <>
          <div>
            <div style={{ color: T.muted, fontSize: 10, marginBottom: 4, display: "flex", alignItems: "center" }}>
              Modal Disetor (IDR) <span style={{ color: T.red, marginLeft: 2 }}>*</span>
              <InfoTip T={T} text={"Total investasi yang sudah Anda masukkan ke PT/CV ini."} />
            </div>
            <input value={f.investmentAmount} onChange={e => setFF("investmentAmount", e.target.value)} placeholder="Contoh: 300000000" style={inp} />
          </div>

          <div style={{ padding: "12px 14px", background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
            <div style={{ color: T.textSoft, fontSize: 11, fontWeight: "bold", marginBottom: 10 }}>
              Apakah Anda mengetahui Net Profit PT ini?
              <InfoTip T={T} text={"Jika Anda tahu net profit PT, sistem akan menghitung valuasi penuh (3 skenario).

Jika tidak, nilai di Net Worth = modal disetor dan pendapatan dihitung dari dividen aktual."} />
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {[[true, "Ya, saya tahu"], [false, "Tidak, input dividen saja"]].map(([v, l]) => (
                <button key={String(v)} onClick={() => setFF("knowsProfit", v)} style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", fontSize: 11,
                  border: `1px solid ${f.knowsProfit === v ? T.accent : T.border}`,
                  background: f.knowsProfit === v ? T.accentDim : T.surface,
                  color: f.knowsProfit === v ? T.accent : T.muted,
                }}>{l}</button>
              ))}
            </div>
            {f.knowsProfit && (
              <div>
                <div style={{ color: T.muted, fontSize: 10, marginBottom: 4 }}>Net Profit PT / Bulan (IDR)</div>
                <input value={f.profitPTMonthly} onChange={e => setFF("profitPTMonthly", e.target.value)} placeholder="Contoh: 25000000" style={inp} />
              </div>
            )}
          </div>

          {/* Dividend */}
          <div>
            <div style={{ color: T.muted, fontSize: 10, marginBottom: 4 }}>
              {f.knowsProfit ? "Dividen Aktual yang Diterima (opsional)" : "Dividen yang Diterima (IDR)"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
              <input value={f.dividendAmount} onChange={e => setFF("dividendAmount", e.target.value)} placeholder="Contoh: 3500000" style={inp} />
              <select value={f.dividendFreq} onChange={e => setFF("dividendFreq", e.target.value)} style={{ ...inp, width: "auto", minWidth: 110 }}>
                <option value="monthly">/ Bulan</option>
                <option value="quarterly">/ Kuartal</option>
                <option value="annual">/ Tahun</option>
              </select>
            </div>
            {divMonthly > 0 && <div style={{ color: T.muted, fontSize: 9, marginTop: 3 }}>= {fMoney(divMonthly)} / bulan</div>}
          </div>

          {/* Sector for investor */}
          <div>
            <div style={{ color: T.muted, fontSize: 10, marginBottom: 6 }}>
              Sektor PT
              <InfoTip T={T} text={"Sektor menentukan range profit multiplier yang digunakan untuk estimasi valuasi perusahaan."} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {[
                ["tech", "Tech / Digital", "5x-15x"],
                ["jasa", "Jasa / Servis", "2x-6x"],
                ["fnb", "F&B / FMCG", "1x-3x"],
                ["properti", "Properti", "3x-6x"],
                ["manufaktur", "Manufaktur", "2x-5x"],
                ["other", "Lainnya", "2x-5x"],
              ].map(([v, l, r]) => (
                <button key={v} onClick={() => setFF("sector", v)} style={{
                  padding: "8px 10px", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: 11,
                  border: `1px solid ${f.sector === v ? T.accent : T.border}`,
                  background: f.sector === v ? T.accentDim : T.surface,
                  color: f.sector === v ? T.accent : T.muted,
                }}>
                  <div style={{ fontWeight: "bold" }}>{l}</div>
                  <div style={{ fontSize: 9, opacity: 0.7 }}>{r} profit/thn</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* NOTES */}
      <div>
        <div style={{ color: T.muted, fontSize: 10, marginBottom: 4 }}>Catatan (opsional)</div>
        <input value={f.notes} onChange={e => setFF("notes", e.target.value)} placeholder="Contoh: 10 kamar, full terisi" style={inp} />
      </div>

      {/* VALUATION RESULT - always visible summary */}
      {(valResult || (isInvestor && !f.knowsProfit && modal > 0)) && (
        <div style={{ padding: "14px 15px", background: T.purple + "14", borderRadius: 12, border: `1px solid ${T.purple}33` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ color: T.purple, fontSize: 12, fontWeight: "bold" }}>Estimasi Nilai Bisnis</div>
              <div style={{ color: T.muted, fontSize: 10 }}>
                {isInvestor && !f.knowsProfit ? "Berdasarkan modal disetor" : "Mid scenario (masuk Net Worth)"}
              </div>
            </div>
            <div style={{ color: T.purple, fontSize: 18, fontWeight: "bold", fontFamily: "'Playfair Display',serif" }}>
              {fMoney(valueForNetWorth)}
            </div>
          </div>

          {/* Low-Mid-High bar */}
          {valResult && isOperational && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
              {[["Konservatif", valResult.low, valResult.multLow], ["Tengah", valResult.mid, valResult.multMid], ["Optimis", valResult.high, valResult.multHigh]].map(([l, v, m]) => (
                <div key={l} style={{ padding: "8px 10px", background: T.surface, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ color: T.muted, fontSize: 9 }}>{l}</div>
                  <div style={{ color: T.purple, fontSize: 11, fontWeight: "bold" }}>{fMoney(v)}</div>
                  <div style={{ color: T.muted, fontSize: 9 }}>{m}x</div>
                </div>
              ))}
            </div>
          )}

          {valResult && isInvestor && f.knowsProfit && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
              {[["Konservatif", valResult.equity.low], ["Tengah", valResult.equity.mid], ["Optimis", valResult.equity.high]].map(([l, v]) => (
                <div key={l} style={{ padding: "8px 10px", background: T.surface, borderRadius: 8, textAlign: "center" }}>
                  <div style={{ color: T.muted, fontSize: 9 }}>{l}</div>
                  <div style={{ color: T.purple, fontSize: 11, fontWeight: "bold" }}>{fMoney(v)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Toggle detail engine */}
          <button onClick={() => setShowCalc(p => !p)} style={{ width: "100%", padding: "7px 0", background: "none", border: `1px solid ${T.purple}44`, borderRadius: 7, color: T.purple, cursor: "pointer", fontSize: 11 }}>
            {showCalc ? "Sembunyikan perhitungan" : "Tampilkan perhitungan detail"}
          </button>

          {showCalc && (
            <div style={{ marginTop: 10, padding: "12px 14px", background: T.surface, borderRadius: 9, border: `1px solid ${T.border}` }}>
              {isOperational && valResult && (
                <>
                  <div style={{ color: T.textSoft, fontSize: 10, fontWeight: "bold", marginBottom: 8 }}>Rincian Perhitungan</div>
                  {[
                    { l: "Net Profit / Bulan", v: fMoney(netProfit) },
                    { l: "Net Profit / Tahun", v: fMoney(valResult.annualProfit) },
                    { l: "Kepemilikan", v: ownership + "%" },
                    { l: `Multiple Range (${SECTOR_MULTIPLES[f.type]?.label || ""})`, v: `${valResult.multLow}x - ${valResult.multHigh}x` },
                    { l: "Valuasi Konservatif", v: fMoney(valResult.low) },
                    { l: "Valuasi Tengah (dipakai)", v: fMoney(valResult.mid) },
                    { l: "Valuasi Optimis", v: fMoney(valResult.high) },
                  ].map(row => (
                    <div key={row.l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ color: T.textSoft, fontSize: 11 }}>{row.l}</span>
                      <span style={{ color: T.text, fontSize: 11, fontWeight: "bold" }}>{row.v}</span>
                    </div>
                  ))}
                  {isKos && parseVal(f.buildingValue) > 0 && !f.linkedPropertyId && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ color: T.textSoft, fontSize: 11 }}>+ Nilai Bangunan</span>
                        <span style={{ color: T.blue, fontSize: 11, fontWeight: "bold" }}>{fMoney(parseVal(f.buildingValue))}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                        <span style={{ color: T.textSoft, fontSize: 11 }}>Total (Goodwill + Bangunan)</span>
                        <span style={{ color: T.purple, fontSize: 11, fontWeight: "bold" }}>{fMoney(valResult.mid + parseVal(f.buildingValue))}</span>
                      </div>
                    </>
                  )}
                  {isKos && f.linkedPropertyId && (
                    <div style={{ padding: "6px 0", color: T.blue, fontSize: 10 }}>Bangunan sudah di Real Assets - tidak double-count</div>
                  )}
                </>
              )}
              {isInvestor && valResult && f.knowsProfit && (
                <>
                  <div style={{ color: T.textSoft, fontSize: 10, fontWeight: "bold", marginBottom: 8 }}>Rincian Engine Investasi</div>
                  {[
                    { l: "Net Profit PT / Bulan", v: fMoney(parseVal(f.profitPTMonthly)) },
                    { l: "Net Profit PT / Tahun", v: fMoney(valResult.annualProfit) },
                    { l: "Entry Valuation PT", v: fMoney(valResult.entryValuation) },
                    { l: "Valuasi PT Sekarang (mid)", v: fMoney(valResult.valPT.mid) },
                    { l: `Ekuitas Anda (${ownership}%)`, v: fMoney(valResult.equity.mid) },
                    { l: "Growth vs Entry (mid)", v: valResult.growth.mid.toFixed(2) + "x" },
                    { l: "Payback Period", v: valResult.paybackMonths > 0 ? Math.round(valResult.paybackMonths) + " bulan" : "-" },
                  ].map(row => (
                    <div key={row.l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ color: T.textSoft, fontSize: 11 }}>{row.l}</span>
                      <span style={{ color: T.text, fontSize: 11, fontWeight: "bold" }}>{row.v}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ marginTop: 10, padding: "8px 12px", background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
            <div style={{ color: T.muted, fontSize: 10, lineHeight: 1.6 }}>
              <span style={{ color: T.textSoft, fontWeight: "bold" }}>Disclaimer:</span> Hasil valuasi merupakan estimasi kasar berdasarkan pendekatan profit multiplier yang umum digunakan. Angka aktual dapat berbeda secara signifikan tergantung kondisi pasar, due diligence, dan negosiasi. Untuk valuasi yang akurat, konsultasikan dengan akuntan publik atau konsultan bisnis berlisensi.
            </div>
          </div>
        </div>
      )}

      {/* INCOME SUMMARY */}
      {incomeMonthly > 0 && (
        <div style={{ padding: "10px 14px", background: f.incomeType === "active" ? T.orangeDim || T.accentDim : T.greenDim, borderRadius: 9, border: `1px solid ${f.incomeType === "active" ? T.orange || T.accent : T.green}33`, display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: T.textSoft, fontSize: 11, fontWeight: "bold" }}>{f.incomeType === "active" ? "Active Income" : "Passive Income"}</div>
            <div style={{ color: T.muted, fontSize: 10 }}>masuk ke ringkasan arus kas</div>
          </div>
          <div style={{ color: f.incomeType === "active" ? T.orange || T.accent : T.green, fontSize: 14, fontWeight: "bold" }}>+{fMoney(incomeMonthly)}/bln</div>
        </div>
      )}

      {/* SAVE / CANCEL */}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={handleSave} disabled={!canSave} style={{
          flex: 1, padding: "12px 0", borderRadius: 9, border: "none", fontWeight: "bold", fontSize: 13, cursor: canSave ? "pointer" : "not-allowed",
          background: canSave ? T.purple : T.border, color: canSave ? "#fff" : T.muted,
        }}>
          Simpan Bisnis
        </button>
        <button onClick={onCancel} style={{ padding: "12px 16px", borderRadius: 9, border: `1px solid ${T.border}`, background: "none", color: T.muted, cursor: "pointer", fontSize: 12 }}>
          Batal
        </button>
      </div>
    </div>
  );
}


function RealAssetsScene({
  assets,
  setAssets,
  debts = [],
  setDebts,
  dispCur,
  T,
  hideValues = false,
}) {
  const fV = (v, c) => fM(v, c, hideValues);
  const [mode, setMode] = useState("list"); // list | add-property | add-business | edit
  const [editAsset, setEditAsset] = useState(null);

  const properties = assets.filter((a) => a.classKey === "property");
  const businesses = assets.filter((a) => a.classKey === "business");
  const totalProp = properties.reduce((s, a) => s + getIDR(a), 0);
  const totalBiz = businesses.reduce((s, a) => s + getIDR(a), 0);
  const totalIncome =
    [...properties, ...businesses]
      .filter((a) => a.income?.amount > 0)
      .reduce(
        (s, a) => s + a.income.amount * (FREQ_MULT[a.income.frequency] || 12),
        0
      ) / 12;

  const saveAsset = (data) => {
    const { kprSync, ...assetData } = data;
    if (editAsset) {
      setAssets((p) =>
        p.map((a) => (a.id === editAsset.id ? { ...a, ...assetData } : a))
      );
      // Update linked debt if exists
      if (kprSync && setDebts) {
        setDebts((p) => {
          const linkedIdx = p.findIndex((d) => d.propertyId === editAsset.id);
          if (linkedIdx >= 0) {
            const updated = [...p];
            updated[linkedIdx] = {
              ...updated[linkedIdx],
              ...kprSync,
              propertyId: editAsset.id,
            };
            return updated;
          }
          return [
            ...p,
            { id: Date.now(), ...kprSync, propertyId: editAsset.id },
          ];
        });
      }
    } else {
      const newId = Date.now() + Math.random();
      setAssets((p) => [...p, { id: newId, ...assetData }]);
      // Auto-create debt entry if KPR sync enabled
      if (kprSync && setDebts) {
        setDebts((p) => [
          ...p,
          { id: Date.now(), ...kprSync, propertyId: newId },
        ]);
      }
      // Auto-add property to Real Assets if kos building not yet listed
      if (data.newPropertyData) {
        const propId = Date.now() + 1;
        setAssets((p) => [...p, { id: propId, ...data.newPropertyData }]);
      }
    }
    setMode("list");
    setEditAsset(null);
  };

  const removeAsset = (id) => setAssets((p) => p.filter((a) => a.id !== id));

  return (
    <div>
      {/* Summary bar */}
      {(properties.length > 0 || businesses.length > 0) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {[
            {
              l: "Total Properti",
              v: fMoney(totalProp, dispCur),
              c: "#34d399",
              icon: "🏡",
            },
            {
              l: "Total Bisnis",
              v: fMoney(totalBiz, dispCur),
              c: "#818cf8",
              icon: "🏢",
            },
            {
              l: "Income/bln",
              v: fMoney(totalIncome, dispCur),
              c: T.green,
              icon: "💰",
            },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                padding: "12px 14px",
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ color: T.muted, fontSize: 9, marginBottom: 3 }}>
                {s.l}
              </div>
              <div
                style={{
                  color: s.c,
                  fontSize: 13,
                  fontWeight: "bold",
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add buttons */}
      {mode === "list" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setMode("add-property")}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 10,
              border: `1px solid #34d39944`,
              background: "#34d39914",
              color: "#34d399",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            🏡 + Tambah Properti
          </button>
          <button
            onClick={() => setMode("add-business")}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 10,
              border: `1px solid #818cf844`,
              background: "#818cf814",
              color: "#818cf8",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            🏢 + Tambah Bisnis
          </button>
        </div>
      )}

      {/* Forms */}
      {mode === "add-property" && (
        <div
          style={{
            background: T.card,
            border: `1px solid #34d39944`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              color: "#34d399",
              fontSize: 11,
              letterSpacing: 2,
              marginBottom: 14,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            TAMBAH PROPERTI
          </div>
          <PropertyForm
            T={T}
            onSave={saveAsset}
            onCancel={() => setMode("list")}
          />
        </div>
      )}
      {mode === "add-business" && (
        <div
          style={{
            background: T.card,
            border: `1px solid #818cf844`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              color: "#818cf8",
              fontSize: 11,
              letterSpacing: 2,
              marginBottom: 14,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            TAMBAH BISNIS & USAHA
          </div>
          <BusinessForm
            T={T}
            onSave={saveAsset}
            onCancel={() => setMode("list")}
            properties={properties}
          />
        </div>
      )}
      {mode === "edit-property" && editAsset && (
        <div
          style={{
            background: T.card,
            border: `1px solid #34d39944`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              color: "#34d399",
              fontSize: 11,
              letterSpacing: 2,
              marginBottom: 14,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            EDIT PROPERTI
          </div>
          <PropertyForm
            T={T}
            onSave={saveAsset}
            onCancel={() => {
              setMode("list");
              setEditAsset(null);
            }}
            editData={editAsset.propertyData}
          />
        </div>
      )}
      {mode === "edit-business" && editAsset && (
        <div
          style={{
            background: T.card,
            border: `1px solid #818cf844`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              color: "#818cf8",
              fontSize: 11,
              letterSpacing: 2,
              marginBottom: 14,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            EDIT BISNIS
          </div>
          <BusinessForm
            T={T}
            onSave={saveAsset}
            onCancel={() => {
              setMode("list");
              setEditAsset(null);
            }}
            editData={editAsset.businessData}
            properties={properties}
          />
        </div>
      )}

      {/* Properti list */}
      {mode === "list" && properties.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              color: "#34d399",
              fontSize: 12,
              fontWeight: "bold",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            🏡 Properti{" "}
            <span
              style={{ color: T.muted, fontSize: 11, fontWeight: "normal" }}
            >
              ({properties.length} aset · {fV(totalProp, dispCur)})
            </span>
          </div>
          {properties.map((a) => {
            const pd = a.propertyData || {};
            const currentVal = parseVal(pd.currentValue) || getIDR(a);
            const purchaseVal = parseVal(pd.purchasePrice) || 0;
            const gain = currentVal - purchaseVal;
            const gainPct = purchaseVal > 0 ? (gain / purchaseVal) * 100 : 0;
            return (
              <div
                key={a.id}
                style={{
                  background: T.card,
                  border: `1px solid #34d39922`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: T.text,
                        fontSize: 13,
                        fontWeight: "bold",
                      }}
                    >
                      🏡 {a.name}
                    </div>
                    {pd.location && (
                      <div style={{ color: T.muted, fontSize: 11 }}>
                        📍 {pd.location}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        color: "#34d399",
                        fontSize: 13,
                        fontWeight: "bold",
                      }}
                    >
                      {fV(getIDR(a), dispCur)}
                    </div>
                    <div style={{ color: T.muted, fontSize: 10 }}>
                      net equity
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      background: T.surface,
                      borderRadius: 8,
                      padding: "7px 10px",
                    }}
                  >
                    <div style={{ color: T.muted, fontSize: 9 }}>
                      Nilai Pasar
                    </div>
                    <div
                      style={{
                        color: T.text,
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    >
                      {fV(currentVal, dispCur)}
                    </div>
                  </div>
                  <div
                    style={{
                      background: T.surface,
                      borderRadius: 8,
                      padding: "7px 10px",
                    }}
                  >
                    <div style={{ color: T.muted, fontSize: 9 }}>
                      Capital Gain
                    </div>
                    <div
                      style={{
                        color: gain >= 0 ? T.green : T.red,
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    >
                      {gainPct > 0 ? "+" : ""}
                      {gainPct.toFixed(1)}%
                    </div>
                  </div>
                  <div
                    style={{
                      background: T.surface,
                      borderRadius: 8,
                      padding: "7px 10px",
                    }}
                  >
                    <div style={{ color: T.muted, fontSize: 9 }}>Sewa/bln</div>
                    <div
                      style={{
                        color: T.green,
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    >
                      {a.income?.amount > 0
                        ? fMoney(
                            a.income.amount *
                              (a.income.frequency === "annual"
                                ? 1 / 12
                                : a.income.frequency === "quarterly"
                                ? 1 / 3
                                : 1),
                            dispCur
                          )
                        : "-"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 7 }}>
                  <button
                    onClick={() => {
                      setEditAsset(a);
                      setMode("edit-property");
                    }}
                    style={{
                      flex: 1,
                      padding: "7px 0",
                      borderRadius: 8,
                      border: `1px solid ${T.border}`,
                      background: "none",
                      color: T.muted,
                      cursor: "pointer",
                      fontSize: 11,
                    }}
                  >
                    ✎ Edit
                  </button>
                  <button
                    onClick={() => removeAsset(a.id)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 8,
                      border: `1px solid ${T.red}33`,
                      background: T.redDim,
                      color: T.red,
                      cursor: "pointer",
                      fontSize: 11,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bisnis list */}
      {mode === "list" && businesses.length > 0 && (
        <div>
          <div
            style={{
              color: "#818cf8",
              fontSize: 12,
              fontWeight: "bold",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            🏢 Bisnis & Usaha{" "}
            <span
              style={{ color: T.muted, fontSize: 11, fontWeight: "normal" }}
            >
              ({businesses.length} bisnis · {fV(totalBiz, dispCur)})
            </span>
          </div>
          {businesses.map((a) => {
            const bd = a.businessData || {};
            const bt =
              BUSINESS_TYPES.find((b) => b.value === bd.type) ||
              BUSINESS_TYPES[0];
            const netProfit =
              (parseVal(bd.monthlyRevenue) - parseVal(bd.monthlyOpex)) *
              (parseVal(bd.ownershipPct || "100") / 100);
            const roi =
              parseVal(bd.modalInvested) > 0
                ? ((netProfit * 12) / parseVal(bd.modalInvested)) * 100
                : 0;
            return (
              <div
                key={a.id}
                style={{
                  background: T.card,
                  border: `1px solid #818cf822`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: T.text,
                        fontSize: 13,
                        fontWeight: "bold",
                      }}
                    >
                      {bt.icon} {a.name}
                    </div>
                    <div style={{ color: T.muted, fontSize: 11 }}>
                      {bt.label} · {bd.ownershipPct || 100}% kepemilikan
                    </div>
                    {bd.notes && (
                      <div
                        style={{ color: T.muted, fontSize: 10, marginTop: 2 }}
                      >
                        📝 {bd.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        color: "#818cf8",
                        fontSize: 13,
                        fontWeight: "bold",
                      }}
                    >
                      {fV(getIDR(a), dispCur)}
                    </div>
                    <div style={{ color: T.muted, fontSize: 10 }}>valuasi</div>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      background: T.surface,
                      borderRadius: 8,
                      padding: "7px 10px",
                    }}
                  >
                    <div style={{ color: T.muted, fontSize: 9 }}>
                      Net Profit/bln
                    </div>
                    <div
                      style={{
                        color: netProfit > 0 ? T.green : T.red,
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    >
                      {fV(netProfit, dispCur)}
                    </div>
                  </div>
                  <div
                    style={{
                      background: T.surface,
                      borderRadius: 8,
                      padding: "7px 10px",
                    }}
                  >
                    <div style={{ color: T.muted, fontSize: 9 }}>ROI/thn</div>
                    <div
                      style={{
                        color: T.accent,
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    >
                      {roi > 0 ? `${roi.toFixed(1)}%` : "-"}
                    </div>
                  </div>
                  <div
                    style={{
                      background: T.surface,
                      borderRadius: 8,
                      padding: "7px 10px",
                    }}
                  >
                    <div style={{ color: T.muted, fontSize: 9 }}>Modal</div>
                    <div
                      style={{
                        color: T.text,
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    >
                      {fV(parseVal(bd.modalInvested), dispCur)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 7 }}>
                  <button
                    onClick={() => {
                      setEditAsset(a);
                      setMode("edit-business");
                    }}
                    style={{
                      flex: 1,
                      padding: "7px 0",
                      borderRadius: 8,
                      border: `1px solid ${T.border}`,
                      background: "none",
                      color: T.muted,
                      cursor: "pointer",
                      fontSize: 11,
                    }}
                  >
                    ✎ Edit
                  </button>
                  <button
                    onClick={() => removeAsset(a.id)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 8,
                      border: `1px solid ${T.red}33`,
                      background: T.redDim,
                      color: T.red,
                      cursor: "pointer",
                      fontSize: 11,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mode === "list" &&
        properties.length === 0 &&
        businesses.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: T.muted,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏡</div>
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              Belum ada aset properti atau bisnis
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.6 }}>
              Tambahkan properti, kos-kosan, atau bisnis kamu
              <br />
              untuk melacak net worth dan passive income secara lengkap
            </div>
          </div>
        )}
    </div>
  );
}

export { PropertyForm, BusinessForm, RealAssetsScene };
