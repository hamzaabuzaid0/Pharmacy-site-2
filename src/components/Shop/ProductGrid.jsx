import { useMemo, useState, useEffect, useRef, useDeferredValue } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';
import { useCatalog } from '../../context/CatalogContext';
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
  const deferredQuery = useDeferredValue(searchQuery);
  const q = deferredQuery.trim().toLowerCase();

  // Products with a real photo come first, everything else keeps catalog
  // order. With ~10k items and photos only on a few, catalog order left
  // every photographed product hundreds of rows down (the nearest was #377),
  // so the shop looked photo-less even though the photos were live.
  // Array.prototype.sort is stable, so ties keep their original order.
  const filtered = useMemo(
    () =>
      products
        .filter((p) => (activeCat === 'all' || p.cat === activeCat) && matchesSearch(p, q))
        .sort((a, b) => (b.imageUrl ? 1 : 0) - (a.imageUrl ? 1 : 0)),
    [products, activeCat, q]
  );

  const [count, setCount] = useState(PAGE);
  // Reset the visible window whenever the filter changes.
  useEffect(() => { setCount(PAGE); }, [activeCat, q]);

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
