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

function UpgradePanel({ show, onClose, onUpgrade, T }) {
  const [tierChoice, setTierChoice] = useState("pro"); // pro | proplus
  const plans = {
    pro: [
      {
        id: "monthly",
        label: "Bulanan",
        price: "$1.99",
        sub: "/bulan",
        saving: "",
      },
      {
        id: "biannual",
        label: "6 Bulan",
        price: "$10.99",
        sub: "/6 bln",
        saving: "Hemat 8%",
      },
      {
        id: "annual",
        label: "Tahunan",
        price: "$19.99",
        sub: "/tahun",
        saving: "Hemat 16%",
        popular: true,
      },
    ],
    proplus: [
      {
        id: "monthly",
        label: "Bulanan",
        price: "$4.99",
        sub: "/bulan",
        saving: "",
      },
      {
        id: "biannual",
        label: "6 Bulan",
        price: "$26.99",
        sub: "/6 bln",
        saving: "Hemat 10%",
      },
      {
        id: "annual",
        label: "Tahunan",
        price: "$47.99",
        sub: "/tahun",
        saving: "Hemat 20%",
        popular: true,
      },
    ],
  };
  const [selected, setSelected] = useState("annual");
  const activePlans = plans[tierChoice];
  const tierMeta = {
    pro: {
      color: "#d4a843",
      badge: "⭐ PRO",
      features: [
        "Upload PDF 7x/bulan (reset bulanan)",
        "Net Worth 1 tahun",
        "AI Advisor 50K token/hari",
        "Tema Custom",
        "Modul Properti & Bisnis",
        "Berbagai Fitur Lainya",
      ],
    },
    proplus: {
      color: "#9b7ef8",
      badge: "💎 PRO+",
      features: [
        "Semua Fitur Pro",
        "Upload PDF 20x/bulan (reset bulanan)",
        "AI Advisor 200K token/hari",
        "Net Worth 5 tahun / MAX",
        "Peer Benchmarking",
        "Komunitas Pro+",
        "Export laporan PDF",
      ],
    },
  };
  const meta = tierMeta[tierChoice];
  return (
    <>
      {show && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
          }}
        />
      )}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: 320,
          background: T.surface,
          borderLeft: `1px solid ${T.border}`,
          zIndex: 1001,
          transform: show ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
          padding: 24,
          overflowY: "auto",
          boxShadow: `-8px 0 32px ${T.shadow}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              color: meta.color,
              fontSize: 16,
              fontWeight: "bold",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            {meta.badge} Upgrade
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: T.muted,
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            ×
          </button>
        </div>

        {/* Tier toggle */}
        <div
          style={{
            display: "flex",
            background: T.surface,
            borderRadius: 10,
            padding: 4,
            marginBottom: 18,
          }}
        >
          {[
            ["pro", "⭐ Pro", "#d4a843"],
            ["proplus", "💎 Pro+", "#9b7ef8"],
          ].map(([id, label, color]) => (
            <button
              key={id}
              onClick={() => {
                setTierChoice(id);
                setSelected("annual");
              }}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 8,
                border: "none",
                background: tierChoice === id ? color + "22" : "none",
                color: tierChoice === id ? color : T.muted,
                cursor: "pointer",
                fontWeight: tierChoice === id ? "bold" : "normal",
                fontSize: 13,
                transition: "all 0.2s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Features */}
        <div
          style={{
            background: meta.color + "18",
            border: `1px solid ${meta.color}33`,
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              color: meta.color,
              fontSize: 12,
              fontWeight: "bold",
              marginBottom: 8,
            }}
          >
            {meta.badge} Features:
          </div>
          {meta.features.map((f) => (
            <div
              key={f}
              style={{ color: T.text, fontSize: 12, marginBottom: 4 }}
            >
              ✓ {f}
            </div>
          ))}
        </div>

        {/* Plans */}
        {activePlans.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelected(p.id)}
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              border: `2px solid ${selected === p.id ? meta.color : T.border}`,
              background: selected === p.id ? meta.color + "18" : T.card,
              cursor: "pointer",
              marginBottom: 10,
              position: "relative",
              transition: "all 0.15s",
            }}
          >
            {p.popular && (
              <div
                style={{
                  position: "absolute",
                  top: -8,
                  right: 12,
                  background: meta.color,
                  color: "#000",
                  fontSize: 9,
                  fontWeight: "bold",
                  padding: "2px 8px",
                  borderRadius: 10,
                }}
              >
                TERPOPULER
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{ color: T.text, fontSize: 13, fontWeight: "bold" }}
                >
                  {p.label}
                </div>
                {p.saving && (
                  <div style={{ color: T.green, fontSize: 10 }}>{p.saving}</div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    color: meta.color,
                    fontSize: 18,
                    fontWeight: "bold",
                  }}
                >
                  {p.price}
                </div>
                <div style={{ color: T.muted, fontSize: 10 }}>{p.sub}</div>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            onUpgrade(tierChoice);
            onClose();
          }}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 9,
            border: "none",
            background: meta.color,
            color: "#000",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 13,
            marginTop: 8,
          }}
        >
          Mulai {meta.badge} —{" "}
          {activePlans.find((p) => p.id === selected)?.price}
        </button>
        <div
          style={{
            marginTop: 16,
            padding: "12px 14px",
            background: T.surface,
            borderRadius: 10,
            border: `1px solid ${T.border}`,
          }}
        >
          <div
            style={{
              color: T.accent,
              fontSize: 11,
              fontWeight: "bold",
              marginBottom: 6,
            }}
          >
            🤝 Program Referral
          </div>
          <div
            style={{
              color: T.textSoft,
              fontSize: 11,
              lineHeight: 1.7,
              marginBottom: 8,
            }}
          >
            Dapatkan <b style={{ color: T.green }}>$0.99</b> untuk setiap user
            yang subscribe via link kamu.
            <br />
            Kredit bisa digunakan untuk:
            <br />
            &nbsp;· Bayar subscription kamu sendiri
            <br />
            &nbsp;· Tukar voucher (coming soon)
          </div>
          <div
            style={{
              background: T.accentDim,
              border: `1px solid ${T.accentSoft}`,
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 10,
              color: T.muted,
            }}
          >
            📊 Referral kamu: <b style={{ color: T.accent }}>0 user</b> ·
            Kredit: <b style={{ color: T.green }}>$0.00</b>
            <br />
            <span
              style={{
                color: T.blue,
                cursor: "pointer",
                marginTop: 4,
                display: "block",
              }}
            >
              Salin link referral kamu →
            </span>
          </div>
        </div>
        <div
          style={{
            textAlign: "center",
            color: T.muted,
            fontSize: 10,
            marginTop: 10,
            lineHeight: 1.6,
          }}
        >
          Pembayaran aman via Stripe · Batalkan kapan saja
        </div>
      </div>
    </>
  );
}

export default UpgradePanel;
