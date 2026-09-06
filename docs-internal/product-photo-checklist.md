# Product Photos

**Superseded.** The 36-item demo catalog this checklist covered has been
replaced by the pharmacy's real inventory (~10,405 items — see
[CATALOG-IMPORT-REPORT.md](../CATALOG-IMPORT-REPORT.md)).

## Where photos stand now

- **No product photos are wired in.** Every item shows a clean fallback: a
  per-section illustrated icon, or — for the 141 hair-colour items — an
  accurate shade swatch built from the dye number.
- The 36 old demo photos still live in `public/images/products/p0…p35.jpg`
  but aren't referenced by any catalog item (generic/mislabelled brand
  shots — not safe to force-match to real SKUs).

## Adding real photos

The requested source (the pharmacy's InstaShop store) can't be scraped —
`robots.txt` disallows product pages and the site returns 403 to bots. An
**authorised** export is needed (InstaShop merchant dashboard, or a folder of
photos from the pharmacy).

Once you have photos:

1. Auto-crop the white padding (the earlier batch had the product at ~20% of
   the frame — fix that first).
2. Name each `public/images/products/<product-code>.jpg` — the code is the
   number from the inventory sheet (e.g. `53130.jpg`).
3. Add those codes to `CODES_WITH_IMAGE` in
   [`src/data/products.js`](../src/data/products.js).
4. `npm run build && cp dist/index.html docs/index.html`.

Staff can also upload photos one-by-one from the staff panel once Supabase is
live — those don't need step 3.
