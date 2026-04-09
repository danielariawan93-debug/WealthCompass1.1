// /api/rates.js — Vercel serverless function
// Fetches USD/EUR/CNY/SGD vs IDR from Frankfurter (ECB data).
// Running server-side avoids CORS issues that occur with direct browser fetches.

export default async function handler(req, res) {
  // Allow GET only
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(
      'https://api.frankfurter.app/latest?from=IDR&to=USD,EUR,CNY,SGD',
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`Frankfurter returned ${response.status}`);
    }

    const data = await response.json();

    // Frankfurter returns: "how many USD per 1 IDR", so we invert to get IDR per 1 foreign unit
    const rates = {
      IDR: 1,
      USD: data.rates?.USD ? Math.round(1 / data.rates.USD) : 16800,
      EUR: data.rates?.EUR ? Math.round(1 / data.rates.EUR) : 19000,
      CNY: data.rates?.CNY ? Math.round(1 / data.rates.CNY) : 2400,
      SGD: data.rates?.SGD ? Math.round(1 / data.rates.SGD) : 13000,
    };

    // Cache at CDN layer for 30 minutes, stale-while-revalidate 5 min
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ rates, ts: Date.now(), source: 'frankfurter' });
  } catch (err) {
    console.error('[/api/rates] Fetch failed:', err.message);
    // Return fallback rates so client still gets something usable
    return res.status(200).json({
      rates: { IDR: 1, USD: 16800, EUR: 19000, CNY: 2400, SGD: 13000 },
      ts: Date.now(),
      source: 'fallback',
      error: err.message,
    });
  }
}
