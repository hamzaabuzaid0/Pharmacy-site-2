// Product names show in English by default, regardless of site language —
// except items flagged arabicOnly: true, which are only ever branded/printed
// in Arabic in real life (no official English name exists), so those always
// display in Arabic. Search still matches typed Arabic or English against
// both fields either way (see matchesSearch in ShopPage).
export function displayName(p) {
  return p.arabicOnly ? p.ar : p.en;
}
