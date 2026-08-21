// Placeholder catalog for the demo. ar/en = product name in each language,
// cat = category id (see categories.js), price = EGP, stock = in stock right
// now, rx = prescription-only (no add-to-cart, shows "please bring
// prescription" instead), arabicOnly = true for products with no real
// English brand name (so it always displays in Arabic regardless of site
// language — see displayName() in src/utils/displayName.js).
//
// This is the file to edit once the pharmacy provides their real product
// list and prices.
const rawProducts = [
  { ar: "بانادول", en: "Panadol", cat: 'pain', price: 25, stock: true, rx: false },
  { ar: "بانادول اكسترا", en: "Panadol Extra", cat: 'pain', price: 32, stock: true, rx: false },
  { ar: "بروفين 400", en: "Brufen 400 (Ibuprofen)", cat: 'pain', price: 28, stock: true, rx: false },
  { ar: "فولتارين جل", en: "Voltaren Gel", cat: 'pain', price: 95, stock: false, rx: false },
  { ar: "كتافلام", en: "Cataflam", cat: 'pain', price: 40, stock: true, rx: false },
  { ar: "استربسلز", en: "Strepsils", cat: 'cold', price: 35, stock: true, rx: false },
  { ar: "فيكس فيبوراب", en: "Vicks Vaporub", cat: 'cold', price: 60, stock: true, rx: false },
  { ar: "زيرتك", en: "Zyrtec (Antihistamine)", cat: 'cold', price: 45, stock: true, rx: false },
  { ar: "كوديللار", en: "Coldrelief", cat: 'cold', price: 38, stock: false, rx: false, arabicOnly: true },
  { ar: "أوجمنتين 1 جم", en: "Augmentin 1g (Antibiotic)", cat: 'cold', price: 110, stock: true, rx: true },
  { ar: "فيتامين سي 1000", en: "Vitamin C 1000mg", cat: 'vit', price: 85, stock: true, rx: false },
  { ar: "سنتروم ملتي فيتامين", en: "Centrum Multivitamin", cat: 'vit', price: 250, stock: true, rx: false },
  { ar: "أوميغا 3", en: "Omega 3", cat: 'vit', price: 180, stock: true, rx: false },
  { ar: "فيتامين د3", en: "Vitamin D3", cat: 'vit', price: 120, stock: false, rx: false },
  { ar: "زنك بلس", en: "Zinc Plus", cat: 'vit', price: 95, stock: true, rx: false },
  { ar: "حليب نان 1", en: "Nan 1 Baby Formula", cat: 'baby', price: 320, stock: true, rx: false },
  { ar: "بامبرز مقاس 3", en: "Pampers Size 3", cat: 'baby', price: 210, stock: true, rx: false },
  { ar: "مناديل مبللة للأطفال", en: "Baby Wet Wipes", cat: 'baby', price: 45, stock: true, rx: false },
  { ar: "كريم حفاضات", en: "Diaper Rash Cream", cat: 'baby', price: 70, stock: false, rx: false },
  { ar: "كريم نيفيا", en: "Nivea Cream", cat: 'skin', price: 90, stock: true, rx: false },
  { ar: "غسول سيتافيل", en: "Cetaphil Cleanser", cat: 'skin', price: 280, stock: true, rx: false },
  { ar: "واقي شمس لاروش", en: "La Roche-Posay Sunscreen", cat: 'skin', price: 450, stock: true, rx: false },
  { ar: "كريم مرطب للوجه", en: "Facial Moisturizer", cat: 'skin', price: 150, stock: false, rx: false },
  { ar: "شاش وضمادات", en: "Gauze & Bandages", cat: 'first', price: 20, stock: true, rx: false },
  { ar: "بيتادين مطهر", en: "Betadine Antiseptic", cat: 'first', price: 35, stock: true, rx: false },
  { ar: "ترمومتر رقمي", en: "Digital Thermometer", cat: 'first', price: 110, stock: true, rx: false },
  { ar: "جهاز ضغط الدم", en: "Blood Pressure Monitor", cat: 'first', price: 950, stock: true, rx: false },
  { ar: "معقم يدين", en: "Hand Sanitizer", cat: 'first', price: 30, stock: true, rx: false },
  { ar: "معجون أسنان سنسوداين", en: "Sensodyne Toothpaste", cat: 'personal', price: 95, stock: true, rx: false },
  { ar: "شامبو هيد اند شولدرز", en: "Head & Shoulders Shampoo", cat: 'personal', price: 140, stock: true, rx: false },
  { ar: "غسول فم ليسترين", en: "Listerine Mouthwash", cat: 'personal', price: 110, stock: false, rx: false },
];

export const products = rawProducts.map((p, i) => ({ ...p, id: 'p' + i }));
