// Suggests in-stock replacements for an out-of-stock product: other
// products sharing the exact same activeIngredient string. Deliberately an
// exact match, not a fuzzy/category match — this is a pharmacological claim
// shown to a real customer ("same active ingredient"), so it should never
// pair up merely-similar drugs (e.g. two different diclofenac salts/forms)
// without a human explicitly tagging them as equivalent in products.js.
// Silently returns nothing rather than force a questionable match — the
// WhatsApp message still asks the pharmacist to verify suitability either
// way, but only when there IS a same-ingredient, in-stock candidate to offer.
export function findAlternatives(product, allProducts) {
  if (!product.activeIngredient) return [];
  return allProducts.filter(
    (p) => p.id !== product.id && p.stock && p.activeIngredient === product.activeIngredient
  );
}
