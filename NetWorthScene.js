import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, SL, Chip, Bar, TInput, TSelect, TBtn, Donut, InfoBtn, LineChart } from '../components/ui';
import { fMoney, fM, parseVal, getIDR, FREQ_MULT, LS, LS2, getWealthSegment } from '../utils/helpers';

function NetWorthTrackerScene({
  assets,
  debts = [],
  dispCur,
  isPro,
  isProPlus = false,
  tier,
  T,
  hideValues = false,
  userEmail = "",
}) {
  const fV = (v, c) => fM(v, c, hideValues);
  const totalAssets = assets.reduce((s, a) => s + getIDR(a), 0);
  const totalLiabilities = debts.reduce(
    (s, d) => s + parseVal(d.outstanding),
    0
  );
  const currentTotal = totalAssets - totalLiabilities; // TRUE net worth
  const seg = getWealthSegment(Math.max(0, currentTotal));

  // Load or generate historical snapshots from localStorage
  const maxDays = tier
    ? tier.netWorthDays === Infinity
      ? 99999
      : tier.netWorthDays
    : 30;
  const snapKey = userEmail ? "wc_snapshots_" + btoa(userEmail).replace(/=/g,"") : "wc_snapshots";
  const [snapshots, setSnapshots] = useState(() => {
    try {
      const saved = localStorage.getItem(snapKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [range, setRange] = useState("1M");
  // tierRequired: 'free'=all, 'pro'=pro+, 'proplus'=proplus only
  const RANGES = [
    { id: "1D", label: "1H", days: 1, tierRequired: "free" },
    { id: "1W", label: "1W", days: 7, tierRequired: "free" },
    { id: "1M", label: "1M", days: 30, tierRequired: "free" },
    { id: "6M", label: "6M", days: 180, tierRequired: "pro" },
    { id: "1Y", label: "1Y", days: 365, tierRequired: "pro" },
    { id: "3Y", label: "3Y", days: 1095, tierRequired: "proplus" },
    { id: "5Y", label: "5Y", days: 1825, tierRequired: "proplus" },
    { id: "MAX", label: "MAX", days: 9999, tierRequired: "proplus" },
  ];
  const rangeUnlocked = (r) => {
    if (r.tierRequired === "free") return true;
    if (r.tierRequired === "pro") return isPro;
    if (r.tierRequired === "proplus") return isProPlus;
    return false;
  };

  // Auto-snapshot: once per day on open (any time)
  useEffect(() => {
    const now = new Date();
    const today = now.toDateString();
    const lastSnap = snapshots[snapshots.length - 1];
    const lastDate = lastSnap ? new Date(lastSnap.ts).toDateString() : null;
    if (lastDate !== today && currentTotal !== 0) {
      const newSnaps = [...snapshots, { ts: Date.now(), val: currentTotal }];
      setSnapshots(newSnaps);
      try { localStorage.setItem(snapKey, JSON.stringify(newSnaps)); } catch {}
    }
  }, []);

  // Trim to tier's max history days
  const tierCutoff = Date.now() - maxDays * 86400000;
  const tierSnapshots = snapshots.filter((s) => s.ts >= tierCutoff);
  const activeRange = RANGES.find((r) => r.id === range) || RANGES[2];
  const cutoff = Date.now() - activeRange.days * 86400000;
  const filtered = tierSnapshots.filter((s) => s.ts >= cutoff);
  const chartData =
    filtered.length >= 2
      ? filtered
      : filtered.length === 1
      ? filtered
      : tierSnapshots.slice(-Math.min(7, tierSnapshots.length));

  const first = chartData[0]?.val || currentTotal;
  const last = chartData[chartData.length - 1]?.val || currentTotal;
  const change = last - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;
  const isUp = change >= 0;

  // SVG line chart
  const W = 400,
    H = 120,
    pad = 8;
  const hasData = chartData.length > 0;
  const vals = hasData ? chartData.map((d) => d.val) : [currentTotal];
  const maxV = Math.max(...vals),
    minV = Math.min(...vals);
  const rangeV = maxV - minV || 1;
  const pts = (
    hasData ? chartData : [{ ts: Date.now(), val: currentTotal }]
  ).map((d, i) => ({
    x:
      pad +
      (i / Math.max((hasData ? chartData.length : 1) - 1, 1)) * (W - pad * 2),
    y: H - pad - ((d.val - minV) / rangeV) * (H - pad * 2),
  }));
  const pathD =
    pts.length > 0
      ? pts
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`
          )
          .join(" ")
      : "";
  const areaD =
    pts.length > 1
      ? pathD + ` L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`
      : "";
  const lineColor = isUp ? T.green : T.red;

  return (
    <div>
      {/* Header card */}
      <Card T={T} glow={seg.color} style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                color: T.muted,
                fontSize: 10,
                letterSpacing: 2,
                marginBottom: 4,
              }}
            >
              NET WORTH
            </div>
            <div
              style={{
                color: T.accent,
                fontSize: 26,
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: "bold",
              }}
            >
              {fV(currentTotal, dispCur)}
            </div>
            {totalLiabilities > 0 && (
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <div style={{ fontSize: 10, color: T.textSoft }}>
                  Aset:{" "}
                  <span style={{ color: T.green }}>
                    {fV(totalAssets, dispCur)}
                  </span>
                  {" − "}Hutang:{" "}
                  <span style={{ color: T.red }}>
                    {fV(totalLiabilities, dispCur)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22 }}>{seg.icon}</div>
            <div
              style={{
                color: seg.color,
                fontSize: 11,
                fontWeight: "bold",
                marginTop: 2,
              }}
            >
              {seg.short}
            </div>
            <div style={{ color: T.muted, fontSize: 10 }}>{seg.min}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              color: isUp ? T.green : T.red,
              fontSize: 13,
              fontWeight: "bold",
            }}
          >
            {isUp ? "▲" : "▼"} {fV(Math.abs(change), dispCur)}
          </span>
          <span style={{ color: isUp ? T.green : T.red, fontSize: 12 }}>
            ({changePct > 0 ? "+" : ""}
            {changePct.toFixed(2)}%)
          </span>
          <span style={{ color: T.muted, fontSize: 11 }}>
            vs periode {activeRange.label}
          </span>
        </div>
      </Card>

      {/* Range selector */}
      <div
        style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}
      >
        {RANGES.map((r) => {
          const locked = !rangeUnlocked(r);
          return (
            <button
              key={r.id}
              onClick={() => !locked && setRange(r.id)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid ${range === r.id ? T.accent : T.border}`,
                background: range === r.id ? T.accentDim : T.surface,
                color: locked
                  ? T.muted
                  : range === r.id
                  ? T.accent
                  : T.textSoft,
                cursor: locked ? "not-allowed" : "pointer",
                fontSize: 11,
                fontWeight: range === r.id ? "bold" : "normal",
                opacity: locked ? 0.5 : 1,
                position: "relative",
              }}
            >
              {r.label}
              {locked && <span style={{ fontSize: 8, marginLeft: 2 }}>⭐</span>}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <Card T={T} style={{ marginBottom: 16, padding: "16px 12px" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: H }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="nwgrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#nwgrad)" />
          <path
            d={pathD}
            stroke={lineColor}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {pts.length > 0 && (
            <circle
              cx={pts[pts.length - 1].x}
              cy={pts[pts.length - 1].y}
              r={4}
              fill={lineColor}
            />
          )}
        </svg>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
            color: T.muted,
            marginTop: 4,
            paddingInline: 8,
          }}
        >
          <span>
            {chartData[0]
              ? new Date(chartData[0].ts).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })
              : ""}
          </span>
          <span>
            {chartData[Math.floor(chartData.length / 2)]
              ? new Date(
                  chartData[Math.floor(chartData.length / 2)].ts
                ).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })
              : ""}
          </span>
          <span>
            {chartData[chartData.length - 1]
              ? new Date(chartData[chartData.length - 1].ts).toLocaleDateString(
                  "id-ID",
                  { day: "numeric", month: "short" }
                )
              : "Hari ini"}
          </span>
        </div>
        {!isPro && range !== "1D" && range !== "1W" && range !== "1M" && (
          <div
            style={{
              textAlign: "center",
              marginTop: 8,
              color: T.orange,
              fontSize: 11,
            }}
          >
            ⭐ Upgrade PRO untuk akses data hingga 5 tahun
          </div>
        )}
      </Card>

      {/* Wealth Segment Ladder */}
      <Card T={T} style={{ marginBottom: 16 }}>
        <SL T={T}>Wealth Segment</SL>
        <div
          style={{
            fontSize: 12,
            color: T.textSoft,
            marginBottom: 14,
            lineHeight: 1.6,
          }}
        >
          Berdasarkan total aset bersih Anda saat ini
        </div>
        {[
          {
            label: "Ultra High Net Worth",
            short: "UHNW",
            min: 500e9,
            color: "#f0c040",
            icon: "💎",
          },
          {
            label: "Very High Net Worth",
            short: "VHNW",
            min: 100e9,
            color: "#9b7ef8",
            icon: "🏆",
          },
          {
            label: "High Net Worth",
            short: "HNW",
            min: 10e9,
            color: "#f26b6b",
            icon: "⭐",
          },
          {
            label: "Affluent",
            short: "Affluent",
            min: 2e9,
            color: "#5b9cf6",
            icon: "🌟",
          },
          {
            label: "Upper Mass",
            short: "Upper Mass",
            min: 500e6,
            color: "#3ecf8e",
            icon: "📈",
          },
          {
            label: "Mass Market",
            short: "Mass",
            min: 0,
            color: "#9aa3b0",
            icon: "🌱",
          },
        ].map((s, i) => {
          const isActive = getWealthSegment(currentTotal).short === s.short;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                background: isActive ? s.color + "18" : T.surface,
                border: `1px solid ${isActive ? s.color + "44" : T.border}`,
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: isActive ? s.color : T.text,
                    fontSize: 12,
                    fontWeight: isActive ? "bold" : "normal",
                  }}
                >
                  {s.label}
                </div>
                <div style={{ color: T.muted, fontSize: 10 }}>
                  Net worth{" "}
                  {s.min > 0
                    ? `≥ ${hideValues ? "••••••" : fMoney(s.min)}`
                    : "< Rp500Jt"}
                </div>
              </div>
              {isActive && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: s.color,
                    color: "#000",
                    fontWeight: "bold",
                  }}
                >
                  Anda di sini
                </span>
              )}
            </div>
          );
        })}
      </Card>

      {/* Snapshot history */}
      <Card T={T} style={{ padding: "14px 16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <SL T={T} style={{ margin: 0 }}>
            Riwayat Snapshot
          </SL>
          <div style={{ color: T.muted, fontSize: 10 }}>Auto-update harian</div>
        </div>
        {snapshots
          .slice(-5)
          .reverse()
          .map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: i < 4 ? `1px solid ${T.border}` : "none",
              }}
            >
              <span style={{ color: T.textSoft, fontSize: 12 }}>
                {new Date(s.ts).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span
                style={{ color: T.accent, fontSize: 12, fontWeight: "bold" }}
              >
                {fV(s.val, dispCur)}
              </span>
            </div>
          ))}
      </Card>
    </div>
  );
}

export default NetWorthTrackerScene;
