import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, SL, Chip, Bar, TInput, TSelect, TBtn, Donut, InfoBtn, LineChart } from '../components/ui';
import { fMoney, fM, parseVal, getIDR, FREQ_MULT, LS, LS2, getWealthSegment } from '../utils/helpers';
import { ASSET_CLASSES, RISK_PROFILES, RISK_QUESTIONS, PRECIOUS_METALS, CRYPTO_COINS, DEBT_TYPES } from '../constants/data';
import { TIERS, getAIUsage, addAIUsage, canUploadPDF, pdfUploadsRemaining, addPDFUsage } from '../constants/tiers';

function DebtScene({ debts, setDebts, dispCur, tier, T, hideValues = false }) {
  const [mode, setMode] = useState("list");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "kpr",
    outstanding: "",
    monthlyPayment: "",
    interestRate: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  const startEdit = (d) => {
    setEditId(d.id);
    setForm({
      name: d.name,
      type: d.type,
      outstanding: String(d.outstanding),
      monthlyPayment: String(d.monthlyPayment),
      interestRate: String(d.interestRate || ""),
      notes: d.notes || "",
    });
  };
  const saveEdit = (id) => {
    setDebts((p) => p.map((d) => (d.id === id ? { ...d, ...form } : d)));
    setEditId(null);
    setForm({
      name: "",
      type: "kpr",
      outstanding: "",
      monthlyPayment: "",
      interestRate: "",
      startDate: "",
      endDate: "",
      notes: "",
    });
  };
  const cancelEdit = () => {
    setEditId(null);
    setForm({
      name: "",
      type: "kpr",
      outstanding: "",
      monthlyPayment: "",
      interestRate: "",
      startDate: "",
      endDate: "",
      notes: "",
    });
  };
  const fV = (v, c) => fM(v, c, hideValues);

  const totalOutstanding = debts.reduce(
    (s, d) => s + parseVal(d.outstanding),
    0
  );
  const totalMonthly = debts.reduce(
    (s, d) => s + parseVal(d.monthlyPayment),
    0
  );
  const avgRate = debts.length
    ? debts.reduce((s, d) => s + parseVal(d.interestRate || "0"), 0) /
      debts.length
    : 0;

  const canAdd =
    debts.length < (tier.maxDebts === Infinity ? 99999 : tier.maxDebts);

  const addDebt = () => {
    if (!form.name || !form.outstanding) return;
    setDebts((p) => [...p, { id: Date.now(), ...form }]);
    setForm({
      name: "",
      type: "kpr",
      outstanding: "",
      monthlyPayment: "",
      interestRate: "",
      startDate: "",
      endDate: "",
      notes: "",
    });
    setMode("list");
  };

  const removeDebt = (id) => setDebts((p) => p.filter((d) => d.id !== id));

  // Payoff projection
  const monthsToPayoff = (outstanding, monthly, annualRate) => {
    const P = parseVal(outstanding),
      pmt = parseVal(monthly),
      r = parseVal(annualRate) / 100 / 12;
    if (!P || !pmt) return null;
    if (r === 0) return Math.ceil(P / pmt);
    const n = -Math.log(1 - (r * P) / pmt) / Math.log(1 + r);
    return isFinite(n) && n > 0 ? Math.ceil(n) : null;
  };

  return (
    <div>
      {/* Summary */}
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
            label: "Total Hutang",
            val: fV(totalOutstanding, dispCur),
            color: T.red,
            icon: "💸",
          },
          {
            label: "Cicilan/Bulan",
            val: fV(totalMonthly, dispCur),
            color: T.orange,
            icon: "📅",
          },
          {
            label: "Bunga Rata-rata",
            val: debts.length ? `${avgRate.toFixed(1)}%` : "—",
            color: T.purple,
            icon: "📊",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: "12px 14px",
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ color: T.muted, fontSize: 9, marginBottom: 3 }}>
              {s.label}
            </div>
            <div
              style={{
                color: s.color,
                fontSize: 13,
                fontWeight: "bold",
                fontFamily: "'Playfair Display',Georgia,serif",
              }}
            >
              {s.val}
            </div>
          </div>
        ))}
      </div>

      {/* Tier limit warning */}
      {!canAdd && (
        <div
          style={{
            padding: "10px 14px",
            background: T.redDim,
            border: `1px solid ${T.red}33`,
            borderRadius: 10,
            marginBottom: 14,
            fontSize: 12,
            color: T.red,
          }}
        >
          ⚠ Batas hutang tier {tier.label} tercapai ({tier.maxDebts} item).
          Upgrade untuk tambah lebih banyak.
        </div>
      )}

      {/* Add button */}
      {mode === "list" && (
        <button
          onClick={() => canAdd && setMode("add")}
          disabled={!canAdd}
          style={{
            width: "100%",
            padding: "11px 0",
            borderRadius: 10,
            border: `1px solid ${canAdd ? T.red + "44" : T.border}`,
            background: canAdd ? T.redDim : T.surface,
            color: canAdd ? T.red : T.muted,
            cursor: canAdd ? "pointer" : "not-allowed",
            fontSize: 13,
            fontWeight: "bold",
            marginBottom: 16,
          }}
        >
          + Tambah Hutang
        </button>
      )}

      {/* Add form */}
      {mode === "add" && (
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.red}33`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              color: T.red,
              fontSize: 11,
              letterSpacing: 2,
              marginBottom: 14,
              fontFamily: "'Playfair Display',serif",
            }}
          >
            TAMBAH HUTANG
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Type selector */}
            <div>
              <div style={{ color: T.textSoft, fontSize: 10, marginBottom: 6 }}>
                Jenis Hutang
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 7,
                }}
              >
                {DEBT_TYPES.map((dt) => (
                  <button
                    key={dt.key}
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        type: dt.key,
                        interestRate: String(dt.rate),
                      }))
                    }
                    style={{
                      padding: "8px 10px",
                      borderRadius: 9,
                      border: `1px solid ${
                        form.type === dt.key ? dt.color : T.border
                      }`,
                      background:
                        form.type === dt.key ? dt.color + "18" : T.surface,
                      color: form.type === dt.key ? dt.color : T.muted,
                      cursor: "pointer",
                      fontSize: 11,
                      textAlign: "left",
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                    }}
                  >
                    <span>{dt.icon}</span>
                    <span>{dt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: T.textSoft, fontSize: 10, marginBottom: 4 }}>
                Nama / Keterangan
              </div>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Contoh: KPR BTN, CC BCA"
                style={{
                  width: "100%",
                  background: T.inputBg,
                  border: `1px solid ${T.border}`,
                  color: T.text,
                  borderRadius: 9,
                  padding: "10px 12px",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 9,
              }}
            >
              <div>
                <div
                  style={{ color: T.textSoft, fontSize: 10, marginBottom: 4 }}
                >
                  Sisa Hutang (IDR)
                </div>
                <input
                  value={form.outstanding}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, outstanding: e.target.value }))
                  }
                  placeholder="0"
                  style={{
                    width: "100%",
                    background: T.inputBg,
                    border: `1px solid ${T.border}`,
                    color: T.text,
                    borderRadius: 9,
                    padding: "10px 12px",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <div
                  style={{ color: T.textSoft, fontSize: 10, marginBottom: 4 }}
                >
                  Cicilan/Bulan (IDR)
                </div>
                <input
                  value={form.monthlyPayment}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, monthlyPayment: e.target.value }))
                  }
                  placeholder="0"
                  style={{
                    width: "100%",
                    background: T.inputBg,
                    border: `1px solid ${T.border}`,
                    color: T.text,
                    borderRadius: 9,
                    padding: "10px 12px",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <div
                  style={{ color: T.textSoft, fontSize: 10, marginBottom: 4 }}
                >
                  Bunga / Tahun (%)
                </div>
                <input
                  value={form.interestRate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, interestRate: e.target.value }))
                  }
                  placeholder={
                    DEBT_TYPES.find((d) => d.key === form.type)?.rate
                  }
                  style={{
                    width: "100%",
                    background: T.inputBg,
                    border: `1px solid ${T.border}`,
                    color: T.text,
                    borderRadius: 9,
                    padding: "10px 12px",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <div
                  style={{ color: T.textSoft, fontSize: 10, marginBottom: 4 }}
                >
                  Catatan (opsional)
                </div>
                <input
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Institusi, tenor, dll"
                  style={{
                    width: "100%",
                    background: T.inputBg,
                    border: `1px solid ${T.border}`,
                    color: T.text,
                    borderRadius: 9,
                    padding: "10px 12px",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Live payoff preview */}
            {parseVal(form.outstanding) > 0 &&
              parseVal(form.monthlyPayment) > 0 && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: T.redDim,
                    borderRadius: 10,
                    border: `1px solid ${T.red}22`,
                  }}
                >
                  {(() => {
                    const months = monthsToPayoff(
                      form.outstanding,
                      form.monthlyPayment,
                      form.interestRate
                    );
                    const totalPaid = months
                      ? parseVal(form.monthlyPayment) * months
                      : null;
                    const interest = totalPaid
                      ? totalPaid - parseVal(form.outstanding)
                      : null;
                    return months ? (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ color: T.muted, fontSize: 9 }}>
                            Lunas dalam
                          </div>
                          <div
                            style={{
                              color: T.orange,
                              fontSize: 12,
                              fontWeight: "bold",
                            }}
                          >
                            {months >= 12
                              ? `${Math.floor(months / 12)}th ${months % 12}bln`
                              : `${months} bulan`}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: T.muted, fontSize: 9 }}>
                            Total bunga
                          </div>
                          <div
                            style={{
                              color: T.red,
                              fontSize: 12,
                              fontWeight: "bold",
                            }}
                          >
                            {fMoney(interest)}
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={addDebt}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: 9,
                  border: "none",
                  background: T.red,
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: 13,
                }}
              >
                ✓ Simpan
              </button>
              <button
                onClick={() => setMode("list")}
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
        </div>
      )}

      {/* Debt list */}
      {debts.map((d) => {
        const dt = DEBT_TYPES.find((t) => t.key === d.type) || DEBT_TYPES[0];
        const months = monthsToPayoff(
          d.outstanding,
          d.monthlyPayment,
          d.interestRate
        );
        const pctPaid = 0; // would need original amount — placeholder
        return (
          <div
            key={d.id}
            style={{
              background: T.card,
              border: `1px solid ${dt.color}22`,
              borderRadius: 13,
              padding: "15px 16px",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 10,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    gap: 7,
                    alignItems: "center",
                    marginBottom: 3,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{dt.icon}</span>
                  <span
                    style={{ color: T.text, fontSize: 14, fontWeight: "bold" }}
                  >
                    {d.name}
                  </span>
                </div>
                <div style={{ color: T.muted, fontSize: 11 }}>
                  {dt.label}
                  {d.notes ? ` · ${d.notes}` : ""}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    color: dt.color,
                    fontSize: 14,
                    fontWeight: "bold",
                    fontFamily: "'Playfair Display',serif",
                  }}
                >
                  {fV(parseVal(d.outstanding), dispCur)}
                </div>
                <div style={{ color: T.muted, fontSize: 10 }}>sisa hutang</div>
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
              {[
                {
                  l: "Cicilan/bln",
                  v: fV(parseVal(d.monthlyPayment), dispCur),
                  c: T.orange,
                },
                {
                  l: "Bunga/thn",
                  v: d.interestRate ? `${d.interestRate}%` : "—",
                  c: T.purple,
                },
                {
                  l: "Lunas dlm",
                  v: months
                    ? months >= 12
                      ? `${Math.floor(months / 12)}th ${months % 12}bln`
                      : `${months}bln`
                    : "—",
                  c: T.blue,
                },
              ].map((s) => (
                <div
                  key={s.l}
                  style={{
                    background: T.surface,
                    borderRadius: 8,
                    padding: "7px 10px",
                  }}
                >
                  <div style={{ color: T.muted, fontSize: 9 }}>{s.l}</div>
                  <div style={{ color: s.c, fontSize: 11, fontWeight: "bold" }}>
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
            {editId === d.id ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: `1px solid ${T.border}`,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
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
                      Nama
                    </div>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        background: T.inputBg,
                        border: `1px solid ${T.accent}`,
                        color: T.text,
                        borderRadius: 8,
                        padding: "8px 10px",
                        fontSize: 12,
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        color: T.textSoft,
                        fontSize: 10,
                        marginBottom: 4,
                      }}
                    >
                      Sisa Hutang (IDR)
                    </div>
                    <input
                      value={form.outstanding}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, outstanding: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        background: T.inputBg,
                        border: `1px solid ${T.accent}`,
                        color: T.text,
                        borderRadius: 8,
                        padding: "8px 10px",
                        fontSize: 12,
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        color: T.textSoft,
                        fontSize: 10,
                        marginBottom: 4,
                      }}
                    >
                      Cicilan/Bulan
                    </div>
                    <input
                      value={form.monthlyPayment}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          monthlyPayment: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        background: T.inputBg,
                        border: `1px solid ${T.accent}`,
                        color: T.text,
                        borderRadius: 8,
                        padding: "8px 10px",
                        fontSize: 12,
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        color: T.textSoft,
                        fontSize: 10,
                        marginBottom: 4,
                      }}
                    >
                      Bunga/Thn (%)
                    </div>
                    <input
                      value={form.interestRate}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, interestRate: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        background: T.inputBg,
                        border: `1px solid ${T.accent}`,
                        color: T.text,
                        borderRadius: 8,
                        padding: "8px 10px",
                        fontSize: 12,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => saveEdit(d.id)}
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      borderRadius: 8,
                      border: "none",
                      background: T.accent,
                      color: "#000",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: 12,
                    }}
                  >
                    ✓ Simpan
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      padding: "9px 14px",
                      borderRadius: 8,
                      border: `1px solid ${T.border}`,
                      background: "none",
                      color: T.muted,
                      cursor: "pointer",
                      fontSize: 11,
                    }}
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      removeDebt(d.id);
                      cancelEdit();
                    }}
                    style={{
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: `1px solid ${T.red}33`,
                      background: T.redDim,
                      color: T.red,
                      cursor: "pointer",
                      fontSize: 11,
                    }}
                  >
                    × Hapus
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => startEdit(d)}
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
                  onClick={() => removeDebt(d.id)}
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
                  × Hapus
                </button>
              </div>
            )}
          </div>
        );
      })}
      {debts.length === 0 && mode === "list" && (
        <div
          style={{ textAlign: "center", padding: "40px 20px", color: T.muted }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>
            Belum ada hutang tercatat
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.6 }}>
            Tambahkan KPR, kartu kredit, atau cicilan
            <br />
            untuk melengkapi kalkulasi net worth kamu
          </div>
        </div>
      )}
    </div>
  );
}

export { DebtScene };
