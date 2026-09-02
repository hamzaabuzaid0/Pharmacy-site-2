import { createContext, useContext, useState, useCallback, useRef } from 'react';

const DrawerContext = createContext(null);

// Both the cart drawer and the account drawer share one overlay; only one is
// ever open at a time. pendingCheckout tracks whether the account drawer was
// opened *because* someone tried to check out without delivery info yet — if
// so, finishing the account form re-opens the cart automatically instead of
// leaving no drawer open at all (which used to read as broken).
export function DrawerProvider({ children }) {
  const [openDrawer, setOpenDrawer] = useState(null); // null | 'cart' | 'account' | 'altModal'
  const [pendingCheckout, setPendingCheckout] = useState(false);
  // The out-of-stock product an "alternatives" popup is currently showing
  // suggestions for — set alongside openDrawer('altModal'), read by
  // AlternativeModal. Left stale after close (harmless, not rendered).
  const [altModalProduct, setAltModalProduct] = useState(null);
  // Guards finishAccountFlow against firing twice for the same account-drawer
  // session (e.g. a fast double-click/double-tap on a form's submit button
  // schedules two 900ms timers) — a second call used to read pendingCheckout
  // as already-flipped-to-false and force-close the drawer the first call had
  // just (correctly) reopened.
  const finishedFlowRef = useRef(false);

  const openCart = useCallback(() => setOpenDrawer('cart'), []);

  const closeCart = useCallback(() => {
    setOpenDrawer((prev) => (prev === 'cart' ? null : prev));
  }, []);

  const openAccount = useCallback((forCheckout = false) => {
    finishedFlowRef.current = false;
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
    if (finishedFlowRef.current) return;
    finishedFlowRef.current = true;
    setPendingCheckout((wasPending) => {
      setOpenDrawer(wasPending ? 'cart' : null);
      return false;
    });
  }, []);

  const closeAll = useCallback(() => {
    setOpenDrawer(null);
    setPendingCheckout(false);
  }, []);

  const openAltModal = useCallback((product) => {
    setAltModalProduct(product);
    setOpenDrawer('altModal');
  }, []);

  const closeAltModal = useCallback(() => {
    setOpenDrawer((prev) => (prev === 'altModal' ? null : prev));
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
    altModalProduct,
    openAltModal,
    closeAltModal,
  };

  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

export function useDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error('useDrawer must be used inside a DrawerProvider');
  return ctx;
}
