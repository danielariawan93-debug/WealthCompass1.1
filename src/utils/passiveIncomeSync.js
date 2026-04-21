// =============================================================================
// passiveIncomeSync.js
// Engine: sinkronisasi passive income WP → AJ transaksi
// Rules:
//   - Hanya buat transaksi type:"income", category:"passive_income"
//   - Tidak ubah valueIDR / saldo aset
//   - Idempotent — aman dipanggil berulang / reload
//   - Skip asset tanpa incomeSchedule.nextDate
// =============================================================================

/**
 * generateNextDate
 * Pure function — tidak ada side effect
 * @param {string} dateStr  "YYYY-MM-DD"
 * @param {string} freq     "monthly" | "quarterly" | "semiannual" | "annual"
 * @returns {string}        "YYYY-MM-DD"
 */
export function generateNextDate(dateStr, freq) {
  const d = new Date(dateStr + "T00:00:00");
  if (freq === "monthly")    d.setMonth(d.getMonth() + 1);
  if (freq === "quarterly")  d.setMonth(d.getMonth() + 3);
  if (freq === "semiannual") d.setMonth(d.getMonth() + 6);
  if (freq === "annual")     d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * syncPassiveIncome
 * Idempotent — tidak mutasi input langsung, return salinan baru
 * @param {Array}  assets          — dari WP state
 * @param {Array}  ajTransactions  — existing AJ transactions
 * @param {string} walletId        — target wallet AJ
 * @returns {{ newTransactions: Array, updatedAssets: Array }}
 */
export function syncPassiveIncome(assets, ajTransactions, walletId) {
  const today = new Date().toISOString().slice(0, 10);

  // Buat salinan assets — tidak mutasi state asli
  const updatedAssets = assets.map(a => ({
    ...a,
    incomeSchedule: a.incomeSchedule ? { ...a.incomeSchedule } : undefined,
  }));

  const newTransactions = [];

  for (let i = 0; i < updatedAssets.length; i++) {
    const a = updatedAssets[i];

    // Skip: tidak ada income atau amount 0
    if (!a.income?.amount) continue;

    // Skip: belum ada incomeSchedule.nextDate (user belum set)
    if (!a.incomeSchedule?.nextDate) continue;

    const nextDate = a.incomeSchedule.nextDate;

    // Skip: belum waktunya
    if (today < nextDate) continue;

    // Anti-duplicate layer: cek transaksi WP_AUTO dengan assetId + date yang sama
    const alreadyPaid = ajTransactions.some(
      t =>
        t.source === "WP_AUTO" &&
        t.assetId === a.id &&
        t.date === nextDate
    );
    if (alreadyPaid) continue;

    // Buat transaksi income
    newTransactions.push({
      id: `inc_${Date.now()}_${a.id}`,
      date: nextDate,
      type: "income",
      category: "passive_income",
      amount: a.income.amount,
      walletId,
      note: `${a.income.type || "passive"} - ${a.name || a.classKey}`,
      source: "WP_AUTO",
      assetId: a.id,
    });

    // Advance schedule — hanya setelah transaksi dibuat
    updatedAssets[i] = {
      ...a,
      incomeSchedule: {
        lastPaid: nextDate,
        nextDate: generateNextDate(nextDate, a.income.frequency),
      },
    };
  }

  return { newTransactions, updatedAssets };
}
