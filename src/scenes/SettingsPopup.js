import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  Card,
  SL,
  Chip,
  Bar,
  TInput,
  TSelect,
  TBtn,
  Donut,
  InfoBtn,
  LineChart,
} from "../components/ui";
import {
  fMoney,
  fM,
  parseVal,
  getIDR,
  FREQ_MULT,
  LS,
  LS2,
  getWealthSegment,
} from "../utils/helpers";
import { THEMES, CUSTOM_PRESETS, applyPreset } from "../constants/themes";
import {
  ASSET_CLASSES,
  CURRENCIES,
  RATES,
  RISK_PROFILES,
  RISK_QUESTIONS,
  PRECIOUS_METALS,
  CRYPTO_COINS,
  DEBT_TYPES,
} from "../constants/data";

function SettingsPopup({
  show,
  onClose,
  settings,
  setSettings,
  theme,
  setTheme,
  dispCur,
  setDispCur,
  isPro,
  setIsPro,
  setShowUpgrade,
  onLogout,
  fontScale,
  setFontScale,
  customPresetId,
  setCustomPresetId,
  T,
}) {
  return (
    <>
      {show && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 998,
          }}
        />
      )}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: show ? "translate(-50%,-50%)" : "translate(-50%,-60%)",
          opacity: show ? 1 : 0,
          pointerEvents: show ? "auto" : "none",
          zIndex: 999,
          width: "min(400px,90vw)",
          maxHeight: "85vh",
          overflowY: "auto",
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 18,
          boxShadow: `0 24px 60px ${T.shadow}`,
          padding: 24,
          transition: "all 0.25s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              color: T.accent,
              fontSize: 15,
              fontWeight: "bold",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            ⚙️ Settings
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: T.muted,
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            ×
          </button>
        </div>

        {/* User */}
        <Card T={T} style={{ marginBottom: 14, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: T.accentSoft,
                border: `2px solid ${T.accent}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              👤
            </div>
            <div style={{ flex: 1 }}>
              <TInput
                T={T}
                value={settings.userName}
                placeholder="Nama kamu"
                onChange={(e) =>
                  setSettings((p) => ({ ...p, userName: e.target.value }))
                }
                style={{ marginBottom: 6, fontSize: 13, fontWeight: "bold" }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <div
                  style={{
                    flex: 1,
                    padding: "5px 10px",
                    borderRadius: 7,
                    border: `1px solid ${!isPro ? T.green : T.border}`,
                    background: !isPro ? T.greenDim : "none",
                    textAlign: "center",
                    fontSize: 10,
                    color: !isPro ? T.green : T.muted,
                  }}
                >
                  Free
                </div>
                <button
                  onClick={() => setShowUpgrade(true)}
                  style={{
                    flex: 1,
                    padding: "5px 10px",
                    borderRadius: 7,
                    border: `1px solid ${isPro ? T.accent : T.border}`,
                    background: isPro ? T.accentDim : T.surface,
                    cursor: "pointer",
                    fontSize: 10,
                    color: isPro ? T.accent : T.muted,
                    fontWeight: isPro ? "bold" : "normal",
                  }}
                >
                  {isPro ? "⭐ PRO" : "Upgrade PRO"}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Theme */}
        {/* TEMA */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 8 }}>
            TEMA
          </div>
          {/* Base themes */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
              marginBottom: 10,
            }}
          >
            {[
              ["dark", "🌑", "Dark"],
              ["light", "☀️", "Light"],
              ["custom", "🎨", "Custom"],
            ].map(([k, icon, name]) => {
              const locked = k === "custom" && !isPro;
              return (
                <button
                  key={k}
                  onClick={() => !locked && setTheme(k)}
                  style={{
                    padding: "9px 8px",
                    borderRadius: 10,
                    border: `2px solid ${theme === k ? T.accent : T.border}`,
                    background: theme === k ? T.accentDim : T.card,
                    cursor: locked ? "not-allowed" : "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    opacity: locked ? 0.5 : 1,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span
                    style={{
                      color: theme === k ? T.accent : T.muted,
                      fontSize: 10,
                      fontWeight: theme === k ? "bold" : "normal",
                    }}
                  >
                    {name}
                  </span>
                  {locked && (
                    <span style={{ color: T.orange, fontSize: 8 }}>
                      PRO only
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom preset grid - only when custom is selected & user is Pro */}
          {theme === "custom" && isPro && (
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div
                style={{
                  color: T.textSoft,
                  fontSize: 10,
                  marginBottom: 10,
                  letterSpacing: 1.5,
                }}
              >
                PILIH PRESET
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                }}
              >
                {CUSTOM_PRESETS.map((preset) => {
                  const isActive = customPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setCustomPresetId(preset.id);
                        try {
                          localStorage.setItem(
                            `wc_custom_theme_${form.email}`,
                            JSON.stringify(theme)
                          );
                        } catch {}
                      }}
                      style={{
                        padding: "8px 6px",
                        borderRadius: 9,
                        border: `2px solid ${
                          isActive ? preset.accent : T.border
                        }`,
                        background: preset.bg,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 5,
                        overflow: "hidden",
                      }}
                    >
                      {/* Color swatch row */}
                      <div style={{ display: "flex", gap: 3, width: "100%" }}>
                        {[preset.bg, preset.surface, preset.accent].map(
                          (c, i) => (
                            <div
                              key={i}
                              style={{
                                flex: 1,
                                height: 8,
                                borderRadius: 3,
                                background: c,
                                border: "1px solid rgba(255,255,255,0.1)",
                              }}
                            />
                          )
                        )}
                      </div>
                      <span
                        style={{
                          color: preset.text,
                          fontSize: 9,
                          fontWeight: isActive ? "bold" : "normal",
                          lineHeight: 1.2,
                          textAlign: "center",
                        }}
                      >
                        {preset.name}
                      </span>
                      {isActive && (
                        <span style={{ color: preset.accent, fontSize: 8 }}>
                          ✓ Aktif
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Currency */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 8 }}>
            MATA UANG TAMPILAN
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setDispCur(c.code)}
                style={{
                  padding: "9px 12px",
                  borderRadius: 9,
                  border: `1px solid ${
                    dispCur === c.code ? T.accent : T.border
                  }`,
                  background: dispCur === c.code ? T.accentDim : T.card,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    color: dispCur === c.code ? T.accent : T.text,
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  {c.symbol} {c.code}
                </span>
                <span
                  style={{ color: T.muted, fontSize: 10, display: "block" }}
                >
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Language & notif */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 8 }}>
            BAHASA{" "}
            <span
              style={{
                color: T.muted,
                fontSize: 9,
                fontWeight: "normal",
                letterSpacing: 0,
              }}
            >
              (UI saja - terjemahan penuh segera hadir)
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              ["id", "🇮🇩 Indonesia"],
              ["en", "🇺🇸 English"],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setSettings((p) => ({ ...p, language: v }))}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 9,
                  border: `1px solid ${
                    settings.language === v ? T.accent : T.border
                  }`,
                  background: settings.language === v ? T.accentDim : T.card,
                  color: settings.language === v ? T.accent : T.muted,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: settings.language === v ? "bold" : "normal",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "11px 14px",
            background: T.card,
            borderRadius: 10,
            border: `1px solid ${T.border}`,
          }}
        >
          <div>
            <div style={{ color: T.text, fontSize: 12 }}>
              Notifikasi Rebalancing
            </div>
            <div style={{ color: T.muted, fontSize: 10 }}>
              Alert saat deviasi {">"} 10%
            </div>
          </div>

        {/* Font & Zoom settings */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 10 }}>
            TAMPILAN TEKS
          </div>

          {/* Font selector - dropdown */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: T.muted, fontSize: 10, marginBottom: 6 }}>
              Jenis Font
            </div>
            <select
              value={settings.fontFamily || "dm"}
              onChange={(e) =>
                setSettings((p) => ({ ...p, fontFamily: e.target.value }))
              }
              style={{
                width: "100%",
                background: T.inputBg,
                border: `1px solid ${T.border}`,
                color: T.text,
                borderRadius: 9,
                padding: "10px 12px",
                fontSize: 13,
              }}
            >
              <option value="dm">DM Sans (Default)</option>
              <option value="playfair">Playfair Display</option>
              <option value="georgia">Georgia</option>
              <option value="arial">Arial</option>
              <option value="calibri">Calibri</option>
              <option value="times">Times New Roman</option>
              <option value="comic">Comic Sans MS</option>
              <option value="system">System Default</option>
            </select>
            {/* Live preview */}
            <div
              style={{
                marginTop: 8,
                padding: "8px 12px",
                background: T.surface,
                borderRadius: 8,
                border: `1px solid ${T.border}`,
              }}
            >
              <span
                style={{
                  fontFamily: {
                    dm: "'DM Sans', sans-serif",
                    playfair: "'Playfair Display', serif",
                    georgia: "Georgia, serif",
                    arial: "Arial, sans-serif",
                    calibri: "Calibri, sans-serif",
                    times: "'Times New Roman', serif",
                    comic: "'Comic Sans MS', cursive",
                    system: "system-ui, sans-serif",
                  }[settings.fontFamily || "dm"],
                  fontSize: 14,
                  color: T.text,
                }}
              >
                The quick brown fox - 1234567890
              </span>
            </div>
          </div>

          {/* Zoom slider */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: T.muted,
                marginBottom: 6,
              }}
            >
              <span>Ukuran Teks (Zoom)</span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span
                  style={{ color: T.accent, fontWeight: "bold", fontSize: 12 }}
                >
                  {Math.round(fontScale * 100)}%
                </span>
                <button
                  onClick={() => setFontScale(1.0)}
                  style={{
                    fontSize: 9,
                    padding: "1px 6px",
                    borderRadius: 4,
                    border: `1px solid ${T.border}`,
                    background: "none",
                    color: T.muted,
                    cursor: "pointer",
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.4"
              step="0.05"
              value={fontScale}
              onChange={(e) => setFontScale(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: T.accent }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 9,
                color: T.muted,
                marginTop: 3,
              }}
            >
              <span>80%</span>
              <span>100%</span>
              <span>120%</span>
              <span>140%</span>
            </div>
          </div>
        </div>

        {/* Module toggles */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: T.textSoft, fontSize: 11, marginBottom: 8 }}>
            MODUL TAMBAHAN
          </div>

        <div
          style={{
            textAlign: "center",
            color: T.muted,
            fontSize: 10,
            marginTop: 16,
            lineHeight: 1.6,
          }}
        >
          WEALTH◎COMPASS · Portfolio Intelligence v9
          <br />
          <span style={{ color: T.blue, cursor: "pointer" }}>
            Referral: Dapatkan $0.99/subscription →
          </span>
        </div>
        {onLogout && (
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            style={{
              width: "100%",
              marginTop: 14,
              padding: "10px 0",
              borderRadius: 9,
              border: `1px solid ${T.red}33`,
              background: T.redDim,
              color: T.red,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            Keluar dari Akun
          </button>
        )}
      </div>
    </>
  );
}

export default SettingsPopup;
