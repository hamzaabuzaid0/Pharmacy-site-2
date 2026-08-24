import { createContext, useContext, useState, useCallback } from 'react';

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

// Orders are logged locally the moment someone taps "Send Order via
// WhatsApp" — there's no backend to confirm the pharmacy actually received
// or fulfilled it, so this is a record of what was *sent*, not a verified
// order status. Kept in localStorage, so it's per-device/browser only.
export function OrderHistoryProvider({ children }) {
  const [orders, setOrders] = useState(loadOrders);

  const addOrder = useCallback((order) => {
    setOrders((prev) => {
      const next = [order, ...prev];
      persistOrders(next);
      return next;
    });
  }, []);

  return (
    <OrderHistoryContext.Provider value={{ orders, addOrder }}>
      {children}
    </OrderHistoryContext.Provider>
  );
}

export function useOrderHistory() {
  const ctx = useContext(OrderHistoryContext);
  if (!ctx) throw new Error('useOrderHistory must be used inside an OrderHistoryProvider');
  return ctx;
}
