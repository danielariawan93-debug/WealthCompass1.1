// /api/rates.js — Vercel serverless function (CommonJS, consistent with other api/*.js)
// Fetches live IDR rates for USD, EUR, CNY, SGD from frankfurter.dev/v2.
// Running server-side avoids CORS issues with direct browser fetches.

const FALLBACK = { IDR: 1, USD: 16800, EUR: 19000, CNY: 2400, SGD: 13500 };

async function fetchRate(base) {
  const res = await fetch(
    `https://api.frankfurter.dev/v2/rates?base=${base}&quotes=IDR`,
    { headers: { Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(`${base}: HTTP ${res.status}`);
  const data = await res.json();
  const idr = data && data.rates && data.rates.IDR;
  if (!idr) throw new Error(`${base}: IDR missing in response`);
  return Math.round(idr);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all 4 currencies in parallel
    const [usd, eur, cny, sgd] = await Promise.all([
      fetchRate('USD'),
      fetchRate('EUR'),
      fetchRate('CNY'),
      fetchRate('SGD'),
    ]);

    const rates = { IDR: 1, USD: usd, EUR: eur, CNY: cny, SGD: sgd };

    // CDN cache 30 min, stale-while-revalidate 5 min
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ rates, ts: Date.now(), source: 'frankfurter.dev/v2' });

  } catch (err) {
    console.error('[/api/rates] Fetch failed:', err.message);
    // Return fallback so client always gets usable data
    return res.status(200).json({
      rates: FALLBACK,
      ts: Date.now(),
      source: 'fallback',
      error: err.message,
    });
  }
};
