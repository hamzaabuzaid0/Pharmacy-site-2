# Catalog Import Report

Replacing the 36-item demo catalog with the pharmacy's real inventory.

Source file: **`رصيد الأصناف فى جميع المخازن.xlsx`** (single sheet — the
Hadayek October branch stock export). Run date: 2026‑09‑06.

---

## Numbers

| | |
|---|---|
| Rows in the Excel sheet | 10,405 |
| Valid products imported | **10,405** (100%) |
| Unique product IDs | 10,405 ✓ |
| Duplicate codes in source | 1 (code `0` used twice — both kept, second re‑keyed `0-2`) |
| Non‑standard codes (e.g. `n4`, `swb`, `BM6`) | 77 — kept as‑is, they're the pharmacy's own shorthand |
| Products with a real photo | **0** (see *Images* below) |
| Products without a photo | 10,405 — all show a clean fallback, none show a wrong image |
| Hair‑colour items with an accurate shade swatch | **141 / 141** |
| Prescription‑flagged (no add‑to‑cart) | 144 |
| Promo / offer‑flagged | 333 |
| Out of stock (qty ≤ 0 in the sheet) | 48 |
| Data‑quality rows flagged for review | 79 → `missing-or-ambiguous-products.json` |

### Category split (auto‑classified)

| Section | Items |
|---|--:|
| Makeup & Cosmetics | 150 |
| Fragrances & Deodorants | 225 |
| Mother & Baby | 351 |
| **Hair Colour** | 141 |
| Hair Care | 799 |
| Skin & Sun Care | 781 |
| Personal Care | 594 |
| Oral Care | 137 |
| Vitamins & Supplements | 280 |
| Pain & Fever | 84 |
| Cold, Cough & Allergy | 67 |
| Digestive Health | 34 |
| Medical Devices | 110 |
| First Aid & Supplies | 111 |
| Sexual Wellness | 23 |
| Medicines (OTC + Rx, the catch‑all safe fallback) | 6,506 |
| Household & Other | 12 |

The retail sections the pharmacy asked to prioritise (cosmetics, fragrances,
baby, hair colour) are the first chips in the shop and the first cards on the
home page. "Medicines" is the deliberate safe fallback for anything that is
clearly a pharmaceutical but not confidently a retail product — a real
pharmacy inventory is mostly medicines, so this bucket being the largest is
expected, not a classification failure.

---

## Images

> **Update 2026-09-15 — 198 products have real photos.** Chefaa was run
> across *every* section (medicines included, since Chefaa is Egyptian and
> shows local packaging): 276 confident matches → 211 passed both automatic
> checks → a new product-type rule and a photo-by-photo visual review
> rejected 30 more (wrong variant, strength or pack, foreign packaging, or
> unreadable). 181 added, 198 total. Chefaa only lists ~1,031 products, so
> this is close to its ceiling. Full review record with every photo:
> `docs-internal/chefaa-full-run.xlsx`; every rejection and its reason:
> `scripts/image-rejections.json`.
>
> Other sources checked (robots.txt read first each time): Vezeeta blocks all
> crawlers; Jumia's product sitemap is password-protected; Yodawy and Misr
> Pharmacies publish no product list; 9 other candidate domains don't
> resolve. Nahdi, Al-Dawaa and Life Pharmacy (Gulf pharmacies) allow product
> pages and together could add ~350 more **retail** products (medicines
> excluded — their packaging isn't the Egyptian one); not run yet.
>
> **Update 2026-09-13 — first real photos are live.** 17 products now have
> a real photo, sourced from **chefaa.com** with Scrapling
> (`scripts/fetch-chefaa-images.py`). Chefaa's robots.txt leaves its product
> pages open, and its catalog is Egyptian pharmacy stock. Each photo passed
> two automatic checks (URL slug and the photo's own filename against the
> catalog name) **and** a visual review. In the 20-item trial, 19 passed
> both checks; 2 of those were still wrong on inspection and were rejected
> (recorded in `scripts/image-rejections.json`). Photos are listed in
> `src/data/productImages.generated.js`, and the trial sheet with every
> photo embedded is `docs-internal/chefaa-image-trial.xlsx`. The 36 old demo
> photos have since been deleted. The original notes below are kept for
> history.

**No product images were imported.** The requested source —
`instashop.com/en-eg/client/ahmed-maher-pharmacy-1st-dist-6th-of-october` —
is not available for automated use:

- `instashop.com/robots.txt` **disallows `/product/*` and `/search/*`** for
  every crawler, including the `en-eg` region.
- The store page returns **HTTP 403** to non‑browser requests (bot
  protection).

Per the task's own rule ("do not bypass authentication, security controls,
CAPTCHAs, rate limits… if automated access is not permitted, stop and report
what is needed"), image acquisition from InstaShop was **stopped, not
bypassed**.

### What every product shows instead (Phase 8)

- **Hair colour** → an accurate colour swatch computed from the shade code
  (Palette `8‑0`, Garnier `6.3`, L'Oréal Casting `513`, Bigen `47`, henna
  shades…). Leading digit = lightness level 1(black)–10(lightest blonde),
  the rest = tone. The shade number is printed on the swatch — which is
  exactly what a customer scans a dye shelf for, so for this section the
  swatch is arguably better than a thumbnail photo. 141/141 covered.
- **Everything else** → a clean per‑section illustrated icon on a tinted
  ground (17 distinct section styles). No product is ever shown a photo of a
  different product.

### To add real photos later

The plumbing is ready and incremental:

1. Get an **authorised** image set — the pharmacy can export their product
   images from their InstaShop **merchant dashboard**, or hand over a folder
   of photos, or obtain written permission + API access from InstaShop.
2. Drop each file at `public/images/products/<product-code>.jpg`
   (auto‑crop the white padding first — the earlier batch had the product at
   ~20% of the frame).
3. Add those codes to `CODES_WITH_IMAGE` in `src/data/products.js`.
4. Rebuild. `ProductVisual` already prefers a real photo when one exists and
   falls back otherwise; images are `loading="lazy"`.

The 36 demo photos from the previous round are **left in the repo**
(`public/images/products/p0…p35.jpg`) but **not wired to any catalog item** —
they're generic/mislabelled brand shots (e.g. `p1.jpg` is Panadol *Advance*
packaging), and force‑matching them to specific SKUs is exactly the wrong‑image
risk the task warns against.

