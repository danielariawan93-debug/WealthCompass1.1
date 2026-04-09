// /api/rates.js — Vercel serverless function (CommonJS)
// Multi-layer fallback: frankfurter.dev → open.er-api → exchangerate-api → jsDelivr CDN → hardcoded

const FALLBACK = { IDR: 1, USD: 16800, EUR: 19000, CNY: 2400, SGD: 13500 };
const CDN_BASE = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies';

// Try REST APIs for a single base→IDR rate
async function tryFetchIDR(base) {
  // Source 1: frankfurter.dev/v2
  try {
    const r = await fetch(`https://api.frankfurter.dev/v2/rates?base=${base}&quotes=IDR`, {
      headers: { Accept: 'application/json' },
    });
    if (r.ok) {
      const d = await r.json();
      if (d && d.rates && d.rates.IDR) return Math.round(d.rates.IDR);
    }
  } catch {}

  // Source 2: open.er-api.com (free, no key)
  try {
    const r = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    if (r.ok) {
      const d = await r.json();
      if (d && d.rates && d.rates.IDR) return Math.round(d.rates.IDR);
    }
  } catch {}

  // Source 3: exchangerate-api.com free tier
  try {
    const r = await fetch(`https://v6.exchangerate-api.com/v6/latest/${base}`);
    if (r.ok) {
      const d = await r.json();
      if (d && d.conversion_rates && d.conversion_rates.IDR) return Math.round(d.conversion_rates.IDR);
    }
  } catch {}

  return null;
}

// jsDelivr CDN — direct per-currency endpoints (no cross-rate math, more reliable)
async function fetchFromCDN() {
  const [usdRes, eurRes, cnyRes, sgdRes] = await Promise.all([
    fetch(`${CDN_BASE}/usd.json`),
    fetch(`${CDN_BASE}/eur.json`),
    fetch(`${CDN_BASE}/cny.json`),
    fetch(`${CDN_BASE}/sgd.json`),
  ]);
  if (!usdRes.ok || !eurRes.ok || !cnyRes.ok || !sgdRes.ok)
    throw new Error(`CDN HTTP errors: ${[usdRes, eurRes, cnyRes, sgdRes].map(r => r.status).join(',')}`);

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

  try {
    // Attempt parallel fetch from REST APIs
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
      return res.status(200).json({ rates, ts: Date.now(), source: 'live' });
    }

    // REST APIs failed — try jsDelivr CDN (direct per-currency, no cross-rate math)
    const cdnRates = await fetchFromCDN();
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ rates: cdnRates, ts: Date.now(), source: 'cdn' });

  } catch (err) {
    console.error('[/api/rates] All sources failed:', err.message);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      rates: FALLBACK,
      ts: Date.now(),
      source: 'fallback',
      error: err.message,
    });
  }
};
