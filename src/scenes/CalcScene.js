import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, SL, Chip, Bar, TInput, TSelect, TBtn, Donut, InfoBtn, LineChart } from '../components/ui';
import { fMoney, fM, parseVal, getIDR, FREQ_MULT, LS, LS2, getWealthSegment } from '../utils/helpers';
import { RATES, CURRENCIES } from '../constants/data';

function CalcScene({ assets, dispCur, T }) {
  const totalP = assets.reduce(
    (s, a) => s + (a.liveValue ?? a.valueIDR ?? 0),
    0
  );
  const [p, setP] = useState({
    principal: totalP > 0 ? Math.round(totalP / 1e6) * 1e6 : 100000000,
    monthly: 5000000,
    rate: 10,
    years: 10,
    compound: "yearly",
  });
  const N = { yearly: 1, quarterly: 4, monthly: 12 }[p.compound] || 1;
  const gen = useCallback(() => {
    const d = [];
    let b = p.principal;
    const r = p.rate / 100;
    for (let y = 0; y <= p.years; y++) {
      d.push({ y: Math.round(b) });
      if (y < p.years) b = b * Math.pow(1 + r / N, N) + p.monthly * 12;
    }
    return d;
  }, [p.principal, p.monthly, p.rate, p.years, p.compound, N]);
  const data = useMemo(gen, [gen]);
  const finalVal = data[data.length - 1]?.y || 0;
  const totalContrib = p.principal + p.monthly * 12 * p.years;
  const roi =
    totalContrib > 0 ? ((finalVal - totalContrib) / totalContrib) * 100 : 0;
  const calcFinal = (r) => {
    let b = p.principal;
    for (let y = 0; y < p.years; y++)
      b = b * Math.pow(1 + r / 100 / N, N) + p.monthly * 12;
    return b;
  };

  return (
    <div>
      <Card T={T} style={{ marginBottom: 16 }}>
        <SL T={T}>Proyeksi Pertumbuhan Investasi</SL>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 5 }}>
              Modal Awal (IDR)
            </div>
            <TInput
              T={T}
              type="number"
              value={p.principal}
              onChange={(e) =>
                setP((x) => ({
                  ...x,
                  principal: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>
          <div>
            <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 5 }}>
              Tabungan/Bulan (IDR)
            </div>
            <TInput
              T={T}
              type="number"
              value={p.monthly}
              onChange={(e) =>
                setP((x) => ({
                  ...x,
                  monthly: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: T.textSoft,
                marginBottom: 6,
              }}
            >
              <span>Return / Tahun</span>
              <span style={{ color: T.accent, fontWeight: "bold" }}>
                {p.rate}%
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              value={p.rate}
              onChange={(e) =>
                setP((x) => ({ ...x, rate: parseFloat(e.target.value) }))
              }
              style={{ width: "100%", accentColor: T.accent }}
            />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: T.textSoft,
                marginBottom: 6,
              }}
            >
              <span>Jangka Waktu</span>
              <span style={{ color: T.accent, fontWeight: "bold" }}>
                {p.years} tahun
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={40}
              value={p.years}
              onChange={(e) =>
                setP((x) => ({ ...x, years: parseInt(e.target.value) }))
              }
              style={{ width: "100%", accentColor: T.accent }}
            />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 8 }}>
              Frekuensi Compound
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                ["yearly", "Tahunan"],
                ["quarterly", "Kuartalan"],
                ["monthly", "Bulanan"],
              ].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setP((x) => ({ ...x, compound: v }))}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 8,
                    border: `1px solid ${
                      p.compound === v ? T.accent : T.border
                    }`,
                    background: p.compound === v ? T.accentDim : T.surface,
                    color: p.compound === v ? T.accent : T.textSoft,
                    cursor: "pointer",
                    fontSize: 11,
                    transition: "all 0.15s",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
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
              l: "Nilai Akhir",
              v: fMoney(finalVal, dispCur),
              c: T.accent,
              big: true,
            },
            {
              l: "Total Kontribusi",
              v: fMoney(totalContrib, dispCur),
              c: T.text,
            },
            {
              l: "Total Gain",
              v: fMoney(finalVal - totalContrib, dispCur),
              c: finalVal - totalContrib > 0 ? T.green : T.red,
            },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                padding: "12px 14px",
                background: T.surface,
                borderRadius: 10,
                border: `1px solid ${T.border}`,
              }}
            >
              <div style={{ color: T.muted, fontSize: 10, marginBottom: 4 }}>
                {s.l}
              </div>
              <div
                style={{
                  color: s.c,
                  fontSize: s.big ? 15 : 12,
                  fontWeight: "bold",
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            padding: "10px 14px",
            background: T.accentDim,
            borderRadius: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <span style={{ color: T.textSoft, fontSize: 12 }}>
            ROI {p.years} Tahun
          </span>
          <span
            style={{
              color: T.accent,
              fontSize: 18,
              fontWeight: "bold",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            {roi.toFixed(1)}%
          </span>
        </div>
        <SL T={T}>Grafik Pertumbuhan</SL>
        <div
          style={{
            background: T.surface,
            borderRadius: 10,
            padding: "14px 10px",
            marginBottom: 16,
          }}
        >
          <LineChart
            data={data.map((d) => ({ y: d.y }))}
            color={T.accent}
            T={T}
            height={110}
            label="growth"
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: T.muted,
              marginTop: 6,
              paddingInline: 8,
            }}
          >
            <span>Tahun 0</span>
            <span>Tahun {Math.round(p.years / 2)}</span>
            <span>Tahun {p.years}</span>
          </div>
        </div>
        <SL T={T}>Perbandingan Skenario</SL>
        {[
          { l: "Konservatif", r: 5, c: T.green },
          { l: "Target Saya", r: p.rate, c: T.accent },
          { l: "Agresif", r: 15, c: T.red },
        ].map((sc) => (
          <div
            key={sc.l}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              background: T.surface,
              borderRadius: 9,
              marginBottom: 8,
              border: `1px solid ${sc.r === p.rate ? sc.c + "44" : T.border}`,
            }}
          >
            <div>
              <span style={{ color: sc.c, fontWeight: "bold", fontSize: 12 }}>
                {sc.l}
              </span>
              <span style={{ color: T.muted, fontSize: 11, marginLeft: 8 }}>
                {sc.r}% p.a.
              </span>
            </div>
            <span style={{ color: sc.c, fontSize: 13, fontWeight: "bold" }}>
              {fMoney(calcFinal(sc.r), dispCur)}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

export default CalcScene;
