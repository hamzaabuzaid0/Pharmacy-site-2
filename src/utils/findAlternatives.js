// Suggests an in-stock replacement for an out-of-stock product, in one of
// two tiers — never both, and never guessed:
//
// 'ingredient' — exact activeIngredient match. A pharmacological claim
// ("same active ingredient"), so it's an exact string match only, never
// fuzzy/category matching that could pair up genuinely different drugs
// (e.g. two different diclofenac salts/forms) without a human explicitly
// tagging them equivalent in products.js.
//
// 'similar' — for products with no activeIngredient (cosmetics/hygiene,
// where "same active ingredient" isn't a meaningful claim at all): an
// exact similarGroup match instead, worded as "similar product" rather
// than a medical equivalence claim. Also human-curated, not derived from
// the `cat` field — same category is too coarse (e.g. baby formula and
// diaper rash cream share a category but aren't substitutes for each
// other), so similarGroup exists specifically to pair up items that are
// actually comparable.
//
import { isInStock } from './stock';

// Returns { type: 'ingredient' | 'similar' | null, matches: Product[] }.
// Silently returns no matches rather than force a questionable one.
//
// branchId matters: with per-branch stock, a product can be the correct
// "same ingredient" match yet still be out of stock at THIS branch — never
// suggest something the customer can't actually get from where their order
// is going.
export function findAlternatives(product, allProducts, branchId) {
  if (product.activeIngredient) {
    return {
      type: 'ingredient',
      matches: allProducts.filter(
        (p) => p.id !== product.id && isInStock(p, branchId) && p.activeIngredient === product.activeIngredient
      ),
    };
  }
  if (product.similarGroup) {
    return {
      type: 'similar',
      matches: allProducts.filter(
        (p) => p.id !== product.id && isInStock(p, branchId) && p.similarGroup === product.similarGroup
      ),
    };
  }
  return { type: null, matches: [] };
}
