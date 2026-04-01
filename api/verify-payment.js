module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const isProduction = process.env.MIDTRANS_ENV === 'production';
  if (!serverKey) {
    return res.status(500).json({ error: 'MIDTRANS_SERVER_KEY not configured.' });
  }

  const orderId = req.query.order_id || req.body?.order_id;
  if (!orderId) return res.status(400).json({ error: 'Missing order_id' });

  const baseUrl = isProduction
    ? `https://api.midtrans.com/v2/${encodeURIComponent(orderId)}/status`
    : `https://api.sandbox.midtrans.com/v2/${encodeURIComponent(orderId)}/status`;

  const auth = Buffer.from(serverKey + ':').toString('base64');

  try {
    const response = await fetch(baseUrl, {
      headers: { 'Authorization': `Basic ${auth}` },
    });
    const data = await response.json();

    const successStatuses = ['capture', 'settlement'];
    const isSuccess = successStatuses.includes(data.transaction_status);

    // Parse pulse from order_id: WC-PULSE-{uid}-{pulse}-{timestamp}
    const parts = orderId.split('-');
    // format: WC PULSE {uid} {pulse} {timestamp}
    // uid can contain dashes too, so count from end
    const pulse = parts[parts.length - 2];  // second from end is pulse
    const uid = parts.slice(2, parts.length - 2).join('-');  // everything between PULSE and pulse

    return res.status(200).json({
      success: isSuccess,
      transaction_status: data.transaction_status,
      payment_type: data.payment_type,
      pulse: isSuccess ? parseInt(pulse, 10) : 0,
      uid: isSuccess ? uid : null,
      orderId,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify payment', message: err.message });
  }
};
