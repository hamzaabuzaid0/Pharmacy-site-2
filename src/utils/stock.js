// Whether `product` is in stock at `branchId` — the one place this check
// happens, so every component agrees on what "in stock" means for a given
// branch, live-Supabase or static-fallback catalog alike (see
// CatalogContext.jsx — both shapes carry a stockByBranch map).
export function isInStock(product, branchId) {
  if (!product || !branchId) return false;
  return !!product.stockByBranch?.[branchId];
}
