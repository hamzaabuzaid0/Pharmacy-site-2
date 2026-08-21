// Real product photos aren't available for this demo (no photos from the
// pharmacy, and using scraped brand packaging images would be a copyright
// problem on a real commercial site). Instead each category gets a clean
// custom illustrated icon + color theme, standing in for a photo until real
// product images can be sourced from the pharmacy itself.
export const CATEGORY_STYLE = {
  pain: { bg: '#e3f3f4', fg: '#0f7a82' },
  cold: { bg: '#e6f7ec', fg: '#1a9e5c' },
  vit: { bg: '#fdf2de', fg: '#b9800f' },
  baby: { bg: '#ebedfa', fg: '#5b62c9' },
  skin: { bg: '#fbeaef', fg: '#c0526b' },
  first: { bg: '#fbeae8', fg: '#c0392b' },
  personal: { bg: '#e3f3f4', fg: '#0f7a82' },
};

const iconPaths = {
  pain: (
    <>
      <rect x="3" y="10" width="18" height="8" rx="4" transform="rotate(-25 12 14)" />
      <line x1="12" y1="9" x2="12" y2="19" transform="rotate(-25 12 14)" />
    </>
  ),
  cold: <path d="M12 3c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z" />,
  vit: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </>
  ),
  baby: (
    <>
      <path d="M8 3h8v4H8z" />
      <path d="M7 7h10l-1 13a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1L7 7z" />
      <line x1="8.5" y1="12" x2="15.5" y2="12" />
    </>
  ),
  skin: (
    <>
      <rect x="5" y="8" width="14" height="12" rx="2" />
      <path d="M8 8V6a4 4 0 0 1 8 0v2" />
    </>
  ),
  first: (
    <>
      <rect x="3" y="5" width="18" height="15" rx="2" />
      <line x1="12" y1="9" x2="12" y2="16" />
      <line x1="8.5" y1="12.5" x2="15.5" y2="12.5" />
    </>
  ),
  personal: (
    <>
      <path d="M9 3h6l1 4H8l1-4z" />
      <path d="M7 7h10l-1.2 12.5a2 2 0 0 1-2 1.5h-3.6a2 2 0 0 1-2-1.5L7 7z" />
    </>
  ),
};

// A category's icon + color-tinted background, sized to fill its parent
// container. Used for product cards, cart items, and the "shop by category"
// quick grid — the universal visual stand-in until real product photos
// exist.
export function CategoryVisual({ catId, size = '38px' }) {
  const style = CATEGORY_STYLE[catId] || CATEGORY_STYLE.pain;
  const paths = iconPaths[catId] || iconPaths.pain;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: style.bg,
        color: style.fg,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: size, height: size, display: 'block' }}
      >
        {paths}
      </svg>
    </div>
  );
}
