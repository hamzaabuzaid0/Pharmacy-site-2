import { useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';
import { products } from '../../data/products';
import { ProductCard } from './ProductCard';

// Matches typed Arabic or English against BOTH name fields, regardless of
// which language the site UI is currently in — so a customer typing in
// Arabic still finds a product that's displayed in English, and vice versa.
function matchesSearch(p, query) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  return p.ar.toLowerCase().includes(q) || p.en.toLowerCase().includes(q);
}

export function ProductGrid() {
  const { t } = useLanguage();
  const { activeCat, searchQuery } = useNavigation();

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const catOk = activeCat === 'all' || p.cat === activeCat;
      return catOk && matchesSearch(p, searchQuery);
    });
  }, [activeCat, searchQuery]);

  if (filtered.length === 0) {
    return <div className="no-results">{t('noResults')}</div>;
  }

  return (
    <div className="grid">
      {filtered.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
