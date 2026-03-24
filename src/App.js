import React, { useState, useEffect, useMemo, useCallback } from "react";
import { THEMES, CUSTOM_PRESETS, applyPreset } from "./constants/themes";
import {
  ASSET_CLASSES,
  CURRENCIES,
  RATES,
  RISK_PROFILES,
} from "./constants/data";
import { TIERS, getAIUsage, getTier } from "./constants/tiers";
import {
  fMoney,
  fM,
  parseVal,
  getIDR,
  LS,
  getWealthSegment,
} from "./utils/helpers";
import {
  saveAccountData,
  loadAccountData,
  DEFAULT_ACCOUNT_STATE,
} from "./utils/storage";
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
} from "./components/ui";
import { NAV_ITEMS, Sidebar } from "./components/Sidebar";
import UpgradePanel from "./components/UpgradePanel";
import LoginScreen from "./components/LoginScreen";
import ProfileScene from "./scenes/ProfileScene";
import PortfolioScene from "./scenes/PortfolioScene";
import RiskScene from "./scenes/RiskScene";
import RebalanceScene from "./scenes/RebalanceScene";
import CalcScene from "./scenes/CalcScene";
import GoalScene from "./scenes/GoalScene";
import AIScene from "./scenes/AIScene";
import SettingsPopup from "./scenes/SettingsPopup";
import NetWorthTrackerScene from "./scenes/NetWorthScene";
import {
  DebtIncomeCard,
  PassiveIncomeSummary,
  PassiveIncomeScene,
  FinanceToolsScene,
} from "./scenes/PassiveScene";
import { DebtScene } from "./scenes/DebtScene";
import { RealAssetsScene } from "./scenes/RealAssetsScene";
import ComingSoonScene from "./scenes/ComingSoonScene";

