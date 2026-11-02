// Google Play Billing for the Android app (a Trusted Web Activity), via the Digital Goods API.
// On the website none of this exists, so Billing.available stays false and the game falls back.
// Product IDs: "pack_<pack id>" for one pack, "all_clubs" for every club pack.
window.Billing = (() => {
  const PLAY = "https://play.google.com/billing";
  let service = null;
  const prices = {};
  const fmt = (p) => { try { return new Intl.NumberFormat(undefined, { style: "currency", currency: p.currency }).format(Number(p.value)); } catch { return `${p.value} ${p.currency}`; } };

  async function init(itemIds) {
    if (!("getDigitalGoodsService" in window)) return false;
    try { service = await window.getDigitalGoodsService(PLAY); } catch { service = null; }
    if (!service) return false;
    try {
      // getDetails takes a list; ask in chunks to stay well inside any limit.
      for (let i = 0; i < itemIds.length; i += 50) {
        for (const d of await service.getDetails(itemIds.slice(i, i + 50))) prices[d.itemId] = fmt(d.price);
      }
    } catch (e) { console.warn("Billing details failed", e); }
    return true;
  }
  // Item ids the player already owns on this Google account.
  async function owned() {
    if (!service) return [];
    try { return (await service.listPurchases()).map((p) => p.itemId); } catch { return []; }
  }
  // Opens Google's payment sheet. Resolves true when paid, false when cancelled.
  async function buy(itemId) {
    if (!service || !window.PaymentRequest) return false;
    const req = new PaymentRequest([{ supportedMethods: PLAY, data: { sku: itemId } }],
      { total: { label: "Total", amount: { currency: "GBP", value: "0" } } });
    try {
      const res = await req.show();
      await res.complete("success");
      return Boolean(res.details && res.details.purchaseToken);
    } catch (e) {
      if (e && e.name !== "AbortError") console.warn("Purchase failed", e);
      return false;
    }
  }
  return { init, owned, buy, prices, get available() { return Boolean(service); } };
})();
