// Branches from the live catalog (Supabase) carry resolved bilingual text
// directly (nameAr/nameEn/addrAr/addrEn) rather than translation keys —
// unlike the old static branches.js, which only stored a key into
// translations.js. This is the single place that picks the right language,
// mirroring how displayName() does it for products.
export function branchName(branch, lang) {
  return lang === 'ar' ? branch.nameAr : branch.nameEn;
}

export function branchAddr(branch, lang) {
  return lang === 'ar' ? branch.addrAr : branch.addrEn;
}
