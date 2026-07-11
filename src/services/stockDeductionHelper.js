// stockDeductionHelper.js
//
// Bridges the AI's "used_items" (from /api/ai/extract-stock-usage, matched
// by item name) to the existing Node.js stock inventory backend, which only
// knows stock items by _id. Mirrors the same GET-all / PATCH-quantity
// pattern already used in StockManagementPage.jsx.

const STOCK_API_BASE = 'https://punto-production-21ed.up.railway.app/api/v1/stock';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const normalizeName = (s = '') => s.trim().toLowerCase();

/**
 * Deducts each { item_name, quantity } from the company's stock by looking
 * up the matching item (case-insensitive name match) and reducing its
 * quantity. Items that can't be matched are reported back, not silently dropped.
 *
 * @param {Array<{ item_name: string, quantity: number }>} usedItems
 * @returns {Promise<{ deducted: Array, notFound: Array, failed: Array }>}
 */
export async function deductStockItems(usedItems = []) {
  const res = await fetch(STOCK_API_BASE, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Could not load stock inventory (HTTP ${res.status})`);
  const json = await res.json();
  const stockItems = Array.isArray(json) ? json : (json.data?.data ?? json.data ?? []);

  const deducted = [];
  const notFound = [];
  const failed = [];

  for (const used of usedItems) {
    const match = stockItems.find((s) => normalizeName(s.name) === normalizeName(used.item_name));
    if (!match) {
      notFound.push(used);
      continue;
    }
    const newQty = Math.max(0, (match.quantity ?? 0) - (used.quantity ?? 0));
    try {
      const patchRes = await fetch(`${STOCK_API_BASE}/${match._id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quantity: newQty }),
      });
      if (!patchRes.ok) throw new Error(`HTTP ${patchRes.status}`);
      deducted.push({ ...used, newQty });
    } catch (err) {
      failed.push({ ...used, error: err.message });
    }
  }

  return { deducted, notFound, failed };
}
