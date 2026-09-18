import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useCatalog } from './CatalogContext';

const CartContext = createContext(null);

// The basket survives a refresh, a closed tab, and coming back tomorrow.
// It used to live in memory only, which on a patchy phone connection meant
// a reload silently threw away a basket someone had just spent minutes
// filling. Stored per-browser, same as order history.
const STORAGE_KEY = 'pharmacy_cart';

// There is deliberately NO default branch. The site used to start everyone
// on branch 1 silently, so a customer near the other branch could order
// without ever seeing which branch would fill it. Now the branch stays empty
// until the customer picks one in the branch picker (BranchPicker.jsx), and
// `branchConfirmed` records that they did. Older saved baskets carry a
// branch but no confirmation — those customers are asked once.
function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return null;
    return {
      cart: saved.cart && typeof saved.cart === 'object' ? saved.cart : {},
      selectedBranch: typeof saved.selectedBranch === 'string' ? saved.selectedBranch : null,
      branchConfirmed: saved.branchConfirmed === true,
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
  const [selectedBranch, setSelectedBranch] = useState(() => saved?.selectedBranch ?? null);
  const [branchConfirmed, setBranchConfirmed] = useState(() => saved?.branchConfirmed ?? false);
  const [branchPickerOpen, setBranchPickerOpen] = useState(false);
  // Something the customer tried to do before choosing a branch (e.g. add
  // to cart). Run right after they confirm, so picking a branch doesn't
  // make them tap "Add" a second time.
  const afterBranchRef = useRef(null);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cart, selectedBranch, branchConfirmed, substitutes }));
    } catch {
      // localStorage unavailable (private browsing, quota) — the cart just
      // goes back to being in-memory for this visit
    }
  }, [cart, selectedBranch, branchConfirmed, substitutes]);

  // The only way a branch gets set: an explicit choice by the customer (the
  // picker, or reordering a past order, which names its branch).
  const chooseBranch = useCallback((id) => {
    setSelectedBranch(id);
    setBranchConfirmed(true);
    setBranchPickerOpen(false);
    const next = afterBranchRef.current;
    afterBranchRef.current = null;
    if (next) next();
  }, []);

  const openBranchPicker = useCallback(() => setBranchPickerOpen(true), []);
  const closeBranchPicker = useCallback(() => {
    afterBranchRef.current = null;
    setBranchPickerOpen(false);
  }, []);

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

  // `branches` is a dependency too: with Supabase the branch list arrives
  // after first render, and without it `branch` stayed undefined until the
  // customer happened to change branch.
  const branch = useMemo(
    () => branches.find((b) => b.id === selectedBranch),
    [selectedBranch, branches]
  );
  const needsBranch = !branchConfirmed || !branch;

  // Run `action` now if a branch is chosen; otherwise ask for the branch
  // first and run it straight after the customer confirms.
  const requireBranch = useCallback((action) => {
    if (!needsBranch) {
      action?.();
      return;
    }
    afterBranchRef.current = action || null;
    setBranchPickerOpen(true);
  }, [needsBranch]);

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
  }, [cart, products]);

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
    chooseBranch,
    branch,
    needsBranch,
    requireBranch,
    branchPickerOpen,
    openBranchPicker,
    closeBranchPicker,
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
