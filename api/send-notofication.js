// api/send-notification.js
const RESEND_KEY = process.env.RESEND_API_KEY;

async function sendEmailNotification(type, payload) {
  const subjects = {
    debt_due: `[WealthCompass] Pengingat Jatuh Tempo: ${payload.name}`,
    subscription_expiry: `[WealthCompass] Langganan Anda Segera Berakhir`,
  };
  const bodies = {
    debt_due: `Halo ${payload.userName},\n\nHutang "${payload.name}" jatuh tempo pada ${payload.dueDate}.\nSisa: Rp ${payload.amount?.toLocaleString("id-ID")}.\n\nSalam,\nWealthCompass`,
    subscription_expiry: `Halo ${payload.userName},\n\nLangganan ${payload.tier} Anda berakhir pada ${payload.expiryDate}.\nPerbarui sekarang agar tidak kehilangan akses.\n\nSalam,\nWealthCompass`,
  };
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "noreply@wealthcompass.app",
      to: payload.email,
      subject: subjects[type],
      text: bodies[type],
    }),
  });
  return r.ok;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();
  const { type, payload } = req.body;
  if (!type || !payload) return res.status(400).json({ error: "Missing type or payload" });
  if (!RESEND_KEY) return res.status(500).json({ error: "RESEND_API_KEY not set" });
  const ok = await sendEmailNotification(type, payload);
  return res.status(ok ? 200 : 500).json({ ok });
};
