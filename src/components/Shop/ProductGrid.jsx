import { useMemo, useState, useEffect, useRef, useDeferredValue } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';
import { useCatalog } from '../../context/CatalogContext';
import { useCart } from '../../context/CartContext';
import { isCarried, isInStock } from '../../utils/stock';
import { ProductCard } from './ProductCard';

// How many cards to render at once. The catalog is ~10k items — rendering
// them all would jank the page and pointlessly build DOM the visitor will
// never scroll to. We render a page at a time and grow it as the sentinel
// at the bottom scrolls into view (plus a manual button as a fallback).
const PAGE = 48;

// Matches typed Arabic or English against BOTH name fields regardless of the
// current UI language, so a customer typing Arabic still finds a product
// shown in English and vice-versa.
function matchesSearch(p, q) {
  if (!q) return true;
  return p.ar.toLowerCase().includes(q) || p.en.toLowerCase().includes(q);
}

export function ProductGrid() {
  const { t } = useLanguage();
  const { activeCat, searchQuery } = useNavigation();
  const { products, loading } = useCatalog();
  const { selectedBranch, needsBranch } = useCart();
  const branchId = needsBranch ? null : selectedBranch;
  const deferredQuery = useDeferredValue(searchQuery);
  const q = deferredQuery.trim().toLowerCase();

  // The shop shows the chosen branch's range: only what that branch
  // carries, with what it has in stock first, then products with a real
  // photo (catalog order had every photographed product hundreds of rows
  // down, so the shop looked photo-less). Sort is stable, so ties keep
  // catalog order. Before a branch is chosen the picker is covering the
  // shop, so nothing is filtered out underneath it.
  const filtered = useMemo(() => {
    const rank = (p) => (branchId && isInStock(p, branchId) ? 2 : 0) + (p.imageUrl ? 1 : 0);
    return products
      .filter((p) => (!branchId || isCarried(p, branchId))
        && (activeCat === 'all' || p.cat === activeCat) && matchesSearch(p, q))
      .sort((a, b) => rank(b) - rank(a));
  }, [products, activeCat, q, branchId]);

  const [count, setCount] = useState(PAGE);
  // Reset the visible window whenever the filter or branch changes.
  useEffect(() => { setCount(PAGE); }, [activeCat, q, branchId]);

  const sentinelRef = useRef(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCount((c) => (c < filtered.length ? c + PAGE : c));
        }
      },
      { rootMargin: '600px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  if (loading) {
    return <div className="no-results">{t('catalogLoading')}</div>;
  }
  if (filtered.length === 0) {
    return <div className="no-results">{t('noResults')}</div>;
  }

  const shown = filtered.slice(0, count);
  const more = filtered.length - shown.length;

  return (
    <>
      <div className="grid-count">{t('showingCount').replace('{n}', shown.length).replace('{total}', filtered.length)}</div>
      <div className="grid">
        {shown.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {more > 0 && (
        <>
          <div ref={sentinelRef} aria-hidden="true" />
          <div className="grid-more">
            <button type="button" className="grid-more-btn" onClick={() => setCount((c) => c + PAGE)}>
              {t('showMore').replace('{n}', Math.min(more, PAGE))}
            </button>
          </div>
        </>
      )}
    </>
  );
}
