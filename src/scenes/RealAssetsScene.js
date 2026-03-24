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
                v: rentalYield > 0 ? `${rentalYield.toFixed(1)}%/thn` : "—",
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

function BusinessForm({ onSave, onCancel, T, editData, hideValues = false }) {
  const [f, setF] = useState(
    editData || {
      name: "",
      type: "kos",
      modalInvested: "",
      monthlyRevenue: "",
      monthlyOpex: "",
      ownershipPct: "100",
      notes: "",
    }
  );

  const revenue = parseVal(f.monthlyRevenue);
  const opex =
    (f.opexMode || "nominal") === "pct"
      ? (revenue * parseVal(f.monthlyOpex)) / 100
      : parseVal(f.monthlyOpex);
  const netProfit =
    Math.max(0, revenue - opex) * (parseVal(f.ownershipPct) / 100);
  const annualProfit = netProfit * 12;
  const bizType =
    BUSINESS_TYPES.find((b) => b.value === f.type) || BUSINESS_TYPES[0];
  const valuation = annualProfit * bizType.multiplier;
  const modal = parseVal(f.modalInvested);
  const roiPct = modal > 0 ? (annualProfit / modal) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ color: "#9aa3b0", fontSize: 10, marginBottom: 6 }}>
          Jenis Bisnis
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}
        >
          {BUSINESS_TYPES.map((bt) => (
            <button
              key={bt.value}
              onClick={() => setF((p) => ({ ...p, type: bt.value }))}
              style={{
                padding: "9px 10px",
                borderRadius: 9,
                border: `1px solid ${
                  f.type === bt.value ? T.purple : T.border
                }`,
                background: f.type === bt.value ? T.purple + "18" : T.surface,
                color: f.type === bt.value ? T.purple : T.muted,
                cursor: "pointer",
                fontSize: 11,
                textAlign: "left",
                display: "flex",
                gap: 6,
                alignItems: "center",
              }}
            >
              <span>{bt.icon}</span>
              <span>{bt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        <div style={{ gridColumn: "span 2" }}>
          <div style={LS}>Nama Bisnis</div>
          <input
            value={f.name}
            onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))}
            placeholder={`Contoh: Kos ${bizType.icon}`}
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
          <div style={LS}>Modal Disetor (IDR)</div>
          <input
            value={f.modalInvested}
            onChange={(e) =>
              setF((p) => ({ ...p, modalInvested: e.target.value }))
            }
            placeholder="Total investasi"
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
          <div style={LS}>Kepemilikan (%)</div>
          <input
            value={f.ownershipPct}
            onChange={(e) =>
              setF((p) => ({ ...p, ownershipPct: e.target.value }))
            }
            type="number"
            min="1"
            max="100"
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
          <div style={LS}>Pendapatan/bulan (IDR)</div>
          <input
            value={f.monthlyRevenue}
            onChange={(e) =>
              setF((p) => ({ ...p, monthlyRevenue: e.target.value }))
            }
            placeholder="Gross revenue"
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
            <span>Biaya Operasional/bulan</span>
            <div style={{ display: "flex", gap: 4 }}>
              {[
                ["nominal", "Rp"],
                ["pct", "%"],
              ].map(([m, l]) => (
                <button
                  key={m}
                  onClick={() => setF((p) => ({ ...p, opexMode: m }))}
                  style={{
                    padding: "2px 7px",
                    borderRadius: 5,
                    border: `1px solid ${
                      (f.opexMode || "nominal") === m ? T.accent : T.border
                    }`,
                    background:
                      (f.opexMode || "nominal") === m ? T.accentDim : "none",
                    color: (f.opexMode || "nominal") === m ? T.accent : T.muted,
                    cursor: "pointer",
                    fontSize: 9,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <input
            value={f.monthlyOpex}
            onChange={(e) =>
              setF((p) => ({ ...p, monthlyOpex: e.target.value }))
            }
            placeholder={
              (f.opexMode || "nominal") === "pct"
                ? "% dari pendapatan (contoh: 40)"
                : "Gaji, sewa, bahan dll"
            }
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
          {(f.opexMode || "nominal") === "pct" &&
            parseVal(f.monthlyOpex) > 0 &&
            parseVal(f.monthlyRevenue) > 0 && (
              <div style={{ color: T.muted, fontSize: 10, marginTop: 4 }}>
                = Rp
                {Math.round(
                  (parseVal(f.monthlyRevenue) * parseVal(f.monthlyOpex)) / 100
                ).toLocaleString("id-ID")}{" "}
                /bln
              </div>
            )}
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <div style={LS}>Catatan (opsional)</div>
          <input
            value={f.notes}
            onChange={(e) => setF((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Misal: 10 kamar, full terisi"
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

      {/* Live valuation preview */}
      {revenue > 0 && (
        <div
          style={{
            padding: "12px 14px",
            background: T.purple + "14",
            borderRadius: 10,
            border: `1px solid ${T.purple}33`,
          }}
        >
          <div
            style={{
              color: T.purple,
              fontSize: 11,
              fontWeight: "bold",
              marginBottom: 8,
            }}
          >
            📊 Estimasi Valuasi ({bizType.label})
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {[
              {
                l: "Net Profit/bln",
                v: fMoney(netProfit),
                c: netProfit > 0 ? T.green : T.red,
              },
              { l: "Net Profit/thn", v: fMoney(annualProfit), c: T.green },
              {
                l: `Valuasi (${bizType.multiplier}× profit)`,
                v: fMoney(valuation),
                c: T.purple,
              },
              {
                l: "ROI/thn",
                v: roiPct > 0 ? `${roiPct.toFixed(1)}%` : "—",
                c: T.accent,
              },
            ].map((s) => (
              <div key={s.l}>
                <div style={{ color: "#4d5866", fontSize: 9 }}>{s.l}</div>
                <div style={{ color: s.c, fontSize: 12, fontWeight: "bold" }}>
                  {s.v}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              color: "#4d5866",
              fontSize: 10,
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            Valuasi menggunakan metode {bizType.multiplier}× annual profit
            (standar untuk {bizType.label.toLowerCase()})
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          onClick={() => {
            if (!f.name || !f.modalInvested) return;
            const useVal = valuation > 0 ? valuation : modal;
            onSave({
              classKey: "business",
              name: f.name,
              valueIDR: useVal,
              businessData: f,
              income:
                netProfit > 0
                  ? {
                      amount: netProfit,
                      frequency: "monthly",
                      type: "business",
                    }
                  : undefined,
            });
          }}
          style={{
            flex: 1,
            padding: "11px 0",
            borderRadius: 9,
            border: "none",
            background: T.purple,
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 13,
          }}
        >
          ✓ Simpan Bisnis
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
                        : "—"}
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
                      {roi > 0 ? `${roi.toFixed(1)}%` : "—"}
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
