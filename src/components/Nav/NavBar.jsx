import { useEffect, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';

const NAV_ITEMS = [
  { id: 'home', key: 'navHome' },
  { id: 'about', key: 'navAbout' },
  { id: 'offers', key: 'navOffers' },
  { id: 'shop', key: 'navShop' },
  { id: 'scan', key: 'navScan' },
  { id: 'track', key: 'navTrack' },
  { id: 'orders', key: 'navOrders' },
  { id: 'branches', key: 'navBranches' },
];

export function NavBar() {
  const { t } = useLanguage();
  const { page, setPage } = useNavigation();
  const containerRef = useRef(null);
  const activeRef = useRef(null);
  const isFirstRender = useRef(true);

  // The nav scrolls horizontally on narrow screens (more items than fit).
  // Without this, navigating to a page whose tab isn't currently visible —
  // e.g. via a Home/Hero shortcut rather than tapping the nav itself —
  // leaves the active tab off-screen with no indication where it went.
  //
  // Deliberately NOT using element.scrollIntoView() here: with the sticky
  // <header> above this nav, browsers' scrollIntoView (even with
  // block:'nearest') can also shift the page's *vertical* scroll trying to
  // "fully reveal" the target, which fought with NavigationContext's own
  // scrollTo(top:0) and left the nav bar scrolled out from under the sticky
  // header. Computing the horizontal delta from actual bounding rects and
  // applying it with scrollBy keeps this strictly horizontal, and works
  // the same regardless of RTL scrollLeft sign quirks since it's a relative
  // pixel delta, not an absolute scrollLeft assignment.
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const container = containerRef.current;
    const btn = activeRef.current;
    if (!container || !btn) return;
    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const delta = (btnRect.left + btnRect.width / 2) - (containerRect.left + containerRect.width / 2);
    container.scrollBy({ left: delta, behavior: 'instant' });
  }, [page]);

  return (
    <nav className="site-nav">
      <div className="site-nav-inner" ref={containerRef}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            ref={page === item.id ? activeRef : null}
            className={'nav-link' + (page === item.id ? ' active' : '')}
            onClick={() => setPage(item.id)}
          >
            {t(item.key)}
          </button>
        ))}
      </div>
    </nav>
  );
}
