// No product photos are supplied with the catalog yet, so every product
// card, cart row and category tile falls back to a clean illustrated icon
// on a colour-tinted ground — one per section. Hair-colour items get a real
// shade swatch instead (see HairColorSwatch.jsx / ProductVisual.jsx).
//
// Keys here must match the category ids in src/data/categories.js.
export const CATEGORY_STYLE = {
  cosmetics: { bg: '#fbe9f1', fg: '#c03c78' },
  fragrance: { bg: '#efe9fb', fg: '#6b46c1' },
  baby:      { bg: '#e7f0fd', fg: '#2f6fd0' },
  haircolor: { bg: '#f6ead9', fg: '#a45a1f' },
  haircare:  { bg: '#e8f4ec', fg: '#2f8f5b' },
  skincare:  { bg: '#fdeee6', fg: '#c9622e' },
  personal:  { bg: '#e3f3f4', fg: '#0f7a82' },
  oral:      { bg: '#e6f6fb', fg: '#1483a6' },
  vitamins:  { bg: '#fdf3d9', fg: '#b9800f' },
  pain:      { bg: '#e3f3f4', fg: '#0f7a82' },
  cold:      { bg: '#e6f7ec', fg: '#1a9e5c' },
  digestive: { bg: '#fdeede', fg: '#c07a1f' },
  devices:   { bg: '#eceef4', fg: '#4b5aa6' },
  firstaid:  { bg: '#fbeae8', fg: '#c0392b' },
  intimate:  { bg: '#fce9ec', fg: '#b23a55' },
  medicine:  { bg: '#eaf1fb', fg: '#2c5fb0' },
  home:      { bg: '#eef0ee', fg: '#5f6b66' },
};

const iconPaths = {
  cosmetics: (
    <>
      <path d="M9 3h6l-1 6h-4L9 3z" />
      <rect x="8" y="9" width="8" height="11" rx="2" />
      <line x1="12" y1="13" x2="12" y2="16" />
    </>
  ),
  fragrance: (
    <>
      <rect x="7" y="9" width="10" height="12" rx="2" />
      <rect x="10" y="3" width="4" height="4" rx="1" />
      <line x1="12" y1="7" x2="12" y2="9" />
      <path d="M17 8l3-2M17 11h3M17 14l3 2" />
    </>
  ),
  baby: (
    <>
      <circle cx="12" cy="9" r="4" />
      <path d="M5 21c1-4 4-6 7-6s6 2 7 6" />
      <line x1="12" y1="2.5" x2="12" y2="5" />
    </>
  ),
  haircolor: (
    <>
      <path d="M12 3c4 4 6 7 6 11a6 6 0 0 1-12 0c0-4 2-7 6-11z" />
      <path d="M9 14c1.5 1.5 4.5 1.5 6 0" />
    </>
  ),
  haircare: (
    <>
      <path d="M7 4h10l-1 5H8L7 4z" />
      <path d="M8 9h8l-.6 9a2 2 0 0 1-2 1.8h-2.8a2 2 0 0 1-2-1.8L8 9z" />
      <line x1="9.5" y1="13" x2="14.5" y2="13" />
    </>
  ),
  skincare: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 6c2.5 2.5 4 4.5 4 7a4 4 0 0 1-8 0c0-2.5 1.5-4.5 4-7z" />
    </>
  ),
  personal: (
    <>
      <path d="M9 3h6l1 4H8l1-4z" />
      <path d="M7 7h10l-1.2 12.5a2 2 0 0 1-2 1.5h-3.6a2 2 0 0 1-2-1.5L7 7z" />
    </>
  ),
  oral: (
    <>
      <path d="M6 5c2 0 3 1 6 1s4-1 6-1c1 4-1 15-3 15-1 0-1.5-4-3-4s-2 4-3 4c-2 0-4-11-3-15z" />
    </>
  ),
  vitamins: (
    <>
      <rect x="3" y="10" width="18" height="8" rx="4" transform="rotate(-25 12 14)" />
      <line x1="12" y1="9" x2="12" y2="19" transform="rotate(-25 12 14)" />
    </>
  ),
  pain: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  cold: <path d="M12 3c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z" />,
  digestive: (
    <>
      <path d="M10 4v4c0 3-4 3-4 7a5 5 0 0 0 10 0c0-3-2-3-2-6" />
      <circle cx="14" cy="6" r="2" />
    </>
  ),
  devices: (
    <>
      <rect x="3" y="8" width="18" height="9" rx="2" />
      <path d="M6 12h3l1.5-3 2 6 1.5-3H18" />
    </>
  ),
  firstaid: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M9 6V4h6v2" />
      <line x1="12" y1="10" x2="12" y2="16" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </>
  ),
  intimate: <path d="M12 20s-7-4.4-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 15.6 12 20 12 20z" />,
  medicine: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="2" />
      <path d="M7 9V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
      <line x1="12" y1="12" x2="12" y2="17" />
      <line x1="9.5" y1="14.5" x2="14.5" y2="14.5" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-6 8 6" />
      <path d="M6 10v9h12v-9" />
    </>
  ),
};

// A category's icon + colour-tinted background, filling its parent
// container. The universal visual stand-in wherever a product has no photo.
export function CategoryVisual({ catId, size = '38px' }) {
  const style = CATEGORY_STYLE[catId] || CATEGORY_STYLE.medicine;
  const paths = iconPaths[catId] || iconPaths.medicine;
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
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: size, height: size, display: 'block' }}
      >
        {paths}
      </svg>
    </div>
  );
}
