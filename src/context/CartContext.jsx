import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { products } from '../data/products';
import { branches } from '../data/branches';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({}); // productId -> qty
  const [selectedBranch, setSelectedBranch] = useState(branches[0].id);
  // substituteProductId -> { originalId, matchType }. Only set for cart
  // lines added via an "alternative for X" suggestion (see AlternativeModal
  // / findAlternatives.js) — used to disclose the swap to the pharmacist in
  // the WhatsApp message and to note it in the cart/order-history UI.
  // matchType ('ingredient' | 'similar') controls the wording used, since a
  // same-active-ingredient claim and a looser same-category suggestion are
  // not the same kind of promise.
  const [substitutes, setSubstitutes] = useState({});

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
