import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, SL, Chip, Bar, TInput, TSelect, TBtn, Donut, InfoBtn, LineChart } from '../components/ui';
import { fMoney, fM, parseVal, getIDR, FREQ_MULT, LS, LS2, getWealthSegment } from '../utils/helpers';
import { RATES, CURRENCIES } from '../constants/data';

function CalcScene({ assets, dispCur, T }) {
  const totalP = assets.reduce((s, a) => s + (a.liveValue ?? a.valueIDR ?? 0), 0);

  const [p, setP] = useState({
    principal: totalP > 0 ? Math.round(totalP / 1e6) * 1e6 : 100000000,
    monthly: 5000000,
    rate: 10,
    inflation: 4,
    years: 10,
    compound: "yearly",
  });

  const N = { yearly: 1, quarterly: 4, monthly: 12 }[p.compound] || 1;

  const gen = useCallback(() => {
    const d = [];
    let b = p.principal;
    let contrib = p.principal;
    const r = p.rate / 100;
    const inf = p.inflation / 100;

    for (let y = 0; y <= p.years; y++) {
      const inflationFactor = Math.pow(1 + inf, y);
      d.push({ 
        y: Math.round(b), 
        contrib: Math.round(contrib),
        real: Math.round(b / inflationFactor),
        label: `Thn ${y}` 
      });
      if (y < p.years) {
        b = b * Math.pow(1 + r / N, N) + p.monthly * 12;
        contrib += p.monthly * 12;
      }
    }
    return d;
  }, [p.principal, p.monthly, p.rate, p.inflation, p.years, p.compound, N]);

  const data = useMemo(() => gen(), [gen]);
  const finalVal = data[data.length - 1]?.y || 0;
  const totalContrib = data[data.length - 1]?.contrib || 0;
  const realFinalVal = data[data.length - 1]?.real || 0;

  const calcFinal = (r) => {
    let b = p.principal;
    for (let y = 0; y < p.years; y++)
      b = b * Math.pow(1 + r / 100 / N, N) + p.monthly * 12;
    return b;
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <Card T={T} style={{ marginBottom: 16 }}>
        <SL T={T}>Proyeksi Pertumbuhan Investasi</SL>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: T.textSoft, marginBottom: 6 }}>Modal Awal (IDR)</div>
            <TInput T={T} value={p.principal} onChange={(e) => setP(x => ({ ...x, principal: parseVal(e.target.value) }))} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSoft, marginBottom: 6 }}>Tabungan/Bulan (IDR)</div>
            <TInput T={T} value={p.monthly} onChange={(e) => setP(x => ({ ...x, monthly: parseVal(e.target.value) }))} />
          </div>
          
          <div style={{ gridColumn: "span 2" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textSoft, marginBottom: 6 }}>
              <span>Return / Tahun</span>
              <span style={{ color: T.accent, fontWeight: "bold" }}>{p.rate}%</span>
            </div>
            <input type="range" min={1} max={30} step={0.5} value={p.rate} onChange={(e) => setP(x => ({ ...x, rate: parseFloat(e.target.value) }))} style={{ width: "100%", accentColor: T.accent }} />
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textSoft, marginBottom: 6 }}>
              <span>Estimasi Inflasi / Tahun</span>
              <span style={{ color: T.red, fontWeight: "bold" }}>{p.inflation}%</span>
            </div>
            <input type="range" min={0} max={15} step={0.5} value={p.inflation} onChange={(e) => setP(x => ({ ...x, inflation: parseFloat(e.target.value) }))} style={{ width: "100%", accentColor: T.red }} />
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textSoft, marginBottom: 6 }}>
              <span>Jangka Waktu</span>
              <span style={{ color: T.text, fontWeight: "bold" }}>{p.years} tahun</span>
            </div>
            <input type="range" min={1} max={50} value={p.years} onChange={(e) => setP(x => ({ ...x, years: parseInt(e.target.value) }))} style={{ width: "100%", accentColor: T.text }} />
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 8 }}>Frekuensi Compound</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[["yearly", "Tahunan"], ["quarterly", "Kuartalan"], ["monthly", "Bulanan"]].map(([v, l]) => (
                <button key={v} onClick={() => setP(x => ({ ...x, compound: v }))} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${p.compound === v ? T.accent : T.border}`, background: p.compound === v ? T.accentDim : T.surface, color: p.compound === v ? T.accent : T.textSoft, fontSize: 11, cursor: "pointer" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <SL T={T}>Ringkasan Angka</SL>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { l: "Total Kontribusi", v: fMoney(totalContrib, dispCur), c: T.text },
            { l: "Nilai Nominal Akhir", v: fMoney(finalVal, dispCur), c: T.accent, big: true },
            { l: "Total Gain", v: fMoney(finalVal - totalContrib, dispCur), c: T.green },
            { l: "Est Nilai Riil", v: fMoney(realFinalVal, dispCur), c: T.blue }
          ].map((s) => (
            <div key={s.l} style={{ padding: "12px 14px", background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <div style={{ color: T.muted, fontSize: 10, marginBottom: 4 }}>{s.l}</div>
              <div style={{ color: s.c, fontSize: s.big ? 15 : 12, fontWeight: "bold" }}>{s.v}</div>
            </div>
          ))}
        </div>

        <SL T={T}>Visualisasi Pertumbuhan</SL>
        <div style={{ background: T.surface, borderRadius: 10, padding: "16px 12px", border: `1px solid ${T.border}` }}>
          <LineChart
            data={data}
            T={T}
            height={140}
            interactive={true}
            series={[
              { key: 'y', color: T.accent, label: 'Nominal' },
              { key: 'contrib', color: T.textSoft, label: 'Kontribusi' },
              { key: 'real', color: T.blue, label: 'Riil' }
            ]}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted, marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 8, height: 2, background: T.accent }} />Nominal</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 8, height: 2, background: T.textSoft }} />Modal</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 8, height: 2, background: T.blue }} />Riil</div>
          </div>
        </div>

        <SL T={T} style={{ marginTop: 20 }}>Perbandingan Skenario (Nominal)</SL>
        {[
          { l: "Konservatif", r: 5, c: T.green },
          { l: "Target Saya", r: p.rate, c: T.accent },
          { l: "Agresif", r: 15, c: T.red },
        ].map((sc) => (
          <div key={sc.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: T.surface, borderRadius: 9, marginBottom: 8, border: `1px solid ${sc.r === p.rate ? sc.c + "44" : T.border}` }}>
            <div><span style={{ color: sc.c, fontWeight: "bold", fontSize: 12 }}>{sc.l}</span><span style={{ color: T.muted, fontSize: 11, marginLeft: 8 }}>{sc.r}% p.a.</span></div>
            <span style={{ color: sc.c, fontSize: 13, fontWeight: "bold" }}>{fMoney(calcFinal(sc.r), dispCur)}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

export default CalcScene;
