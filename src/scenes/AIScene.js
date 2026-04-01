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
import { TIERS } from "../constants/tiers";
import { ASSET_CLASSES, RISK_PROFILES } from "../constants/data";

function AIScene({
  assets,
  debts = [],
  riskProfile,
  livePrices,
  dispCur,
  T,
  tier,
  pulseCredits,
  setPulseCredits,
  onBuyPulse,
}) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Halo! Saya AI Wealth Advisor kamu. Data portofolio & harga live sudah terhubung. Tanya apa saja!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const total = assets.reduce((s, a) => s + getIDR(a), 0);
  const profile = riskProfile ? RISK_PROFILES[riskProfile] : null;
  const byClass = ASSET_CLASSES.map((ac) => {
    const v = assets
      .filter((a) => a.classKey === ac.key)
      .reduce((s, a) => s + getIDR(a), 0);
    return {
      label: ac.label,
      v,
      pct: total > 0 ? ((v / total) * 100).toFixed(1) : 0,
    };
  }).filter((c) => c.v > 0);

  // Pulse Credit system — 1 Pulse per chat message
  const blocked = pulseCredits <= 0;

  // Model selection per tier
  const model =
    tier.id === "free"
      ? "claude-haiku-4-5-20251001"
      : "claude-sonnet-4-6";

  const totalDebts = debts.reduce((s, d) => s + parseVal(d.outstanding), 0);
  const totalMonthlyDebt = debts.reduce(
    (s, d) => s + parseVal(d.monthlyPayment),
    0
  );
  const trueNetWorth = total - totalDebts;
  const debtLines =
    debts.length > 0
      ? "HUTANG (" +
        debts.length +
        " item): Total " +
        fMoney(totalDebts) +
        ", cicilan " +
        fMoney(totalMonthlyDebt) +
        "/bln\n" +
        debts
          .map(
            (d) =>
              " · " +
              d.name +
              ": " +
              fMoney(parseVal(d.outstanding)) +
              " @ " +
              (d.interestRate || "?") +
              "%/thn"
          )
          .join("\n")
      : "Hutang: tidak ada";
  const sys = `Kamu adalah AI Wealth Advisor profesional Indonesia. Bahasa Indonesia, hangat dan konkret.
ASET: ${fMoney(total)} | NET WORTH BERSIH: ${fMoney(trueNetWorth)} | Profil: ${
    profile ? profile.label : "Belum diisi"
  }
Alokasi Aset: ${
    byClass.map((c) => `${c.label} ${fMoney(c.v)} (${c.pct}%)`).join(", ") ||
    "kosong"
  }
${debtLines}
${livePrices.gold ? `Emas: ${fMoney(livePrices.gold)}/gram` : ""}${
    livePrices.crypto?.bitcoin
      ? ` · BTC: ${fMoney(livePrices.crypto.bitcoin.idr)}`
      : ""
  }
Jawab max 3 paragraf. Sertakan disclaimer singkat.`;

  const send = async () => {
    if (!input.trim() || loading || blocked) return;
    const um = { role: "user", content: input };
    setMessages((p) => [...p, um]);
    setInput("");
    setLoading(true);
    // Deduct 1 Pulse Credit immediately on send
    setPulseCredits(prev => Math.max(0, prev - 1));
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          max_tokens: tier.id === "free" ? 400 : 1000,
          system: sys,
          messages: [...messages, um].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data?.error?.message || data?.error || `HTTP ${res.status}`;
        setMessages((p) => [...p, { role: "assistant", content: `⚠️ Error: ${errMsg}` }]);
      } else {
        const reply = data.content?.[0]?.text || "Maaf, terjadi kesalahan.";
        setMessages((p) => [...p, { role: "assistant", content: reply }]);
      }
    } catch (e) {
      setMessages((p) => [
        ...p,
        {
          role: "assistant",
          content: `⚠️ Gagal terhubung ke server: ${e.message}`,
        },
      ]);
    }
    setLoading(false);
  };

  const QUICK = [
    "Analisa portofolio saya",
    "Kapan perlu rebalancing?",
    "Strategi untuk profil saya",
    "Rekomendasi untuk pemula",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 560 }}>
      {/* Pulse Credit bar */}
      <div
        style={{
          padding: "8px 12px",
          background: T.surface,
          borderRadius: 10,
          border: `1px solid ${T.border}`,
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: tier.color, fontWeight: "bold" }}>{tier.badge || tier.label}</span>
          <span style={{ fontSize: 10, color: T.muted }}>· {model.includes("haiku") ? "Claude Haiku" : "Claude Sonnet"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: pulseCredits <= 2 ? T.red : T.muted }}>
            ⚡ <strong style={{ color: pulseCredits <= 2 ? T.red : T.accent }}>{pulseCredits}</strong> Pulse
          </span>
          {onBuyPulse && (
            <button onClick={onBuyPulse} style={{ fontSize: 9, padding: "2px 8px", background: T.accentDim, border: `1px solid ${T.accentSoft}`, borderRadius: 6, color: T.accent, cursor: "pointer", fontWeight: "bold" }}>
              + Beli
            </button>
          )}
        </div>
      </div>

      {/* Blocked state — no Pulse */}
      {blocked && (
        <div
          style={{
            padding: "12px 14px",
            background: T.redDim,
            border: `1px solid ${T.red}33`,
            borderRadius: 10,
            marginBottom: 12,
            fontSize: 12,
            color: T.red,
            textAlign: "center",
          }}
        >
          PULSE Credit habis. Beli Pulse untuk melanjutkan obrolan.
          <br />
          {onBuyPulse && (
            <button onClick={onBuyPulse} style={{ marginTop: 8, padding: "5px 16px", background: T.accentDim, border: `1px solid ${T.accentSoft}`, borderRadius: 8, color: T.accent, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>
              ⚡ Beli Pulse
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          paddingBottom: 8,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              gap: 8,
            }}
          >
            {m.role === "assistant" && (
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: T.accentSoft,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: T.accent,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                ✦
              </div>
            )}
            <div
              style={{
                maxWidth: "80%",
                background: m.role === "user" ? T.accentDim : T.card,
                border: `1px solid ${
                  m.role === "user" ? T.accentSoft : T.border
                }`,
                borderRadius:
                  m.role === "user"
                    ? "14px 3px 14px 14px"
                    : "3px 14px 14px 14px",
                padding: "11px 15px",
                color: T.text,
                fontSize: 12,
                lineHeight: 1.75,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: T.accentSoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                color: T.accent,
              }}
            >
              ✦
            </div>
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: "3px 14px 14px 14px",
                padding: "11px 15px",
                display: "flex",
                gap: 5,
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: T.accent,
                    animation: `pulse 1s ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ marginTop: 10 }}>
        <div
          style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 9 }}
        >
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                color: T.muted,
                borderRadius: 20,
                padding: "4px 11px",
                fontSize: 10,
                cursor: "pointer",
              }}
            >
              {q}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <TInput
            T={T}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={
              blocked
                ? "Pulse Kredit ands habis silahkan upgrade subcription atau beli extra Pulse"
                : "Tanya tentang investasi kamu..."
            }
            style={{ flex: 1, padding: "11px 15px" }}
          />
          <TBtn
            T={T}
            variant="primary"
            onClick={send}
            disabled={loading || !input.trim() || blocked}
            style={{ padding: "11px 18px", fontSize: 14 }}
          >
            ↑
          </TBtn>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,80%,100%{opacity:.3}40%{opacity:1}}`}</style>
    </div>
  );
}

export default AIScene;
