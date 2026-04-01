const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return res.status(500).json({ error: 'Server key not configured' });

  const body = req.body;
  const { order_id, status_code, gross_amount, signature_key, transaction_status } = body;

  // Verify Midtrans signature: SHA512(order_id + status_code + gross_amount + serverKey)
  const expected = crypto
    .createHash('sha512')
    .update(order_id + status_code + gross_amount + serverKey)
    .digest('hex');

  if (signature_key !== expected) {
    console.warn('Midtrans notification: invalid signature', { order_id });
    return res.status(403).json({ error: 'Invalid signature' });
  }

  const successStatuses = ['capture', 'settlement'];
  const isSuccess = successStatuses.includes(transaction_status);

  console.log('Midtrans notification:', {
    order_id,
    transaction_status,
    isSuccess,
  });

  // Payment is verified — frontend handles Pulse credit via onSuccess callback + verify-payment.
  // This endpoint just acknowledges the notification to Midtrans.
  return res.status(200).json({ ok: true, order_id, transaction_status });
};
