import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CustomerContext = createContext(null);

// Delivery details survive a refresh — retyping your name, phone and address
// because a page reloaded is the kind of friction that loses an order. Same
// per-browser localStorage as the cart and order history; still nothing
// server-side, so this is a convenience, not an account.
const STORAGE_KEY = 'pharmacy_customer';

function loadCustomer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    return saved && ['code', 'new', 'guest'].includes(saved.mode) ? saved : null;
  } catch {
    return null;
  }
}

// IMPORTANT: this site has no real backend yet, so nothing here is verified
// or persisted anywhere — it only lives in memory for this page visit and is
// lost on refresh. "Codes" typed in aren't checked against the pharmacy's
// real customer system, and "new" codes generated here are provisional
// placeholders for staff to confirm manually. When a real backend exists,
// swap generateDemoCode()/setCustomer() for real API calls and the rest of
// the flow (drawer UI, message building) stays the same.
function generateDemoCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function CustomerProvider({ children }) {
  // null | { mode:'code', code } | { mode:'new', name, phone, address, demoCode } | { mode:'guest', address }
  const [customer, setCustomer] = useState(loadCustomer);

  useEffect(() => {
    try {
      if (customer) localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable — details just won't survive this visit
    }
  }, [customer]);

  const setCode = useCallback((code) => {
    setCustomer({ mode: 'code', code });
  }, []);

  const setNewCustomer = useCallback((name, phone, address) => {
    const demoCode = generateDemoCode();
    setCustomer({ mode: 'new', name, phone, address, demoCode });
    return demoCode;
  }, []);

  const setGuest = useCallback((address) => {
    setCustomer({ mode: 'guest', address });
  }, []);

  return (
    <CustomerContext.Provider value={{ customer, setCode, setNewCustomer, setGuest }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used inside a CustomerProvider');
  return ctx;
}
