import React, { useState } from "react";
import { fMoney, getIDR, parseVal } from "../utils/helpers";

const CLASS_LABELS = {
  stocks: "Saham", crypto: "Kripto", bonds: "Obligasi",
  cash: "Kas & Setara", property: "Properti", gold: "Emas/Logam",
  commodity: "Komoditas", other: "Lainnya", business: "Bisnis",
};

const DEBT_LABELS = {
  kpr: "KPR / Mortgage", vehicle: "Cicilan Kendaraan",
  kta: "Pinjaman Pribadi", cc: "Kartu Kredit",
  paylater: "PayLater", other: "Lainnya",
};

const INS_LABELS = {
  life: "Jiwa", health: "Kesehatan", vehicle: "Kendaraan",
  property: "Properti", travel: "Perjalanan", other: "Lainnya",
};

const FREQ_MULT = { monthly: 12, semiannual: 2, quarterly: 4, annual: 1 };
const FREQ_LABELS = { monthly: "Bln", semiannual: "6Bln", quarterly: "Triwulan", annual: "Thn" };

function fmt(idr, cur) { return fMoney(idr, cur || "IDR"); }

function generateHTML(assets, debts, insurances, dispCur, periodMode, monthlySnaps, userName) {
  const totalAssets = assets.reduce((s, a) => s + getIDR(a), 0);
  const totalDebts = debts.reduce((s, d) => s + parseVal(d.outstanding), 0);
  const netWorth = totalAssets - totalDebts;
  const totalAnnualPremium = insurances.reduce(
    (s, ins) => s + parseVal(ins.premium) * (FREQ_MULT[ins.premiumFreq] || 1), 0
  );
  const cur = dispCur || "IDR";

  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Group assets by class
  const byClass = {};
  assets.forEach(a => {
    const k = a.classKey || "other";
    if (!byClass[k]) byClass[k] = [];
    byClass[k].push(a);
  });

  const assetRows = assets.map(a =>
    `<tr><td>${a.name || "-"}</td><td>${CLASS_LABELS[a.classKey] || a.classKey || "-"}</td><td class="num">${fmt(getIDR(a), cur)}</td></tr>`
  ).join("");

  const debtRows = debts.map(d =>
    `<tr><td>${d.name || "-"}</td><td>${DEBT_LABELS[d.type] || d.type || "-"}</td><td class="num">${fmt(parseVal(d.outstanding), cur)}</td></tr>`
  ).join("");

  const insRows = insurances.map(ins => {
    const annualPrem = parseVal(ins.premium) * (FREQ_MULT[ins.premiumFreq] || 1);
    return `<tr><td>${ins.name || "-"}</td><td>${ins.company || "-"}</td><td>${INS_LABELS[ins.type] || ins.type || "-"}</td><td class="num">${fmt(parseVal(ins.coverage), cur)}</td><td class="num">${fmt(annualPrem, cur)}/thn</td></tr>`;
  }).join("");

  const historySection = periodMode === "monthly" && monthlySnaps.length > 0
    ? `<div class="section">
        <h2>📈 Riwayat Net Worth (Per Akhir Bulan)</h2>
        <table>
          <thead><tr><th>Bulan</th><th class="num">Net Worth</th><th class="num">Perubahan</th></tr></thead>
          <tbody>
            ${monthlySnaps.map((s, i) => {
              const prev = i > 0 ? monthlySnaps[i - 1].val : s.val;
              const change = s.val - prev;
              const pct = prev !== 0 ? ((change / Math.abs(prev)) * 100).toFixed(1) : "0.0";
              const color = change >= 0 ? "#16a34a" : "#dc2626";
              const sign = change >= 0 ? "+" : "";
              const [year, month] = s.month.split("-");
              const monthName = new Date(parseInt(year), parseInt(month) - 1, 1)
                .toLocaleDateString("id-ID", { month: "long", year: "numeric" });
              return `<tr>
                <td>${monthName}</td>
                <td class="num">${fmt(s.val, cur)}</td>
                <td class="num" style="color:${color}">${i === 0 ? "-" : `${sign}${fmt(Math.abs(change), cur)} (${sign}${pct}%)`}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Laporan Portofolio — WealthPulse</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a2e; background: #fff; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2px solid #9b7ef8; margin-bottom: 24px; }
    .logo { font-size: 20px; font-weight: 900; color: #9b7ef8; letter-spacing: -0.5px; }
    .logo span { color: #7c5ce4; }
    .meta { text-align: right; font-size: 11px; color: #666; line-height: 1.7; }
    .meta .name { font-weight: bold; color: #1a1a2e; font-size: 13px; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px; }
    .summary-card { padding: 14px 16px; border-radius: 10px; border: 1px solid #e5e7eb; }
    .summary-card .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .summary-card .value { font-size: 16px; font-weight: 800; }
    .green { color: #16a34a; } .red { color: #dc2626; } .purple { color: #9b7ef8; }
    .bg-green { background: #f0fdf4; border-color: #bbf7d0; }
    .bg-red { background: #fef2f2; border-color: #fecaca; }
    .bg-purple { background: #f5f3ff; border-color: #ddd6fe; }
    .section { margin-bottom: 28px; }
    h2 { font-size: 13px; font-weight: 700; color: #1a1a2e; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f9fafb; color: #555; font-weight: 600; text-align: left; padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; }
    td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; color: #333; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fafafa; }
    .num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
    .empty { color: #aaa; font-style: italic; text-align: center; padding: 16px; }
    .footer { margin-top: 32px; padding-top: 14px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #aaa; text-align: center; line-height: 1.7; }
    .badge { display: inline-block; background: #f5f3ff; color: #7c3aed; border-radius: 4px; padding: 1px 6px; font-size: 9px; font-weight: bold; margin-left: 6px; vertical-align: middle; }
    @media print {
      body { padding: 16px; }
      @page { size: A4; margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Wealth<span>Compass</span></div>
      <div style="font-size:10px;color:#aaa;margin-top:3px;">Laporan Rekap Portofolio <span class="badge">💎 PRO+</span></div>
    </div>
    <div class="meta">
      ${userName ? `<div class="name">${userName}</div>` : ""}
      <div>${dateStr}</div>
      <div style="color:#9b7ef8;font-size:10px;">wealthpulse.app</div>
    </div>
  </div>

  <div class="summary">
    <div class="summary-card bg-green">
      <div class="label">Total Aset</div>
      <div class="value green">${fmt(totalAssets, cur)}</div>
      <div style="font-size:9px;color:#888;margin-top:3px;">${assets.length} instrumen</div>
    </div>
    <div class="summary-card bg-red">
      <div class="label">Total Utang</div>
      <div class="value red">${fmt(totalDebts, cur)}</div>
      <div style="font-size:9px;color:#888;margin-top:3px;">${debts.length} kewajiban</div>
    </div>
    <div class="summary-card bg-purple">
      <div class="label">Net Worth</div>
      <div class="value ${netWorth >= 0 ? "green" : "red"}">${fmt(Math.abs(netWorth), cur)}${netWorth < 0 ? " (−)" : ""}</div>
      <div style="font-size:9px;color:#888;margin-top:3px;">Aset − Utang</div>
    </div>
  </div>

  ${historySection}

  <div class="section">
    <h2>📊 Rekap Aset (${assets.length} instrumen)</h2>
    ${assets.length > 0
      ? `<table><thead><tr><th>Nama</th><th>Kelas Aset</th><th class="num">Nilai (${cur})</th></tr></thead><tbody>${assetRows}</tbody></table>`
      : `<div class="empty">Tidak ada aset tercatat</div>`}
  </div>

  <div class="section">
    <h2>💳 Rekap Utang (${debts.length} kewajiban)</h2>
    ${debts.length > 0
      ? `<table><thead><tr><th>Nama</th><th>Jenis</th><th class="num">Outstanding (${cur})</th></tr></thead><tbody>${debtRows}</tbody></table>`
      : `<div class="empty">Tidak ada utang tercatat</div>`}
  </div>

  <div class="section">
    <h2>🛡️ Rekap Asuransi (${insurances.length} polis · Premi tahunan: ${fmt(totalAnnualPremium, cur)})</h2>
    ${insurances.length > 0
      ? `<table><thead><tr><th>Nama Polis</th><th>Perusahaan</th><th>Jenis</th><th class="num">Uang Pertanggungan</th><th class="num">Premi</th></tr></thead><tbody>${insRows}</tbody></table>`
      : `<div class="empty">Tidak ada asuransi tercatat</div>`}
  </div>

  <div class="footer">
    Laporan ini dibuat oleh WealthPulse pada ${dateStr}.<br/>
    Data bersifat rahasia dan hanya untuk keperluan perencanaan keuangan pribadi.<br/>
    Nilai aset dapat berubah sewaktu-waktu mengikuti kondisi pasar.
  </div>
</body>
</html>`;
}

function PdfExportModal({ assets = [], debts = [], insurances = [], dispCur, pulseCredits, setPulseCredits, T, userEmail, userName, onClose }) {
  const [periodMode, setPeriodMode] = useState("today");

  const snapKey = userEmail ? "wc_snapshots_" + btoa(userEmail).replace(/=/g, "") : "wc_snapshots";

  const getMonthlySnapshots = () => {
    try {
      const saved = localStorage.getItem(snapKey);
      if (!saved) return [];
      const snaps = JSON.parse(saved);
      const byMonth = {};
      snaps.forEach(s => {
        const month = new Date(s.ts).toISOString().slice(0, 7);
        if (!byMonth[month] || s.ts > byMonth[month].ts) byMonth[month] = s;
      });
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 12);
      return Object.entries(byMonth)
        .filter(([m]) => new Date(m + "-01") >= cutoff)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, s]) => ({ month, val: s.val }));
    } catch { return []; }
  };

  const canExport = pulseCredits >= 3;

  const handleExport = () => {
    if (!canExport) return;
    setPulseCredits(p => Math.max(0, p - 3));
    const monthlySnaps = periodMode === "monthly" ? getMonthlySnapshots() : [];
    const html = generateHTML(assets, debts, insurances, dispCur, periodMode, monthlySnaps, userName);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); } catch (e) {} }, 600);
    onClose();
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, maxWidth: 380, width: "100%", position: "relative" }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer" }}>✕</button>

        <div style={{ fontSize: 15, fontWeight: "bold", color: T.text, marginBottom: 4 }}>📄 Export Laporan Portofolio</div>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 20 }}>
          Laporan lengkap: Aset, Utang &amp; Asuransi · <span style={{ color: T.accent, fontWeight: "bold" }}>3 Pulse/export</span>
        </div>

        {/* Period selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: T.textSoft, marginBottom: 8, fontWeight: 600 }}>Pilih Periode Laporan</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["today", "📅 Today"], ["monthly", "📆 Per Akhir Bulan"]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setPeriodMode(id)}
                style={{
                  flex: 1, padding: "10px 8px", borderRadius: 9, border: `2px solid ${periodMode === id ? "#9b7ef8" : T.border}`,
                  background: periodMode === id ? "#9b7ef822" : T.surface, color: periodMode === id ? "#9b7ef8" : T.text,
                  cursor: "pointer", fontSize: 12, fontWeight: periodMode === id ? "bold" : "normal",
                }}
              >{label}</button>
            ))}
          </div>
          {periodMode === "monthly" && (
            <div style={{ marginTop: 8, fontSize: 10, color: T.muted, background: T.surface, borderRadius: 8, padding: "8px 10px", lineHeight: 1.6 }}>
              Menambahkan tabel riwayat net worth per akhir bulan (maks. 12 bulan terakhir) ke dalam laporan.
            </div>
          )}
        </div>

        {/* Summary preview */}
        <div style={{ background: T.surface, borderRadius: 10, padding: "12px 14px", marginBottom: 18, fontSize: 11 }}>
          <div style={{ color: T.textSoft, marginBottom: 6, fontWeight: 600 }}>Isi Laporan:</div>
          <div style={{ color: T.text, lineHeight: 1.9 }}>
            ✓ Rekap Aset ({assets.length} instrumen)<br/>
            ✓ Rekap Utang ({debts.length} kewajiban)<br/>
            ✓ Rekap Asuransi ({insurances.length} polis)<br/>
            {periodMode === "monthly" && "✓ Riwayat Net Worth per Bulan"}
          </div>
        </div>

        {/* Pulse balance */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, fontSize: 11 }}>
          <span style={{ color: T.muted }}>Saldo Pulse kamu:</span>
          <span style={{ color: T.accent, fontWeight: "bold" }}>⚡ {pulseCredits} Pulse</span>
        </div>

        {!canExport && (
          <div style={{ background: "#f26b6b22", border: "1px solid #f26b6b44", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 11, color: "#f26b6b", textAlign: "center" }}>
            Pulse tidak cukup. Perlu minimal 3 Pulse.
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={!canExport}
          style={{
            width: "100%", padding: 13, borderRadius: 9, border: "none",
            background: canExport ? "#9b7ef8" : T.border,
            color: canExport ? "#fff" : T.muted,
            cursor: canExport ? "pointer" : "not-allowed",
            fontWeight: "bold", fontSize: 13,
          }}
        >
          {canExport ? "📄 Export & Print (−3 Pulse)" : "Pulse Tidak Cukup"}
        </button>

        <div style={{ textAlign: "center", color: T.muted, fontSize: 10, marginTop: 10 }}>
          Laporan akan dibuka di tab baru untuk dicetak / simpan PDF
        </div>
      </div>
    </div>
  );
}

export default PdfExportModal;
