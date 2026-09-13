import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useCatalog } from './CatalogContext';

const CartContext = createContext(null);

// Both the live Supabase branches and the static-fallback ones use the same
// 'b1'/'b2' ids (see supabase/schema.sql) specifically so a fixed default
// here works either way, without waiting on the catalog to finish loading.
const DEFAULT_BRANCH_ID = 'b1';

// The basket survives a refresh, a closed tab, and coming back tomorrow.
// It used to live in memory only, which on a patchy phone connection meant
// a reload silently threw away a basket someone had just spent minutes
// filling. Stored per-browser, same as order history.
const STORAGE_KEY = 'pharmacy_cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return null;
    return {
      cart: saved.cart && typeof saved.cart === 'object' ? saved.cart : {},
      selectedBranch: typeof saved.selectedBranch === 'string' ? saved.selectedBranch : DEFAULT_BRANCH_ID,
      substitutes: saved.substitutes && typeof saved.substitutes === 'object' ? saved.substitutes : {},
    };
  } catch {
    return null;
  }
}

export function CartProvider({ children }) {
  const { products, branches } = useCatalog();
  const saved = useMemo(loadCart, []);
  const [cart, setCart] = useState(() => saved?.cart ?? {}); // productId -> qty
  const [selectedBranch, setSelectedBranch] = useState(() => saved?.selectedBranch ?? DEFAULT_BRANCH_ID);
  // substituteProductId -> { originalId, matchType }. Only set for cart
  // lines added via an "alternative for X" suggestion (see AlternativeModal
  // / findAlternatives.js) — used to disclose the swap to the pharmacist in
  // the WhatsApp message and to note it in the cart/order-history UI.
  // matchType ('ingredient' | 'similar') controls the wording used, since a
  // same-active-ingredient claim and a looser same-category suggestion are
  // not the same kind of promise.
  const [substitutes, setSubstitutes] = useState(() => saved?.substitutes ?? {});

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cart, selectedBranch, substitutes }));
    } catch {
      // localStorage unavailable (private browsing, quota) — the cart just
      // goes back to being in-memory for this visit
    }
  }, [cart, selectedBranch, substitutes]);

  const clearSubstitute = useCallback((id) => {
    setSubstitutes((prev) => {
      if (!(id in prev)) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  const changeQty = useCallback((id, delta) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const copy = { ...prev };
      if (next === 0) {
        delete copy[id];
        clearSubstitute(id);
      } else {
        copy[id] = next;
      }
      return copy;
    });
  }, [clearSubstitute]);

  const removeItem = useCallback((id) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    clearSubstitute(id);
  }, [clearSubstitute]);

  // Emptied once an order is confirmed as sent (see OrderHistoryContext) —
  // leaving the basket full afterwards let someone send the identical order
  // twice without noticing. "Reorder" in My Orders is the deliberate way to
  // repeat an order instead.
  const clearCart = useCallback(() => {
    setCart({});
    setSubstitutes({});
  }, []);

  // Records that `substituteId` in the cart is standing in for the
  // out-of-stock `originalId` — call alongside changeQty(substituteId, +n)
  // when adding a suggested alternative, not as a replacement for it.
  const markSubstitute = useCallback((substituteId, originalId, matchType) => {
    setSubstitutes((prev) => ({ ...prev, [substituteId]: { originalId, matchType } }));
  }, []);

  const branch = useMemo(
    () => branches.find((b) => b.id === selectedBranch),
    [selectedBranch]
  );

  const { itemsTotal, itemCount } = useMemo(() => {
    let itemsTotal = 0;
    let itemCount = 0;
    Object.entries(cart).forEach(([id, qty]) => {
      const p = products.find((pp) => pp.id === id);
      if (!p) return;
      itemsTotal += p.price * qty;
      itemCount += qty;
    });
    return { itemsTotal, itemCount };
  }, [cart]);

  const deliveryFee = branch ? branch.deliveryFee : 0;
  const grandTotal = itemCount === 0 ? 0 : itemsTotal + deliveryFee;

  const value = {
    cart,
    changeQty,
    removeItem,
    clearCart,
    substitutes,
    markSubstitute,
    selectedBranch,
    setSelectedBranch,
    branch,
    itemsTotal,
    itemCount,
    deliveryFee,
    grandTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside a CartProvider');
  return ctx;
}
