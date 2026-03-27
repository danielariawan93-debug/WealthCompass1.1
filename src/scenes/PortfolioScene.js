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
  ASSET_CLASSES,
  RISK_PROFILES,
  RISK_QUESTIONS,
  PRECIOUS_METALS,
  CRYPTO_COINS,
  CURRENCIES,
  toIDR,
  fromIDR,
} from "../constants/data";
import {
  TIERS,
  getAIUsage,
  addAIUsage,
  canUploadPDF,
  pdfUploadsRemaining,
  addPDFUsage,
} from "../constants/tiers";

function PortfolioScene({
  assets,
  setAssets,
  livePrices,
  priceLoading,
  dispCur,
  isPro,
  tier,
  uploadCount,
  setUploadCount,
  hideValues = false,
  T,
}) {
  const fV = (v, c) => fM(v, c, hideValues);
  const canAdd =
    assets.length <
    (tier ? (tier.maxAssets === Infinity ? 999999 : tier.maxAssets) : 999999);
  const pdfRemaining = tier ? pdfUploadsRemaining(tier, uploadCount) : 3;
  const pdfAllowed = tier ? canUploadPDF(tier, uploadCount) : uploadCount < 3;
  const [subTab, setSubTab] = useState("list"); // list | add | upload
  const [collapsedClasses, setCollapsedClasses] = useState({});
  // Default: all asset detail sections hidden (true = collapsed)
  const isCollapsed = (key) => collapsedClasses[key] !== false;
  const toggleClass = (key) =>
    setCollapsedClasses((p) => ({ ...p, [key]: p[key] === false ? true : false }));
  const [form, setForm] = useState({
    classKey: "cash",
    name: "",
    amount: "",
    currency: "IDR",
    coinId: "bitcoin",
    quantity: "",
    inputMode: "amount",
    metalType: "gold",
    metalPricePerGram: "",
  });
  const [editId, setEditId] = useState(null);
  const [editState, setEditState] = useState({
    val: "",
    cur: "IDR",
    mode: "amount",
    qty: "",
  });
  const total = assets.reduce((s, a) => s + getIDR(a), 0);
  const liquidTotal = assets.filter(a => !['property','business'].includes(a.classKey)).reduce((s, a) => s + getIDR(a), 0);
  const byClass = ASSET_CLASSES.map((ac) => {
    const items = assets.filter((a) => a.classKey === ac.key);
    const v = items.reduce((s, a) => s + getIDR(a), 0);
    return { ...ac, items, v, pct: total > 0 ? (v / total) * 100 : 0 };
  });

  const isCrypto = form.classKey === "crypto";
  const isEquity = form.classKey === "equity";
  const isMetal =
    form.classKey === "mixed" && form.metalType && form.metalType !== "none";
  const canUseUnits = isCrypto || isEquity || isMetal;
  const coinInfo = CRYPTO_COINS.find((c) => c.id === form.coinId);
  const livePrice = isCrypto ? livePrices.crypto?.[form.coinId]?.idr ?? 0 : 0;

  const addAsset = () => {
    if (!canAdd) return; // tier gate
    let valueIDR = 0,
      extra = {};
    if (isCrypto && form.inputMode === "units" && form.quantity) {
      const qty = parseVal(form.quantity);
      valueIDR = qty * livePrice;
      extra = { coinId: form.coinId, quantity: qty };
    } else if (isEquity && form.inputMode === "units" && form.quantity) {
      const lots = parseVal(form.quantity);
      const pricePerShare = parseVal(form.amount);
      valueIDR = toIDR(lots * 100 * pricePerShare, form.currency);
      extra = { lots, pricePerShare, sourceCurrency: form.currency };
    } else if (isMetal && form.inputMode === "units" && form.quantity) {
      const grams = parseVal(form.quantity);
      const metal = PRECIOUS_METALS.find((m) => m.id === form.metalType);
      let pricePerGram = 0;
      if (form.metalType === "gold") pricePerGram = livePrices.gold || 1500000;
      else if (form.metalType === "silver")
        pricePerGram = livePrices.silver || 20000;
      else pricePerGram = parseVal(form.metalPricePerGram);
      valueIDR = grams * pricePerGram;
      extra = {
        metalType: form.metalType,
        gramWeight: grams,
        pricePerGram,
        metalLabel: metal?.label,
      };
    } else {
      const amt = parseVal(form.amount);
      if (!amt) return;
      valueIDR = toIDR(amt, form.currency);
      extra = { sourceAmount: amt, sourceCurrency: form.currency };
    }
    if (!form.name || valueIDR <= 0) return;
    setAssets((p) => [
      ...p,
      {
        id: crypto.randomUUID(),
        classKey: form.classKey,
        name: form.name,
        valueIDR,
        ...extra,
      },
    ]);
    setForm((p) => ({ ...p, name: "", amount: "", quantity: "" }));
    setSubTab("list");
  };

  const removeAsset = (id) => setAssets((p) => p.filter((a) => a.id !== id));

  const startEdit = (asset) => {
    const idrVal = getIDR(asset);
    setEditId(asset.id);
    setEditState({
      val: String(
        asset.lots
          ? asset.pricePerShare || Math.round(idrVal / (asset.lots * 100))
          : asset.sourceAmount || Math.round(idrVal)
      ),
      cur: asset.sourceCurrency || "IDR",
      mode: asset.lots || asset.coinId ? "units" : "amount",
      qty: String(asset.quantity || asset.lots || ""),
    });
  };
  const saveEdit = (id) => {
    setAssets((p) =>
      p.map((a) => {
        if (a.id !== id) return a;
        let newIDR;
        if (
          (a.coinId || a.lots) &&
          editState.mode === "units" &&
          editState.qty
        ) {
          const qty = parseVal(editState.qty);
          if (a.coinId) {
            const pr = livePrices.crypto?.[a.coinId]?.idr || 0;
            newIDR = qty * pr;
            return { ...a, quantity: qty, liveValue: newIDR, valueIDR: newIDR };
          }
          if (a.lots) {
            const pps = parseVal(editState.val);
            newIDR = toIDR(qty * 100 * pps, editState.cur);
            return {
              ...a,
              lots: qty,
              pricePerShare: pps,
              valueIDR: newIDR,
              liveValue: undefined,
            };
          }
        }
        const v = parseVal(editState.val);
        newIDR = toIDR(v, editState.cur);
        return {
          ...a,
          valueIDR: newIDR,
          liveValue: undefined,
          sourceAmount: v,
          sourceCurrency: editState.cur,
        };
      })
    );
    setEditId(null);
  };

  // PDF Upload logic (inline)
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfParsed, setPdfParsed] = useState([]);
  const [pdfError, setPdfError] = useState("");
  const [conflictMode, setConflictMode] = useState({});
  const fileRef = useRef();
  const remaining = pdfRemaining; // from tier helper

  const parsePDF = async () => {
    if (!pdfFile) return;
    setPdfParsing(true);
    setPdfError("");
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("Read failed"));
        r.readAsDataURL(pdfFile);
      });
      const prompt = `Ekstrak semua instrumen investasi dari dokumen ini. Return HANYA JSON array:\n[{"name":"...","classKey":"cash|bond|fixedincome_plus|mixed|equity|crypto","value":0,"currency":"IDR","notes":"..."}]\nJika kosong: []`;
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: "application/pdf",
                    data: base64,
                  },
                },
                { type: "text", text: prompt },
              ],
            },
          ],
        }),
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text || "[]";
      const items = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setPdfParsed(items.map((it, i) => ({ ...it, id: i, selected: true })));
      addPDFUsage();
      if (tier?.id === "free") setUploadCount((c) => c + 1);
    } catch (e) {
      setPdfError("Gagal parsing PDF: " + e.message);
    }
    setPdfParsing(false);
  };

  const applyPDF = () => {
    const toApply = pdfParsed.filter(
      (it) => it.selected && it.value > 0 && it.name
    );
    const newAssets = [...assets];
    toApply.forEach((it) => {
      const conflict = assets.find(
        (a) => a.name.toLowerCase() === it.name.toLowerCase()
      );
      const vIDR = toIDR(it.value, it.currency);
      if (conflict && conflictMode[it.name] === "overwrite") {
        const idx = newAssets.findIndex((a) => a.id === conflict.id);
        newAssets[idx] = {
          ...newAssets[idx],
          valueIDR: vIDR,
          classKey: it.classKey,
        };
      } else {
        newAssets.push({
          id: crypto.randomUUID(),
          classKey: it.classKey,
          name: it.name,
          valueIDR: vIDR,
          sourceAmount: it.value,
          sourceCurrency: it.currency,
        });
      }
    });
    setAssets(newAssets);
    setPdfParsed([]);
    setPdfFile(null);
    setSubTab("list");
  };

  return (
    <div>
      <Card T={T} style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Donut
        T={T}
        slices={byClass.map((ac) => ({ v: ac.v, c: ac.riskColor }))}
        total={total}
        size={130}
      />
        <div style={{ flex: 1 }}>
          <div style={{ color: T.muted, fontSize: 10, letterSpacing: 1.5, marginBottom: 4 }}>
          TOTAL NET WORTH
        </div>
          <div style={{ color: T.accent, fontSize: 20, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: "bold", marginBottom: 4 }}>
          {fV(total, dispCur)}
        </div>
        {liquidTotal < total && (
            <div style={{ marginBottom: 10 }}>
      <div style={{ color: T.muted, fontSize: 9, letterSpacing: 1, marginBottom: 2 }}>LIQUID NET WORTH</div>
      <div style={{ color: T.textSoft, fontSize: 14, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: "bold" }}>
              {fV(liquidTotal, dispCur)}
            </div>
      <div style={{ color: T.muted, fontSize: 9 }}>excl. Properti & Bisnis</div>
          </div>
        )}
        {byClass
          .filter((ac) => ac.v > 0)
          .map((ac) => (
      <div
              key={ac.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 5,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: ac.riskColor,
                  flexShrink: 0,
                }}
              />
              <span
                style={{ color: T.textSoft, fontSize: 11, flex: 1 }}
              >
                {ac.shortLabel}
              </span>
              <span
                style={{
                  color: T.text,
                  fontSize: 11,
                  fontWeight: "bold",
                }}
              >
                {ac.pct.toFixed(1)}%
              </span>
            </div>
          ))}
      </div>
            </div>
          </Card>


      {/* Sub-tab bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          ["list", "◎ Aset Saya"],
          ["add", "+ Tambah Manual"],
          ["upload", "📄 Upload PDF"],
        ].map(([id, l]) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 9,
              border: `1px solid ${subTab === id ? T.accent : T.border}`,
              background: subTab === id ? T.accentDim : T.surface,
              color: subTab === id ? T.accent : T.muted,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: subTab === id ? "bold" : "normal",
              transition: "all 0.15s",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* LIST */}
      {subTab === "list" && (
        <div>
          {/* Tier limit banner */}
          {tier && !canAdd && (
            <div
              style={{
                padding: "10px 14px",
                background: T.redDim,
                border: `1px solid ${T.red}33`,
                borderRadius: 10,
                marginBottom: 12,
                fontSize: 12,
                color: T.red,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                ⚠ Batas {tier.maxAssets} aset tier {tier.label} tercapai
              </span>
              <span
                style={{ color: T.accent, cursor: "pointer", fontSize: 11 }}
                onClick={() => {}}
              >
                Upgrade →
              </span>
            </div>
          )}
          {tier &&
            canAdd &&
            assets.length >= tier.maxAssets * 0.8 &&
            tier.maxAssets < 999999 && (
              <div
                style={{
                  padding: "8px 14px",
                  background: T.accentDim,
                  border: `1px solid ${T.accentSoft}`,
                  borderRadius: 10,
                  marginBottom: 12,
                  fontSize: 11,
                  color: T.accent,
                }}
              >
                {assets.length}/{tier.maxAssets} aset terpakai
              </div>
            )}

          {byClass
            .filter((ac) => ac.items.length > 0)
            .map((ac) => {
              const isCollapsedSection = isCollapsed(ac.key);
              return (
                <div key={ac.key} style={{ marginBottom: 12 }}>
                  {/* Collapsible header */}
                  <div
                    onClick={() => toggleClass(ac.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: isCollapsedSection ? 0 : 8,
                      cursor: "pointer",
                      padding: "8px 12px",
                      background: T.surface,
                      borderRadius: 10,
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{ac.icon}</span>
                    <span
                      style={{
                        color: ac.riskColor,
                        fontSize: 13,
                        fontWeight: "bold",
                        flex: 1,
                      }}
                    >
                      {ac.label}
                    </span>
                    <InfoBtn
                      T={T}
                      content={
                        <>
                          <b style={{ color: ac.riskColor }}>{ac.riskLabel}</b>
                          <br />
                          {ac.desc}
                          <br />
                          <br />
                          <b>Return:</b> {ac.expectedReturn}
                          <br />
                          <b>Contoh:</b> {ac.instruments.join(", ")}
                        </>
                      }
                    />
                    <span
                      style={{
                        color: T.accent,
                        fontSize: 13,
                        fontWeight: "bold",
                        marginLeft: 4,
                      }}
                    >
                      {fV(ac.v, dispCur)}
                    </span>
                    <span
                      style={{ color: T.muted, fontSize: 11, marginLeft: 4 }}
                    >
                      {ac.pct.toFixed(1)}%
                    </span>
                    <span
                      style={{
                        color: T.muted,
                        fontSize: 14,
                        marginLeft: 6,
                        transition: "transform 0.2s",
                        transform: isCollapsedSection
                          ? "rotate(-90deg)"
                          : "rotate(0deg)",
                        display: "inline-block",
                      }}
                    >
                      ▾
                    </span>
                  </div>
                  {/* Items - shown only when expanded */}
                  {!isCollapsedSection &&
                    ac.items.map((asset) => {
                      const idrV = getIDR(asset);
                      const isLive = asset.coinId;
                      const isEditing = editId === asset.id;
                      const editClass = ASSET_CLASSES.find(
                        (c) => c.key === asset.classKey
                      );
                      const canUnitEdit = asset.coinId || asset.lots;
                      return (
                        <Card
                          T={T}
                          key={asset.id}
                          style={{ padding: "13px 15px", marginBottom: 8 }}
                        >
                          {isEditing ? (
                            <div>
                              <div
                                style={{
                                  color: T.textSoft,
                                  fontSize: 11,
                                  marginBottom: 10,
                                }}
                              >
                                Edit:{" "}
                                <b style={{ color: T.accent }}>{asset.name}</b>
                              </div>
                              {canUnitEdit && (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    marginBottom: 10,
                                  }}
                                >
                                  {[
                                    ["amount", "Nominal"],
                                    [
                                      "units",
                                      asset.coinId
                                        ? "Jumlah Koin"
                                        : "Jumlah Lot",
                                    ],
                                  ].map(([m, l]) => (
                                    <button
                                      key={m}
                                      onClick={() =>
                                        setEditState((p) => ({ ...p, mode: m }))
                                      }
                                      style={{
                                        flex: 1,
                                        padding: "7px",
                                        borderRadius: 7,
                                        border: `1px solid ${
                                          editState.mode === m
                                            ? T.accent
                                            : T.border
                                        }`,
                                        background:
                                          editState.mode === m
                                            ? T.accentDim
                                            : T.surface,
                                        color:
                                          editState.mode === m
                                            ? T.accent
                                            : T.muted,
                                        cursor: "pointer",
                                        fontSize: 11,
                                      }}
                                    >
                                      {l}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {editState.mode === "units" ? (
                                <div>
                                  <TInput
                                    T={T}
                                    value={editState.qty}
                                    onChange={(e) =>
                                      setEditState((p) => ({
                                        ...p,
                                        qty: e.target.value,
                                      }))
                                    }
                                    placeholder={
                                      asset.coinId
                                        ? "Jumlah koin"
                                        : "Jumlah lot"
                                    }
                                    style={{ marginBottom: 8 }}
                                  />
                                  {asset.coinId &&
                                    livePrices.crypto?.[asset.coinId] && (
                                      <div
                                        style={{
                                          fontSize: 10,
                                          color: T.green,
                                          marginBottom: 8,
                                        }}
                                      >
                                        Harga live:{" "}
                                        {fMoney(
                                          livePrices.crypto[asset.coinId].idr
                                        )}{" "}
                                        → Nilai:{" "}
                                        {fMoney(
                                          parseVal(editState.qty) *
                                            livePrices.crypto[asset.coinId].idr,
                                          dispCur
                                        )}
                                      </div>
                                    )}
                                  {asset.lots && (
                                    <TInput
                                      T={T}
                                      value={editState.val}
                                      onChange={(e) =>
                                        setEditState((p) => ({
                                          ...p,
                                          val: e.target.value,
                                        }))
                                      }
                                      placeholder="Harga per saham"
                                      style={{ marginBottom: 8 }}
                                    />
                                  )}
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    marginBottom: 8,
                                  }}
                                >
                                  <TInput
                                    T={T}
                                    value={editState.val}
                                    onChange={(e) =>
                                      setEditState((p) => ({
                                        ...p,
                                        val: e.target.value,
                                      }))
                                    }
                                    placeholder="Nominal"
                                    style={{ flex: 1 }}
                                  />
                                  <TSelect
                                    T={T}
                                    value={editState.cur}
                                    onChange={(e) =>
                                      setEditState((p) => ({
                                        ...p,
                                        cur: e.target.value,
                                      }))
                                    }
                                    style={{ width: 85 }}
                                  >
                                    {CURRENCIES.map((c) => (
                                      <option key={c.code} value={c.code}>
                                        {c.code}
                                      </option>
                                    ))}
                                  </TSelect>
                                </div>
                              )}
                              <div style={{ display: "flex", gap: 8 }}>
                                <button
                                  onClick={() => saveEdit(asset.id)}
                                  style={{
                                    flex: 1,
                                    background: T.green,
                                    color: "#000",
                                    border: "none",
                                    borderRadius: 8,
                                    padding: "9px",
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontWeight: "bold",
                                  }}
                                >
                                  ✓ Simpan
                                </button>
                                <button
                                  onClick={() => setEditId(null)}
                                  style={{
                                    background: T.border,
                                    color: T.muted,
                                    border: "none",
                                    borderRadius: 8,
                                    padding: "9px 14px",
                                    cursor: "pointer",
                                    fontSize: 12,
                                  }}
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                gap: 10,
                                alignItems: "center",
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 5,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 6,
                                      alignItems: "center",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: T.text,
                                        fontSize: 13,
                                        fontWeight: 500,
                                      }}
                                    >
                                      {asset.name}
                                    </span>
                                    {isLive && (
                                      <span
                                        style={{
                                          fontSize: 9,
                                          color: T.green,
                                          background: T.greenDim,
                                          padding: "1px 5px",
                                          borderRadius: 3,
                                        }}
                                      >
                                        LIVE
                                      </span>
                                    )}
                                    {asset.sourceCurrency &&
                                      asset.sourceCurrency !== "IDR" &&
                                      !isLive && (
                                        <span
                                          style={{
                                            fontSize: 9,
                                            color: T.blue,
                                            background: T.blueDim,
                                            padding: "1px 5px",
                                            borderRadius: 3,
                                          }}
                                        >
                                          {asset.sourceCurrency}
                                        </span>
                                      )}
                                  </div>
                                  <div style={{ textAlign: "right" }}>
                                    <div
                                      style={{
                                        color: T.accent,
                                        fontSize: 13,
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {fV(idrV, dispCur)}
                                    </div>
                                    {dispCur !== "IDR" && (
                                      <div
                                        style={{ color: T.muted, fontSize: 10 }}
                                      >
                                        {fV(idrV, "IDR")}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {asset.quantity && (
                                  <div
                                    style={{
                                      color: T.muted,
                                      fontSize: 10,
                                      marginBottom: 4,
                                    }}
                                  >
                                    {asset.quantity}{" "}
                                    {CRYPTO_COINS.find(
                                      (c) => c.id === asset.coinId
                                    )?.symbol || "coin"}
                                  </div>
                                )}
                                {asset.lots && (
                                  <div
                                    style={{
                                      color: T.muted,
                                      fontSize: 10,
                                      marginBottom: 4,
                                    }}
                                  >
                                    {asset.lots} lot ×{" "}
                                    {fMoney(
                                      toIDR(
                                        asset.pricePerShare,
                                        asset.sourceCurrency || "IDR"
                                      )
                                    )}
                                    /lembar
                                  </div>
                                )}
                                <Bar
                                  pct={total > 0 ? (idrV / total) * 100 : 0}
                                  color={ac.riskColor}
                                  h={4}
                                  T={T}
                                />
                              </div>
                              <div style={{ display: "flex", gap: 5 }}>
                                <button
                                  onClick={() => startEdit(asset)}
                                  style={{
                                    background: T.surface,
                                    color: T.textSoft,
                                    border: `1px solid ${T.border}`,
                                    borderRadius: 7,
                                    padding: "6px 9px",
                                    cursor: "pointer",
                                    fontSize: 11,
                                  }}
                                >
                                  ✎
                                </button>
                                <button
                                  onClick={() => removeAsset(asset.id)}
                                  style={{
                                    background: "none",
                                    color: T.muted,
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 15,
                                    padding: "4px",
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                </div>
              );
            })}
          {assets.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: T.muted,
                padding: 50,
                fontSize: 13,
              }}
            >
              Belum ada aset. Tambah manual atau upload PDF ↑
            </div>
          )}
        </div>
      )}

      {/* ADD MANUAL */}
      {subTab === "add" && (
        <Card T={T}>
          <SL T={T}>Tambah Aset Manual</SL>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <TSelect
              T={T}
              value={form.classKey}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  classKey: e.target.value,
                  amount: "",
                  quantity: "",
                  inputMode: e.target.value === "mixed" ? "units" : "amount",
                  metalType: e.target.value === "mixed" ? "gold" : p.metalType,
                }))
              }
            >
              {ASSET_CLASSES.map((ac) => (
                <option key={ac.key} value={ac.key}>
                  {ac.icon} {ac.label} - {ac.riskLabel}
                </option>
              ))}
            </TSelect>

            {form.classKey === "mixed" && (
              <div>
                <div
                  style={{ color: "#9aa3b0", fontSize: 10, marginBottom: 6 }}
                >
                  Jenis Komoditas
                </div>
                <TSelect
                  T={T}
                  value={form.metalType || "gold"}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      metalType: e.target.value,
                      inputMode: e.target.value !== "none" ? "units" : "amount",
                    }))
                  }
                >
                  <option value="none">
                    Properti / Campuran (nominal IDR)
                  </option>
                  {PRECIOUS_METALS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.icon} {m.label}
                    </option>
                  ))}
                </TSelect>
              </div>
            )}
            {isCrypto && (
              <TSelect
                T={T}
                value={form.coinId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, coinId: e.target.value }))
                }
              >
                {CRYPTO_COINS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.symbol} - {c.label}
                  </option>
                ))}
              </TSelect>
            )}

            <TInput
              T={T}
              placeholder="Nama aset (contoh: BBCA, BTC Personal)"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />

            {/* Input mode toggle for crypto/equity */}
            {canUseUnits && (
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  ["amount", "Nominal"],
                  ["units", isCrypto ? "Jumlah Koin" : "Jumlah Lot"],
                ].map(([m, l]) => (
                  <button
                    key={m}
                    onClick={() => setForm((p) => ({ ...p, inputMode: m }))}
                    style={{
                      flex: 1,
                      padding: "9px",
                      borderRadius: 9,
                      border: `1px solid ${
                        form.inputMode === m ? T.accent : T.border
                      }`,
                      background:
                        form.inputMode === m ? T.accentDim : T.surface,
                      color: form.inputMode === m ? T.accent : T.muted,
                      cursor: "pointer",
                      fontSize: 12,
                      transition: "all 0.15s",
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}

            {form.inputMode === "units" && isMetal && (
              <div>
                <div style={LS}>Berat (gram)</div>
                <TInput
                  T={T}
                  placeholder="Contoh: 10"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, quantity: e.target.value }))
                  }
                />
                {form.metalType === "other" && (
                  <div style={{ marginTop: 8 }}>
                    <div
                      style={{
                        color: "#9aa3b0",
                        fontSize: 10,
                        marginBottom: 4,
                      }}
                    >
                      Harga per gram (IDR)
                    </div>
                    <TInput
                      T={T}
                      placeholder="Input manual harga/gram"
                      value={form.metalPricePerGram}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          metalPricePerGram: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
                {(() => {
                  const grams = parseVal(form.quantity);
                  const ppg =
                    form.metalType === "gold"
                      ? livePrices.gold || 1500000
                      : form.metalType === "silver"
                      ? livePrices.silver || 20000
                      : parseVal(form.metalPricePerGram);
                  return grams > 0 && ppg > 0 ? (
                    <div
                      style={{
                        color: "#3ecf8e",
                        fontSize: 11,
                        marginTop: 6,
                        padding: "7px 10px",
                        background: "#3ecf8e18",
                        borderRadius: 7,
                      }}
                    >
                      {grams}g × {fMoney(ppg)}/gram ={" "}
                      <b>{fMoney(grams * ppg)}</b>
                      {form.metalType !== "other" && (
                        <span style={{ color: "#4d5866", fontSize: 10 }}>
                          {" "}
                          · harga live
                        </span>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {form.inputMode === "units" && isCrypto && (
              <div>
                <TInput
                  T={T}
                  placeholder={`Jumlah koin (contoh: 0.05)`}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, quantity: e.target.value }))
                  }
                />
                {livePrice > 0 && form.quantity && (
                  <div
                    style={{
                      fontSize: 11,
                      color: T.green,
                      marginTop: 6,
                      padding: "7px 10px",
                      background: T.greenDim,
                      borderRadius: 7,
                    }}
                  >
                    {parseVal(form.quantity)} {coinInfo?.symbol} ×{" "}
                    {fM(livePrice, "IDR", hideValues)} ={" "}
                    <b>{fV(parseVal(form.quantity) * livePrice, dispCur)}</b>
                  </div>
                )}
                {livePrice === 0 && (
                  <div style={{ fontSize: 10, color: T.orange, marginTop: 5 }}>
                    ⚠ Harga live belum tersedia. Coba refresh.
                  </div>
                )}
              </div>
            )}

            {form.inputMode === "units" && isEquity && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <TInput
                  T={T}
                  placeholder="Jumlah lot (1 lot = 100 lembar)"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, quantity: e.target.value }))
                  }
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <TInput
                    T={T}
                    placeholder="Harga per saham"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, amount: e.target.value }))
                    }
                    style={{ flex: 1 }}
                  />
                  <TSelect
                    T={T}
                    value={form.currency}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, currency: e.target.value }))
                    }
                    style={{ width: 80 }}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </TSelect>
                </div>
                {form.quantity && form.amount && (
                  <div
                    style={{
                      fontSize: 11,
                      color: T.blue,
                      padding: "7px 10px",
                      background: T.blueDim,
                      borderRadius: 7,
                    }}
                  >
                    {parseVal(form.quantity)} lot × 100 ×{" "}
                    {fMoney(toIDR(parseVal(form.amount), form.currency))} ={" "}
                    <b>
                      {fMoney(
                        toIDR(
                          parseVal(form.quantity) * 100 * parseVal(form.amount),
                          form.currency
                        ),
                        dispCur
                      )}
                    </b>
                  </div>
                )}
              </div>
            )}

            {form.inputMode === "amount" && (
              <div>
                <div style={{ display: "flex", gap: 8 }}>
                  <TInput
                    T={T}
                    placeholder="Nominal"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, amount: e.target.value }))
                    }
                    style={{ flex: 1 }}
                  />
                  <TSelect
                    T={T}
                    value={form.currency}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, currency: e.target.value }))
                    }
                    style={{ width: 80 }}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </TSelect>
                </div>
                {form.amount && form.currency !== "IDR" && (
                  <div style={{ fontSize: 10, color: T.blue, marginTop: 5 }}>
                    {parseVal(form.amount)} {form.currency} ={" "}
                    <b>
                      {fMoney(
                        toIDR(parseVal(form.amount), form.currency),
                        "IDR"
                      )}
                    </b>
                  </div>
                )}
              </div>
            )}

            <TBtn
              T={T}
              variant="primary"
              onClick={addAsset}
              style={{ padding: 13, fontSize: 13 }}
            >
              + Tambah Aset
            </TBtn>
          </div>
        </Card>
      )}

      {/* UPLOAD PDF */}
      {subTab === "upload" && (
        <div>
          <Card T={T} style={{ marginBottom: 16, padding: "14px 18px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span
                  style={{ color: T.accent, fontWeight: "bold", fontSize: 13 }}
                >
                  📄 Upload Portofolio PDF
                </span>
                <div style={{ color: T.muted, fontSize: 11, marginTop: 3 }}>
                  AI baca & ekstrak aset otomatis
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Chip
                  color={
                    pdfAllowed
                      ? tier?.id === "proplus"
                        ? "#9b7ef8"
                        : T.accent
                      : T.red
                  }
                  T={T}
                >
                  {tier?.id === "proplus"
                    ? "💎 20x/bulan"
                    : tier?.id === "pro"
                    ? `⭐ ${pdfRemaining}x / bulan`
                    : `${pdfRemaining}x tersisa`}
                </Chip>
                <div style={{ color: T.muted, fontSize: 10, marginTop: 3 }}>
                  {tier?.id === "proplus"
                    ? "Pro+ - tidak terbatas"
                    : tier?.id === "pro"
                    ? "Pro - 7x per bulan, reset tiap bulan"
                    : "Free - 3x seumur hidup"}
                </div>
              </div>
            </div>
          </Card>

          {pdfParsed.length === 0 && (
            <Card T={T}>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setPdfFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${T.border}`,
                  borderRadius: 12,
                  padding: "32px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: T.surface,
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                <div
                  style={{
                    color: T.text,
                    fontSize: 13,
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                >
                  {pdfFile
                    ? `✓ ${pdfFile.name}`
                    : "Drag & drop PDF atau klik pilih"}
                </div>
                <div style={{ color: T.muted, fontSize: 11 }}>
                  Rekening koran, laporan portofolio, statement investasi
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  style={{ display: "none" }}
                  onChange={(e) => setPdfFile(e.target.files[0])}
                />
              </div>
              {pdfFile && (
                <TBtn
                  T={T}
                  variant="primary"
                  onClick={parsePDF}
                  disabled={pdfParsing || !pdfAllowed}
                  style={{ width: "100%", padding: 13 }}
                >
                  {pdfParsing ? "⏳ AI membaca PDF..." : "🔍 Analisa dengan AI"}
                </TBtn>
              )}
              {pdfError && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 14px",
                    background: T.redDim,
                    border: `1px solid ${T.red}33`,
                    borderRadius: 9,
                    color: T.red,
                    fontSize: 12,
                  }}
                >
                  {pdfError}
                </div>
              )}
            </Card>
          )}

          {pdfParsed.length > 0 && (
            <Card T={T}>
              <SL T={T}>Review Hasil AI</SL>
              <div
                style={{ color: T.textSoft, fontSize: 12, marginBottom: 14 }}
              >
                AI menemukan{" "}
                <b style={{ color: T.accent }}>{pdfParsed.length} aset</b>.
                Periksa sebelum disimpan.
              </div>
              {pdfParsed.map((it, i) => {
                const conflict = assets.find(
                  (a) => a.name.toLowerCase() === it.name.toLowerCase()
                );
                return (
                  <div
                    key={it.id}
                    style={{
                      marginBottom: 10,
                      padding: "12px 14px",
                      background: T.surface,
                      borderRadius: 10,
                      border: `1px solid ${
                        it.selected ? T.accent + "33" : T.border
                      }`,
                      opacity: it.selected ? 1 : 0.5,
                    }}
                  >
                    <div style={{ display: "flex", gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={it.selected}
                        onChange={(e) =>
                          setPdfParsed((p) =>
                            p.map((x, j) =>
                              j === i ? { ...x, selected: e.target.checked } : x
                            )
                          )
                        }
                        style={{ marginTop: 3 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginBottom: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <TInput
                            T={T}
                            value={it.name}
                            placeholder="Nama"
                            style={{ flex: 1, minWidth: 100 }}
                            onChange={(e) =>
                              setPdfParsed((p) =>
                                p.map((x, j) =>
                                  j === i ? { ...x, name: e.target.value } : x
                                )
                              )
                            }
                          />
                          <TSelect
                            T={T}
                            value={it.classKey}
                            style={{ flex: 1 }}
                            onChange={(e) =>
                              setPdfParsed((p) =>
                                p.map((x, j) =>
                                  j === i
                                    ? { ...x, classKey: e.target.value }
                                    : x
                                )
                              )
                            }
                          >
                            {ASSET_CLASSES.map((ac) => (
                              <option key={ac.key} value={ac.key}>
                                {ac.icon} {ac.shortLabel}
                              </option>
                            ))}
                          </TSelect>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <TInput
                            T={T}
                            value={it.value}
                            type="number"
                            style={{ flex: 1 }}
                            onChange={(e) =>
                              setPdfParsed((p) =>
                                p.map((x, j) =>
                                  j === i
                                    ? {
                                        ...x,
                                        value: parseFloat(e.target.value) || 0,
                                      }
                                    : x
                                )
                              )
                            }
                          />
                          <TSelect
                            T={T}
                            value={it.currency}
                            style={{ width: 80 }}
                            onChange={(e) =>
                              setPdfParsed((p) =>
                                p.map((x, j) =>
                                  j === i
                                    ? { ...x, currency: e.target.value }
                                    : x
                                )
                              )
                            }
                          >
                            {CURRENCIES.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.code}
                              </option>
                            ))}
                          </TSelect>
                        </div>
                        {it.currency !== "IDR" && it.value > 0 && (
                          <div
                            style={{
                              color: T.blue,
                              fontSize: 10,
                              marginTop: 4,
                            }}
                          >
                            = {fMoney(toIDR(it.value, it.currency), "IDR")}
                          </div>
                        )}
                      </div>
                    </div>
                    {conflict && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "9px 12px",
                          background: T.orange + "14",
                          borderRadius: 8,
                          border: `1px solid ${T.orange}33`,
                        }}
                      >
                        <div
                          style={{
                            color: T.orange,
                            fontSize: 11,
                            marginBottom: 6,
                          }}
                        >
                          ⚠ "{conflict.name}" sudah ada
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() =>
                              setConflictMode((p) => ({
                                ...p,
                                [it.name]: "overwrite",
                              }))
                            }
                            style={{
                              flex: 1,
                              background:
                                conflictMode[it.name] === "overwrite"
                                  ? T.orange + "33"
                                  : T.surface,
                              border: `1px solid ${T.orange}44`,
                              color: T.orange,
                              borderRadius: 7,
                              padding: "6px",
                              cursor: "pointer",
                              fontSize: 11,
                              fontWeight:
                                conflictMode[it.name] === "overwrite"
                                  ? "bold"
                                  : "normal",
                            }}
                          >
                            Overwrite
                          </button>
                          <button
                            onClick={() =>
                              setConflictMode((p) => ({
                                ...p,
                                [it.name]: "add",
                              }))
                            }
                            style={{
                              flex: 1,
                              background:
                                !conflictMode[it.name] ||
                                conflictMode[it.name] === "add"
                                  ? T.greenDim
                                  : T.surface,
                              border: `1px solid ${T.green}44`,
                              color: T.green,
                              borderRadius: 7,
                              padding: "6px",
                              cursor: "pointer",
                              fontSize: 11,
                              fontWeight:
                                !conflictMode[it.name] ||
                                conflictMode[it.name] === "add"
                                  ? "bold"
                                  : "normal",
                            }}
                          >
                            Tambah baru
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: 9, marginTop: 8 }}>
                <TBtn
                  T={T}
                  variant="primary"
                  onClick={applyPDF}
                  style={{ flex: 1, padding: 12 }}
                >
                  ✓ Simpan {pdfParsed.filter((x) => x.selected).length} Aset
                </TBtn>
                <TBtn
                  T={T}
                  onClick={() => {
                    setPdfParsed([]);
                    setPdfFile(null);
                  }}
                  style={{ padding: "12px 16px" }}
                >
                  Batal
                </TBtn>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default PortfolioScene;
