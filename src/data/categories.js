// id, ar, en. Order here = order of the chips in the shop and the cards in
// the "shop by category" grid. The pharmacy asked for the retail sections
// (cosmetics, fragrances, baby, hair colour) to come first.
//
// To add a category: add it here, then add a matching entry in
// CATEGORY_STYLE and CATEGORY_ICON in src/utils/categoryVisual.jsx. The
// automatic classifier that fills these lives in scripts/build-catalog.py —
// its category ids must stay in sync with this list.
export const categories = [
  { id: 'cosmetics', ar: 'المكياج والتجميل', en: 'Makeup & Cosmetics' },
  { id: 'fragrance', ar: 'العطور ومزيلات العرق', en: 'Fragrances & Deodorants' },
  { id: 'baby', ar: 'الأم والطفل', en: 'Mother & Baby' },
  { id: 'haircolor', ar: 'صبغات الشعر', en: 'Hair Colour' },
  { id: 'haircare', ar: 'العناية بالشعر', en: 'Hair Care' },
  { id: 'skincare', ar: 'العناية بالبشرة', en: 'Skin & Sun Care' },
  { id: 'personal', ar: 'العناية الشخصية', en: 'Personal Care' },
  { id: 'oral', ar: 'العناية بالفم والأسنان', en: 'Oral Care' },
  { id: 'vitamins', ar: 'الفيتامينات والمكملات', en: 'Vitamins & Supplements' },
  { id: 'pain', ar: 'مسكنات الألم والحرارة', en: 'Pain & Fever' },
  { id: 'cold', ar: 'البرد والسعال والحساسية', en: 'Cold, Cough & Allergy' },
  { id: 'digestive', ar: 'الجهاز الهضمي', en: 'Digestive Health' },
  { id: 'devices', ar: 'الأجهزة الطبية', en: 'Medical Devices' },
  { id: 'firstaid', ar: 'الإسعافات والمستلزمات', en: 'First Aid & Supplies' },
  { id: 'intimate', ar: 'الصحة الجنسية', en: 'Sexual Wellness' },
  { id: 'medicine', ar: 'الأدوية', en: 'Medicines' },
  { id: 'home', ar: 'منتجات منزلية وأخرى', en: 'Household & Other' },
];
