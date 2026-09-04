import { CategoryVisual } from './categoryVisual';

// A product's real photo if staff have uploaded one (see the Staff panel),
// falling back to the category icon otherwise — used everywhere a product
// gets a small thumbnail (shop grid, cart, alternative-suggestion popup).
// Deliberately no loading="lazy": at this catalog size (a few dozen small
// photos, tens of KB each) eager loading costs nothing worth trading away
// the guarantee that images are actually visible immediately.
export function ProductVisual({ product, size }) {
  if (product.imageUrl) {
    return <img src={product.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return <CategoryVisual catId={product.cat} size={size} />;
}
