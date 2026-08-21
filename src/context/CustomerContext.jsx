import { createContext, useContext, useState, useCallback } from 'react';

const CustomerContext = createContext(null);

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
  const [customer, setCustomer] = useState(null);

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
