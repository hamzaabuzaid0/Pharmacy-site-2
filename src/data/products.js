// The real catalog now comes from the pharmacy's inventory export, converted
// by scripts/build-catalog.py into src/data/catalog.generated.js (one entry
// per inventory line — ~10k items). This file just adds the derived image
// path and re-exports, keeping the same `products` import everywhere else.
//
// image: derived from the inventory product code, not hand-added per row —
// every product's photo, when one exists, is named to match its code
// exactly (public/images/products/<code>.jpg). No leading slash: the site
// deploys to hamzaabuzaid0.github.io/Pharmacy-site-2/ (a subfolder), so an
// absolute "/images/..." path would miss the subfolder — a relative path
// resolves against the page URL and works in the subfolder and on localhost
// alike. There are currently no product photos in the catalog; ProductVisual
// falls back to the category illustration / hair-colour swatch until real
// photos are supplied (see docs-internal/CATALOG-IMPORT-REPORT.md).
import { generatedProducts } from './catalog.generated.js';

// Codes that DO have a real photo file in public/images/products/.
// Empty for now — populate when authorised product images are added.
const CODES_WITH_IMAGE = new Set([]);

export const products = generatedProducts.map((p) => ({
  ...p,
  image: CODES_WITH_IMAGE.has(p.code) ? `images/products/${p.code}.jpg` : null,
}));