export default function WealthCompassV7() {
  // ── ALL STATE DECLARATIONS FIRST (handlers reference these via closure) ─────
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wc_session") || "null");
    } catch {
      return null;
    }
  });
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("wc_theme") || "dark";
    } catch {
      return "dark";
    }
  });
  const [customPresetId, setCustomPresetId] = useState(() => {
    try {
      return localStorage.getItem("wc_custom_theme") || "midnight";
    } catch {
      return "midnight";
    }
  });
  const [tab, setTab] = useState("profile");
  const [riskProfile, setRiskProfile] = useState(null);
  const [dispCur, setDispCur] = useState("IDR");
  const [isPro, setIsPro] = useState(false);
  const [isProPlus, setIsProPlus] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [debts, setDebts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [aiTokensUsed, setAiTokensUsed] = useState(() => getAIUsage());
  const [sideOpen, setSideOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [hideValues, setHideValues] = useState(false);
  const [monthlyExpense, setMonthlyExpense] = useState(() => {
    try {
      return localStorage.getItem("wc_monthly_expense") || "";
    } catch {
      return "";
    }
  });
  const [fontScale, setFontScale] = useState(1.0);
  const [settings, setSettings] = useState({
    language: "id",
    notifications: true,
    userName: "",
    modules: { realAssets: false },
  });
  const [proExpiry, setProExpiry] = useState(null);
  const [livePrices, setLivePrices] = useState({
    crypto: {},
    gold: 1500000,
    silver: 18000,
  });
  const [priceLoading, setPriceLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [assets, setAssets] = useState([]);

  // ── AUTH HANDLERS (safe to reference state now) ────────────────────────────
  const handleLogin = (userData) => {
    const saved = loadAccountData(userData.email);
    const d = saved || DEFAULT_ACCOUNT_STATE;
    setUser(userData);
    setAssets(d.assets?.length ? d.assets : []);
    setDebts(d.debts || []);
    setGoals(d.goals || []);
    setRiskProfile(d.riskProfile || null);
    setIsPro(d.isPro || false);
    setIsProPlus(d.isProPlus || false);
    setUploadCount(d.uploadCount || 0);
    setProExpiry(d.proExpiry || null);
    setDispCur(d.dispCur || "IDR");
    setSettings({
      language: d.settings?.language || "id",
      notifications: d.settings?.notifications !== false,
      userName:
        d.settings?.userName ||
        userData.name ||
        userData.email?.split("@")[0] ||
        "",
      modules: d.settings?.modules || { realAssets: false },
    });
    setTab("profile");
    setTheme(d.theme || "dark");
    setCustomPresetId(d.customPresetId || "midnight");
  };

  const handleLogout = () => {
    if (user?.email) {
      saveAccountData(user.email, {
        assets,
        debts,
        goals,
        riskProfile,
        isPro,
        isProPlus,
        uploadCount,
        proExpiry,
        dispCur,
        settings,
        theme,
        customPresetId,
      });
    }
    setAssets([]);
    setDebts([]);
    setGoals([]);
    setRiskProfile(null);
    setIsPro(false);
    setIsProPlus(false);
    setUploadCount(0);
    setProExpiry(null);
    setHideValues(false);
    setTab("profile");
    localStorage.removeItem("wc_session");
    localStorage.removeItem("wc_theme");
    localStorage.removeItem("wc_custom_theme");
    setTheme("dark");
    setCustomPresetId("midnight");
    setUser(null);
  };

  const handleUpgrade = (tierChoice = "pro") => {
    setIsPro(true);
    if (tierChoice === "proplus") setIsProPlus(true);
    const d = new Date();
    d.setDate(d.getDate() + 2);
    setProExpiry({
      daysLeft: 2,
      dateStr: d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      }),
    });
  };

  const tier = getTier(isPro, isProPlus);

  const T = useMemo(() => {
    if (theme === "custom") {
      const preset = CUSTOM_PRESETS.find((p) => p.id === customPresetId);
      return preset ? applyPreset(preset) : THEMES.custom;
    }
    return THEMES[theme] || THEMES.dark;
  }, [theme, customPresetId]);

  // Persist theme choice
  const handleSetTheme = (t) => {
    setTheme(t);
    try {
      localStorage.setItem("wc_theme", t);
    } catch {}
  };

  // ── CoinCap API ──────────────────────────────────────────────────
  const CC_KEY = '29eb9eb7f921e41d70cb469c1ea9f23bddf88694c9c9873064c38c02183a5234';
  const CC_HDR = { 'Authorization': `Bearer ${CC_KEY}` };

  // ── Fetch crypto + metals + USD/IDR via CoinCap (60 menit) ───────
  const fetchCryptoAndMetals = useCallback(async () => {
    setPriceLoading(true);
    const CACHE_KEY = 'wc_cache_crypto';
    const TTL = 60 * 60 * 1000;
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < TTL) {
        setLivePrices(p => ({ ...p, crypto: cached.crypto, gold: cached.gold, silver: cached.silver }));
        if (cached.rates) Object.assign(RATES, cached.rates);
        setAssets(prev => prev.map(a => {
          if (a.coinId && cached.crypto?.[a.coinId])
            return { ...a, liveValue: a.quantity * cached.crypto[a.coinId].idr };
          return a;
        }));
        setPriceLoading(false);
        return;
      }
    } catch {}
    try {
      const COIN_MAP = { bitcoin: 'bitcoin', ethereum: 'ethereum', binancecoin: 'binance-coin', solana: 'solana', ripple: 'ripple' };
      const ccIds = Object.values(COIN_MAP).join(',');
      const [cryptoRes, goldRes, silverRes, idrRes] = await Promise.all([
        fetch(`https://api.coincap.io/v2/assets?ids=${ccIds}&limit=10`, { headers: CC_HDR }),
        fetch('https://api.coincap.io/v2/rates/tether-gold', { headers: CC_HDR }),
        fetch('https://api.coincap.io/v2/rates/silver', { headers: CC_HDR }),
        fetch('https://api.coincap.io/v2/rates/indonesian-rupiah', { headers: CC_HDR }),
      ]);
      const [cryptoRaw, goldRaw, silverRaw, idrRaw] = await Promise.all([
        cryptoRes.json(), goldRes.json(), silverRes.json(), idrRes.json()
      ]);

      const idrRateUsd = parseFloat(idrRaw?.data?.rateUsd || 0);
      const usdToIdr = idrRateUsd > 0 ? Math.round(1 / idrRateUsd) : 16800;

      const cryptoData = {};
      (cryptoRaw?.data || []).forEach(coin => {
        const priceUsd = parseFloat(coin.priceUsd || 0);
        const geckoId = Object.keys(COIN_MAP).find(k => COIN_MAP[k] === coin.id) || coin.id;
        cryptoData[geckoId] = { idr: Math.round(priceUsd * usdToIdr), usd: priceUsd };
      });

      const goldUsdOz = parseFloat(goldRaw?.data?.rateUsd || 0);
      const silverUsdOz = parseFloat(silverRaw?.data?.rateUsd || 0);
      const goldPerGram = goldUsdOz > 0 ? Math.round((goldUsdOz * usdToIdr) / 31.1035) : 1580000;
      const silverPerGram = silverUsdOz > 0 ? Math.round((silverUsdOz * usdToIdr) / 31.1035) : 20000;

      const newRates = { IDR: 1, USD: usdToIdr };
      try {
        const fxCache = JSON.parse(localStorage.getItem('wc_cache_forex') || 'null');
        if (fxCache?.rates?.EUR) newRates.EUR = fxCache.rates.EUR;
        if (fxCache?.rates?.CNY) newRates.CNY = fxCache.rates.CNY;
        if (fxCache?.rates?.SGD) newRates.SGD = fxCache.rates.SGD;
      } catch {}
      Object.assign(RATES, newRates);

      const toSave = { ts: Date.now(), crypto: cryptoData, gold: goldPerGram, silver: silverPerGram, rates: newRates };
      localStorage.setItem(CACHE_KEY, JSON.stringify(toSave));

      setLivePrices(p => ({ ...p, crypto: cryptoData, gold: goldPerGram, silver: silverPerGram }));
      setLastUpdated(new Date().toLocaleTimeString('id-ID'));
      setAssets(prev => prev.map(a => {
        if (a.coinId && cryptoData[a.coinId])
          return { ...a, liveValue: a.quantity * cryptoData[a.coinId].idr };
        return a;
      }));
    } catch (e) {
      console.warn('CoinCap fetch failed:', e.message);
      setLivePrices(p => ({ ...p, gold: p.gold || 1580000, silver: p.silver || 20000 }));
    }
    setPriceLoading(false);
  }, []);

  // ── Fetch EUR/CNY/SGD via frankfurter (4 jam) ────────────────────
  const fetchForex = useCallback(async () => {
    const CACHE_KEY = 'wc_cache_forex';
    const TTL = 4 * 60 * 60 * 1000;
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < TTL) { Object.assign(RATES, cached.rates); return; }
    } catch {}
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=IDR&to=USD,EUR,CNY,SGD');
      const data = await res.json();
      const newRates = {
        IDR: 1,
        USD: data.rates?.USD ? Math.round(1 / data.rates.USD) : 16800,
        EUR: data.rates?.EUR ? Math.round(1 / data.rates.EUR) : 19000,
        CNY: data.rates?.CNY ? Math.round(1 / data.rates.CNY) : 2400,
        SGD: data.rates?.SGD ? Math.round(1 / data.rates.SGD) : 13000,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), rates: newRates }));
      Object.assign(RATES, newRates);
    } catch (e) { console.warn('Forex fetch failed:', e.message); }
  }, []);

  useEffect(() => {
    fetchCryptoAndMetals();
    fetchForex();
    const t1 = setInterval(fetchCryptoAndMetals, 60 * 60 * 1000);
    const t2 = setInterval(fetchForex, 4 * 60 * 60 * 1000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [fetchCryptoAndMetals, fetchForex]);

  const total = useMemo(
    () => assets.reduce((s, a) => s + getIDR(a), 0),
    [assets]
  );
  const profile = riskProfile ? RISK_PROFILES[riskProfile] : null;
  const profileColor = riskProfile
    ? RISK_PROFILES[riskProfile].color
    : T.accent;
  // seg for header: based on NET worth (gross - debts) for accurate wealth positioning
  const totalLiabilities = debts.reduce(
    (s, d) => s + parseVal(d.outstanding),
    0
  );
  const netWorth = total - totalLiabilities;
  const seg = getWealthSegment(Math.max(0, netWorth)); // segment from NET
  const grossSeg = getWealthSegment(total); // gross segment (for reference)

  // Masked value display
  const displayMoney = (val, cur) => (hideValues ? "••••••" : fMoney(val, cur));

  const handleSetTab = (t) => {
    if (t === "settings") {
      setShowSettings(true); // open popup, keep current tab unchanged
      return;
    }
    setTab(t);
  };
  const FONT_FAMILIES = {
    dm: "'DM Sans', system-ui, sans-serif",
    playfair: "'Playfair Display', Georgia, serif",
    georgia: "Georgia, serif",
    arial: "Arial, sans-serif",
    calibri: "Calibri, Candara, sans-serif",
    times: "'Times New Roman', Times, serif",
    comic: "'Comic Sans MS', cursive",
    system: "system-ui, sans-serif",
  };
  const activeFontFamily = FONT_FAMILIES[settings.fontFamily || "dm"];

  const tabProps = { assets, riskProfile, dispCur, livePrices, T, hideValues };

  // Auto-save account data whenever key data changes (placed here so all state is initialized)
  useEffect(() => {
    if (!user?.email) return;
    saveAccountData(user.email, {
      assets,
      debts,
      goals,
      riskProfile,
      isPro,
      isProPlus,
      uploadCount,
      proExpiry,
      dispCur,
      settings,
      theme,
      customPresetId,
    });
  }, [
    assets,
    debts,
    goals,
    riskProfile,
    isPro,
    isProPlus,
    uploadCount,
    proExpiry,
    dispCur,
    settings,
  ]);

  // ── Show login if not authenticated ────────────────────────────────────────
  if (!user) return <LoginScreen onLogin={handleLogin} T={T} />;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: T.bg,
        fontFamily: activeFontFamily,
        zoom: fontScale,
        color: T.text,
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');:root{--fs:${fontScale}rem}*{box-sizing:border-box;margin:0;padding:0}input::placeholder{color:${T.muted}}select option{background:${T.card}}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}input[type=range]{height:4px}`}</style>

      {/* Sidebar */}
      <Sidebar
        tab={tab}
        setTab={handleSetTab}
        T={T}
        isPro={isPro}
        sideOpen={sideOpen}
        setSideOpen={setSideOpen}
        modules={settings.modules}
      />

      {/* Main */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Top header bar */}
        <div
          style={{
            borderBottom: `1px solid ${T.border}`,
            padding: "10px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: T.surface,
            position: "sticky",
            top: 0,
            zIndex: 90,
          }}
        >
          <div>
            <div
              style={{
                color: T.text,
                fontSize: 14,
                fontWeight: "bold",
                fontFamily: "'Playfair Display', Georgia, serif",
                textTransform: "capitalize",
              }}
            >
              {tab === "profile"
                ? `${settings.userName || "Profil"} ◎`
                : NAV_ITEMS.find((n) => n.id === tab)?.label || tab}
            </div>
            <div style={{ color: T.muted, fontSize: 9, letterSpacing: 1.5 }}>
              WEALTH◎COMPASS · v7
              {priceLoading
                ? " · ↻"
                : lastUpdated
                ? ` · live ${lastUpdated}`
                : ""}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: T.accent, fontSize: 15, fontWeight: "bold" }}>
                    {displayMoney(total, dispCur)}
                  </div>
                  {dispCur !== "IDR" && RATES[dispCur] && (
                    <div style={{ color: T.muted, fontSize: 10, marginTop: 1 }}>
                      1 {dispCur} = Rp{RATES[dispCur].toLocaleString("id-ID")}
                    </div>
                  )}
                </div>
                {/* Hide/show toggle */}
                <button
                  onClick={() => setHideValues((p) => !p)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    color: T.muted,
                    padding: "2px 4px",
                    lineHeight: 1,
                  }}
                  title={hideValues ? "Tampilkan nilai" : "Sembunyikan nilai"}
                >
                  {hideValues ? "👁" : "🙈"}
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 5,
                  justifyContent: "flex-end",
                  alignItems: "center",
                  marginTop: 1,
                }}
              >
                {profile && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: "1px 6px",
                      borderRadius: 3,
                      background: profileColor + "1a",
                      color: profileColor,
                      fontWeight: 700,
                    }}
                  >
                    {profile.emoji} {profile.label}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 9,
                    padding: "1px 5px",
                    borderRadius: 3,
                    background: seg.color + "18",
                    color: seg.color,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  title={`Net: ${fMoney(netWorth)} | Gross: ${fMoney(total)}`}
                >
                  {seg.icon} {seg.short}
                  {grossSeg.short !== seg.short && (
                    <span
                      style={{
                        color: seg.color,
                        fontSize: 8,
                        marginLeft: 3,
                      }}
                    >
                      (G:{grossSeg.short})
                    </span>
                  )}
                </span>
              </div>
            </div>
            {/* Free/Pro badge */}
            {isPro ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    padding: "4px 9px",
                    borderRadius: 6,
                    background: T.accentDim,
                    color: isProPlus ? "#9b7ef8" : T.accent,
                    fontWeight: "bold",
                    border: `1px solid ${
                      isProPlus ? "#9b7ef833" : T.accentSoft
                    }`,
                    cursor: "pointer",
                  }}
                  onClick={() => setShowUpgrade(true)}
                >
                  {isProPlus ? "💎 PRO+" : "⭐ PRO"}
                </span>
                {proExpiry && proExpiry.daysLeft <= 3 && (
                  <span style={{ fontSize: 9, color: T.orange }}>
                    ⚠ Berakhir{" "}
                    {proExpiry.daysLeft === 0
                      ? "hari ini"
                      : `${proExpiry.daysLeft} hari lagi`}
                  </span>
                )}
                {proExpiry && proExpiry.daysLeft > 3 && (
                  <span style={{ fontSize: 9, color: T.muted }}>
                    s/d {proExpiry.dateStr}
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowUpgrade(true)}
                style={{
                  fontSize: 10,
                  padding: "4px 9px",
                  borderRadius: 6,
                  background: T.redDim,
                  color: T.red,
                  border: `1px solid ${T.red}33`,
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                FREE · Upgrade
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px 80px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            {tab === "profile" && (
              <ProfileScene
                {...tabProps}
                settings={settings}
                setSettings={setSettings}
                setTab={handleSetTab}
              />
            )}
            {tab === "risk" && (
              <RiskScene
                riskProfile={riskProfile}
                setRiskProfile={setRiskProfile}
                T={T}
                onDone={() => handleSetTab("profile")}
              />
            )}
            {tab === "portfolio" && (
              <>
                <PassiveIncomeSummary
                  assets={assets}
                  setAssets={setAssets}
                  dispCur={dispCur}
                  T={T}
                  hideValues={hideValues}
                />
                {/* Debt vs Passive Income Summary Card */}
                <DebtIncomeCard
                  assets={assets}
                  debts={debts || []}
                  dispCur={dispCur}
                  isPro={isPro}
                  T={T}
                  hideValues={hideValues}
                  setShowUpgrade={setShowUpgrade}
                  monthlyExpense={monthlyExpense}
                />
                <PortfolioScene
                  {...tabProps}
                  setAssets={setAssets}
                  priceLoading={priceLoading}
                  isPro={isPro}
                  tier={tier}
                  uploadCount={uploadCount}
                  setUploadCount={setUploadCount}
                />
              </>
            )}
            {tab === "rebalance" && (
              <RebalanceScene
                {...tabProps}
                setTab={handleSetTab}
                hideValues={hideValues}
              />
            )}
            {tab === "networth" && (
              <NetWorthTrackerScene
                assets={assets}
                debts={debts}
                dispCur={dispCur}
                isPro={isPro}
                isProPlus={isProPlus}
                tier={tier}
                T={T}
                hideValues={hideValues}
              />
            )}
            {tab === "finance-tools" && (
              <FinanceToolsScene
                assets={assets}
                setAssets={setAssets}
                dispCur={dispCur}
                T={T}
                hideValues={hideValues}
              />
            )}
            {tab === "calc" && (
              <FinanceToolsScene
                assets={assets}
                setAssets={setAssets}
                dispCur={dispCur}
                T={T}
                hideValues={hideValues}
              />
            )}
            {tab === "real-assets" &&
              (isPro ? (
                <RealAssetsScene
                  assets={assets}
                  setAssets={setAssets}
                  debts={debts}
                  setDebts={setDebts}
                  dispCur={dispCur}
                  T={T}
                  hideValues={hideValues}
                />
              ) : (
                <div style={{ textAlign: "center", padding: "60px 24px" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🏡</div>
                  <div
                    style={{
                      color: T.accent,
                      fontSize: 16,
                      fontWeight: "bold",
                      marginBottom: 8,
                    }}
                  >
                    Fitur Pro
                  </div>
                  <div
                    style={{
                      color: T.textSoft,
                      fontSize: 13,
                      lineHeight: 1.7,
                      marginBottom: 20,
                    }}
                  >
                    Modul Properti & Bisnis hanya tersedia untuk pengguna Pro
                    dan Pro+.
                  </div>
                  <button
                    onClick={() => setShowUpgrade(true)}
                    style={{
                      padding: "11px 24px",
                      borderRadius: 10,
                      border: "none",
                      background: T.accent,
                      color: "#000",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: 13,
                    }}
                  >
                    Upgrade Pro →
                  </button>
                </div>
              ))}
            {tab === "goal" && (
              <GoalScene
                assets={assets}
                goals={goals}
                setGoals={setGoals}
                dispCur={dispCur}
                T={T}
                tier={tier}
                hideValues={hideValues}
              />
            )}
            {tab === "debt" && (
              <DebtScene
                hideValues={hideValues}
                debts={debts}
                setDebts={setDebts}
                dispCur={dispCur}
                tier={tier}
                T={T}
              />
            )}
            {tab === "ai" && (
              <AIScene
                {...tabProps}
                debts={debts}
                tier={tier}
                aiTokensUsed={aiTokensUsed}
                setAiTokensUsed={setAiTokensUsed}
              />
            )}
            {tab === "insurance" && (
              <ComingSoonScene
                T={T}
                title="Asuransi & Proteksi Kekayaan"
                icon="🛡️"
                proPlus={false}
                description="Lacak semua polis asuransi dalam satu tempat — jiwa, kesehatan, properti, dan kendaraan. Pastikan proteksi kekayaan kamu sudah optimal."
                features={[
                  {
                    icon: "📋",
                    label: "Polis Asuransi Jiwa",
                    desc: "Input premi, uang pertanggungan, dan masa berlaku polis jiwa & term life",
                  },
                  {
                    icon: "🏥",
                    label: "Asuransi Kesehatan",
                    desc: "Lacak BPJS, asuransi swasta, dan limit manfaat per tahun",
                  },
                  {
                    icon: "🏠",
                    label: "Asuransi Properti & Kendaraan",
                    desc: "Nilai pertanggungan vs nilai aset aktual",
                  },
                  {
                    icon: "📊",
                    label: "Coverage Gap Analysis",
                    desc: "AI analisa apakah proteksi kamu sudah cukup vs net worth",
                  },
                ]}
              />
            )}
            {tab === "peers" && (
              <ComingSoonScene
                T={T}
                title="Portfolio vs Peers"
                icon="👥"
                proPlus={true}
                description="Bandingkan alokasi portofolio kamu dengan investor lain di segmen wealth yang sama. Anonymized & aggregated untuk privasi."
                features={[
                  {
                    icon: "📊",
                    label: "Benchmark Alokasi Aset",
                    desc: "Lihat alokasi rata-rata peer di segment Mass, Affluent, HNW",
                  },
                  {
                    icon: "📈",
                    label: "Return Comparison",
                    desc: "Performa portofolio kamu vs median peer (anonymized)",
                  },
                  {
                    icon: "🎯",
                    label: "Gap Analysis",
                    desc: "Instrumen apa yang dimiliki peer tapi belum kamu punya",
                  },
                  {
                    icon: "🔒",
                    label: "100% Anonymized",
                    desc: "Tidak ada data personal yang dibagikan — hanya persentase alokasi",
                  },
                ]}
              />
            )}
            {tab === "community" && (
              <ComingSoonScene
                T={T}
                title="Komunitas WealthCompass"
                icon="🤝"
                proPlus={true}
                description="Jalin relasi dengan sesama investor. Diskusi strategi, share insight, dan tumbuh bersama komunitas wealth-conscious Indonesia."
                features={[
                  {
                    icon: "💬",
                    label: "Forum Diskusi",
                    desc: "Thread per topik: saham, properti, kripto, bisnis, perencanaan pensiun",
                  },
                  {
                    icon: "🎓",
                    label: "Wealth Masterclass",
                    desc: "Sesi eksklusif dari praktisi wealth management Indonesia",
                  },
                  {
                    icon: "🤝",
                    label: "Networking HNW+",
                    desc: "Connect dengan investor level Affluent ke atas (verified)",
                  },
                  {
                    icon: "📰",
                    label: "Market Insights",
                    desc: "Analisa mingguan dari AI + kurator konten finansial pilihan",
                  },
                ]}
              />
            )}
          </div>
        </div>
      </div>

      {/* Settings popup */}
      <SettingsPopup
        show={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        setSettings={setSettings}
        theme={theme}
        setTheme={handleSetTheme}
        dispCur={dispCur}
        setDispCur={setDispCur}
        isPro={isPro}
        setIsPro={setIsPro}
        setShowUpgrade={setShowUpgrade}
        T={T}
        onLogout={handleLogout}
        fontScale={fontScale}
        setFontScale={setFontScale}
        customPresetId={customPresetId}
        setCustomPresetId={setCustomPresetId}
      />

      {/* Floating zoom control */}
      <div
        style={{
          position: "fixed",
          bottom: 80,
          right: 16,
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 24,
            boxShadow: `0 2px 12px ${T.shadow}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() =>
              setFontScale((s) =>
                Math.min(1.4, parseFloat((s + 0.05).toFixed(2)))
              )
            }
            style={{
              width: 32,
              height: 28,
              border: "none",
              borderBottom: `1px solid ${T.border}`,
              background: "none",
              color: T.text,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            A+
          </button>
          <div
            style={{
              fontSize: 8,
              color: T.muted,
              padding: "2px 0",
              lineHeight: 1,
            }}
          >
            {Math.round(fontScale * 100)}%
          </div>
          <button
            onClick={() =>
              setFontScale((s) =>
                Math.max(0.8, parseFloat((s - 0.05).toFixed(2)))
              )
            }
            style={{
              width: 32,
              height: 28,
              border: "none",
              borderTop: `1px solid ${T.border}`,
              background: "none",
              color: T.text,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            A-
          </button>
          {fontScale !== 1.0 && (
            <button
              onClick={() => setFontScale(1.0)}
              style={{
                width: 32,
                height: 18,
                border: "none",
                borderTop: `1px solid ${T.border}`,
                background: T.accentDim,
                color: T.accent,
                cursor: "pointer",
                fontSize: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              1:1
            </button>
          )}
        </div>
      </div>
      {/* Upgrade panel */}
      <UpgradePanel
        show={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={handleUpgrade}
        T={T}
      />
    </div>
  );
}
