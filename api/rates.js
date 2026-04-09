// /api/rates.js — Vercel serverless function (CommonJS)
// Multi-layer fallback: frankfurter.dev → open.er-api → jsDelivr CDN → hardcoded fallback

const FALLBACK = { IDR: 1, USD: 16800, EUR: 19000, CNY: 2400, SGD: 13500 };

// Try a single base→IDR fetch from multiple REST APIs
async function tryFetchIDR(base) {
  // Source 1: frankfurter.dev/v2
  try {
    const r = await fetch(
      `https://api.frankfurter.dev/v2/rates?base=${base}&quotes=IDR`,
      { headers: { Accept: 'application/json' } }
    );
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

// jsDelivr CDN — @fawazahmed0/currency-api — accessible from any environment
async function fetchFromCDN() {
  const r = await fetch(
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json'
  );
  if (!r.ok) throw new Error(`CDN HTTP ${r.status}`);
  const d = await r.json();
  const usd = d && d.usd;
  if (!usd || !usd.idr) throw new Error('CDN: usd.idr missing');
  return {
    IDR: 1,
    USD: Math.round(usd.idr),
    EUR: Math.round(usd.idr / usd.eur),
    CNY: Math.round(usd.idr / usd.cny),
    SGD: Math.round(usd.idr / usd.sgd),
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

    // REST APIs failed — try jsDelivr CDN (server-side)
    const cdnRates = await fetchFromCDN();
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ rates: cdnRates, ts: Date.now(), source: 'cdn' });

  } catch (err) {
    console.error('[/api/rates] All sources failed:', err.message);
    // Return fallback — client will try CDN directly on source:'fallback'
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      rates: FALLBACK,
      ts: Date.now(),
      source: 'fallback',
      error: err.message,
    });
  }
};
