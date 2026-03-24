import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, SL, Chip, Bar, TInput, TSelect, TBtn, Donut, InfoBtn, LineChart } from '../components/ui';
import { fMoney, fM, parseVal, getIDR, FREQ_MULT, LS, LS2, getWealthSegment } from '../utils/helpers';
import { ASSET_CLASSES, RISK_PROFILES, RISK_QUESTIONS, PRECIOUS_METALS, CRYPTO_COINS, DEBT_TYPES } from '../constants/data';

function RiskScene({ riskProfile, setRiskProfile, T, onDone }) {
  const [answers, setAnswers] = useState({});
  const answered = Object.keys(answers).length;
  const score = Object.values(answers).reduce((a, b) => a + b, 0);
  const allDone = answered === RISK_QUESTIONS.length;
  const calcProfile = () => {
    const key =
      Object.entries(RISK_PROFILES).find(
        ([, v]) => score >= v.range[0] && score <= v.range[1]
      )?.[0] || "low_moderate";
    setRiskProfile(key);
  };
  const profile = riskProfile ? RISK_PROFILES[riskProfile] : null;
  const profileColor = riskProfile
    ? RISK_PROFILES[riskProfile].color
    : T.accent;

  return (
    <div>
      <Card T={T} style={{ marginBottom: 16 }}>
        <SL T={T}>Kuesioner Profil Risiko Investasi</SL>
        <div
          style={{
            fontSize: 12,
            color: T.textSoft,
            marginBottom: 18,
            lineHeight: 1.7,
            padding: "10px 14px",
            background: T.accentDim,
            borderRadius: 9,
            borderLeft: `3px solid ${T.accent}`,
          }}
        >
          Jawab {RISK_QUESTIONS.length} pertanyaan dengan jujur untuk menentukan
          strategi investasi yang tepat.
        </div>
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: T.muted,
              marginBottom: 6,
            }}
          >
            <span>
              {answered}/{RISK_QUESTIONS.length} terjawab
            </span>
            {allDone && (
              <span style={{ color: T.green }}>
                ✓ Selesai · Skor: {score}/28
              </span>
            )}
          </div>
          <Bar
            pct={(answered / RISK_QUESTIONS.length) * 100}
            color={T.accent}
            h={4}
            T={T}
          />
        </div>
        {RISK_QUESTIONS.map((q, qi) => (
          <div
            key={qi}
            style={{
              marginBottom: 18,
              paddingBottom: 18,
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <div
              style={{
                color: T.text,
                fontSize: 13,
                marginBottom: 10,
                display: "flex",
                gap: 10,
              }}
            >
              <span
                style={{
                  color: T.accent,
                  fontWeight: "bold",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  minWidth: 20,
                  fontSize: 14,
                }}
              >
                {qi + 1}
              </span>
              <span style={{ lineHeight: 1.6 }}>{q.q}</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginLeft: 30,
              }}
            >
              {q.opts.map(([label, val], oi) => (
                <button
                  key={oi}
                  onClick={() => setAnswers((p) => ({ ...p, [qi]: val }))}
                  style={{
                    background: answers[qi] === val ? T.accentSoft : T.surface,
                    border: `1px solid ${
                      answers[qi] === val ? T.accent : T.border
                    }`,
                    color: answers[qi] === val ? T.accent : T.textSoft,
                    borderRadius: 9,
                    padding: "9px 11px",
                    cursor: "pointer",
                    fontSize: 11,
                    textAlign: "left",
                    transition: "all 0.15s",
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: T.muted, fontSize: 9, marginRight: 5 }}>
                    {["A", "B", "C", "D"][oi]}
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <TBtn
          T={T}
          variant="primary"
          disabled={!allDone}
          onClick={calcProfile}
          style={{ width: "100%", padding: 13, fontSize: 13 }}
        >
          {allDone
            ? "Analisa Profil Risiko →"
            : `Masih ${RISK_QUESTIONS.length - answered} pertanyaan lagi`}
        </TBtn>
      </Card>

      {profile && (
        <Card T={T} glow={profileColor}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 36 }}>{profile.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.muted, fontSize: 10, letterSpacing: 1.5 }}>
                PROFIL RISIKO ANDA
              </div>
              <div
                style={{
                  color: profileColor,
                  fontSize: 21,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: "bold",
                }}
              >
                {profile.label}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: T.muted, fontSize: 10 }}>Skor</div>
              <div
                style={{ color: T.accent, fontSize: 22, fontWeight: "bold" }}
              >
                {score}
                <span style={{ color: T.muted, fontSize: 12 }}>/28</span>
              </div>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 18,
            }}
          >
            {Object.entries(RISK_PROFILES).map(([k, p]) => (
              <div
                key={k}
                style={{
                  padding: "8px 12px",
                  background: k === riskProfile ? p.color + "1a" : T.surface,
                  border: `1px solid ${
                    k === riskProfile ? p.color + "44" : T.border
                  }`,
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    color: k === riskProfile ? p.color : T.muted,
                    fontSize: 11,
                    fontWeight: k === riskProfile ? "bold" : "normal",
                  }}
                >
                  {p.emoji} {p.label}
                </div>
                <div style={{ color: T.muted, fontSize: 10 }}>
                  Skor {p.range[0]}–{p.range[1]}
                </div>
              </div>
            ))}
          </div>
          <SL T={T}>Alokasi Ideal</SL>
          {ASSET_CLASSES.map((ac) => (
            <div key={ac.key} style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 5,
                }}
              >
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12 }}>{ac.icon}</span>
                  <span style={{ color: T.text, fontSize: 12 }}>
                    {ac.shortLabel}
                  </span>
                  <InfoBtn
                    T={T}
                    content={
                      <>
                        <b style={{ color: ac.riskColor }}>{ac.riskLabel}</b> ·{" "}
                        {ac.expectedReturn}
                        <br />
                        {ac.desc}
                      </>
                    }
                  />
                </div>
                <span
                  style={{
                    color: ac.riskColor,
                    fontSize: 13,
                    fontWeight: "bold",
                  }}
                >
                  {profile.alloc[ac.key] - 3}% – {profile.alloc[ac.key] + 3}%
                </span>
              </div>
              <Bar pct={profile.alloc[ac.key]} color={ac.riskColor} T={T} />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export default RiskScene;
