import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, SL, Chip, Bar, TInput, TSelect, TBtn, Donut, InfoBtn, LineChart } from '../components/ui';
import { fMoney, fM, parseVal, getIDR, FREQ_MULT, LS, LS2, getWealthSegment } from '../utils/helpers';
import { ASSET_CLASSES, RISK_PROFILES, RISK_QUESTIONS, PRECIOUS_METALS, CRYPTO_COINS, DEBT_TYPES } from '../constants/data';

function RebalanceScene({
  assets,
  riskProfile,
  dispCur,
  T,
  setTab,
  hideValues = false,
}) {
  const fV = (v, c) => fM(v, c, hideValues);
  const [showRec, setShowRec] = useState(false);
  const total = assets.reduce((s, a) => s + getIDR(a), 0);
  const target = riskProfile ? RISK_PROFILES[riskProfile].alloc : null;
  const profile = riskProfile ? RISK_PROFILES[riskProfile] : null;
  const byClass = ASSET_CLASSES.map((ac) => {
    const v = assets
      .filter((a) => a.classKey === ac.key)
      .reduce((s, a) => s + getIDR(a), 0);
    const curPct = total > 0 ? (v / total) * 100 : 0,
      tgtPct = target ? target[ac.key] : 0,
      diff = tgtPct - curPct;
    return { ...ac, v, curPct, tgtPct, diff, diffVal: (diff / 100) * total };
  });
  if (!riskProfile)
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>◈</div>
        <div
          style={{
            color: T.textSoft,
            fontSize: 13,
            lineHeight: 1.8,
            marginBottom: 20,
          }}
        >
          Lengkapi <b style={{ color: T.accent }}>Profil Risiko</b> terlebih
          dahulu
          <br />
          untuk melihat analisa rebalancing.
        </div>
        <TBtn
          T={T}
          variant="primary"
          onClick={() => setTab("risk")}
          style={{ padding: "12px 24px", fontSize: 13 }}
        >
          → Isi Profil Risiko Sekarang
        </TBtn>
      </div>
    );
  const needsRebalance = byClass.some((c) => Math.abs(c.diff) > 5);
  const profileColor = RISK_PROFILES[riskProfile].color;
  return (
    <div>
      <Card
        T={T}
        glow={needsRebalance ? T.red : T.green}
        style={{ marginBottom: 16 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>{needsRebalance ? "⚠️" : "✅"}</span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: needsRebalance ? T.red : T.green,
                fontWeight: "bold",
                fontSize: 14,
                marginBottom: 3,
              }}
            >
              {needsRebalance
                ? "Portofolio Perlu Rebalancing"
                : "Portofolio Sudah Seimbang"}
            </div>
            <div style={{ color: T.muted, fontSize: 12 }}>
              Profil:{" "}
              <span style={{ color: profileColor }}>
                {profile.emoji} {profile.label}
              </span>{" "}
              · Toleransi ±5%
            </div>
          </div>
          {needsRebalance && (
            <TBtn
              T={T}
              variant={showRec ? "default" : "primary"}
              onClick={() => setShowRec(!showRec)}
              style={{ padding: "9px 14px" }}
            >
              {showRec ? "Tutup" : "Rekomendasi →"}
            </TBtn>
          )}
        </div>
      </Card>
      {showRec && needsRebalance && (
        <Card T={T} style={{ marginBottom: 16, borderColor: T.accentSoft }}>
          <SL T={T}>Rekomendasi Tindakan</SL>
          {byClass
            .filter((c) => Math.abs(c.diff) > 5)
            .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
            .map((c) => (
              <div
                key={c.key}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "13px 15px",
                  background: c.diff > 0 ? T.greenDim : T.redDim,
                  borderRadius: 10,
                  border: `1px solid ${c.diff > 0 ? T.green : T.red}22`,
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 17 }}>{c.icon}</span>
                <div>
                  <div
                    style={{
                      color: c.diff > 0 ? T.green : T.red,
                      fontWeight: "bold",
                      fontSize: 13,
                      marginBottom: 3,
                    }}
                  >
                    {c.diff > 0 ? "▲ Tambah" : "▼ Kurangi"} {c.label}
                  </div>
                  <div
                    style={{ color: T.textSoft, fontSize: 12, lineHeight: 1.6 }}
                  >
                    {c.diff > 0
                      ? `Beli/top-up ≈ ${fV(
                          Math.abs(c.diffVal),
                          dispCur
                        )} → target ${c.tgtPct}%`
                      : `Jual/realokasi ≈ ${fV(Math.abs(c.diffVal), dispCur)}`}
                  </div>
                  <div style={{ color: T.muted, fontSize: 11, marginTop: 3 }}>
                    {c.curPct.toFixed(1)}% → {c.tgtPct}%
                  </div>
                </div>
              </div>
            ))}
          <div
            style={{
              padding: "10px 14px",
              background: T.accentDim,
              borderRadius: 10,
              fontSize: 12,
              color: T.textSoft,
              lineHeight: 1.7,
            }}
          >
            💡 Mulai dari aset paling likuid: RDPU, deposito jatuh tempo, reksa
            dana pasar uang.
          </div>
        </Card>
      )}
      {byClass.map((c) => (
        <Card
          T={T}
          key={c.key}
          style={{ padding: "14px 17px", marginBottom: 10 }}
          glow={
            Math.abs(c.diff) > 5 ? (c.diff > 0 ? T.green : T.red) : undefined
          }
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 15 }}>{c.icon}</span>
              <div>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <span
                    style={{ color: T.text, fontSize: 13, fontWeight: 500 }}
                  >
                    {c.shortLabel}
                  </span>
                  <InfoBtn T={T} content={c.desc} />
                </div>
                <div style={{ color: T.muted, fontSize: 10 }}>
                  {fV(c.v, dispCur)}
                </div>
              </div>
            </div>
            {Math.abs(c.diff) > 5 ? (
              <Chip color={c.diff > 0 ? T.green : T.red} T={T}>
                {c.diff > 0 ? "+" : ""}
                {fV(c.diffVal, dispCur)}
              </Chip>
            ) : (
              <Chip color={T.green} T={T}>
                ✓ OK
              </Chip>
            )}
          </div>
          <Bar
            pct={c.curPct}
            color={c.riskColor}
            target={c.tgtPct}
            h={7}
            T={T}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: T.muted,
              marginTop: 6,
            }}
          >
            <span>
              Saat ini:{" "}
              <b style={{ color: c.riskColor }}>{c.curPct.toFixed(1)}%</b>
            </span>
            <span style={{ color: T.accent }}>▼ Target: {c.tgtPct}%</span>
            <span>
              Deviasi:{" "}
              <b
                style={{
                  color:
                    Math.abs(c.diff) > 5
                      ? c.diff > 0
                        ? T.green
                        : T.red
                      : T.green,
                }}
              >
                {c.diff > 0 ? "+" : ""}
                {c.diff.toFixed(1)}%
              </b>
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default RebalanceScene;
