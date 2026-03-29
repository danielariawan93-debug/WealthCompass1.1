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
  debts = [],
  goals = [],
  insurances = [],
  isPro = false,
  isProPlus = false,
  monthlyExpense = '',
  monthlyFixedIncome = '',
  activeIncomes = [],
  userEmail = "",
  userPhoto = "",
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

  // --- Financial Snapshot calculations ---
  const totalDebt      = debts.reduce((s, d) => s + parseVal(d.outstanding), 0);
  const netWorth       = total - totalDebt;
  const passiveMonthly = assets
    .filter(a => a.income?.amount > 0 && !(a.classKey === "business" && a.incomeType === "active"))
    .reduce((s, a) => s + a.income.amount * (FREQ_MULT[a.income.frequency] || 12) / 12, 0);
  const activeMonthly  = activeIncomes.reduce((s, a) => s + (a.amount || 0), 0);
  const fixedMonthly   = parseVal(monthlyFixedIncome);
  const totalInflow    = passiveMonthly + activeMonthly + fixedMonthly;
  const totalDebtMon   = debts.reduce((s, d) => s + parseVal(d.monthlyPayment), 0);
  const expense        = parseVal(monthlyExpense);
  const totalOutflow   = totalDebtMon + expense;
  const surplus        = totalInflow - totalOutflow;
  const coveragePct    = expense > 0 ? Math.min(999, (passiveMonthly / expense) * 100) : 0;

  const goalsTotal    = goals.length;
  const goalsOnTrack  = goals.filter(g => {
    const allocated = assets
      .filter(a => a.goalId === g.id)
      .reduce((s, a) => s + getIDR(a), 0);
    return g.target > 0 && allocated >= g.target * 0.5;
  }).length;

  const activeInsurances = insurances.length;
  const expiredIns = insurances.filter(i => i.endDate && new Date(i.endDate) < new Date()).length;
  const expiringSoon = insurances.filter(i => {
    if (!i.endDate) return false;
    const d = new Date(i.endDate) - new Date();
    return d > 0 && d < 30 * 24 * 60 * 60 * 1000;
  }).length;

  // Health score: weakest dimension recommendation
  const metrics = [
    { key: 'diversification', val: health.diversification, label: 'Diversifikasi', action: 'Tambah kelas aset baru di Portofolio', tab: 'portfolio' },
    { key: 'liquidity', val: health.liquidity, label: 'Likuiditas', action: 'Tingkatkan alokasi Dana Tunai & Setara', tab: 'portfolio' },
    { key: 'alignment', val: health.alignment, label: 'Kesesuaian', action: 'Jalankan Rebalancing portofolio', tab: 'rebalance' },
  ];
  const weakest = [...metrics].sort((a, b) => a.val - b.val)[0];

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
              overflow: "hidden",
            }}
          >
            {userPhoto
              ? <img src={userPhoto} alt="avatar" style={{ width:48, height:48, objectFit:"cover" }} />
              : <span>👤</span>
            }
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
            {userEmail && (
              <div style={{ color: T.muted, fontSize: 10, marginTop: 2, display:"flex", alignItems:"center", gap:4 }}>
                <span>✉</span>
                <span>{userEmail}</span>
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

      {/* Financial Snapshot */}
      <Card T={T}>
        <SL T={T}>Financial Snapshot</SL>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          {/* Net Worth - open all tiers */}
          <div
            onClick={() => setTab('networth')}
            style={{ padding: '12px 13px', background: T.surface, borderRadius: 11, border: `1px solid ${netWorth >= 0 ? T.green + '44' : T.red + '44'}`, cursor: 'pointer' }}
          >
            <div style={{ color: T.muted, fontSize: 9, letterSpacing: 1.2, marginBottom: 4 }}>NET WORTH</div>
            <div style={{ color: netWorth >= 0 ? T.green : T.red, fontSize: 15, fontWeight: 'bold', fontFamily: "'Playfair Display',serif", marginBottom: 2 }}>
              {fV(netWorth, dispCur)}
            </div>
            <div style={{ color: T.muted, fontSize: 9 }}>
              {totalDebt > 0 ? `Hutang: ${fV(totalDebt, dispCur)}` : 'Bebas hutang'}
            </div>
          </div>

          {/* Arus Kas - Free: hanya surplus/minus | Pro+: full */}
          <div
            onClick={() => setTab('finance-tools')}
            style={{ padding: '12px 13px', background: T.surface, borderRadius: 11, border: `1px solid ${surplus >= 0 ? T.blue + '44' : T.orange + '44'}`, cursor: 'pointer' }}
          >
            <div style={{ color: T.muted, fontSize: 9, letterSpacing: 1.2, marginBottom: 4 }}>ARUS KAS/BLN</div>
            {expense > 0 || totalInflow > 0 ? (
              <>
                <div style={{ color: surplus >= 0 ? T.blue : T.orange, fontSize: 15, fontWeight: 'bold', fontFamily: "'Playfair Display',serif", marginBottom: 2 }}>
                  {surplus >= 0 ? '+' : ''}{fV(surplus, dispCur)}
                </div>
                <div style={{ color: T.muted, fontSize: 9 }}>
                  {isPro
                    ? `Masuk ${fV(totalInflow, dispCur)} · Keluar ${fV(totalOutflow, dispCur)}`
                    : surplus >= 0 ? 'Surplus' : 'Defisit'}
                </div>
              </>
            ) : (
              <div style={{ color: T.muted, fontSize: 11 }}>Belum diisi</div>
            )}
          </div>

          {/* Goals - open all tiers */}
          <div
            onClick={() => setTab('goal')}
            style={{ padding: '12px 13px', background: T.surface, borderRadius: 11, border: `1px solid ${T.border}`, cursor: 'pointer' }}
          >
            <div style={{ color: T.muted, fontSize: 9, letterSpacing: 1.2, marginBottom: 4 }}>GOALS</div>
            {goalsTotal > 0 ? (
              <>
                <div style={{ color: T.accent, fontSize: 15, fontWeight: 'bold', fontFamily: "'Playfair Display',serif", marginBottom: 2 }}>
                  {goalsOnTrack}/{goalsTotal}
                </div>
                <div style={{ color: T.muted, fontSize: 9 }}>on-track (≥50% tercapai)</div>
              </>
            ) : (
              <div style={{ color: T.muted, fontSize: 11 }}>Belum ada goal</div>
            )}
          </div>

          {/* Proteksi - hidden for Free */}
          {isPro ? (
            <div
              onClick={() => setTab('insurance')}
              style={{ padding: '12px 13px', background: T.surface, borderRadius: 11, border: `1px solid ${expiredIns > 0 ? T.red + '44' : expiringSoon > 0 ? T.orange + '44' : T.border}`, cursor: 'pointer' }}
            >
              <div style={{ color: T.muted, fontSize: 9, letterSpacing: 1.2, marginBottom: 4 }}>PROTEKSI</div>
              {activeInsurances > 0 ? (
                <>
                  <div style={{ color: expiredIns > 0 ? T.red : T.green, fontSize: 15, fontWeight: 'bold', fontFamily: "'Playfair Display',serif", marginBottom: 2 }}>
                    {activeInsurances} polis
                  </div>
                  <div style={{ color: expiredIns > 0 ? T.red : expiringSoon > 0 ? T.orange : T.muted, fontSize: 9 }}>
                    {expiredIns > 0 ? `${expiredIns} kadaluarsa` : expiringSoon > 0 ? `${expiringSoon} segera habis` : 'Semua aktif'}
                  </div>
                </>
              ) : (
                <div style={{ color: T.muted, fontSize: 11 }}>Belum ada polis</div>
              )}
            </div>
          ) : (
            <div
              onClick={() => setTab('insurance')}
              style={{ padding: '12px 13px', background: T.accentDim, borderRadius: 11, border: `1px solid ${T.accentSoft}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
              <div style={{ color: T.muted, fontSize: 9, letterSpacing: 1.2, marginBottom: 4 }}>PROTEKSI</div>
              <div style={{ color: T.accent, fontSize: 11, fontWeight: 'bold' }}>⭐ Pro</div>
              <div style={{ color: T.muted, fontSize: 9 }}>Tracker asuransi</div>
            </div>
          )}

        </div>
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
        {health.score > 0 && (
            <div
              onClick={() => setTab(weakest.tab)}
              style={{ marginTop: 12, padding: '8px 12px', background: T.surface, borderRadius: 9, border: `1px solid ${scoreColor}33`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <div style={{ color: scoreColor, fontSize: 10, fontWeight: 'bold', marginBottom: 1 }}>
                  {health.score >= 75 ? 'Portofolio dalam kondisi baik' : health.score >= 50 ? 'Perlu perhatian' : 'Perlu perbaikan segera'}
                </div>
                <div style={{ color: T.muted, fontSize: 10 }}>
                  {weakest.label} paling rendah - {weakest.action}
                </div>
              </div>
              <span style={{ color: T.muted, fontSize: 14 }}>›</span>
            </div>
        )}
      </Card>
    </div>
  );
}

export default ProfileScene;
