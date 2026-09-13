// The real catalog comes from the pharmacy's inventory export, converted by
// scripts/build-catalog.py into src/data/catalog.generated.js (one entry per
// inventory line). This file adds each product's photo path and re-exports,
// keeping the same `products` import everywhere else.
//
// Photos: a product only gets an `image` if its code is listed in
// productImages.generated.js (written by scripts/fetch-chefaa-images.py when
// it saves a verified photo). Deriving the path for every product instead
// would render ~10k broken <img> tags for products with no file.
//
// No leading slash on the path: the site deploys to
// hamzaabuzaid0.github.io/Pharmacy-site-2/ (a subfolder), so an absolute
// "/images/..." path would miss the subfolder — a relative path resolves
// against the page URL and works there and on localhost alike. Products
// without a photo fall back to the category illustration / hair-colour
// swatch in ProductVisual.
import { generatedProducts } from './catalog.generated.js';
import { productImages } from './productImages.generated.js';

export const products = generatedProducts.map((p) => ({
  ...p,
  image: productImages[p.code] ? productImages[p.code].src : null,
}));
