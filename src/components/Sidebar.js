import React from 'react';

const WPLogo = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="0.5" y="0.5" width="23" height="23" rx="5" fill="#0d1117" stroke="#f59e0b" strokeWidth="1.2"/>
    <polyline points="0.5,13 2,13 2.8,10.5 3.8,15.5 4.6,13 5.5,13" stroke="#f59e0b" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
    <polyline points="5,5.5 7,16.5 9.5,10 12,16.5 14,5.5" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="15" y1="5.5" x2="15" y2="17" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M15,5.5 Q21.5,5.5 21.5,9.25 Q21.5,13 15,13" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <polyline points="21.5,13 22,13 22.5,11 23,15 23.5,13" stroke="#f59e0b" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
  </svg>
);

const AJLogo = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" stroke="#f59e0b" strokeWidth="1.6"/>
    <rect x="5.5" y="11.5" width="13" height="7" rx="1.5" stroke="#f59e0b" strokeWidth="1.2"/>
    <rect x="5.5" y="9.5" width="8.5" height="3" rx="1" stroke="#f59e0b" strokeWidth="1.1"/>
    <rect x="7" y="14" width="1.8" height="2.5" rx="0.4" fill="#f59e0b" opacity="0.6"/>
    <rect x="10" y="13" width="1.8" height="3.5" rx="0.4" fill="#f59e0b" opacity="0.8"/>
    <rect x="13" y="11.5" width="1.8" height="5" rx="0.4" fill="#f59e0b"/>
    <polyline points="14.5,11 16.5,9 18.5,11" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="16.5" y1="9" x2="16.5" y2="14" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round"/>
    <polyline points="1.5,12 3.5,12 4.2,10.5 5,13.5" stroke="#f59e0b" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
    <polyline points="19,12 20.5,12 21.2,10.5 22,13.5" stroke="#f59e0b" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
  </svg>
);

const NAV_ITEMS = [
  { id: "profile",       label: "Profil",            icon: "👤", color: "#5b9cf6" },
  { id: "portfolio",     label: "Portofolio",         icon: "💼", color: "#d4a843" },
  { id: "rebalance",     label: "Rebalance",          icon: "⚖️", color: "#3ecf8e" },
  { id: "goal",          label: "Goals",              icon: "🎯", color: "#f26b6b" },
  { id: "finance-tools", label: "Finance Tools",      icon: "📊", color: "#9b7ef8" },
  { id: "debt",          label: "Hutang",             icon: "💳", color: "#f59e0b" },
  { id: "networth",      label: "Net Worth",          icon: "📈", color: "#34d399" },
  { id: "real-assets",   label: "Properti & Bisnis",  icon: "🏡", color: "#f87239", alwaysShow: true, proGate: true },
  { id: "insurance",     label: "Asuransi",           icon: "🛡️", color: "#818cf8", alwaysShow: true, proGate: true },
  { id: "peers",         label: "Peer Benchmark",     icon: "👥", color: "#5b9cf6", comingSoon: true },
  { id: "family",        label: "Family Wealth",      icon: "👨‍👩‍👧", color: "#ec4899", comingSoon: true },
  { id: "community",     label: "Komunitas",          icon: "🤝", color: "#f59e0b", comingSoon: true },
  { id: "risk",          label: "Profil Risiko",      icon: "🎲", color: "#9b7ef8", hidden: true },
];

function Sidebar({ tab, setTab, T, isPro = false, isProPlus = false, sideOpen, setSideOpen, modules = {}, setShowUpgrade, activeApp, setActiveApp }) {
  const W = sideOpen ? 180 : 52;

  const handleNav = (item) => {
    // Coming Soon: allow click to show the preview scene (not blocked)
    if (item.proGate && !isPro && !isProPlus) {
      if (setShowUpgrade) setShowUpgrade(true);
      return;
    }
    setTab(item.id);
  };

  const visibleItems = NAV_ITEMS.filter(n => !n.hidden);

  return (
    <div style={{ width: W, minHeight: "100vh", background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", transition: "width 0.25s ease", overflow: "hidden", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>

      <button
        onClick={() => setActiveApp && setActiveApp("arthajourney")}
        title="Pindah ke Artha Journey"
        style={{
          padding: sideOpen ? "14px 14px 12px" : "14px 0 12px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: sideOpen ? "flex-start" : "center",
          gap: 8,
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${T.border}`,
          cursor: setActiveApp ? "pointer" : "default",
          width: "100%",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ flexShrink: 0 }}><WPLogo size={sideOpen ? 26 : 22} /></div>
        {sideOpen && (
          <div style={{ textAlign: "left", minWidth: 0 }}>
            <div style={{ color: "#f59e0b", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>WEALTH PULSE</div>
            <div style={{ color: T.muted, fontSize: 8, marginTop: 1 }}>tap untuk pindah</div>
          </div>
        )}
      </button>

      <div style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {visibleItems.map((n) => {
          const active = tab === n.id;
          const locked = n.proGate && !isPro && !isProPlus;
          const soon   = n.comingSoon;
          return (
            <button
              key={n.id}
              onClick={() => handleNav(n)}
              title={soon ? n.label + " (Segera Hadir)" : n.label}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: sideOpen ? "10px 14px" : "10px 0", justifyContent: sideOpen ? "flex-start" : "center", background: active ? n.color + "22" : "none", border: "none", borderLeft: "3px solid " + (active ? n.color : "transparent"), color: active ? n.color : T.muted, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap", overflow: "hidden", opacity: soon ? 0.55 : 1 }}
            >
              <span style={{ fontSize: 17, flexShrink: 0, lineHeight: 1 }}>{n.icon}</span>
              {sideOpen && (
                <span style={{ fontSize: 11, fontWeight: active ? "bold" : "normal", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {n.label}
                  {soon && <span style={{ fontSize: 9, marginLeft: 4 }}> 🔜</span>}
                  {locked && <span style={{ fontSize: 9, marginLeft: 4 }}>🔒</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ borderTop: "1px solid " + T.border, padding: "6px 0" }}>
        <button onClick={() => setTab("ai")} title="AI Advisor"
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: sideOpen ? "9px 14px" : "9px 0", justifyContent: sideOpen ? "flex-start" : "center", background: tab === "ai" ? "#f59e0b18" : "none", border: "none", borderLeft: "3px solid " + (tab === "ai" ? "#f59e0b" : "transparent"), color: tab === "ai" ? "#f59e0b" : T.muted, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 17, flexShrink: 0 }}>✦</span>
          {sideOpen && <span style={{ fontSize: 11, fontWeight: tab === "ai" ? "bold" : "normal" }}>AI Advisor</span>}
        </button>

        <button onClick={() => setTab("settings")} title="Settings"
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: sideOpen ? "9px 14px" : "9px 0", justifyContent: sideOpen ? "flex-start" : "center", background: tab === "settings" ? T.accentDim : "none", border: "none", borderLeft: "3px solid " + (tab === "settings" ? T.accent : "transparent"), color: tab === "settings" ? T.accent : T.muted, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 17, flexShrink: 0 }}>⚙️</span>
          {sideOpen && <span style={{ fontSize: 11, fontWeight: tab === "settings" ? "bold" : "normal" }}>Settings</span>}
        </button>

        <button onClick={() => setSideOpen(p => !p)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: sideOpen ? "7px 14px" : "7px 0", justifyContent: sideOpen ? "flex-start" : "center", background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 11, whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 13, transform: sideOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s", flexShrink: 0 }}>→</span>
          {sideOpen && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );
}

export { NAV_ITEMS, Sidebar };
