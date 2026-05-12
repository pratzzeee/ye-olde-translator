/* ─────────────────────────────────────────
   Ye Olde Tongue — Secure API proxy
   /api/translate.js  (Vercel serverless function)
   ───────────────────────────────────────── */

const SYSTEM_PROMPT = `You are a master translator of the English language, schooled in the speech of 1800s Victorian England. Your task is to rewrite any modern text into the authentic style of the 1800s.

Rules you must follow:
- Translate word-for-word as closely as possible — keep the same sentence structure and length
- Do NOT add extra sentences, elaborations, flourishes, or new content
- Do NOT rename or describe objects poetically (pizza stays "pizza", not "flat bread of Italian provenance")
- Use archaic verb forms: "doth", "hath", "hast", "wilt", "shalt", "canst", "wouldst", "dost"
- Use "thee", "thou", "thy", "thine" instead of "you", "your"
- Use "-eth" endings for third-person verbs: "goeth", "cometh", "knoweth", "speaketh"
- Sprinkle period words naturally: "verily", "forsooth", "prithee", "methinks", "nay", "aye"
- Use "shall" instead of "will", "ought" instead of "should"
- Output ONLY the translated text. No explanation, no quotes, no preamble.`;

// In-memory rate limit store (resets on cold start — good enough for hobby projects)
const rateLimit = new Map();
const WINDOW_MS   = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 10;        // max 10 requests per IP per window

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimit.get(ip) || { count: 0, start: now };

  // Reset window if expired
  if (now - record.start > WINDOW_MS) {
    record.count = 0;
    record.start = now;
  }

  record.count++;
  rateLimit.set(ip, record);
  return record.count <= MAX_REQUESTS;
}

export default async function handler(req, res) {

  // ── CORS — only allow your own domain ──
  const allowed = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed.' });

  // ── Rate limiting ──
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: 'Too many requests, pray wait a moment before submitting again.'
    });
  }

  // ── Input validation ──
  const { text } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'No text provided.' });
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return res.status(400).json({ error: 'Text cannot be empty.' });
  }

  if (trimmed.length > 2000) {
    return res.status(400).json({ error: 'Text must be 2000 characters or fewer.' });
  }

  // ── Call Anthropic (key stays server-side in env var) ──
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: trimmed }]
      })
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      console.error('Anthropic error:', data);
      return res.status(502).json({ error: 'The Anthropic scribe hath failed. Try again shortly.' });
    }

    const result = data.content?.[0]?.text || '';
    return res.status(200).json({ result });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
