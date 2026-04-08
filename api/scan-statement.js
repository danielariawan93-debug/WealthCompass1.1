module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const apiKey =
    process.env.WealthCompass_API_KEY ||
    process.env.WealthCompasss_API_KEY ||
    process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { imageBase64, mimeType, mode } = req.body || {};
  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const finalMimeType = validMimeTypes.includes(mimeType) ? mimeType : 'image/jpeg';

  // mode: "summary" (Wealth Pulse) | "transactions" (Artha Journey)
  const isTransactions = mode === 'transactions';

  const prompt = isTransactions
    ? 'Ekstrak semua transaksi dari e-statement kartu kredit ini. Kembalikan HANYA JSON array valid tanpa teks lain:\n[{"name":"deskripsi transaksi","amount":150000,"date":"YYYY-MM-DD","txType":"expense"}]\n\ntxType: "expense" untuk tagihan/pengeluaran/debit, "credit_entry" untuk pembayaran masuk/refund/kredit/bonus. Jumlah dalam angka positif (Rupiah). Tanggal format YYYY-MM-DD. Jika bukan e-statement CC, kembalikan [].'
    : 'Ekstrak data ringkasan dari e-statement kartu kredit ini. Kembalikan HANYA JSON valid tanpa teks lain:\n{"total_tagihan":0,"tanggal_jatuh_tempo":"YYYY-MM-DD","sisa_cicilan":0,"sisa_limit":0}\n\ntotal_tagihan: total tagihan bulan ini. tanggal_jatuh_tempo: tanggal jatuh tempo pembayaran (YYYY-MM-DD). sisa_cicilan: sisa cicilan (0 jika tidak ada). sisa_limit: sisa limit tersedia. Jumlah dalam angka bulat Rupiah. Jika tidak terbaca kembalikan 0.';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: isTransactions ? 2048 : 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: finalMimeType, data: imageBase64 },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errBody.error?.message || 'Anthropic API error' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    if (isTransactions) {
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) return res.status(422).json({ error: 'Tidak dapat membaca transaksi dari e-statement' });
      const parsed = JSON.parse(match[0]);
      return res.json({ transactions: parsed });
    } else {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return res.status(422).json({ error: 'Tidak dapat membaca ringkasan dari e-statement' });
      const parsed = JSON.parse(match[0]);
      return res.json(parsed);
    }
  } catch (e) {
    console.error('scan-statement error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
