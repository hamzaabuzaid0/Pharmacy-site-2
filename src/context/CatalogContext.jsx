import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { products as staticProducts } from '../data/products';
import { branches as staticBranchesRaw } from '../data/branches';
import { translations } from '../i18n/translations';

const CatalogContext = createContext(null);

// Normalizes the two possible sources (live Supabase rows, or the bundled
// static demo data) into one shape everywhere else in the app can rely on:
//   product: { id, ar, en, cat, price, rx, arabicOnly, activeIngredient,
//              similarGroup, imageUrl, stockByBranch: { [branchId]: bool } }
//   branch:  { id, nameAr, nameEn, addrAr, addrEn, waPhone, callPhone,
//              waDisplay, callDisplay, deliveryFee }
// See src/utils/stock.js for how components read stockByBranch, and
// src/utils/branchText.js for branch name/address. Static fallback gives
// every product the SAME stock value on both branches (there's no
// per-branch distinction possible without a real database) — it exists so
// the site keeps working exactly as before if Supabase isn't configured
// yet, not as a long-term data source.
function staticBranchesNormalized() {
  return staticBranchesRaw.map((b) => ({
    id: b.id,
    nameAr: translations.ar[b.nameKey], nameEn: translations.en[b.nameKey],
    addrAr: translations.ar[b.addrKey], addrEn: translations.en[b.addrKey],
    waPhone: b.waPhone, callPhone: b.callPhone,
    waDisplay: b.waDisplay, callDisplay: b.callDisplay,
    deliveryFee: b.deliveryFee,
  }));
}

function staticProductsNormalized() {
  const branchIds = staticBranchesRaw.map((b) => b.id);
  return staticProducts.map((p) => ({
    id: p.id, ar: p.ar, en: p.en, cat: p.cat, price: p.price, rx: p.rx,
    arabicOnly: !!p.arabicOnly, activeIngredient: p.activeIngredient || null,
    similarGroup: p.similarGroup || null, imageUrl: p.image || null,
    stockByBranch: Object.fromEntries(branchIds.map((id) => [id, !!p.stock])),
  }));
}

function normalizeBranchRows(rows) {
  return (rows || []).map((b) => ({
    id: b.id, nameAr: b.name_ar, nameEn: b.name_en, addrAr: b.addr_ar, addrEn: b.addr_en,
    waPhone: b.wa_phone, callPhone: b.call_phone, waDisplay: b.wa_display, callDisplay: b.call_display,
    deliveryFee: Number(b.delivery_fee),
  }));
}

function normalizeProductRows(productRows, stockRows) {
  const stockByProduct = {};
  (stockRows || []).forEach((s) => {
    (stockByProduct[s.product_id] ||= {})[s.branch_id] = s.in_stock;
  });
  return (productRows || []).map((p) => ({
    id: p.id, ar: p.ar, en: p.en, cat: p.cat, price: Number(p.price), rx: p.rx,
    arabicOnly: p.arabic_only, activeIngredient: p.active_ingredient, similarGroup: p.similar_group,
    imageUrl: p.image_url, stockByBranch: stockByProduct[p.id] || {},
  }));
}

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState(isSupabaseConfigured ? [] : staticProductsNormalized());
  const [branches, setBranches] = useState(isSupabaseConfigured ? [] : staticBranchesNormalized());
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const [branchRes, productRes, stockRes] = await Promise.all([
      supabase.from('branches').select('*'),
      supabase.from('products').select('*'),
      supabase.from('branch_stock').select('*'),
    ]);
    const firstError = branchRes.error || productRes.error || stockRes.error;
    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }
    setError(null);
    setBranches(normalizeBranchRows(branchRes.data));
    setProducts(normalizeProductRows(productRes.data, stockRes.data));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    reload();

    // Any staff change to stock or the product list re-pulls everything.
    // A full refetch (rather than patching the changed row into state) is
    // deliberate — this catalog is a few dozen rows, so the simplicity and
    // correctness of "always reflect exactly what's in the database" beats
    // the complexity of a hand-rolled merge that could drift out of sync.
    const channel = supabase
      .channel('catalog-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'branch_stock' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, reload)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [reload]);

  const value = useMemo(
    () => ({ products, branches, loading, error, isLive: isSupabaseConfigured, reload }),
    [products, branches, loading, error, reload]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside a CatalogProvider');
  return ctx;
}
