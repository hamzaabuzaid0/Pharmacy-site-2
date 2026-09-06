import { CategoryVisual } from './categoryVisual';
import { HairColorSwatch } from './HairColorSwatch';

// What to show in a product's thumbnail slot (shop grid, cart, alternative
// popup), in priority order:
//   1. a real uploaded photo, if one exists
//   2. a hair-colour shade swatch, for dye products (their shade IS the product)
//   3. the category illustration — the universal fallback
//
// loading="lazy" matters now: the catalog is ~10k items and the grid can
// scroll far, so thumbnails below the fold shouldn't all fetch at once.
export function ProductVisual({ product, size }) {
  if (product.imageUrl) {
    return (
      <img
        src={product.imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  }
  if (product.swatch || product.cat === 'haircolor') {
    return <HairColorSwatch product={product} size={size} />;
  }
  return <CategoryVisual catId={product.cat} size={size} />;
}
