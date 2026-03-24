import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, SL, Chip, Bar, TInput, TSelect, TBtn, Donut, InfoBtn, LineChart } from '../components/ui';
import { fMoney, fM, parseVal, getIDR, FREQ_MULT, LS, LS2, getWealthSegment , calcHealthScore } from '../utils/helpers';
import { ASSET_CLASSES, RISK_PROFILES, RISK_QUESTIONS, PRECIOUS_METALS, CRYPTO_COINS, DEBT_TYPES } from '../constants/data';

function ProfileScene({
  assets,
  riskProfile,
  setTab,
  dispCur,
  settings,
  setSettings,
  hideValues = false,
  T,
}) {
  const fV = (v, c) => fM(v, c, hideValues);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(settings.userName || "");
  const saveName = () => {
    setSettings((p) => ({ ...p, userName: nameInput }));
    setEditingName(false);
  };

  const total = assets.reduce((s, a) => s + getIDR(a), 0);
  const health = calcHealthScore(assets, riskProfile);
  const profile = riskProfile ? RISK_PROFILES[riskProfile] : null;
  const profileColor = profile?.color || T.accent;
  const byClass = ASSET_CLASSES.map((ac) => {
    const v = assets
      .filter((a) => a.classKey === ac.key)
      .reduce((s, a) => s + getIDR(a), 0);
    return { ...ac, v };
  });
  const scoreColor =
    health.score >= 75 ? T.green : health.score >= 50 ? T.orange : T.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* User greeting */}
      <Card T={T} style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: T.accentSoft,
              border: `2px solid ${T.accent}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            👤
          </div>
          <div style={{ flex: 1 }}>
            {editingName ? (
              <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  placeholder="Nama Anda"
                  style={{
                    flex: 1,
                    background: T.inputBg,
                    border: `1px solid ${T.accent}`,
                    color: T.text,
                    borderRadius: 9,
                    padding: "8px 11px",
                    fontSize: 14,
                    fontWeight: "bold",
                    outline: "none",
                  }}
                />
                <button
                  onClick={saveName}
                  style={{
                    background: T.green,
                    color: "#000",
                    border: "none",
                    borderRadius: 7,
                    padding: "7px 11px",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  ✓
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  style={{
                    background: T.border,
                    color: T.muted,
                    border: "none",
                    borderRadius: 7,
                    padding: "7px 9px",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  ✗
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    color: T.text,
                    fontSize: 16,
                    fontWeight: "bold",
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}
                >
                  {settings.userName || "Investor"}
                </span>
                <button
                  onClick={() => {
                    setNameInput(settings.userName || "");
                    setEditingName(true);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: T.muted,
                    cursor: "pointer",
                    fontSize: 13,
                    padding: 2,
                    lineHeight: 1,
                  }}
                  title="Edit nama"
                >
                  ✎
                </button>
              </div>
            )}
            <div style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>
              Total aset:{" "}
              <span style={{ color: T.accent, fontWeight: "bold" }}>
                {fV(total, dispCur)}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {profile ? (
              <div>
                <div style={{ color: profileColor, fontSize: 20 }}>
                  {profile.emoji}
                </div>
                <Chip color={profileColor} T={T}>
                  {profile.label}
                </Chip>
              </div>
            ) : (
              <TBtn
                T={T}
                variant="ghost"
                onClick={() => setTab("risk")}
                style={{ fontSize: 11, padding: "6px 12px" }}
              >
                Isi Profil Risiko →
              </TBtn>
            )}
          </div>
        </div>
        {profile && (
          <button
            onClick={() => setTab("risk")}
            style={{
              marginTop: 12,
              background: "none",
              border: `1px solid ${T.border}`,
              color: T.muted,
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 11,
              width: "100%",
            }}
          >
            ✎ Perbarui Profil Risiko
          </button>
        )}
      </Card>

      {/* Donut + breakdown */}
      <Card T={T}>
        <SL T={T}>Rekap Portofolio</SL>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Donut
            T={T}
            slices={byClass.map((ac) => ({ v: ac.v, c: ac.riskColor }))}
            total={total}
            size={130}
          />
          <div style={{ flex: 1 }}>
            {byClass
              .filter((ac) => ac.v > 0)
              .map((ac) => (
                <div
                  key={ac.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 7,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: ac.riskColor,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: T.textSoft, fontSize: 11, flex: 1 }}>
                    {ac.shortLabel}
                  </span>
                  <span
                    style={{ color: T.text, fontSize: 11, fontWeight: "bold" }}
                  >
                    {total > 0 ? ((ac.v / total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              ))}
            {assets.length === 0 && (
              <div style={{ color: T.muted, fontSize: 12 }}>Belum ada aset</div>
            )}
          </div>
        </div>
        <TBtn
          T={T}
          variant="ghost"
          onClick={() => setTab("portfolio")}
          style={{ width: "100%", marginTop: 14, padding: 9, fontSize: 12 }}
        >
          Lihat Detail Portofolio →
        </TBtn>
      </Card>

      {/* Health score mini */}
      <Card T={T} glow={scoreColor}>
        <SL T={T}>Portfolio Health</SL>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              position: "relative",
              width: 70,
              height: 70,
              flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 70 70" style={{ width: 70, height: 70 }}>
              <circle
                cx={35}
                cy={35}
                r={28}
                fill="none"
                stroke={T.border}
                strokeWidth={7}
              />
              <circle
                cx={35}
                cy={35}
                r={28}
                fill="none"
                stroke={scoreColor}
                strokeWidth={7}
                strokeDasharray={`${health.score * 1.759} 175.9`}
                strokeDashoffset={44}
                style={{
                  transform: "rotate(-90deg)",
                  transformOrigin: "50% 50%",
                  transition: "stroke-dasharray 1s ease",
                }}
              />
              <text
                x={35}
                y={39}
                textAnchor="middle"
                fill={scoreColor}
                fontSize={16}
                fontWeight="bold"
                fontFamily="'Playfair Display', Georgia, serif"
              >
                {health.score}
              </text>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            {[
              {
                label: "Diversifikasi",
                val: health.diversification,
                color: T.blue,
              },
              { label: "Likuiditas", val: health.liquidity, color: T.green },
              { label: "Kesesuaian", val: health.alignment, color: T.purple },
            ].map((m) => (
              <div key={m.label} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 3,
                  }}
                >
                  <span style={{ color: T.textSoft, fontSize: 10 }}>
                    {m.label}
                  </span>
                  <span
                    style={{ color: m.color, fontSize: 10, fontWeight: "bold" }}
                  >
                    {Math.round(m.val)}%
                  </span>
                </div>
                <Bar pct={m.val} color={m.color} h={4} T={T} />
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ProfileScene;
