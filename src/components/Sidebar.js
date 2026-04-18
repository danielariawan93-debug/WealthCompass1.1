import React from 'react';

const WPLogo = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="47" stroke="url(#wpg)" strokeWidth="3"/>
    <defs>
      <linearGradient id="wpg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffe066"/>
        <stop offset="100%" stopColor="#b8860b"/>
      </linearGradient>
    </defs>
    {/* Heartbeat left */}
    <polyline points="4,50 14,50 18,38 23,62 27,50 36,50" stroke="#d4a017" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Heartbeat right */}
    <polyline points="64,50 73,50 77,38 82,62 86,50 96,50" stroke="#d4a017" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    {/* W letter */}
    <polyline points="28,65 35,35 43,55 50,35 57,55 65,35 72,65" stroke="url(#wpg)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Arrow up-right */}
    <line x1="55" y1="38" x2="72" y2="20" stroke="#ffe066" strokeWidth="4" strokeLinecap="round"/>
    <polyline points="62,18 74,18 74,30" stroke="#ffe066" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AJLogo = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="47" stroke="url(#ajg)" strokeWidth="3"/>
    <defs>
      <linearGradient id="ajg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffe066"/>
        <stop offset="100%" stopColor="#b8860b"/>
      </linearGradient>
    </defs>
    {/* Heartbeat left */}
    <polyline points="4,50 14,50 18,40 23,60 27,50 34,50" stroke="#d4a017" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Heartbeat right */}
    <polyline points="66,50 73,50 77,40 82,60 86,50 96,50" stroke="#d4a017" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Wallet body */}
    <rect x="28" y="48" width="44" height="26" rx="4" stroke="url(#ajg)" strokeWidth="3"/>
    {/* Wallet flap */}
    <path d="M28,56 Q28,48 36,48 L56,48" stroke="url(#ajg)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    {/* Wallet clasp */}
    <circle cx="65" cy="61" r="3" stroke="url(#ajg)" strokeWidth="2"/>
    {/* Bar chart */}
    <rect x="34" y="37" width="6" height="12" rx="1.5" fill="#d4a017" opacity="0.7"/>
    <rect x="43" y="30" width="6" height="19" rx="1.5" fill="#d4a017" opacity="0.85"/>
    <rect x="52" y="22" width="6" height="27" rx="1.5" fill="url(#ajg)"/>
    {/* Arrow */}
    <line x1="55" y1="25" x2="68" y2="14" stroke="#ffe066" strokeWidth="3.5" strokeLinecap="round"/>
    <polyline points="62,13 70,13 70,21" stroke="#ffe066" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
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
            <div style={{ color: "#f59e0b", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>WEALTH<span style={{color:"#b8860b"}}>◆</span>PULSE</div>
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
