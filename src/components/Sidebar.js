import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const NAV_ITEMS = [
  { id: "profile", label: "Profil", icon: "◎" },
  { id: "portfolio", label: "Portofolio", icon: "◈" },
  { id: "risk", label: "Profil Risiko", icon: "◈", hidden: true },
  { id: "networth", label: "Net Worth", icon: "📊" },
  { id: "debt", label: "Hutang", icon: "💸" },
  { id: "rebalance", label: "Rebalance", icon: "⇌" },
  {
    id: "real-assets",
    label: "Properti & Bisnis",
    icon: "🏡",
    moduleKey: "realAssets",
  },
  { id: "finance-tools", label: "Finance Tools", icon: "◉" },
  { id: "goal", label: "Goals", icon: "◇" },
  { id: "ai", label: "AI Advisor", icon: "✦" },
  { id: "insurance", label: "Asuransi 🔜", icon: "🛡️" },
  {
    id: "peers",
    label: "Peer Benchmark 🔜",
    icon: "👥",
    moduleKey: "comingSoon",
  },
  {
    id: "community",
    label: "Komunitas 🔜",
    icon: "🤝",
    moduleKey: "comingSoon",
  },
];

function Sidebar({
  tab,
  setTab,
  T,
  isPro,
  sideOpen,
  setSideOpen,
  modules = {},
}) {
  const W = sideOpen ? 180 : 52;
  return (
    <div
      style={{
        width: W,
        minHeight: "100vh",
        background: T.surface,
        borderRight: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease",
        overflow: "hidden",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: sideOpen ? "18px 16px 14px" : "16px 10px 14px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            color: T.accent,
            fontSize: 18,
            fontWeight: "bold",
            flexShrink: 0,
          }}
        >
          ◎
        </div>
        {sideOpen && (
          <div>
            <div
              style={{
                color: T.accent,
                fontSize: 12,
                fontWeight: "bold",
                letterSpacing: 1,
              }}
            >
              WEALTH
            </div>
            <div style={{ color: T.muted, fontSize: 7, letterSpacing: 2 }}>
              COMPASS
            </div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
        {NAV_ITEMS.filter(
          (n) =>
            !n.hidden &&
            (!n.moduleKey ||
              modules[n.moduleKey] ||
              n.moduleKey === "comingSoon")
        ).map((n) => {
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              title={n.label}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: sideOpen ? "11px 16px" : "11px 0",
                justifyContent: sideOpen ? "flex-start" : "center",
                background: active ? T.accentDim : "none",
                border: "none",
                borderLeft: `3px solid ${active ? T.accent : "transparent"}`,
                color: active ? T.accent : T.muted,
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <span style={{ fontSize: 15, flexShrink: 0 }}>{n.icon}</span>
              {sideOpen && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: active ? "bold" : "normal",
                  }}
                >
                  {n.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Settings button */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "8px 0" }}>
        <button
          onClick={() => setTab("settings")}
          title="Settings"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: sideOpen ? "10px 16px" : "10px 0",
            justifyContent: sideOpen ? "flex-start" : "center",
            background: tab === "settings" ? T.accentDim : "none",
            border: "none",
            borderLeft: `3px solid ${
              tab === "settings" ? T.accent : "transparent"
            }`,
            color: tab === "settings" ? T.accent : T.muted,
            cursor: "pointer",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 14, flexShrink: 0 }}>⚙️</span>
          {sideOpen && <span style={{ fontSize: 12 }}>Settings</span>}
        </button>

        {/* Toggle */}
        <button
          onClick={() => setSideOpen((p) => !p)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: sideOpen ? "8px 16px" : "8px 0",
            justifyContent: sideOpen ? "flex-start" : "center",
            background: "none",
            border: "none",
            color: T.muted,
            cursor: "pointer",
            fontSize: 11,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontSize: 13,
              transform: sideOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.25s",
              flexShrink: 0,
            }}
          >
            →
          </span>
          {sideOpen && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );
}

export { NAV_ITEMS, Sidebar };
