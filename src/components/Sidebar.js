import React from 'react';

// NAV_ITEMS - urutan sesuai permintaan
// proGate: Free tier klik -> upgrade panel
// alwaysShow: muncul tanpa cek module
const NAV_ITEMS = [
  { id: "profile",       label: "Profil",            icon: "\U0001f464", color: "#5b9cf6" },
  { id: "portfolio",     label: "Portofolio",         icon: "\U0001f4bc", color: "#d4a843" },
  { id: "rebalance",     label: "Rebalance",          icon: "\u2696\ufe0f", color: "#3ecf8e" },
  { id: "goal",          label: "Goals",              icon: "\U0001f3af", color: "#f26b6b" },
  { id: "finance-tools", label: "Finance Tools",      icon: "\U0001f4ca", color: "#9b7ef8" },
  { id: "debt",          label: "Hutang",             icon: "\U0001f4b3", color: "#f59e0b" },
  { id: "networth",      label: "Net Worth",          icon: "\U0001f4c8", color: "#34d399" },
  { id: "real-assets",   label: "Properti & Bisnis",  icon: "\U0001f3e1", color: "#f87239", alwaysShow: true, proGate: true },
  { id: "insurance",     label: "Asuransi",           icon: "\U0001f6e1\ufe0f", color: "#818cf8", alwaysShow: true, proGate: true },
  { id: "peers",         label: "Peer Benchmark",     icon: "\U0001f465", color: "#5b9cf6", comingSoon: true },
  { id: "community",     label: "Komunitas",          icon: "\U0001f91d", color: "#f59e0b", comingSoon: true },
  { id: "risk",          label: "Profil Risiko",      icon: "\U0001f3b2", color: "#9b7ef8", hidden: true },
];

function Sidebar({ tab, setTab, T, isPro = false, isProPlus = false, sideOpen, setSideOpen, modules = {}, setShowUpgrade }) {
  const W = sideOpen ? 180 : 52;

  const handleNav = (item) => {
    if (item.comingSoon) return;
    if (item.proGate && !isPro && !isProPlus) {
      if (setShowUpgrade) setShowUpgrade(true);
      return;
    }
    setTab(item.id);
  };

  const visibleItems = NAV_ITEMS.filter(n => !n.hidden);

  return (
    <div style={{ width: W, minHeight: "100vh", background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", transition: "width 0.25s ease", overflow: "hidden", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>

      {/* Logo */}
      <div style={{ padding: sideOpen ? "18px 16px 14px" : "16px 10px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, overflow: "hidden", whiteSpace: "nowrap" }}>
        <div style={{ color: T.accent, fontSize: 18, fontWeight: "bold", flexShrink: 0 }}>\u25ce</div>
        {sideOpen && (
          <div>
            <div style={{ color: T.accent, fontSize: 12, fontWeight: "bold", letterSpacing: 1 }}>WEALTH</div>
            <div style={{ color: T.muted, fontSize: 7, letterSpacing: 2 }}>COMPASS</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {visibleItems.map((n) => {
          const active     = tab === n.id;
          const locked     = n.proGate && !isPro && !isProPlus;
          const soon       = n.comingSoon;
          return (
            <button
              key={n.id}
              onClick={() => handleNav(n)}
              title={soon ? n.label + " (Segera Hadir)" : n.label}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: sideOpen ? "10px 14px" : "10px 0", justifyContent: sideOpen ? "flex-start" : "center", background: active ? n.color + "18" : "none", border: "none", borderLeft: `3px solid ${active ? n.color : "transparent"}`, color: active ? n.color : T.muted, cursor: soon ? "default" : "pointer", transition: "all 0.15s", whiteSpace: "nowrap", overflow: "hidden", opacity: soon ? 0.45 : 1 }}
            >
              <span style={{ fontSize: 17, flexShrink: 0, lineHeight: 1 }}>{n.icon}</span>
              {sideOpen && (
                <span style={{ fontSize: 11, fontWeight: active ? "bold" : "normal", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {n.label}
                  {soon && <span style={{ fontSize: 9, marginLeft: 4 }}> \U0001f51c</span>}
                  {locked && <span style={{ fontSize: 9, marginLeft: 4 }}> \U0001f512</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom: AI Advisor + Settings + Toggle */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "6px 0" }}>
        {/* AI Advisor */}
        <button
          onClick={() => setTab("ai")}
          title="AI Advisor"
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: sideOpen ? "9px 14px" : "9px 0", justifyContent: sideOpen ? "flex-start" : "center", background: tab === "ai" ? "#f59e0b18" : "none", border: "none", borderLeft: `3px solid ${tab === "ai" ? "#f59e0b" : "transparent"}`, color: tab === "ai" ? "#f59e0b" : T.muted, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}
        >
          <span style={{ fontSize: 17, flexShrink: 0 }}>\u2736</span>
          {sideOpen && <span style={{ fontSize: 11, fontWeight: tab === "ai" ? "bold" : "normal" }}>AI Advisor</span>}
        </button>

        {/* Settings */}
        <button
          onClick={() => setTab("settings")}
          title="Settings"
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: sideOpen ? "9px 14px" : "9px 0", justifyContent: sideOpen ? "flex-start" : "center", background: tab === "settings" ? T.accentDim : "none", border: "none", borderLeft: `3px solid ${tab === "settings" ? T.accent : "transparent"}`, color: tab === "settings" ? T.accent : T.muted, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}
        >
          <span style={{ fontSize: 17, flexShrink: 0 }}>\u2699\ufe0f</span>
          {sideOpen && <span style={{ fontSize: 11, fontWeight: tab === "settings" ? "bold" : "normal" }}>Settings</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setSideOpen(p => !p)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: sideOpen ? "7px 14px" : "7px 0", justifyContent: sideOpen ? "flex-start" : "center", background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 11, whiteSpace: "nowrap" }}
        >
          <span style={{ fontSize: 13, transform: sideOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s", flexShrink: 0 }}>\u2192</span>
          {sideOpen && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );
}

export { NAV_ITEMS, Sidebar };
