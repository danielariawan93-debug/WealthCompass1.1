import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const NAV_ITEMS = [
  { id: "profile",       label: "Profil",            icon: "👤", color: "#3ecf8e" },
  { id: "portfolio",     label: "Portofolio",         icon: "💼", color: "#5b9cf6" },
  { id: "risk",          label: "Profil Risiko",      icon: "🧭", color: "#9b7ef8", hidden: true },
  { id: "rebalance",     label: "Rebalance",          icon: "⚖️", color: "#f59e0b" },
  { id: "goal",          label: "Goals",              icon: "🎯", color: "#f26b6b" },
  { id: "finance-tools", label: "Finance Tools",      icon: "📊", color: "#34d399" },
  { id: "debt",          label: "Hutang",             icon: "💳", color: "#f87239" },
  { id: "networth",      label: "Net Worth",          icon: "📈", color: "#9b7ef8" },
  { id: "real-assets",   label: "Properti & Bisnis",  icon: "🏡", color: "#d4a843", proOnly: true },
  { id: "insurance",     label: "Asuransi",           icon: "🛡️", color: "#5b9cf6", proOnly: true },
  { id: "peers",         label: "Peer Benchmark",     icon: "👥", color: "#3ecf8e", moduleKey: "comingSoon" },
  { id: "community",     label: "Komunitas",          icon: "🤝", color: "#f59e0b", moduleKey: "comingSoon" },
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
            (!n.proOnly || isPro) &&
            (!n.moduleKey || n.moduleKey === "comingSoon")
        ).map((n) => {
          const active = tab === n.id;
          const itemColor = n.color || T.accent;
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
                background: active ? itemColor + "18" : "none",
                border: "none",
                borderLeft: `3px solid ${active ? itemColor : "transparent"}`,
                color: active ? itemColor : T.muted,
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

      {/* Bottom: AI Advisor + Settings */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "8px 0" }}>
        <button
          onClick={() => setTab("ai")}
          title="AI Advisor"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: sideOpen ? "10px 16px" : "10px 0",
            justifyContent: sideOpen ? "flex-start" : "center",
            background: tab === "ai" ? "#9b7ef818" : "none",
            border: "none",
            borderLeft: `3px solid ${tab === "ai" ? "#9b7ef8" : "transparent"}`,
            color: tab === "ai" ? "#9b7ef8" : T.muted,
            cursor: "pointer",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 14, flexShrink: 0 }}>✦</span>
          {sideOpen && <span style={{ fontSize: 12 }}>AI Advisor</span>}
        </button>
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
