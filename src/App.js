import React, { useState, useEffect, useMemo, useCallback } from "react";
import { auth } from "./components/LoginScreen";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { THEMES, CUSTOM_PRESETS, applyPreset } from "./constants/themes";
import {
  ASSET_CLASSES,
  CURRENCIES,
  RATES,
  RISK_PROFILES,
} from "./constants/data";
import { TIERS, getTier, PULSE_PACKAGES } from "./constants/tiers";
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
  saveAccountDataCloud,
  loadAccountDataCloud,
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
  ActiveIncomeSummary,
  PassiveIncomeScene,
  FinanceToolsScene,
} from "./scenes/PassiveScene";
import { DebtScene } from "./scenes/DebtScene";
import { RealAssetsScene } from "./scenes/RealAssetsScene";
import ComingSoonScene from "./scenes/ComingSoonScene";
import InsuranceScene from "./scenes/InsuranceScene";

// CoinCap API credentials
const CC_KEY = '29eb9eb7f921e41d70cb469c1ea9f23bddf88694c9c9873064c38c02183a5234';
const CC_HDR = { 'Authorization': `Bearer ${CC_KEY}` };

function WealthCompassV7() {
  // -- ALL STATE DECLARATIONS FIRST (handlers reference these via closure) -----
  const [user, setUser] = useState(null);
  const cloudLoadDone = React.useRef(false);
  const isLoggingOut = React.useRef(false);
  const [logoutSaving, setLogoutSaving] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [keepSignIn] = useState(() => localStorage.getItem('wc_keep_signin') !== 'false');
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
  const [monthlyUploadCount, setMonthlyUploadCount] = useState(0);
  const [monthlyUploadMonth, setMonthlyUploadMonth] = useState("");
  const [pulseCredits, setPulseCredits] = useState(5);
  const [debts, setDebts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [showBuyPulse, setShowBuyPulse] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [hideValues, setHideValues] = useState(false);
  const [monthlyExpense, setMonthlyExpense] = useState("");
  const [monthlyFixedIncome, setMonthlyFixedIncome] = useState("");
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
  const [activeIncomes, setActiveIncomes] = useState([]);
  const [insurances, setInsurances] = useState([]);

  // -- AUTH HANDLERS (safe to reference state now) ----------------------------
  const handleLogin = (userData) => {
    isLoggingOut.current = false; // reset logout flag so onAuthStateChanged works after re-login
    cloudLoadDone.current = false; // block auto-save until cloud load done
    // Load from localStorage immediately (fast, works offline)
    const localSaved = loadAccountData(userData.email);
    const d = localSaved || DEFAULT_ACCOUNT_STATE;
    setUser(userData);
    setAssets(d.assets?.length ? d.assets : []);
    setDebts(d.debts || []);
    setGoals(d.goals || []);
    setRiskProfile(d.riskProfile || null);
    setIsPro(d.isPro || false);
    setIsProPlus(d.isProPlus || false);
    setUploadCount(d.uploadCount || 0);
    setMonthlyUploadCount(d.monthlyUploadCount || 0);
    setMonthlyUploadMonth(d.monthlyUploadMonth || "");
    setPulseCredits(d.pulseCredits ?? 5);
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
    // Clean stale activeIncomes - keep only entries matching active business assets
    const loadedAssets = d.assets || [];
    const loadedActive = (d.activeIncomes || []).filter(ai =>
      loadedAssets.some(a =>
        a.classKey === "business" && a.incomeType === "active" &&
        ("biz_" + String(a.id) === String(ai.id))
      )
    );
    setActiveIncomes(loadedActive);
    setInsurances(d.insurances || []);
    setMonthlyExpense(d.monthlyExpense || "");
    setMonthlyFixedIncome(d.monthlyFixedIncome || "");

    // Then try Firestore (async - always authoritative source of truth)
    if (userData.uid) {
      loadAccountDataCloud(userData.uid).then(cloud => {
        if (!cloud) {
          // Firestore empty - push local data up so other devices can sync
          const localData = loadAccountData(userData.email);
          if (localData) saveAccountDataCloud(userData.uid, localData).catch(() => {});
          setTimeout(() => { cloudLoadDone.current = true; }, 300);
          return;
        }
        // Use cloud data (single source of truth)
        setAssets(cloud.assets?.length ? cloud.assets : []);
        setDebts(cloud.debts || []);
        setGoals(cloud.goals || []);
        setRiskProfile(cloud.riskProfile || null);
        setIsPro(cloud.isPro || false);
        setIsProPlus(cloud.isProPlus || false);
        setUploadCount(cloud.uploadCount || 0);
        setMonthlyUploadCount(cloud.monthlyUploadCount || 0);
        setMonthlyUploadMonth(cloud.monthlyUploadMonth || "");
        setPulseCredits(cloud.pulseCredits ?? 5);
        setProExpiry(cloud.proExpiry || null);
        setDispCur(cloud.dispCur || "IDR");
        setSettings({
          language: cloud.settings?.language || "id",
          notifications: cloud.settings?.notifications !== false,
          userName: cloud.settings?.userName || userData.name || userData.email?.split("@")[0] || "",
          modules: cloud.settings?.modules || { realAssets: false },
        });
        setTheme(cloud.theme || "dark");
        setCustomPresetId(cloud.customPresetId || "midnight");
        // Clean stale activeIncomes from cloud data too
        const cloudAssets = cloud.assets || [];
        const cleanCloudActive = (cloud.activeIncomes || []).filter(ai =>
          cloudAssets.some(a =>
            a.classKey === "business" && a.incomeType === "active" &&
            ("biz_" + String(a.id) === String(ai.id))
          )
        );
        setActiveIncomes(cleanCloudActive);
        setInsurances(cloud.insurances || []);
        setMonthlyExpense(cloud.monthlyExpense || "");
        setMonthlyFixedIncome(cloud.monthlyFixedIncome || "");
        // Mirror cloud data to localStorage as offline cache
        saveAccountData(userData.email, cloud);
        // Delay cloudLoadDone agar React flush semua setState sebelum auto-save
        setTimeout(() => { cloudLoadDone.current = true; }, 300);
      }).catch(() => {
        setTimeout(() => { cloudLoadDone.current = true; }, 300);
      });
    }
  };

  const handleLogout = async () => {
    isLoggingOut.current = true;
    if (user?.uid) {
      const savePayload = {
        assets, debts, goals, riskProfile,
        isPro, isProPlus, uploadCount, monthlyUploadCount, monthlyUploadMonth,
        pulseCredits, proExpiry,
        dispCur, settings, theme, customPresetId,
        activeIncomes, insurances,
        monthlyExpense, monthlyFixedIncome,
      };
      // Await Firestore save so data is committed before the next login loads it
      setLogoutSaving(true);
      try {
        await saveAccountDataCloud(user.uid, savePayload);
      } catch (e) {
        console.error("[WC] Logout cloud save failed:", e.message);
      }
      // Keep localStorage in sync as offline cache
      if (user?.email) saveAccountData(user.email, savePayload);
    }
    localStorage.removeItem("wc_session");
    localStorage.removeItem("wc_theme");
    localStorage.removeItem("wc_custom_theme");
    // Sign out from Firebase FIRST — LoginScreen mounts an onAuthStateChanged listener
    // and will immediately re-login the user if Firebase still shows them authenticated.
    try { await signOut(auth); } catch {}
    setLogoutSaving(false);
    setUser(null);
    setAssets([]);
    setDebts([]);
    setGoals([]);
    setRiskProfile(null);
    setIsPro(false);
    setIsProPlus(false);
    setUploadCount(0);
    setMonthlyUploadCount(0);
    setMonthlyUploadMonth("");
    setPulseCredits(5);
    setProExpiry(null);
    setActiveIncomes([]);
    setInsurances([]);
    setMonthlyExpense("");
    setMonthlyFixedIncome("");
    setHideValues(false);
    setTheme("dark");
    setCustomPresetId("midnight");
  };

  const handleUpgrade = (tierChoice = "pro", durationDays = 30) => {
    setIsPro(true);
    if (tierChoice === "proplus") setIsProPlus(true);
    // Allocate Pulse Credits upfront for the full subscription period
    const months = Math.max(1, Math.round(durationDays / 30));
    const pulsePerMonth = tierChoice === "proplus" ? 100 : 25;
    setPulseCredits(prev => prev + pulsePerMonth * months);
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + durationDays);
    setProExpiry({
      expiryDate: expDate.toISOString(),
      daysLeft: durationDays,
      dateStr: expDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
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



  // -- Fetch crypto + metals + USD/IDR via CoinCap (60 menit) -------
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

  // -- Fetch EUR/CNY/SGD via frankfurter (4 jam) --------------------
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

  // Expiry enforcement
  useEffect(() => {
    const checkExpiry = () => {
      if (!proExpiry) return;
      if (proExpiry.expiryDate) {
        const now = new Date();
        const expDate = new Date(proExpiry.expiryDate);
        const msLeft = expDate - now;
        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
        if (msLeft <= 0) {
          setIsPro(false);
          setIsProPlus(false);
          setProExpiry(null);
          if (user?.email && cloudLoadDone.current) {
            saveAccountData(user.email, {
              assets, debts, goals, riskProfile,
              isPro: false, isProPlus: false,
              uploadCount, monthlyUploadCount, monthlyUploadMonth,
              pulseCredits, proExpiry: null,
              dispCur, settings, theme, customPresetId,
              activeIncomes, insurances, monthlyExpense, monthlyFixedIncome,
            });
          }
        } else if (daysLeft !== proExpiry.daysLeft) {
          setProExpiry(p => ({ ...p, daysLeft }));
        }
      }
    };
    checkExpiry();
    const t = setInterval(checkExpiry, 60 * 1000);
    return () => clearInterval(t);
  }, [proExpiry, user, assets, debts, goals, riskProfile, uploadCount, dispCur, settings, theme, customPresetId]);

  // Auto-save to localStorage (instant) AND Firestore (cloud sync)
  useEffect(() => {
    if (!user?.email) return;
    if (!cloudLoadDone.current) return; // wait for cloud load before saving
    const payload = {
      assets,
      debts,
      goals,
      riskProfile,
      isPro,
      isProPlus,
      uploadCount,
      monthlyUploadCount,
      monthlyUploadMonth,
      pulseCredits,
      proExpiry,
      dispCur,
      settings,
      theme,
      customPresetId,
      activeIncomes,
      insurances,
      monthlyExpense,
      monthlyFixedIncome,
    };
    saveAccountData(user.email, payload);
    if (user?.uid) {
      saveAccountDataCloud(user.uid, payload)
        .then(() => console.log("[WC] Firestore save OK uid:", user.uid))
        .catch(e => console.error("[WC] Firestore save FAILED:", e.message));
    } else {
      console.warn("[WC] No uid - Firestore skip");
    }
  }, [
    assets,
    debts,
    goals,
    riskProfile,
    isPro,
    isProPlus,
    uploadCount,
    monthlyUploadCount,
    monthlyUploadMonth,
    pulseCredits,
    proExpiry,
    dispCur,
    settings,
    activeIncomes,
    insurances,
    monthlyExpense,
    monthlyFixedIncome,
  ]);

  // -- Firebase session check on mount ----------------------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && !isLoggingOut.current) {
        const isGoogle = firebaseUser.providerData?.some(p => p.providerId === 'google.com');
        if (firebaseUser.emailVerified || isGoogle) {
          const cached = (() => { try { return JSON.parse(localStorage.getItem('wc_session') || 'null'); } catch { return null; } })();
          if (cached?.email === firebaseUser.email) {
            handleLogin(cached);
          } else {
            const userData = { email: firebaseUser.email, name: firebaseUser.displayName || firebaseUser.email.split('@')[0], photo: firebaseUser.photoURL, uid: firebaseUser.uid };
            handleLogin(userData);
          }
        }
      }
      setAuthChecking(false);
    });
    return () => unsub();
  }, []);

  // -- Show login if not authenticated ----------------------------------------
  if (authChecking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
      <div style={{ color: T.muted, fontSize: 13 }}>Memuat...</div>
    </div>
  );
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
        isProPlus={isProPlus}
        sideOpen={sideOpen}
        setSideOpen={setSideOpen}
        modules={settings.modules}
        setShowUpgrade={setShowUpgrade}
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
                {proExpiry && proExpiry.daysLeft <= 7 && proExpiry.daysLeft > 0 && (
                  <span style={{ fontSize: 9, color: proExpiry.daysLeft <= 3 ? T.red : T.orange }}>
                    {"⚠"} Berakhir{" "}
                    {proExpiry.daysLeft === 1 ? "besok" : proExpiry.daysLeft + " hari lagi"}
                  </span>
                )}
                {proExpiry && proExpiry.daysLeft === 0 && (
                  <span style={{ fontSize: 9, color: T.red }}>
                    {"⚠"} Berakhir hari ini
                  </span>
                )}
                {proExpiry && proExpiry.daysLeft > 7 && (
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
                debts={debts || []}
                goals={goals || []}
                insurances={insurances}
                isPro={isPro}
                isProPlus={isProPlus}
                monthlyExpense={monthlyExpense}
                monthlyFixedIncome={monthlyFixedIncome}
                activeIncomes={activeIncomes}
                userEmail={user?.email || ""}
                userPhoto={user?.photo || ""}
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
                  activeIncomes={activeIncomes}
                />
                <ActiveIncomeSummary
                  activeIncomes={activeIncomes}
                  monthlyFixedIncome={monthlyFixedIncome}
                  dispCur={dispCur}
                  T={T}
                  hideValues={hideValues}
                  setTab={handleSetTab}
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
                  activeIncomes={activeIncomes}
                  monthlyFixedIncome={monthlyFixedIncome}
                />
                <PortfolioScene
                  {...tabProps}
                  setAssets={setAssets}
                  priceLoading={priceLoading}
                  isPro={isPro}
                  tier={tier}
                  uploadCount={uploadCount}
                  setUploadCount={setUploadCount}
                  monthlyUploadCount={monthlyUploadCount}
                  setMonthlyUploadCount={setMonthlyUploadCount}
                  monthlyUploadMonth={monthlyUploadMonth}
                  setMonthlyUploadMonth={setMonthlyUploadMonth}
                  pulseCredits={pulseCredits}
                  setPulseCredits={setPulseCredits}
                  onBuyPulse={() => setShowBuyPulse(true)}
                />
              </>
            )}
            {tab === "rebalance" && (
              <RebalanceScene
                {...tabProps}
                setTab={handleSetTab}
                hideValues={hideValues}
                isPro={isPro}
                setShowUpgrade={setShowUpgrade}
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
                userEmail={user?.email || ""}
              />
            )}
            {tab === "finance-tools" && (
              <FinanceToolsScene
                assets={assets}
                setAssets={setAssets}
                debts={debts || []}
                dispCur={dispCur}
                T={T}
                hideValues={hideValues}
                activeIncomes={activeIncomes}
                setActiveIncomes={setActiveIncomes}
                isPro={isPro}
                isProPlus={isProPlus}
                monthlyExpense={monthlyExpense}
                setMonthlyExpense={setMonthlyExpense}
                monthlyFixedIncome={monthlyFixedIncome}
                setMonthlyFixedIncome={setMonthlyFixedIncome}
                setTab={handleSetTab}
              />
            )}
            {tab === "calc" && (
              <FinanceToolsScene
                assets={assets}
                setAssets={setAssets}
                debts={debts || []}
                dispCur={dispCur}
                T={T}
                hideValues={hideValues}
                activeIncomes={activeIncomes}
                setActiveIncomes={setActiveIncomes}
                isPro={isPro}
                isProPlus={isProPlus}
                monthlyExpense={monthlyExpense}
                setMonthlyExpense={setMonthlyExpense}
                monthlyFixedIncome={monthlyFixedIncome}
                setMonthlyFixedIncome={setMonthlyFixedIncome}
                setTab={handleSetTab}
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
                  activeIncomes={activeIncomes}
                  setActiveIncomes={setActiveIncomes}
                  setTab={handleSetTab}
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
                assets={assets}
                dispCur={dispCur}
                tier={tier}
                T={T}
                isPro={isPro}
                isProPlus={isProPlus}
              />
            )}
            {tab === "ai" && (
              <AIScene
                {...tabProps}
                debts={debts}
                tier={tier}
                pulseCredits={pulseCredits}
                setPulseCredits={setPulseCredits}
                onBuyPulse={() => setShowBuyPulse(true)}
              />
            )}
            {tab === "insurance" && (
              <InsuranceScene
                assets={assets}
                debts={debts || []}
                goals={goals || []}
                dispCur={dispCur}
                T={T}
                hideValues={hideValues}
                isPro={isPro}
                isProPlus={isProPlus}
                setShowUpgrade={setShowUpgrade}
                insurances={insurances}
                setInsurances={setInsurances}
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
                    desc: "Tidak ada data personal yang dibagikan - hanya persentase alokasi",
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
        logoutSaving={logoutSaving}
        fontScale={fontScale}
        setFontScale={setFontScale}
        customPresetId={customPresetId}
        setCustomPresetId={setCustomPresetId}
      />

      {/* Buy Pulse Modal */}
      {showBuyPulse && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setShowBuyPulse(false)}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, maxWidth: 380, width: "100%", position: "relative" }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowBuyPulse(false)} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer" }}>✕</button>
            <div style={{ fontSize: 14, fontWeight: "bold", color: T.text, marginBottom: 4 }}>⚡ Beli PULSE Credit</div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 18 }}>
              Saldo saat ini: <span style={{ color: T.accent, fontWeight: "bold" }}>{pulseCredits} Pulse</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
              {PULSE_PACKAGES.map(pkg => (
                <div key={pkg.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>⚡ {pkg.label}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>${(pkg.price / pkg.pulse).toFixed(3)} / Pulse</div>
                  </div>
                  <button style={{ padding: "6px 14px", background: T.accentDim, border: `1px solid ${T.accentSoft}`, borderRadius: 8, color: T.accent, fontSize: 12, fontWeight: "bold", cursor: "pointer" }}>
                    ${pkg.price}
                  </button>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: T.muted, textAlign: "center" }}>Pembayaran via Stripe · Segera hadir</div>
          </div>
        </div>
      )}

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

export default WealthCompassV7;
