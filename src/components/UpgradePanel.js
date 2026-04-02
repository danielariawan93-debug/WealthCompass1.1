import React, { useState, useEffect, useRef } from "react";
import { Card, TBtn } from "./ui";
import { PULSE_PACKAGES } from "../constants/tiers";

const PLANS = {
  pro: [
    { id: "monthly",  label: "Bulanan",  price: "$1.99",  idrPrice: 34000,  sub: "/bulan",  saving: "",          pulse: 20,  days: 30  },
    { id: "biannual", label: "6 Bulan",  price: "$10.99", idrPrice: 187000, sub: "/6 bln",  saving: "Hemat 8%",  pulse: 120, days: 180 },
    { id: "annual",   label: "Tahunan",  price: "$19.99", idrPrice: 340000, sub: "/tahun",  saving: "Hemat 16%", pulse: 250, days: 365, popular: true },
  ],
  proplus: [
    { id: "monthly",  label: "Bulanan",  price: "$4.99",  idrPrice: 85000,  sub: "/bulan",  saving: "",           pulse: 80,   days: 30  },
    { id: "biannual", label: "6 Bulan",  price: "$26.99", idrPrice: 459000, sub: "/6 bln",  saving: "Hemat 10%",  pulse: 480,  days: 180 },
    { id: "annual",   label: "Tahunan",  price: "$47.99", idrPrice: 816000, sub: "/tahun",  saving: "Hemat 20%",  pulse: 1000, days: 365, popular: true },
  ],
};

const TIER_META = {
  pro: {
    color: "#d4a843",
    badge: "⭐ PRO",
    features: [
      "50 aset · 15 utang · 10 tujuan",
      "Upload PDF 7x/bulan + Pulse",
      "Net Worth 1 tahun",
      "AI Advisor (1 Pulse/chat)",
      "Tema Custom",
      "Modul Properti & Bisnis",
    ],
  },
  proplus: {
    color: "#9b7ef8",
    badge: "💎 PRO+",
    features: [
      "Semua Fitur Pro",
      "Aset, utang & tujuan tak terbatas",
      "Upload PDF 20x/bulan + Pulse",
      "Net Worth 5 tahun / MAX",
      "AI Advisor Claude Sonnet (1 Pulse/chat)",
      "Peer Benchmarking",
      "Export PDF Laporan Portofolio (3 Pulse)",
    ],
  },
};

// Load Midtrans Snap.js dynamically
function useSnapScript() {
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current || document.getElementById("midtrans-snap")) return;
    const isProduction = process.env.REACT_APP_MIDTRANS_ENV === "production";
    const clientKey = process.env.REACT_APP_MIDTRANS_CLIENT_KEY || "";
    const script = document.createElement("script");
    script.id = "midtrans-snap";
    script.src = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    document.head.appendChild(script);
    loaded.current = true;
  }, []);
}

