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

  const { packageId, pulse, priceIDR, userEmail, uid } = req.body;
  if (!packageId || !pulse || !priceIDR || !uid) {
    return res.status(400).json({ error: 'Missing required fields: packageId, pulse, priceIDR, uid' });
  }

  // Encode pulse & uid in order_id so we can parse it back on verification
  const orderId = `WC-PULSE-${uid}-${pulse}-${Date.now()}`;

  const snapUrl = isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  const auth = Buffer.from(serverKey + ':').toString('base64');

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
          id: packageId,
          price: priceIDR,
          quantity: 1,
          name: `WealthCompass ${pulse} Pulse Credit`,
        }],
        customer_details: { email: userEmail || '' },
        custom_field1: String(pulse),
        custom_field2: uid,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error_messages?.join(', ') || 'Midtrans error', detail: data });
    }
    return res.status(200).json({ token: data.token, redirect_url: data.redirect_url, orderId });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create transaction', message: err.message });
  }
};
