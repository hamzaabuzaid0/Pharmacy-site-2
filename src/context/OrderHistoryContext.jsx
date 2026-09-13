import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const STORAGE_KEY = 'pharmacy_order_history';

function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistOrders(orders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // localStorage unavailable (private browsing, quota) — history just won't survive a reload
  }
}

const OrderHistoryContext = createContext(null);

// Orders are logged locally — there's no backend to confirm the pharmacy
// actually received or fulfilled it, so the best this site can do is record
// what the customer says they *sent*. That "says" matters: wa.me only opens
// WhatsApp with the message pre-filled — pressing Send is a separate action
// inside WhatsApp itself that this page has no way to observe. Adding the
// order to history the moment the WhatsApp link is opened (the old
// behaviour) meant every order showed up in "My Orders" even if the person
// closed WhatsApp without sending, or the popup was blocked — a customer
// could believe an order went through when the pharmacy never saw it.
//
// So sending now goes through a staging step: CartDrawer calls beginOrder()
// when it opens the WhatsApp link, which holds the order as `pendingOrder`
// WITHOUT adding it to history yet. The cart then shows an explicit
// "did you send it?" confirmation; only confirmPendingOrder() (a real "yes")
// commits it to history. discardPendingOrder() (a "no", or closing without
// answering) drops it — nothing is recorded, matching what actually
// happened. Kept in localStorage, so confirmed history is per-device/browser
// only; `pendingOrder` is intentionally NOT persisted — it's a mid-checkout
// question, not something that should reappear after a reload.
export function OrderHistoryProvider({ children }) {
  const [orders, setOrders] = useState(loadOrders);
  const [pendingOrder, setPendingOrder] = useState(null);
  // Guards against one order being committed twice — a double-tap on
  // "yes, I sent it" can fire two clicks before React re-renders with the
  // cleared pendingOrder, and both would see it as still pending.
  const committingRef = useRef(false);

  // Writing to localStorage happens in an effect, not inside the setState
  // updater. Side effects inside an updater run twice under React
  // StrictMode and are impure regardless — that exact mistake is what made
  // "yes, I sent it" log the same order to history twice.
  useEffect(() => {
    persistOrders(orders);
  }, [orders]);

  const addOrder = useCallback((order) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const beginOrder = useCallback((order) => {
    committingRef.current = false;
    setPendingOrder(order);
  }, []);

  const confirmPendingOrder = useCallback(() => {
    if (!pendingOrder || committingRef.current) return;
    committingRef.current = true;
    addOrder(pendingOrder);
    setPendingOrder(null);
  }, [pendingOrder, addOrder]);

  const discardPendingOrder = useCallback(() => {
    committingRef.current = false;
    setPendingOrder(null);
  }, []);

  return (
    <OrderHistoryContext.Provider
      value={{ orders, addOrder, pendingOrder, beginOrder, confirmPendingOrder, discardPendingOrder }}
    >
      {children}
    </OrderHistoryContext.Provider>
  );
}

export function useOrderHistory() {
  const ctx = useContext(OrderHistoryContext);
  if (!ctx) throw new Error('useOrderHistory must be used inside an OrderHistoryProvider');
  return ctx;
}
