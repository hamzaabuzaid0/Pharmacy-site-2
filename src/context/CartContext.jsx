import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { products } from '../data/products';
import { branches } from '../data/branches';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({}); // productId -> qty
  const [selectedBranch, setSelectedBranch] = useState(branches[0].id);

  const changeQty = useCallback((id, delta) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  }, []);

  const removeItem = useCallback((id) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
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
