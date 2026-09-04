// Placeholder catalog for the demo. ar/en = product name in each language,
// cat = category id (see categories.js), price = EGP, stock = in stock right
// now, rx = prescription-only (no add-to-cart, shows "please bring
// prescription" instead), arabicOnly = true for products with no real
// English brand name (so it always displays in Arabic regardless of site
// language — see displayName() in src/utils/displayName.js).
//
// activeIngredient = the real pharmacological active substance, used by
// findAlternatives() to suggest an in-stock replacement when a product is
// out of stock (see src/utils/findAlternatives.js). Only set on actual
// medicines where "same active ingredient" is a meaningful, pharmacist-
// verifiable claim. Set this from the real product's actual formulation,
// not guessed — an exact-string match is intentional (see
// findAlternatives.js) so two different salts/forms of a similar drug are
// never silently conflated.
//
// similarGroup = a looser, human-curated "these are comparable products"
// tag for items with NO activeIngredient (cosmetics/hygiene, where "same
// active ingredient" isn't a meaningful claim at all) — findAlternatives()
// falls back to this only when activeIngredient is absent. Deliberately
// NOT derived from `cat`, which is too coarse (e.g. baby formula and
// diaper rash cream share a category but aren't substitutes for each
// other) — pick a group value by hand only for products that are actually
// comparable, and the UI/WhatsApp wording says "similar product" rather
// than claiming equivalence.
//
// This is the file to edit once the pharmacy provides their real product
// list and prices.
const rawProducts = [
  { ar: "بانادول", en: "Panadol", cat: 'pain', price: 25, stock: true, rx: false, activeIngredient: 'Paracetamol 500mg' },
  { ar: "بانادول اكسترا", en: "Panadol Extra", cat: 'pain', price: 32, stock: true, rx: false, activeIngredient: 'Paracetamol 500mg + Caffeine 65mg' },
  { ar: "بروفين 400", en: "Brufen 400 (Ibuprofen)", cat: 'pain', price: 28, stock: true, rx: false, activeIngredient: 'Ibuprofen 400mg' },
  { ar: "فولتارين جل", en: "Voltaren Gel", cat: 'pain', price: 95, stock: false, rx: false, activeIngredient: 'Diclofenac Diethylamine (topical)' },
  { ar: "جل ديكلوفيناك - جينيريك", en: "Diclofenac Gel (Generic)", cat: 'pain', price: 75, stock: true, rx: false, activeIngredient: 'Diclofenac Diethylamine (topical)' },
  { ar: "كتافلام", en: "Cataflam", cat: 'pain', price: 40, stock: true, rx: false, activeIngredient: 'Diclofenac Potassium (oral)' },
  { ar: "استربسلز", en: "Strepsils", cat: 'cold', price: 35, stock: true, rx: false },
  { ar: "فيكس فيبوراب", en: "Vicks Vaporub", cat: 'cold', price: 60, stock: true, rx: false },
  { ar: "زيرتك", en: "Zyrtec (Antihistamine)", cat: 'cold', price: 45, stock: true, rx: false, activeIngredient: 'Cetirizine 10mg' },
  { ar: "كوديللار", en: "Coldrelief", cat: 'cold', price: 38, stock: false, rx: false, arabicOnly: true, activeIngredient: 'Paracetamol + Phenylephrine + Chlorpheniramine' },
  { ar: "مضاد برد - جينيريك", en: "Cold & Flu Relief (Generic)", cat: 'cold', price: 30, stock: true, rx: false, activeIngredient: 'Paracetamol + Phenylephrine + Chlorpheniramine' },
  { ar: "أوجمنتين 1 جم", en: "Augmentin 1g (Antibiotic)", cat: 'cold', price: 110, stock: true, rx: true, activeIngredient: 'Amoxicillin + Clavulanic Acid 1g' },
  { ar: "فيتامين سي 1000", en: "Vitamin C 1000mg", cat: 'vit', price: 85, stock: true, rx: false, activeIngredient: 'Ascorbic Acid 1000mg' },
  { ar: "سنتروم ملتي فيتامين", en: "Centrum Multivitamin", cat: 'vit', price: 250, stock: true, rx: false },
  { ar: "أوميغا 3", en: "Omega 3", cat: 'vit', price: 180, stock: true, rx: false, activeIngredient: 'Omega-3 Fish Oil' },
  { ar: "فيتامين د3", en: "Vitamin D3", cat: 'vit', price: 120, stock: false, rx: false, activeIngredient: 'Cholecalciferol (Vitamin D3)' },
  { ar: "فيتامين د3 - جينيريك", en: "Vitamin D3 (Generic)", cat: 'vit', price: 90, stock: true, rx: false, activeIngredient: 'Cholecalciferol (Vitamin D3)' },
  { ar: "زنك بلس", en: "Zinc Plus", cat: 'vit', price: 95, stock: true, rx: false, activeIngredient: 'Zinc' },
  { ar: "حليب نان 1", en: "Nan 1 Baby Formula", cat: 'baby', price: 320, stock: true, rx: false },
  { ar: "بامبرز مقاس 3", en: "Pampers Size 3", cat: 'baby', price: 210, stock: true, rx: false },
  { ar: "مناديل مبللة للأطفال", en: "Baby Wet Wipes", cat: 'baby', price: 45, stock: true, rx: false },
  { ar: "كريم حفاضات", en: "Diaper Rash Cream", cat: 'baby', price: 70, stock: false, rx: false, similarGroup: 'diaper-rash-cream' },
  { ar: "كريم حفاضات - بديل", en: "Diaper Rash Cream (Alternative Brand)", cat: 'baby', price: 65, stock: true, rx: false, similarGroup: 'diaper-rash-cream' },
  { ar: "كريم نيفيا", en: "Nivea Cream", cat: 'skin', price: 90, stock: true, rx: false, similarGroup: 'face-moisturizer' },
  { ar: "غسول سيتافيل", en: "Cetaphil Cleanser", cat: 'skin', price: 280, stock: true, rx: false },
  { ar: "واقي شمس لاروش", en: "La Roche-Posay Sunscreen", cat: 'skin', price: 450, stock: true, rx: false },
  { ar: "كريم مرطب للوجه", en: "Facial Moisturizer", cat: 'skin', price: 150, stock: false, rx: false, similarGroup: 'face-moisturizer' },
  { ar: "شاش وضمادات", en: "Gauze & Bandages", cat: 'first', price: 20, stock: true, rx: false },
  { ar: "بيتادين مطهر", en: "Betadine Antiseptic", cat: 'first', price: 35, stock: true, rx: false },
  { ar: "ترمومتر رقمي", en: "Digital Thermometer", cat: 'first', price: 110, stock: true, rx: false },
  { ar: "جهاز ضغط الدم", en: "Blood Pressure Monitor", cat: 'first', price: 950, stock: true, rx: false },
  { ar: "معقم يدين", en: "Hand Sanitizer", cat: 'first', price: 30, stock: true, rx: false },
  { ar: "معجون أسنان سنسوداين", en: "Sensodyne Toothpaste", cat: 'personal', price: 95, stock: true, rx: false },
  { ar: "شامبو هيد اند شولدرز", en: "Head & Shoulders Shampoo", cat: 'personal', price: 140, stock: true, rx: false },
  { ar: "غسول فم ليسترين", en: "Listerine Mouthwash", cat: 'personal', price: 110, stock: false, rx: false, similarGroup: 'mouthwash' },
  { ar: "غسول فم - بديل", en: "Mouthwash (Alternative Brand)", cat: 'personal', price: 85, stock: true, rx: false, similarGroup: 'mouthwash' },
];

// image: derived from the index the same way `id` is, rather than hand-added
// per row — every product's photo is named to match its id exactly (see
// public/images/products/ and docs-internal/product-photo-checklist.md), so
// this can never drift out of sync the way 36 hand-typed paths could.
// No leading slash: this site is deployed at hamzaabuzaid0.github.io/
// Pharmacy-site-2/ (a subfolder, not the domain root) — a path starting
// with "/" resolves against the domain root and misses the subfolder
// entirely. A relative path resolves against the page's own URL instead,
// which works correctly whether that's this subfolder or plain localhost.
export const products = rawProducts.map((p, i) => ({ ...p, id: 'p' + i, image: `images/products/p${i}.jpg` }));
