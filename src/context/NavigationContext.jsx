import { createContext, useContext, useState, useCallback } from 'react';

const NavigationContext = createContext(null);

// Drives which top-level page is visible, plus the shop page's search/category
// filters — the header search bar lives here (used from every page) and
// "shop by category" cards need to jump to the shop page pre-filtered.
// Staff panel entry point: visiting the site with a #staff hash lands there
// directly, without needing a nav link a customer could stumble onto (see
// App.jsx's Pages()). Just discretion, not the real security boundary.
function initialPage() {
  return window.location.hash === '#staff' ? 'staff' : 'home';
}

export function NavigationProvider({ children }) {
  const [page, setPageState] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  const setPage = useCallback((id) => {
    setPageState(id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const goToShopWithCategory = useCallback((catId) => {
    setActiveCat(catId);
    setSearchQuery('');
    setPage('shop');
  }, [setPage]);

  const value = {
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    activeCat,
    setActiveCat,
    goToShopWithCategory,
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used inside a NavigationProvider');
  return ctx;
}
