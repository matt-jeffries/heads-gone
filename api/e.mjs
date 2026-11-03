// Anonymous event counter. Stores daily totals only: "date:event" -> {pack id: count}.
// Nothing about the sender (IP, device, id) is read or kept.
// Storage: Upstash Redis connected through the Vercel dashboard (Storage tab), which sets the env vars below.
const EVENTS = new Set(["open", "turn", "finish", "buy_view", "purchase", "code", "myclub"]);
const ID = /^[a-z0-9_-]{0,40}$/;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).end();
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  const e = body?.e, p = String(body?.p ?? "");
  if (!EVENTS.has(e) || !ID.test(p)) return res.status(400).end();
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return res.status(204).end();
  const key = `hg:${new Date().toISOString().slice(0, 10)}:${e}`;
  try {
    await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["HINCRBY", key, p || "-", 1], ["EXPIRE", key, 60 * 60 * 24 * 400]]),
    });
  } catch {}
  res.status(204).end();
}