function PulseTab({ pulseCredits, setPulseCredits, user, T }) {
  useSnapScript();
  const [loading, setLoading] = useState(null); // packageId being purchased
  const [statusMsg, setStatusMsg] = useState(null);

  const handleBuy = async (pkg) => {
    if (!user?.uid) {
      setStatusMsg({ type: "error", text: "Silakan login terlebih dahulu." });
      return;
    }
    setLoading(pkg.id);
    setStatusMsg(null);
    try {
      // 1. Get Midtrans snap token from our backend
      const res = await fetch("/api/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          pulse: pkg.pulse,
          priceIDR: pkg.idrPrice,
          userEmail: user.email || "",
          uid: user.uid,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setStatusMsg({ type: "error", text: data.error || "Gagal membuat transaksi." });
        setLoading(null);
        return;
      }

      const { token, orderId } = data;

      // 2. Open Midtrans Snap popup
      if (!window.snap) {
        setStatusMsg({ type: "error", text: "Midtrans Snap belum siap. Coba lagi." });
        setLoading(null);
        return;
      }

      window.snap.pay(token, {
        onSuccess: async (result) => {
          setLoading(null);
          // 3. Verify payment on backend before adding Pulse
          try {
            const vRes = await fetch(`/api/verify-payment?order_id=${encodeURIComponent(orderId)}`);
            const vData = await vRes.json();
            if (vData.success && vData.pulse > 0) {
              setPulseCredits((p) => p + vData.pulse);
              setStatusMsg({ type: "success", text: `+${vData.pulse} Pulse berhasil ditambahkan!` });
            } else {
              setStatusMsg({ type: "error", text: "Pembayaran terverifikasi tapi Pulse belum bisa ditambahkan. Hubungi support." });
            }
          } catch {
            // Fallback: trust Snap onSuccess and add locally
            setPulseCredits((p) => p + pkg.pulse);
            setStatusMsg({ type: "success", text: `+${pkg.pulse} Pulse berhasil ditambahkan!` });
          }
        },
        onPending: () => {
          setLoading(null);
          setStatusMsg({ type: "info", text: "Pembayaran pending. Pulse akan ditambahkan otomatis setelah terkonfirmasi." });
        },
        onError: (result) => {
          setLoading(null);
          setStatusMsg({ type: "error", text: "Pembayaran gagal. Silakan coba lagi." });
        },
        onClose: () => {
          setLoading(null);
        },
      });
    } catch (err) {
      setLoading(null);
      setStatusMsg({ type: "error", text: "Koneksi error: " + err.message });
    }
  };

  const msgColors = { success: T.green, error: "#f26b6b", info: T.accent };

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: "bold", color: T.text, marginBottom: 4 }}>⚡ Beli Pulse Credit</div>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 16 }}>
        Saldo saat ini: <span style={{ color: T.accent, fontWeight: "bold" }}>{pulseCredits} Pulse</span>
      </div>

      {statusMsg && (
        <div style={{
          background: msgColors[statusMsg.type] + "22",
          border: `1px solid ${msgColors[statusMsg.type]}44`,
          borderRadius: 8, padding: "8px 12px", marginBottom: 14,
          fontSize: 11, color: msgColors[statusMsg.type], lineHeight: 1.5,
        }}>
          {statusMsg.text}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {PULSE_PACKAGES.map((pkg) => {
          const isLoading = loading === pkg.id;
          return (
            <div key={pkg.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 14px", background: T.card, borderRadius: 12,
              border: `1px solid ${T.border}`,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>⚡ {pkg.label}</div>
                <div style={{ fontSize: 10, color: T.muted }}>
                  Rp {pkg.idrPrice.toLocaleString("id-ID")} · ${(pkg.price / pkg.pulse).toFixed(3)}/Pulse
                </div>
              </div>
              <button
                disabled={!!loading}
                onClick={() => handleBuy(pkg)}
                style={{
                  padding: "7px 14px", borderRadius: 9,
                  background: isLoading ? T.surface : T.accentDim,
                  border: `1px solid ${T.accentSoft}`,
                  color: isLoading ? T.muted : T.accent,
                  fontSize: 12, fontWeight: "bold",
                  cursor: loading ? "not-allowed" : "pointer",
                  minWidth: 80, textAlign: "center",
                }}
              >
                {isLoading ? "..." : `$${pkg.price.toFixed(2)}`}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 10, color: T.muted, textAlign: "center", lineHeight: 1.7 }}>
        Pembayaran aman via <b>Midtrans</b><br />
        Pulse tidak hangus · Bisa dipakai kapan saja
      </div>
    </div>
  );
}

function SubscriptionTab({ isPro, isProPlus, proExpiry, onUpgrade, onClose, user, T }) {
  useSnapScript();
  const [tierChoice, setTierChoice] = useState("pro");
  const [selected, setSelected] = useState("annual");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const activePlans = PLANS[tierChoice];
  const meta = TIER_META[tierChoice];

  const isUpgradeFromPro = tierChoice === "proplus" && isPro && !isProPlus && proExpiry?.expiryDate;
  const remainingMonths = isUpgradeFromPro
    ? Math.max(1, Math.ceil((new Date(proExpiry.expiryDate) - Date.now()) / (30 * 24 * 60 * 60 * 1000)))
    : 0;
  const upgradeDiffPrice = isUpgradeFromPro ? (3.0 * remainingMonths).toFixed(2) : null;
  const upgradeExtraPulse = isUpgradeFromPro ? 60 * remainingMonths : 0;

  const selectedPlan = activePlans.find(p => p.id === selected) || activePlans[activePlans.length - 1];
  const upgradePlan = PLANS.proplus.find(p => p.id === "monthly");

  const handleBuySubscription = async () => {
    if (!user?.uid) {
      setStatusMsg({ type: "error", text: "Silakan login terlebih dahulu." });
      return;
    }
    const plan = isUpgradeFromPro ? upgradePlan : selectedPlan;
    const tier = isUpgradeFromPro ? "proplus" : tierChoice;
    const idrAmount = isUpgradeFromPro
      ? Math.round(3.0 * remainingMonths * 17000)
      : plan.idrPrice;

    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierChoice: tier,
          planId: plan.id,
          priceIDR: idrAmount,
          pulse: isUpgradeFromPro ? upgradeExtraPulse : plan.pulse,
          days: plan.days,
          userEmail: user.email || "",
          uid: user.uid,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setStatusMsg({ type: "error", text: data.error || "Gagal membuat transaksi." });
        setLoading(false);
        return;
      }

      if (!window.snap) {
        setStatusMsg({ type: "error", text: "Midtrans Snap belum siap. Coba lagi." });
        setLoading(false);
        return;
      }

      window.snap.pay(data.token, {
        onSuccess: () => {
          setLoading(false);
          onUpgrade(tier, plan.id);
          setStatusMsg({ type: "success", text: `Selamat! ${meta.badge} aktif.` });
          setTimeout(onClose, 1200);
        },
        onPending: () => {
          setLoading(false);
          setStatusMsg({ type: "info", text: "Pembayaran pending. Subscription akan aktif otomatis setelah terkonfirmasi." });
        },
        onError: () => {
          setLoading(false);
          setStatusMsg({ type: "error", text: "Pembayaran gagal. Silakan coba lagi." });
        },
        onClose: () => { setLoading(false); },
      });
    } catch (err) {
      setLoading(false);
      setStatusMsg({ type: "error", text: "Koneksi error: " + err.message });
    }
  };

  const msgColors = { success: "#3ecf8e", error: "#f26b6b", info: T.accent };

  return (
    <div>
      {/* Tier toggle */}
      <div style={{ display: "flex", background: T.surface, borderRadius: 10, padding: 4, marginBottom: 18 }}>
        {[["pro", "⭐ Pro", "#d4a843"], ["proplus", "💎 Pro+", "#9b7ef8"]].map(([id, label, color]) => (
          <button key={id} onClick={() => { setTierChoice(id); setSelected("annual"); setStatusMsg(null); }}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
              background: tierChoice === id ? color + "22" : "none",
              color: tierChoice === id ? color : T.muted,
              cursor: "pointer", fontWeight: tierChoice === id ? "bold" : "normal", fontSize: 13,
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Status message */}
      {statusMsg && (
        <div style={{
          background: msgColors[statusMsg.type] + "22",
          border: `1px solid ${msgColors[statusMsg.type]}44`,
          borderRadius: 8, padding: "8px 12px", marginBottom: 14,
          fontSize: 11, color: msgColors[statusMsg.type], lineHeight: 1.5,
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* Pro→Pro+ upgrade banner */}
      {isUpgradeFromPro && (
        <div style={{ background: "#9b7ef822", border: "1px solid #9b7ef833", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 11 }}>
          <div style={{ color: "#9b7ef8", fontWeight: "bold", marginBottom: 4 }}>💎 Upgrade dari Pro → Pro+</div>
          <div style={{ color: T.textSoft }}>
            Sisa {remainingMonths} bulan aktif. Bayar selisih <b style={{ color: "#9b7ef8" }}>${upgradeDiffPrice}</b>, dapat tambahan <b style={{ color: T.accent }}>+{upgradeExtraPulse} Pulse</b>.
          </div>
        </div>
      )}

      {/* Features */}
      <div style={{ background: meta.color + "18", border: `1px solid ${meta.color}33`, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ color: meta.color, fontSize: 12, fontWeight: "bold", marginBottom: 8 }}>{meta.badge} Features:</div>
        {meta.features.map(f => (
          <div key={f} style={{ color: T.text, fontSize: 12, marginBottom: 4 }}>✓ {f}</div>
        ))}
      </div>

      {/* Plans */}
      {!isUpgradeFromPro && activePlans.map(p => (
        <div key={p.id} onClick={() => setSelected(p.id)}
          style={{
            padding: "14px 16px", borderRadius: 12, cursor: "pointer", marginBottom: 10,
            border: `2px solid ${selected === p.id ? meta.color : T.border}`,
            background: selected === p.id ? meta.color + "18" : T.card,
            position: "relative", transition: "all 0.15s",
          }}>
          {p.popular && (
            <div style={{ position: "absolute", top: -8, right: 12, background: meta.color, color: "#000", fontSize: 9, fontWeight: "bold", padding: "2px 8px", borderRadius: 10 }}>
              TERPOPULER
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: T.text, fontSize: 13, fontWeight: "bold" }}>{p.label}</div>
              {p.saving && <div style={{ color: T.green, fontSize: 10 }}>{p.saving}</div>}
              <div style={{ color: T.accent, fontSize: 10, marginTop: 3 }}>⚡ +{p.pulse} Pulse Credit</div>
              <div style={{ color: T.muted, fontSize: 10 }}>≈ Rp {p.idrPrice.toLocaleString("id-ID")}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: meta.color, fontSize: 18, fontWeight: "bold" }}>{p.price}</div>
              <div style={{ color: T.muted, fontSize: 10 }}>{p.sub}</div>
            </div>
          </div>
        </div>
      ))}

      {/* CTA */}
      <button
        disabled={loading}
        onClick={handleBuySubscription}
        style={{
          width: "100%", padding: 14, borderRadius: 9, border: "none",
          background: loading ? T.surface : meta.color,
          color: loading ? T.muted : "#000",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "bold", fontSize: 13, marginTop: 8,
        }}>
        {loading
          ? "Memproses..."
          : isUpgradeFromPro
            ? `Upgrade ke Pro+ — $${upgradeDiffPrice}`
            : `Mulai ${meta.badge} — ${selectedPlan?.price}`}
      </button>

      {/* Referral */}
      <div style={{ marginTop: 16, padding: "12px 14px", background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
        <div style={{ color: T.accent, fontSize: 11, fontWeight: "bold", marginBottom: 6 }}>🤝 Program Referral</div>
        <div style={{ color: T.textSoft, fontSize: 11, lineHeight: 1.7, marginBottom: 8 }}>
          Dapatkan <b style={{ color: T.green }}>$0.99</b> untuk setiap user yang subscribe via link kamu.
        </div>
        <div style={{ background: T.accentDim, border: `1px solid ${T.accentSoft}`, borderRadius: 8, padding: "8px 12px", fontSize: 10, color: T.muted }}>
          📊 Referral kamu: <b style={{ color: T.accent }}>0 user</b> · Kredit: <b style={{ color: T.green }}>$0.00</b>
          <br /><span style={{ color: T.blue, cursor: "pointer", marginTop: 4, display: "block" }}>Salin link referral kamu →</span>
        </div>
      </div>
      <div style={{ textAlign: "center", color: T.muted, fontSize: 10, marginTop: 10, lineHeight: 1.6 }}>
        Pembayaran aman via Midtrans · Batalkan kapan saja
      </div>
    </div>
  );
}

function UpgradePanel({ show, onClose, onUpgrade, isPro, isProPlus, proExpiry, pulseCredits, setPulseCredits, user, T, initialTab }) {
  const [panelTab, setPanelTab] = useState(initialTab || "subscription");

  // Sync initialTab when panel opens
  useEffect(() => {
    if (show) setPanelTab(initialTab || "subscription");
  }, [show, initialTab]);

  const headerTitle = panelTab === "pulse" ? "⚡ Pulse Credit" : "🚀 Upgrade";

  return (
    <>
      {show && (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000 }} />
      )}
      <div style={{
        position: "fixed", top: 0, right: 0, height: "100vh", width: 320,
        background: T.surface, borderLeft: `1px solid ${T.border}`, zIndex: 1001,
        transform: show ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s ease",
        padding: 24, overflowY: "auto", boxShadow: `-8px 0 32px ${T.shadow}`,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ color: T.accent, fontSize: 16, fontWeight: "bold", fontFamily: "'Playfair Display', Georgia, serif" }}>
            {headerTitle}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 20 }}>×</button>
        </div>

        {/* Main tab: Subscription / Pulse Credit */}
        <div style={{ display: "flex", background: T.card, borderRadius: 10, padding: 4, marginBottom: 20, border: `1px solid ${T.border}` }}>
          {[["subscription", "🚀 Subscription"], ["pulse", "⚡ Pulse Credit"]].map(([id, label]) => (
            <button key={id} onClick={() => setPanelTab(id)}
              style={{
                flex: 1, padding: "9px 4px", borderRadius: 8, border: "none",
                background: panelTab === id ? T.accent + "22" : "none",
                color: panelTab === id ? T.accent : T.muted,
                cursor: "pointer", fontWeight: panelTab === id ? "bold" : "normal", fontSize: 12,
              }}>
              {label}
            </button>
          ))}
        </div>

        {panelTab === "subscription" ? (
          <SubscriptionTab
            isPro={isPro}
            isProPlus={isProPlus}
            proExpiry={proExpiry}
            onUpgrade={onUpgrade}
            onClose={onClose}
            user={user}
            T={T}
          />
        ) : (
          <PulseTab
            pulseCredits={pulseCredits}
            setPulseCredits={setPulseCredits}
            user={user}
            T={T}
          />
        )}
      </div>
    </>
  );
}

export default UpgradePanel;
