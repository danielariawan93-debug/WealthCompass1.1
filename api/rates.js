// /api/rates.js — Vercel serverless function (CommonJS, Node 20.x)
// Multi-layer fallback: frankfurter.dev → open.er-api → jsDelivr CDN → hardcoded

const FALLBACK = { IDR: 1, USD: 16800, EUR: 19000, CNY: 2400, SGD: 13500 };
const CDN_BASE = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies';

// Fetch with timeout (ms). AbortSignal.timeout requires Node 17.3+.
function fetchWithTimeout(url, ms = 4000, opts = {}) {
  return fetch(url, { ...opts, signal: AbortSignal.timeout(ms) });
}

// Try multiple REST APIs to get base→IDR rate. Returns null if all fail.
async function tryFetchIDR(base) {
  // Source 1: frankfurter.dev/v2
  try {
    const r = await fetchWithTimeout(
      `https://api.frankfurter.dev/v2/rates?base=${base}&quotes=IDR`,
      4000, { headers: { Accept: 'application/json' } }
    );
    if (r.ok) {
      const d = await r.json();
      if (d?.rates?.IDR) return Math.round(d.rates.IDR);
    }
  } catch {}

  // Source 2: open.er-api.com (free, no key)
  try {
    const r = await fetchWithTimeout(`https://open.er-api.com/v6/latest/${base}`, 4000);
    if (r.ok) {
      const d = await r.json();
      if (d?.rates?.IDR) return Math.round(d.rates.IDR);
    }
  } catch {}

  return null;
}

// jsDelivr CDN — direct per-currency endpoints (no cross-rate math, always accessible)
async function fetchFromCDN() {
  const [usdRes, eurRes, cnyRes, sgdRes] = await Promise.all([
    fetchWithTimeout(`${CDN_BASE}/usd.json`, 5000),
    fetchWithTimeout(`${CDN_BASE}/eur.json`, 5000),
    fetchWithTimeout(`${CDN_BASE}/cny.json`, 5000),
    fetchWithTimeout(`${CDN_BASE}/sgd.json`, 5000),
  ]);

  if (!usdRes.ok || !eurRes.ok || !cnyRes.ok || !sgdRes.ok) {
    const codes = [usdRes.status, eurRes.status, cnyRes.status, sgdRes.status];
    throw new Error(`CDN HTTP ${codes.join(',')}`);
  }

  const [usdD, eurD, cnyD, sgdD] = await Promise.all([
    usdRes.json(), eurRes.json(), cnyRes.json(), sgdRes.json(),
  ]);

  if (!usdD?.usd?.idr) throw new Error('CDN: usd.idr missing');
  if (!eurD?.eur?.idr) throw new Error('CDN: eur.idr missing');
  if (!cnyD?.cny?.idr) throw new Error('CDN: cny.idr missing');
  if (!sgdD?.sgd?.idr) throw new Error('CDN: sgd.idr missing');

  return {
    IDR: 1,
    USD: Math.round(usdD.usd.idr),
    EUR: Math.round(eurD.eur.idr),
    CNY: Math.round(cnyD.cny.idr),
    SGD: Math.round(sgdD.sgd.idr),
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Guard: Node 18+ required for global fetch
  if (typeof fetch === 'undefined') {
    console.error('[/api/rates] fetch is not defined — Node version too old (need 18+)');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      rates: FALLBACK, ts: Date.now(), source: 'fallback',
      error: 'fetch unavailable: upgrade Node to 18+',
    });
  }

  try {
    // Layer 1: REST APIs in parallel (4 currencies, up to 2 sources each, 4s timeout)
    const [usd, eur, cny, sgd] = await Promise.all([
      tryFetchIDR('USD'),
      tryFetchIDR('EUR'),
      tryFetchIDR('CNY'),
      tryFetchIDR('SGD'),
    ]);

    if (usd && eur && cny && sgd) {
      const rates = { IDR: 1, USD: usd, EUR: eur, CNY: cny, SGD: sgd };
      res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=300');
      res.setHeader('Access-Control-Allow-Origin', '*');
      console.log('[/api/rates] source=live', rates);
      return res.status(200).json({ rates, ts: Date.now(), source: 'live' });
    }

    // Layer 2: jsDelivr CDN (direct per-currency, no cross-rate math)
    const cdnRates = await fetchFromCDN();
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    console.log('[/api/rates] source=cdn', cdnRates);
    return res.status(200).json({ rates: cdnRates, ts: Date.now(), source: 'cdn' });

  } catch (err) {
    console.error('[/api/rates] All sources failed:', err.message);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      rates: FALLBACK, ts: Date.now(), source: 'fallback',
      error: err.message,
    });
  }
};