---

## How the import works (the pipeline)

| File | Role |
|---|---|
| `scripts/build-catalog.py` | **the pipeline.** Reads the xlsx → cleans names (keeps Arabic, strips `"…"`/`"NEW PRICE"`/offer noise) → classifies every row → parses hair‑dye shades → writes the catalog. Re‑runnable. |
| `scripts/source-inventory.xlsx` | committed copy of the manager's file, so the build is reproducible from the repo |
| `src/data/catalog.generated.js` | **generated** — 10,405 product objects. Do not hand‑edit. |
| `src/data/products.js` | thin wrapper: adds the derived image path, re‑exports as `products` (same import everywhere else) |
| `src/data/categories.js` | the 17 sections, retail‑first order |
| `missing-or-ambiguous-products.json` | the image‑source blocker + 79 source‑data rows to eyeball |
| `docs-internal/catalog-build-report.txt` | raw per‑run counts |

**Refresh when the pharmacy sends a new stock file:**

```bash
pip install openpyxl
python scripts/build-catalog.py path/to/new-inventory.xlsx \
  --out src/data/catalog.generated.js \
  --report docs-internal/catalog-build-report.txt \
  --missing missing-or-ambiguous-products.json
npm run build
cp dist/index.html docs/index.html
```

Product object shape (unchanged fields kept so nothing else broke):

```js
{ id, code, en, ar, cat, price, stock,
  company, unit,
  rx?, arabicOnly?, offer?,      // only present when true
  shade?, swatch? }              // hair colour only
```

---

## Website changes (Phases 5–7)

| File | Change |
|---|---|
| `src/data/categories.js` | 7 → 17 sections |
| `src/utils/categoryVisual.jsx` | icon + colour theme for all 17 sections |
| `src/utils/HairColorSwatch.jsx` | **new** — renders the computed shade swatch |
| `src/utils/ProductVisual.jsx` | photo → swatch → category‑icon fallback chain; `loading="lazy"` |
| `src/components/Shop/ProductGrid.jsx` | **pagination**: renders 48 cards, grows on scroll (IntersectionObserver) + a "Show more" button; `useDeferredValue` keeps typing smooth over 10k rows; shows "Showing N of M" |
| `src/components/Shop/ProductCard.jsx` | brand · unit subline, shade line, `OFFER` badge |
| `src/context/CatalogContext.jsx` | normaliser carries the new fields (both static and Supabase paths) |
| `src/components/Scan/ScanPage.jsx` | demo prescription items point at real catalog names |
| `src/i18n/translations.js` | new keys (ar + en); home stat "1000+" → "10,000+" |
| `src/index.css` | grid‑count / show‑more / offer‑badge / brand‑line styles |
| `scripts/generate-schema-sql.mjs` + `supabase/schema.sql` | new columns (`code`, `company`, `unit`, `offer`, `shade`, `swatch`), seed INSERTs chunked for 10k rows |

Search, category filter, branch switch, cart, and the WhatsApp‑order message
all work unchanged against the new data (verified in‑browser).

---

## Validation (Phase 9)

- [x] All 10,405 Excel rows imported, 0 dropped
- [x] Product IDs unique (10,405 / 10,405)
- [x] `npm run build` succeeds (2.09 MB single file, **371 KB gzipped**)
- [x] `npx oxlint` — 0 errors
- [x] Every category chip renders with correct counts, pagination caps at 48
- [x] Search works across the full catalog (Arabic + English), stays responsive
- [x] Hair‑colour swatches match their shade numbers (spot‑checked Palette, Garnier, L'Oréal Casting, Bigen)
- [x] Prescription items show "bring prescription", no add‑to‑cart
- [x] Add‑to‑cart + WhatsApp message build correctly
- [x] Mobile (375 px) and English/Arabic both verified
- [x] Fallback placeholder shown for all 10,405 (no broken `<img>`)

---

## Remaining manual work

1. **Product images** — obtain an authorised set (see *Images* above). Until
   then the fallbacks stand in; the site is not blocked on this.
2. **Review `missing-or-ambiguous-products.json`** — 77 short‑code items and
   2 rows sharing code `0`; also one junk row (`45.558.5`, code `70042`).
3. **Second branch stock** — the sheet is the Hadayek October branch only.
   The 6 October branch currently mirrors the same stock. A per‑branch sheet
   would fix that.
4. **`rx` review** — 144 items auto‑flagged from a known‑drug list. A
   pharmacist should confirm which sections should be visit‑pharmacy‑only.
5. **Supabase** — schema updated but not deployed; the 10k‑row seed is large,
   so load it via CSV import rather than pasting `schema.sql` whole.
6. **Real offers** — 333 items carry an `offer` flag from the sheet's own
   wording; the Offers page still shows placeholder cards and could be wired
   to these.
