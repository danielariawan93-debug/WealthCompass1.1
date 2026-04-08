// creditSync.js — shared utilities for CC/Paylater ↔ Wealth Pulse sync
// Single source of truth: debts array (Wealth Pulse)

/** Maps debt.type → AJ wallet type */
const CREDIT_DEBT_TO_WALLET = { paylater: "Paylater", cc: "Kartu Kredit" };

/**
 * Returns the current billing period for a credit debt.
 *
 * If debt.renewalDate is set (e.g. "2026-04-25"):
 *   start = most recent past renewal day (or today if today == renewalDay)
 *   end   = start + 1 month - 1 day
 *   Example: renewal = 25 → period = March 25 – April 24
 *
 * Otherwise: 1st–last day of current calendar month.
 */
function getBillingPeriod(debt) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (debt.renewalDate) {
    const parts = debt.renewalDate.split("-");
    // Clamp to 28 so February never overflows
    const renewalDay = Math.min(parseInt(parts[2] || parts[1] || 1, 10), 28);

    let start = new Date(today.getFullYear(), today.getMonth(), renewalDay);
    if (start > today) {
      // This month's renewal hasn't arrived yet → use last month's
      start = new Date(today.getFullYear(), today.getMonth() - 1, renewalDay);
    }
    // End = one day before next renewal
    const end = new Date(start.getFullYear(), start.getMonth() + 1, renewalDay - 1);
    return { start, end };
  }

  // Default: calendar month
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start, end };
}

/**
 * Calculates net outstanding for a CC/Paylater debt from AJ transactions
 * within the current billing period.
 *
 * Returns null if:
 *   - debt is not a credit type, OR
 *   - no linked AJ wallets found (nothing to calculate from)
 *
 * Formula: max(0, gross_expenses − debt_payments) within billing period
 */
function calcCreditOutstanding(debt, ajTransactions, ajWallets) {
  const walletType = CREDIT_DEBT_TO_WALLET[debt.type];
  if (!walletType) return null;

  // Linked wallets: explicitly linked (debtId) OR unlinked wallets of same type
  const linked = (ajWallets || []).filter(
    w => w.debtId === debt.id || (w.type === walletType && !w.debtId)
  );
  if (linked.length === 0) return null;

  const linkedIds = new Set(linked.map(w => w.id));
  const { start, end } = getBillingPeriod(debt);

  const inPeriod = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr + "T00:00:00");
    return d >= start && d <= end;
  };

  const spending = (ajTransactions || [])
    .filter(t => t.type === "expense" && linkedIds.has(t.walletId) && inPeriod(t.date))
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const payments = (ajTransactions || [])
    .filter(t => t.type === "debt_payment" && t.debtId === debt.id && inPeriod(t.date))
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  return Math.max(0, spending - payments);
}

/**
 * Walks all debts and recalculates outstanding for every CC/Paylater entry
 * that has linked AJ wallets.  Returns a new array only when something
 * actually changed; otherwise returns null so callers can skip setState.
 */
function recalcAllCreditDebts(debts, ajTransactions, ajWallets) {
  let changed = false;
  const updated = (debts || []).map(d => {
    const calc = calcCreditOutstanding(d, ajTransactions, ajWallets);
    if (calc === null) return d; // not a credit debt or no linked wallet
    const calcStr = String(Math.round(calc));
    if (d.outstanding === calcStr) return d;
    changed = true;
    return { ...d, outstanding: calcStr };
  });
  return changed ? updated : null;
}

export { getBillingPeriod, calcCreditOutstanding, recalcAllCreditDebts, CREDIT_DEBT_TO_WALLET };
