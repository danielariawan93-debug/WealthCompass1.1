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
function LineChart({ data, color, T, height = 110, label = "" }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data.map((d) => d.y)),
    min = Math.min(...data.map((d) => d.y)),
    range = max - min || 1;
  const W = 300,
    H = height,
    pad = 8;
  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: H - pad - ((d.y - min) / range) * (H - pad * 2),
  }));
  const pathD = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaD = pathD + ` L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`g_${label}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#g_${label})`} />
      <path
        d={pathD}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map(
        (p, i) =>
          i === pts.length - 1 && (
            <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
          )
      )}
    </svg>
  );
}

export { Card, SL, Chip, Bar, TInput, TSelect, TBtn, Donut, InfoBtn, LineChart };
