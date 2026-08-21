import { createContext, useContext, useState, useCallback } from 'react';

const NavigationContext = createContext(null);

// Drives which of the 5 top-level pages (home/about/offers/shop/branches) is
// visible, plus the shop page's search/category filters — since several
// actions elsewhere (hero search, "shop by category" cards) need to jump to
// the shop page pre-filtered.
export function NavigationProvider({ children }) {
  const [page, setPageState] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  const setPage = useCallback((id) => {
    setPageState(id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const goToShopWithSearch = useCallback((query) => {
    setSearchQuery(query);
    setActiveCat('all');
    setPage('shop');
  }, [setPage]);

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
    goToShopWithSearch,
    goToShopWithCategory,
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used inside a NavigationProvider');
  return ctx;
}
