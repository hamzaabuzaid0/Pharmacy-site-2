import { createContext, useContext, useState, useCallback } from 'react';

const DrawerContext = createContext(null);

// Both the cart drawer and the account drawer share one overlay; only one is
// ever open at a time. pendingCheckout tracks whether the account drawer was
// opened *because* someone tried to check out without delivery info yet — if
// so, finishing the account form re-opens the cart automatically instead of
// leaving no drawer open at all (which used to read as broken).
export function DrawerProvider({ children }) {
  const [openDrawer, setOpenDrawer] = useState(null); // null | 'cart' | 'account'
  const [pendingCheckout, setPendingCheckout] = useState(false);

  const openCart = useCallback(() => setOpenDrawer('cart'), []);

  const closeCart = useCallback(() => {
    setOpenDrawer((prev) => (prev === 'cart' ? null : prev));
  }, []);

  const openAccount = useCallback((forCheckout = false) => {
    if (forCheckout) setPendingCheckout(true);
    setOpenDrawer('account');
  }, []);

  const closeAccount = useCallback(() => {
    setOpenDrawer((prev) => (prev === 'account' ? null : prev));
    // Manually closing (X, overlay click) cancels any pending return-to-cart
    // — only an actual successful submission (finishAccountFlow) should
    // trigger that.
    setPendingCheckout(false);
  }, []);

  const finishAccountFlow = useCallback(() => {
    setPendingCheckout((wasPending) => {
      setOpenDrawer(wasPending ? 'cart' : null);
      return false;
    });
  }, []);

  const closeAll = useCallback(() => {
    setOpenDrawer(null);
    setPendingCheckout(false);
  }, []);

  const value = {
    openDrawer,
    pendingCheckout,
    openCart,
    closeCart,
    openAccount,
    closeAccount,
    finishAccountFlow,
    closeAll,
  };

  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

export function useDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error('useDrawer must be used inside a DrawerProvider');
  return ctx;
}
