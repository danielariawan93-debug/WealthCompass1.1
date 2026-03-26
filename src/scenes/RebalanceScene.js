import React, { useState, useEffect } from 'react';
import { Card, SL, Chip, Bar, TBtn, InfoBtn } from '../components/ui';
import { fM, getIDR } from '../utils/helpers';
import { ASSET_CLASSES, RISK_PROFILES } from '../constants/data';

const LS_KEY = 'wc_rebalance_always_show';

function RebalanceScene({
  assets,
  riskProfile,
  dispCur,
  T,
  setTab,
  hideValues = false,
  isPro = false,
  setShowUpgrade,
}) {
  const fV = (v, c) => fM(v, c, hideValues);

  // Persist "always show" preference
  const [alwaysShow, setAlwaysShow] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === '1'; } catch { return false; }
  });
  const [showRec, setShowRec] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === '1'; } catch { return false; }
  });

  const toggleAlwaysShow = (e) => {
    e.stopPropagation();
    const next = !alwaysShow;
    setAlwaysShow(next);
    setShowRec(next);
    try { localStorage.setItem(LS_KEY, next ? '1' : '0'); } catch {}
  };

  const liquidAssets = assets.filter(a => !['property', 'business'].includes(a.classKey));
  const total = liquidAssets.reduce((s, a) => s + getIDR(a), 0);
  const target = riskProfile ? RISK_PROFILES[riskProfile].alloc : null;
  const profile = riskProfile ? RISK_PROFILES[riskProfile] : null;

  const byClass = ASSET_CLASSES.filter(ac => !['property', 'business'].includes(ac.key)).map((ac) => {
    const v = liquidAssets.filter((a) => a.classKey === ac.key).reduce((s, a) => s + getIDR(a), 0);
    const curPct = total > 0 ? (v / total) * 100 : 0;
    const tgtPct = target ? target[ac.key] : 0;
    const diff = tgtPct - curPct;
    return { ...ac, v, curPct, tgtPct, diff, diffVal: (diff / 100) * total };
  });

  if (!riskProfile)
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>◈</div>
        <div style={{ color: T.textSoft, fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>
          Lengkapi <b style={{ color: T.accent }}>Profil Risiko</b> terlebih dahulu
          <br />untuk melihat analisa rebalancing.
        </div>
        <TBtn T={T} variant="primary" onClick={() => setTab('risk')} style={{ padding: '12px 24px', fontSize: 13 }}>
          → Isi Profil Risiko Sekarang
        </TBtn>
      </div>
    );

  const needsRebalance = byClass.some((c) => Math.abs(c.diff) > 5);
  const profileColor = RISK_PROFILES[riskProfile].color;
  const itemsNeedingAction = byClass
    .filter((c) => Math.abs(c.diff) > 5)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  return (
    <div>

      {/* ── Status Card — same for all tiers ── */}
      <Card T={T} glow={needsRebalance ? T.red : T.green} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 28 }}>{needsRebalance ? '⚠️' : '✅'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: needsRebalance ? T.red : T.green, fontWeight: 'bold', fontSize: 14, marginBottom: 3 }}>
              {needsRebalance ? 'Portofolio Perlu Rebalancing' : 'Portofolio Sudah Seimbang'}
            </div>
            <div style={{ color: T.muted, fontSize: 12 }}>
              Profil: <span style={{ color: profileColor }}>{profile.emoji} {profile.label}</span>
              {' '} · Toleransi ±5%
            </div>
          </div>
          {/* Toggle button — same for ALL tiers */}
          {needsRebalance && (
            <TBtn
              T={T}
              variant={showRec ? 'default' : 'primary'}
              onClick={() => setShowRec(p => !p)}
              style={{ padding: '9px 14px' }}
            >
              {showRec ? 'Tutup' : 'Rekomendasi →'}
            </TBtn>
          )}
        </div>
      </Card>

      {/* ── Recommendation Detail Card — same structure all tiers ── */}
      {needsRebalance && showRec && (
        <Card T={T} style={{ marginBottom: 16, borderColor: T.accentSoft }}>
          <SL T={T}>Rekomendasi Tindakan</SL>
          {itemsNeedingAction.map((c) => (
            <div
              key={c.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: c.diff > 0 ? T.greenDim : T.redDim,
                borderRadius: 10,
                border: `1px solid ${c.diff > 0 ? T.green : T.red}22`,
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 17 }}>{c.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: c.diff > 0 ? T.green : T.red, fontWeight: 'bold', fontSize: 13, marginBottom: isPro ? 3 : 0 }}>
                  {c.diff > 0 ? '▲ Tambah' : '▼ Kurangi'} {c.label}
                </div>
                {/* Detail amounts — Pro only */}
                {isPro && (
                  <>
                    <div style={{ color: T.textSoft, fontSize: 12, lineHeight: 1.6 }}>
                      {c.diff > 0
                        ? `Beli/top-up ≈ ${fV(Math.abs(c.diffVal), dispCur)} → target ${c.tgtPct}%`
                        : `Jual/realokasi ≈ ${fV(Math.abs(c.diffVal), dispCur)}`}
                    </div>
                    <div style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>
                      {c.curPct.toFixed(1)}% → {c.tgtPct}%
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
          <div style={{ padding: '10px 14px', background: T.accentDim, borderRadius: 10, fontSize: 12, color: T.textSoft, lineHeight: 1.7 }}>
            💡 Mulai dari aset paling likuid: RDPU, deposito jatuh tempo, reksa dana pasar uang.
          </div>
        </Card>
      )}

      {/* ── "Lihat Rekomendasi Lengkap" compact bar — all tiers, with always-show toggle ── */}
      {needsRebalance && (
        <div
          onClick={() => !isPro && setShowUpgrade && setShowUpgrade(true)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 12,
            background: T.accentDim,
            border: `1px solid ${T.accentSoft}`,
            cursor: !isPro ? 'pointer' : 'default',
          }}
        >
          <div>
            <div style={{ color: T.accent, fontWeight: 'bold', fontSize: 13 }}>
              {'\u2b50'} Lihat Rekomendasi Lengkap
            </div>
            <div style={{ color: T.textSoft, fontSize: 11, marginTop: 2 }}>
              {isPro
                ? 'Centang untuk selalu tampil saat buka halaman ini'
                : 'Upgrade Pro untuk tahu persis berapa yang harus dibeli/dijual per aset.'}
            </div>
          </div>
          {/* Always-show checkbox — Pro only */}
          {isPro && (
            <label
              onClick={e => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0, marginLeft: 12 }}
            >
              <span style={{ color: T.muted, fontSize: 10, whiteSpace: 'nowrap' }}>Selalu tampil</span>
              <div
                onClick={toggleAlwaysShow}
                style={{
                  width: 32,
                  height: 18,
                  borderRadius: 9,
                  background: alwaysShow ? T.accent : T.border,
                  position: 'relative',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 2,
                  left: alwaysShow ? 16 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
            </label>
          )}
          {/* Arrow for free */}
          {!isPro && (
            <span style={{ color: T.accent, fontSize: 18, marginLeft: 12 }}>›</span>
          )}
        </div>
      )}

      {/* ── Asset Cards — blurred for Free ── */}
      <div style={{ position: 'relative' }}>

        {/* Blur overlay — Free only */}
        {!isPro && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div
              onClick={() => setShowUpgrade && setShowUpgrade(true)}
              style={{
                cursor: 'pointer',
                padding: '18px 24px',
                borderRadius: 14,
                background: T.card,
                border: `1px solid ${T.accentSoft}`,
                boxShadow: `0 4px 24px ${T.shadow}`,
                textAlign: 'center',
                maxWidth: 260,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>⭐</div>
              <div style={{ color: T.accent, fontWeight: 'bold', fontSize: 14, marginBottom: 6 }}>
                Upgrade Pro
              </div>
              <div style={{ color: T.textSoft, fontSize: 12, lineHeight: 1.6, marginBottom: 14 }}>
                Lihat deviasi nominal, bar alokasi, dan angka persis per aset.
              </div>
              <div style={{
                padding: '9px 20px',
                borderRadius: 9,
                background: T.accent,
                color: '#000',
                fontWeight: 'bold',
                fontSize: 12,
              }}>
                Upgrade Sekarang →
              </div>
            </div>
          </div>
        )}

        {/* Asset cards */}
        <div style={{ filter: isPro ? 'none' : 'blur(4px)', pointerEvents: isPro ? 'auto' : 'none', userSelect: 'none' }}>
          {byClass.map((c) => (
            <Card
              T={T}
              key={c.key}
              style={{ padding: '14px 17px', marginBottom: 10 }}
              glow={Math.abs(c.diff) > 5 ? (c.diff > 0 ? T.green : T.red) : undefined}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 15 }}>{c.icon}</span>
                  <div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      <span style={{ color: T.text, fontSize: 13, fontWeight: 500 }}>{c.shortLabel}</span>
                      <InfoBtn T={T} content={c.desc} />
                    </div>
                    <div style={{ color: T.muted, fontSize: 10 }}>{fV(c.v, dispCur)}</div>
                  </div>
                </div>
                {Math.abs(c.diff) > 5 ? (
                  <Chip color={c.diff > 0 ? T.green : T.red} T={T}>
                    {c.diff > 0 ? '+' : ''}{fV(c.diffVal, dispCur)}
                  </Chip>
                ) : (
                  <Chip color={T.green} T={T}>✓ OK</Chip>
                )}
              </div>
              <Bar pct={c.curPct} color={c.riskColor} target={c.tgtPct} h={7} T={T} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.muted, marginTop: 6 }}>
                <span>Saat ini: <b style={{ color: c.riskColor }}>{c.curPct.toFixed(1)}%</b></span>
                <span style={{ color: T.accent }}>▼ Target: {c.tgtPct}%</span>
                <span>
                  Deviasi:{' '}
                  <b style={{ color: Math.abs(c.diff) > 5 ? (c.diff > 0 ? T.green : T.red) : T.green }}>
                    {c.diff > 0 ? '+' : ''}{c.diff.toFixed(1)}%
                  </b>
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
}

export default RebalanceScene;
