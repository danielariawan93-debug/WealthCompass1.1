// creditSync.js — shared utilities for CC/Paylater ↔ Wealth Pulse sync

/** Maps debt.type → AJ wallet type */
const CREDIT_DEBT_TO_WALLET = { paylater: "Paylater", cc: "Kartu Kredit", krek: "Rekening Koran" };

/**
 * Returns the current billing period for a credit debt (legacy fallback).
 * Used when debt has no tanggal_outstanding set.
 */
function getBillingPeriod(debt) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (debt.renewalDate) {
    const parts = debt.renewalDate.split("-");
    const renewalDay = Math.min(parseInt(parts[2] || parts[1] || 1, 10), 28);

    let start = new Date(today.getFullYear(), today.getMonth(), renewalDay);
    if (start > today) {
      start = new Date(today.getFullYear(), today.getMonth() - 1, renewalDay);
    }
    const end = new Date(start.getFullYear(), start.getMonth() + 1, renewalDay - 1);
    return { start, end };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start, end };
}

/**
 * Calculates net outstanding for a revolving credit debt from AJ transactions.
 *
 * If debt.tanggal_outstanding is set (snapshot mode):
 *   outstanding = debt.outstanding (base snapshot)
 *                 + expenses via linked wallet where date > snapshot
 *                 - debt_payments where date > snapshot
 *                 ± same-date transactions where affects_outstanding === true
 *
 * If tanggal_outstanding is NOT set (legacy billing-period mode):
 *   outstanding = max(0, gross_expenses − debt_payments) within billing period
 *
 * Returns null if not a credit type or no linked wallet.
 */
function calcCreditOutstanding(debt, ajTransactions, ajWallets) {
  const walletType = CREDIT_DEBT_TO_WALLET[debt.type];
  if (!walletType) return null;

  const linked = (ajWallets || []).filter(w => w.debtId === debt.id);
  if (linked.length === 0) return null;

  const linkedIds = new Set(linked.map(w => w.id));

  // ── Snapshot mode (tanggal_outstanding set) ───────────────────────────────
  if (debt.tanggal_outstanding) {
    const snapshotDate = new Date(debt.tanggal_outstanding + 'T00:00:00');
    const base = Math.max(0, Number(debt.outstanding) || 0);

    const txAfterOrSameDate = (t, dateField) => {
      if (!t[dateField]) return false;
      const txDate = new Date(t[dateField] + 'T00:00:00');
      if (txDate > snapshotDate) return true;
      // same date: only include if user explicitly confirmed
      if (txDate.getTime() === snapshotDate.getTime()) return t.affects_outstanding === true;
      return false;
    };

    const newSpending = (ajTransactions || [])
      .filter(t => t.type === 'expense' && linkedIds.has(t.walletId) && txAfterOrSameDate(t, 'date'))
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const newPayments = (ajTransactions || [])
      .filter(t => t.type === 'debt_payment' && t.debtId === debt.id && txAfterOrSameDate(t, 'date'))
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    return Math.max(0, base + newSpending - newPayments);
  }

  // ── Legacy billing-period mode (no snapshot date) ─────────────────────────
  const { start, end } = getBillingPeriod(debt);

  const inPeriod = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T00:00:00');
    return d >= start && d <= end;
  };

  const spending = (ajTransactions || [])
    .filter(t => t.type === 'expense' && linkedIds.has(t.walletId) && inPeriod(t.date))
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const payments = (ajTransactions || [])
    .filter(t => t.type === 'debt_payment' && t.debtId === debt.id && inPeriod(t.date))
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  return Math.max(0, spending - payments);
}

/**
 * Walks all debts and recalculates outstanding for every credit entry
 * that has linked AJ wallets. Returns new array only when something
 * changed; otherwise returns null so callers can skip setState.
 */
function recalcAllCreditDebts(debts, ajTransactions, ajWallets) {
  let changed = false;
  const updated = (debts || []).map(d => {
    const calc = calcCreditOutstanding(d, ajTransactions, ajWallets);
    if (calc === null) return d;
    const calcStr = String(Math.round(calc));
    if (d.outstanding === calcStr) return d;
    changed = true;
    return { ...d, outstanding: calcStr };
  });
  return changed ? updated : null;
}

/**
 * Checks if a transaction date conflicts with a debt's tanggal_outstanding.
 * Returns 'before' | 'same' | 'after' | 'no_snapshot'.
 */
function checkTxDateVsSnapshot(txDate, debt) {
  if (!debt.tanggal_outstanding) return 'no_snapshot';
  const snapshot = new Date(debt.tanggal_outstanding + 'T00:00:00');
  const tx = new Date(txDate + 'T00:00:00');
  if (tx < snapshot) return 'before';
  if (tx.getTime() === snapshot.getTime()) return 'same';
  return 'after';
}

export { getBillingPeriod, calcCreditOutstanding, recalcAllCreditDebts, checkTxDateVsSnapshot, CREDIT_DEBT_TO_WALLET };
