module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const isProduction = process.env.MIDTRANS_ENV === 'production';
  if (!serverKey) {
    return res.status(500).json({ error: 'MIDTRANS_SERVER_KEY not configured in Vercel env vars.' });
  }

  const { tierChoice, planId, priceIDR, pulse, days, userEmail, uid } = req.body;
  if (!tierChoice || !planId || !priceIDR || !uid) {
    return res.status(400).json({ error: 'Missing required fields: tierChoice, planId, priceIDR, uid' });
  }

  // Encode tier & planId in order_id so we can identify the purchase
  const orderId = `WC-SUB-${uid}-${tierChoice}-${planId}-${Date.now()}`;

  const snapUrl = isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  const auth = Buffer.from(serverKey + ':').toString('base64');

  const tierLabel = tierChoice === 'proplus' ? 'Pro+' : 'Pro';
  const planLabel = planId === 'monthly' ? 'Bulanan' : planId === 'biannual' ? '6 Bulan' : 'Tahunan';

  try {
    const response = await fetch(snapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: priceIDR },
        item_details: [{
          id: `${tierChoice}-${planId}`,
          price: priceIDR,
          quantity: 1,
          name: `WealthCompass ${tierLabel} ${planLabel}`,
        }],
        customer_details: { email: userEmail || '' },
        custom_field1: tierChoice,
        custom_field2: String(pulse || 0),
        custom_field3: String(days || 30),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error_messages?.join(', ') || 'Midtrans error', detail: data });
    }
    return res.status(200).json({ token: data.token, redirect_url: data.redirect_url, orderId });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create subscription transaction', message: err.message });
  }
};
