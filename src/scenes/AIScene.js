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
import {
  TIERS,
  getAIUsage,
  addAIUsage,
  canUploadPDF,
  pdfUploadsRemaining,
  addPDFUsage,
  estimateTokens,
} from "../constants/tiers";
import { ASSET_CLASSES, RISK_PROFILES } from "../constants/data";

function AIScene({
  assets,
  debts = [],
  riskProfile,
  livePrices,
  dispCur,
  T,
  tier,
  aiTokensUsed,
  setAiTokensUsed,
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

  // Token system
  const dailyLimit = tier.aiTokensPerDay;
  const isUnlimited = dailyLimit === Infinity;
  const tokensLeft = isUnlimited
    ? Infinity
    : Math.max(0, dailyLimit - aiTokensUsed);
  const pctUsed = isUnlimited
    ? 0
    : Math.min(100, (aiTokensUsed / dailyLimit) * 100);
  const blocked = !isUnlimited && tokensLeft < 50; // need at least ~50 tokens to send

  // Model selection per tier
  const model =
    tier.id === "free"
      ? "claude-haiku-4-5-20251001"
      : "claude-sonnet-4-20250514";

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
    const estimatedCost = estimateTokens(sys) + estimateTokens(input) + 500;
    if (!isUnlimited && estimatedCost > tokensLeft) {
      setMessages((p) => [
        ...p,
        {
          role: "assistant",
          content: `⚠️ Token harian tidak cukup (sisa ~${tokensLeft} token). Reset besok atau upgrade ke tier lebih tinggi.`,
        },
      ]);
      return;
    }
    setMessages((p) => [...p, um]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
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
      const reply = data.content?.[0]?.text || "Maaf, terjadi kesalahan.";
      const tokensUsed =
        (data.usage?.input_tokens || estimatedCost) +
        (data.usage?.output_tokens || estimateTokens(reply));
      addAIUsage(tokensUsed);
      setAiTokensUsed(getAIUsage());
      setMessages((p) => [...p, { role: "assistant", content: reply }]);
    } catch {
      setMessages((p) => [
        ...p,
        {
          role: "assistant",
          content:
            "⚠️ AI Advisor memerlukan koneksi backend. Fitur ini aktif setelah deploy production.",
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
      {/* Token usage bar */}
      <div
        style={{
          padding: "8px 12px",
          background: T.surface,
          borderRadius: 10,
          border: `1px solid ${T.border}`,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: isUnlimited ? 0 : 5,
          }}
        >
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span
              style={{ fontSize: 10, color: tier.color, fontWeight: "bold" }}
            >
              {tier.badge || tier.label}
            </span>
            <span style={{ fontSize: 10, color: T.muted }}>
              · {model.includes("haiku") ? "Claude Haiku" : "Claude Sonnet"}
            </span>
          </div>
          {isUnlimited ? (
            <span style={{ fontSize: 10, color: T.green }}>✓ Unlimited</span>
          ) : (
            <span
              style={{
                fontSize: 10,
                color: tokensLeft < dailyLimit * 0.2 ? T.orange : T.muted,
              }}
            >
              ~
              {tokensLeft < 1000
                ? tokensLeft
                : Math.round(tokensLeft / 100) * 100}{" "}
              token tersisa hari ini
            </span>
          )}
        </div>
        {!isUnlimited && (
          <div style={{ height: 4, background: T.border, borderRadius: 2 }}>
            <div
              style={{
                width: `${pctUsed}%`,
                height: "100%",
                background:
                  pctUsed > 80 ? T.red : pctUsed > 50 ? T.orange : T.green,
                borderRadius: 2,
                transition: "width 0.4s",
              }}
            />
          </div>
        )}
      </div>

      {/* Blocked state */}
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
          Token harian habis. Reset otomatis besok pagi.
          <br />
          <span style={{ fontSize: 11, color: T.textSoft }}>
            Upgrade Pro untuk 15.000 token/hari, Pro+ untuk unlimited.
          </span>
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
                ? "Token habis — reset besok"
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
