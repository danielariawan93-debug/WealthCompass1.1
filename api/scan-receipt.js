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

  const { imageBase64, mimeType } = req.body || {};
  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const isPdf = mimeType === 'application/pdf';
  const finalMimeType = isPdf ? 'application/pdf'
    : validImageTypes.includes(mimeType) ? mimeType : 'image/jpeg';

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
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              isPdf
                ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: imageBase64 } }
                : { type: 'image', source: { type: 'base64', media_type: finalMimeType, data: imageBase64 } },
              {
                type: 'text',
                text: 'Ekstrak semua data dari struk/receipt ini. Kembalikan HANYA JSON valid tanpa teks lain:\n{"storeName":"nama toko","date":"YYYY-MM-DD","items":[{"name":"nama item","qty":1,"amount":0}],"total":0}\n\nGunakan tanggal hari ini jika tanggal tidak terbaca. Jumlah dalam angka bulat (Rupiah). Jika bukan struk, kembalikan {"storeName":"","date":"","items":[],"total":0}',
              },
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
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(422).json({ error: 'Tidak dapat membaca struk dari gambar ini' });
    }

    const parsed = JSON.parse(match[0]);
    return res.json(parsed);
  } catch (e) {
    console.error('scan-receipt error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
