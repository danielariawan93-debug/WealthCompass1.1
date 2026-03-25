import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { fMoney, fM, LS } from '../utils/helpers';

function Card({ children, style = {}, glow, T }) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${glow ? glow + "44" : T.border}`,
        borderRadius: 14,
        padding: 20,
        boxShadow: glow ? `0 0 24px ${glow}0c` : `0 2px 8px ${T.shadow}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
function SL({ children, T }) {
  return (
    <div
      style={{
        color: T.accent,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        marginBottom: 14,
        fontFamily: "'Playfair Display', Georgia, serif",
      }}
    >
      {children}
    </div>
  );
}
function Chip({ children, color, T }) {
  return (
    <span
      style={{
        fontSize: 10,
        padding: "2px 8px",
        borderRadius: 4,
        background: color + "1a",
        color,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}
function Bar({ pct, color, target, h = 6, T }) {
  return (
    <div
      style={{
        position: "relative",
        height: h,
        background: T.border,
        borderRadius: 3,
        overflow: "visible",
      }}
    >
      <div
        style={{
          width: `${Math.min(Math.max(pct, 0), 100)}%`,
          height: "100%",
          background: color,
          borderRadius: 3,
          transition: "width 0.5s",
        }}
      />
      {target !== undefined && (
        <div
          style={{
            position: "absolute",
            top: -3,
            left: `${Math.min(target, 99)}%`,
            width: 2,
            height: h + 6,
            background: T.accent,
            borderRadius: 1,
            boxShadow: `0 0 4px ${T.accent}`,
          }}
        />
      )}
    </div>
  );
}
function TInput({ style = {}, T, ...props }) {
  return (
    <input
      {...props}
      style={{
        background: T.inputBg,
        border: `1px solid ${T.border}`,
        color: T.text,
        borderRadius: 9,
        padding: "10px 12px",
        fontSize: 13,
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
        ...style,
      }}
    />
  );
}
function TSelect({ style = {}, T, children, ...props }) {
  return (
    <select
      {...props}
      style={{
        background: T.inputBg,
        border: `1px solid ${T.border}`,
        color: T.text,
        borderRadius: 9,
        padding: "10px 12px",
        fontSize: 13,
        ...style,
      }}
    >
      {children}
    </select>
  );
}
function TBtn({
  children,
  style = {},
  T,
  variant = "primary",
  disabled,
  ...props
}) {
  const base = {
    border: "none",
    borderRadius: 9,
    padding: "10px 16px",
    fontWeight: "bold",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13,
    transition: "all 0.2s",
    ...style,
  };
  if (variant === "primary")
    return (
      <button
        {...props}
        disabled={disabled}
        style={{
          ...base,
          background: disabled ? T.border : T.accent,
          color: disabled ? T.muted : "#000",
        }}
      >
        {children}
      </button>
    );
  if (variant === "ghost")
    return (
      <button
        {...props}
        disabled={disabled}
        style={{
          ...base,
          background: T.accentDim,
          color: T.accent,
          border: `1px solid ${T.accentSoft}`,
        }}
      >
        {children}
      </button>
    );
  if (variant === "danger")
    return (
      <button
        {...props}
        disabled={disabled}
        style={{
          ...base,
          background: T.redDim,
          color: T.red,
          border: `1px solid ${T.red}33`,
        }}
      >
        {children}
      </button>
    );
  return (
    <button
      {...props}
      disabled={disabled}
      style={{ ...base, background: T.border, color: T.textSoft }}
    >
      {children}
    </button>
  );
}
function Donut({ slices, total, T, size = 140 }) {
  const r = 52,
    cx = size / 2,
    cy = size / 2,
    circ = 2 * Math.PI * r;
  let off = 0;
  const arcs = slices
    .filter((s) => s.v > 0)
    .map((s) => {
      const d = total > 0 ? (s.v / total) * circ : 0;
      const a = { ...s, d, off };
      off += d;
      return a;
    });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((a, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={a.c}
          strokeWidth={16}
          strokeDasharray={`${a.d} ${circ - a.d}`}
          strokeDashoffset={-a.off}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
            transition: "all 0.5s",
          }}
          opacity={0.9}
        />
      ))}
      <circle cx={cx} cy={cy} r={44} fill={T.card} />
      <text
        x={cx}
        y={cy - 7}
        textAnchor="middle"
        fill={T.accent}
        fontSize={8}
        fontFamily="'Playfair Display', Georgia, serif"
        letterSpacing={1}
      >
        TOTAL
      </text>
      <text
        x={cx}
        y={cy + 7}
        textAnchor="middle"
        fill={T.text}
        fontSize={8}
        fontFamily="'Playfair Display', Georgia, serif"
      >
        {fMoney(total)}
      </text>
    </svg>
  );
}
function InfoBtn({ content, T }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setShow((p) => !p)}
        style={{
          width: 15,
          height: 15,
          borderRadius: "50%",
          background: T.border,
          color: T.muted,
          border: "none",
          cursor: "pointer",
          fontSize: 9,
          fontWeight: "bold",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        i
      </button>
      {show && (
        <>
          <div
            onClick={() => setShow(false)}
            style={{ position: "fixed", inset: 0, zIndex: 999 }}
          />
          <div
            style={{
              position: "absolute",
              left: 20,
              top: -8,
              zIndex: 1000,
              background: T.card,
              border: `1px solid ${T.borderLight}`,
              borderRadius: 11,
              padding: "12px 14px",
              width: 240,
              boxShadow: `0 8px 24px ${T.shadow}`,
              fontSize: 11,
              color: T.textSoft,
              lineHeight: 1.7,
            }}
          >
            {content}
            <button
              onClick={() => setShow(false)}
              style={{
                position: "absolute",
                top: 6,
                right: 8,
                background: "none",
                border: "none",
                color: T.muted,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              ×
            </button>
          </div>
        </>
      )}
    </div>
  );
}
function LineChart({ data, color, T, height = 110, label = "", series, interactive = false }) {
  if (!data || data.length < 2) return null;

  // Multi-series mode: accept series=[{key,color,label}]
  // Single-series fallback: use legacy color prop with key 'y'
  const activeSeries = series && series.length > 0
    ? series
    : [{ key: 'y', color: color || (T && T.accent) || '#888', label: label }];

  const W = 300, H = height, pad = 8;

  // Compute global min/max across ALL series for a unified Y scale
  const allValues = activeSeries.flatMap(s => data.map(d => d[s.key] ?? 0));
  const globalMax = Math.max(...allValues);
  const globalMin = Math.min(0, Math.min(...allValues));
  const range = globalMax - globalMin || 1;

  const toY = (val) => H - pad - ((val - globalMin) / range) * (H - pad * 2);
  const toX = (i) => pad + (i / (data.length - 1)) * (W - pad * 2);

  const [tooltip, setTooltip] = useState(null);

  const handleMouseMove = (e) => {
    if (!interactive) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xRel = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(xRel * (data.length - 1));
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    setTooltip({ idx: clamped, x: toX(clamped), d: data[clamped] });
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height, overflow: 'visible' }}
      preserveAspectRatio="none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTooltip(null)}
      onTouchEnd={() => setTooltip(null)}
    >
      <defs>
        {activeSeries.map((s, si) => (
          <linearGradient key={si} id={`g_${s.key}_${si}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0.01" />
          </linearGradient>
        ))}
      </defs>

      {activeSeries.map((s, si) => {
        const pts = data.map((d, i) => ({ x: toX(i), y: toY(d[s.key] ?? 0) }));
        const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        const areaD = pathD + ` L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
        // Only fill area for the first (primary) series to avoid visual clutter
        return (
          <g key={si}>
            {si === 0 && <path d={areaD} fill={`url(#g_${s.key}_${si})`} />}
            <path d={pathD} stroke={s.color} strokeWidth={si === 0 ? 2 : 1.5} fill="none"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={si === 1 ? '5,3' : si === 2 ? '2,3' : 'none'} />
            <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={3} fill={s.color} />
          </g>
        );
      })}

      {/* Tooltip crosshair */}
      {interactive && tooltip && (
        <g>
          <line x1={tooltip.x} y1={pad} x2={tooltip.x} y2={H - pad}
            stroke={T ? T.border : '#555'} strokeWidth={1} strokeDasharray="3,2" />
          {activeSeries.map((s, si) => {
            const val = tooltip.d[s.key] ?? 0;
            const cy = toY(val);
            return <circle key={si} cx={tooltip.x} cy={cy} r={4} fill={s.color} stroke="#fff" strokeWidth={1.5} />;
          })}
        </g>
      )}
    </svg>
  );
}

export { Card, SL, Chip, Bar, TInput, TSelect, TBtn, Donut, InfoBtn, LineChart };
