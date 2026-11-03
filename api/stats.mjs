// Totals for the last N days, for Matt only: /api/stats?key=<STATS_KEY>&days=30
const EVENTS = ["open", "turn", "finish", "buy_view", "purchase", "code", "myclub"];
const LABELS = { open: "App opened", turn: "Turns played", finish: "Games finished", buy_view: "Buy screen opened",
  purchase: "Purchases", code: "Discount code used", myclub: "Picked as my club" };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const want = process.env.STATS_KEY;
  if (!want || req.query.key !== want) return res.status(404).send("Not found");
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return res.status(500).send("Storage isn't connected yet.");
  const days = Math.min(400, Math.max(1, parseInt(req.query.days, 10) || 30));
  const dates = [];
  for (let i = 0; i < days; i++) dates.push(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  const cmds = [];
  for (const d of dates) for (const e of EVENTS) cmds.push(["HGETALL", `hg:${d}:${e}`]);
  const out = await fetch(`${url}/pipeline`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(cmds),
  }).then((r) => r.json());
  const tot = {}, byDay = {};
  let i = 0;
  for (const d of dates) for (const e of EVENTS) {
    const flat = out[i++]?.result || [];
    for (let j = 0; j < flat.length; j += 2) {
      const n = Number(flat[j + 1]);
      (tot[e] ||= {})[flat[j]] = (tot[e][flat[j]] || 0) + n;
      (byDay[d] ||= {})[e] = (byDay[d][e] || 0) + n;
    }
  }
  const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
  const top = (e) => Object.entries(tot[e] || {}).sort((a, b) => b[1] - a[1]).slice(0, 25)
    .map(([k, n]) => `<tr><td>${esc(k)}</td><td>${n}</td></tr>`).join("") || "<tr><td colspan=2>None yet</td></tr>";
  const conv = sum(tot.buy_view) ? ((sum(tot.purchase) / sum(tot.buy_view)) * 100).toFixed(1) + "%" : "–";
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><title>Head's Gone stats</title>
<style>body{font:15px/1.5 system-ui;margin:0;padding:16px;background:#0c1a42;color:#f3efe4}h1{margin:0 0 4px}h2{color:#f5c244;font-size:17px;margin:24px 0 6px}
table{border-collapse:collapse;width:100%;max-width:560px}td,th{text-align:left;padding:4px 8px;border-bottom:1px solid #2a4185}td:last-child,th:last-child{text-align:right}a{color:#f5c244}</style>
<h1>Head's Gone stats</h1><p>Last ${days} days · <a href="?key=${esc(req.query.key)}&days=7">7</a> · <a href="?key=${esc(req.query.key)}&days=30">30</a> · <a href="?key=${esc(req.query.key)}&days=365">365</a></p>
<table>${EVENTS.map((e) => `<tr><td>${LABELS[e]}</td><td>${sum(tot[e])}</td></tr>`).join("")}<tr><td>Buy screen → purchase</td><td>${conv}</td></tr></table>
<h2>Opened from</h2><table>${top("open")}</table>
<h2>Most played packs (turns)</h2><table>${top("turn")}</table>
<h2>Buy screen opened, by pack</h2><table>${top("buy_view")}</table>
<h2>Purchases</h2><table>${top("purchase")}</table>
<h2>Clubs people support</h2><table>${top("myclub")}</table>
<h2>By day</h2><table><tr><th>Date</th><th>Opens</th><th>Turns</th><th>Buy views</th><th>Purchases</th></tr>${dates.map((d) => `<tr><td>${d}</td><td>${byDay[d]?.open || 0}</td><td>${byDay[d]?.turn || 0}</td><td>${byDay[d]?.buy_view || 0}</td><td>${byDay[d]?.purchase || 0}</td></tr>`).join("")}</table>`);
}
