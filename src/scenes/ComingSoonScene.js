import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, SL, Chip, Bar, TInput, TSelect, TBtn, Donut, InfoBtn, LineChart } from '../components/ui';
import { fMoney, fM, parseVal, getIDR, FREQ_MULT, LS, LS2, getWealthSegment } from '../utils/helpers';

function ComingSoonScene({
  title,
  icon,
  description,
  features = [],
  proPlus = false,
  T,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Hero */}
      <div
        style={{
          textAlign: "center",
          padding: "32px 20px 24px",
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
        <div
          style={{
            color: T.accent,
            fontSize: 18,
            fontWeight: "bold",
            fontFamily: "'Playfair Display',Georgia,serif",
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "inline-block",
            padding: "3px 12px",
            borderRadius: 20,
            background: proPlus ? "#9b7ef822" : T.accentDim,
            border: `1px solid ${proPlus ? "#9b7ef844" : T.accentSoft}`,
            color: proPlus ? "#9b7ef8" : T.accent,
            fontSize: 10,
            fontWeight: "bold",
            marginBottom: 12,
          }}
        >
          {proPlus ? "💎 PRO+ Feature" : "⭐ PRO Feature"} · Coming Soon
        </div>
        <div
          style={{
            color: T.textSoft,
            fontSize: 13,
            lineHeight: 1.7,
            maxWidth: 360,
            margin: "0 auto",
          }}
        >
          {description}
        </div>
      </div>

      {/* Feature list */}
      {features.length > 0 && (
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            padding: 20,
          }}
        >
          <div
            style={{
              color: T.accent,
              fontSize: 10,
              letterSpacing: 2,
              marginBottom: 14,
              fontFamily: "'Playfair Display',serif",
            }}
          >
            YANG AKAN HADIR
          </div>
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                padding: "10px 0",
                borderBottom:
                  i < features.length - 1 ? `1px solid ${T.border}` : "none",
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div
                  style={{
                    color: T.text,
                    fontSize: 12,
                    fontWeight: "bold",
                    marginBottom: 2,
                  }}
                >
                  {f.label}
                </div>
                <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.5 }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notify me */}
      <div
        style={{
          background: T.accentDim,
          border: `1px solid ${T.accentSoft}`,
          borderRadius: 12,
          padding: "14px 16px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: T.accent,
            fontSize: 12,
            fontWeight: "bold",
            marginBottom: 4,
          }}
        >
          🔔 Dapatkan notifikasi saat fitur ini live
        </div>
        <div style={{ color: T.muted, fontSize: 11 }}>
          Aktifkan notifikasi di Settings untuk update terbaru
        </div>
      </div>
    </div>
  );
}

export default ComingSoonScene;
