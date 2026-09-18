// Whether `product` is in stock at `branchId` — the one place this check
// happens, so every component agrees on what "in stock" means for a given
// branch, live-Supabase or static-fallback catalog alike (see
// CatalogContext.jsx — both shapes carry a stockByBranch map).
export function isInStock(product, branchId) {
  if (!product || !branchId) return false;
  return !!product.stockByBranch?.[branchId];
}

// Whether `branchId` carries `product` at all (in stock or not). A branch
// carries a product when its stock map has an entry for that branch — with
// Supabase that means a branch_stock row exists. The shop only lists what
// the chosen branch carries, so once each branch has its own stock rows,
// each branch automatically shows its own range. The static catalog gives
// every product an entry for every branch, so today both show everything.
export function isCarried(product, branchId) {
  if (!product || !branchId) return false;
  return Object.prototype.hasOwnProperty.call(product.stockByBranch || {}, branchId);
}

// In stock at ANY branch — used only before a branch is chosen, so cards
// don't all read "out of stock" in the moment before the picker is answered.
export function isInStockAnywhere(product) {
  return Object.values(product?.stockByBranch || {}).some(Boolean);
}
