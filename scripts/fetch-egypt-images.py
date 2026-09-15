# -*- coding: utf-8 -*-
"""
Product photos from Egyptian online pharmacies and beauty stores.

Companion to fetch-chefaa-images.py (reuses its matching, cropping, manifest
and Excel code). These stores sell Egyptian stock priced in EGP, so like
Chefaa every section is allowed, medicines included.

Sources (robots.txt of page host and image host read 2026-09-15; none names
an AI agent, all allow /products/ or /product/):
  bloom, sabry, lotus, aldawaaegy, roots, feel22, sourcebeauty, loolia
      Shopify stores. The product sitemap already carries the image URL and
      the product title, so no page is fetched; photos come from
      cdn.shopify.com (robots allows it).
  ezaby  drahmedelezaby.com (WooCommerce, EGP). Sitemap carries image URLs.

Excluded: sidalih.com (Saudi, SAR), tdawi.com (blocks ClaudeBot),
gardeniapharmacies.com (Disallow: / for all), egyptdwa.com (no pack photos).

A match must pass twice:
  1. the product URL handle, indexed by its first word (brand position),
     scores >= --threshold against the catalog name;
  2. an independent name — the sitemap's product title for Shopify, the
     photo's file name for Ezaby — scores >= --title-threshold.
Then every photo is a PREVIEW until a human has reviewed the contact sheet.

Usage:
    python scripts/fetch-egypt-images.py --sitemap-dir <dir> --dry
    python scripts/fetch-egypt-images.py --sitemap-dir <dir> --limit 5000
"""
import argparse, collections, glob, html, io, json, os, re, runpy, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = runpy.run_path(os.path.join(ROOT, "scripts", "fetch-chefaa-images.py"))
score, tokens = C["score"], C["tokens"]

PREVIEW = os.path.join(ROOT, "docs-internal", "egypt-preview")
SHOPIFY = {  # source id -> (sitemap file prefix, host)
    "bloom": ("www.bloompharmacy.com", "bloompharmacy.com"),
    "sabry": ("pharmacysabry.com", "pharmacysabry.com"),
    "lotus": ("www.lotusonline.com", "lotusonline.com"),
    "aldawaaegy": ("aldawaaegy.com", "aldawaaegy.com"),
    "roots": ("roots-pharmacy.com", "roots-pharmacy.com"),
    "feel22": ("eg.feel22.com", "eg.feel22.com"),
    "sourcebeauty": ("sourcebeauty.com", "sourcebeauty.com"),
    "loolia": ("eg.looliacloset.com", "eg.looliacloset.com"),
}
# on an equal score, prefer pharmacies (cleaner pack shots) over beauty shops
PRIORITY = ["bloom", "sabry", "aldawaaegy", "lotus", "ezaby", "roots", "feel22", "sourcebeauty", "loolia"]
DELAY = {"ezaby": 2.0}
DEFAULT_DELAY = 1.0


def words(slug):
    return re.sub(r"[-_]+", " ", html.unescape(slug))


def file_words(url):
    name = url.split("?")[0].rsplit("/", 1)[-1]
    name = re.sub(r"\.(png|jpe?g|webp|gif)$", "", name, flags=re.I)
    name = re.sub(r"[-_](\d{5,}|[0-9a-f]{8}-[0-9a-f-]{27,})$", "", name, flags=re.I)
    return words(name)


def parse_shopify(d, source):
    prefix, host = SHOPIFY[source]
    out = {}
    for f in sorted(glob.glob(os.path.join(d, f"{prefix}-products-*.xml"))):
        text = io.open(f, encoding="utf-8").read()
        for block in re.finditer(r"<url>(.*?)</url>", text, re.S):
            b = block.group(1)
            m = re.search(r"<loc>(https://[^<]*/products/([^<]+))</loc>", b)
            img = re.search(r"<image:loc>([^<]+)</image:loc>", b)
            title = re.search(r"<image:title>([^<]*)</image:title>", b)
            if not m or not img:
                continue
            handle = html.unescape(m.group(2))
            url = html.unescape(img.group(1))
            url = url + ("&" if "?" in url else "?") + "width=1000"
            out[handle] = {"source": source, "id": handle, "text": words(handle),
                           "check": html.unescape(title.group(1)) if title else "",
                           "page": html.unescape(m.group(1)), "image": url}
    return out


def parse_ezaby(d):
    out = {}
    for f in sorted(glob.glob(os.path.join(d, "product-sitemap*.xml"))):
        text = io.open(f, encoding="utf-8").read()
        for block in re.finditer(r"<url>(.*?)</url>", text, re.S):
            b = block.group(1)
            m = re.search(r"<loc>(https://drahmedelezaby\.com/(?:ar/)?product/([^/<]+)/?)</loc>", b)
            img = re.search(r"<image:loc>([^<]+)</image:loc>", b)
            if not m or not img:
                continue
            slug = html.unescape(m.group(2))
            if slug in out and "/ar/" in m.group(1):
                continue                      # same product, prefer the English URL
            url = html.unescape(img.group(1))
            out[slug] = {"source": "ezaby", "id": slug, "text": words(re.sub(r"%[0-9a-f]{2}", " ", slug, flags=re.I)),
                         "check": file_words(url), "page": m.group(1), "image": url}
    return out


# Words whose presence on only one side says nothing about the variant.
HARMLESS = frozenset("""with for by in to on from scent baby babies kids kid child children hair face facial
body skin female male women woman men man ladies f w m spf cleansing moisturizing moisturising
moisturizer moisturiser vaginal contour glowing shaping s c x pro plus intimate eye oral
jar tablet tablets capsule capsules cap caps tab tabs sachet sachets ampoule ampoules amp
vial vials syrup susp suspension drops drop cream gel lotion ml gm g mg""".split())


GENERIC_FIRST = frozenset("""baby babies kids kid pure white black blue green red pink gold golden silver
care hair skin face body super natural nature soft fresh cotton medical beauty new extra classic
vitamin vit magic royal smart happy herbal organic premium ultra daily family mini maxi
cream gel oil lotion shampoo soap wax spray powder wipes mask serum toner hand foot nail lip
eye tooth dental oral cool ice aloe rose lemon coconut argan olive milk honey""".split())


_GENERIC_FILE = os.path.join(ROOT, "scripts", "generic-drug-names.txt")
GENERIC_DRUGS = frozenset(
    w.strip() for w in (io.open(_GENERIC_FILE, encoding="utf-8") if os.path.exists(_GENERIC_FILE) else [])
    if w.strip() and not w.startswith("#"))


# The ingredient list only guards medical sections, and its words that are
# also real brands on this sheet stay usable.
MEDICAL = frozenset("medicine vitamins pain cold digestive firstaid devices intimate home".split())
BRAND_EXEMPT = frozenset("vaseline clear banana essence polytar derma".split())


def variant_conflict(name, other):
    """Same brand and line, different variant: each name carries a word the
    other lacks ("... BERRIES scent" vs "... VANILLA scent", "... MENTHOL"
    vs "... CHARCOAL"). The F1 score still clears 0.9 on long names, so this
    is checked separately. Near-identical spellings (moisturizing /
    moisturizer, same 5-letter start) are not a conflict.

    Also: the same numbers in a different order are a different product.
    "COVERAM 10/5 MG" and "Coveram 5 mg-10 mg" share every number, so the
    token score matched them; the review caught both swapped pairs."""
    na = re.findall(r"\d+(?:\.\d+)?", name)
    nb = re.findall(r"\d+(?:\.\d+)?", other)
    if len(na) >= 2 and sorted(na) == sorted(nb) and na != nb:
        return True
    a, b = set(tokens(name)) - HARMLESS, set(tokens(other)) - HARMLESS
    only_a, only_b = a - b, b - a
    only_a = {t for t in only_a if not any(len(t) >= 5 and u[:5] == t[:5] for u in only_b)}
    only_b = {u for u in only_b if not any(len(u) >= 5 and t[:5] == u[:5] for t in a - b)}
    return bool(only_a and only_b)


# The pharmacy sheet abbreviates; store listings spell things out. These only
# rewrite spelling so the same words meet — they never relax the thresholds.
NORMALIZE = [
    (r"\b\d+(?:\.\d+)?\s*l\.?\s?e\b.*$", " "),          # "... 35 L.E", "... 10 L.E OF" price leftovers
    (r"\b(offer|offr|promo|price|u\.?s\.?a)\b\.?", " "),
    (r"\be\.?\s?d\.?\s?p(?:arfum)?\b|\beau de parfum\b|\bbody parfum\b|\bparfum\b", " perfume "),
    (r"\be\.?\s?d\.?\s?t\b|\beau de toilette\b", " toilette "),
    (r"\bf\s*/\s*men\b|\bfor men\b|\bf\s*/\s*m\b", " men "),
    (r"\bf\s*/\s*w(?:omen)?\b|\bfor women\b", " women "),
    (r"\bm\.\s?w\b\.?", " mouthwash "),
    (r"\btooth\s?pa?st[e]?\b|\btoothpast\b", " toothpaste "),
    (r"\bcond\b\.?", " conditioner "),
    (r"\bw\s*/\s*", " with "),
    (r"\bstik\b", " stick "), (r"\bboster\b", " booster "), (r"\bcaffe+ine\b", " caffeine "),
    (r"\bspf\.\s?(\d)", r" spf \1"),
    (r"(\d+)\s*\.\s*(pcs|gm|ml|g)\b", r"\1 \2"),        # "400.GM", "60.PCS"
    (r"\bpieces?\b", " pcs "),
]
NORMALIZE = [(re.compile(p, re.I), r) for p, r in NORMALIZE]


def norm(s):
    s = html.unescape(s or "")
    for rx, rep in NORMALIZE:
        s = rx.sub(rep, s)
    return re.sub(r"\s+", " ", s).strip()


# YOLO nail polish: the sheet lists shades as "YOLO NAIL POLISH 10 ML COD 257",
# stores as "Yolo Nail Polish Coconut 215 - toluene free". Matched only on the
# exact shade number, and only against listings that are nail polish (not
# remover/therapy/hardener) and carry exactly one number.
YOLO_SHEET = re.compile(r"^YOLO NAIL POLISH\b(?!.*\b(?:HARDENER|REMOVER|BASE|TOP COAT)\b).*?\bCOD\.?\s*(\d{1,4})\b", re.I)


def yolo_shade_source(text):
    t = text.lower()
    if not t.startswith("yolo") or "polish" not in t or re.search(r"remover|therapy|hardener|base|top coat|set|kit", t):
        return None
    nums = re.findall(r"\b\d{1,4}\b", t)
    return nums[0] if len(nums) == 1 else None


def load_sources(d, wanted):
    items = {}
    for s in wanted:
        parsed = parse_ezaby(d) if s == "ezaby" else parse_shopify(d, s)
        print(f"{s:12}: {len(parsed):6} products with a photo URL", flush=True)
        items.update({(s, k): v for k, v in parsed.items()})
    return items


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sitemap-dir", required=True)
    ap.add_argument("--sources", default=",".join(PRIORITY))
    ap.add_argument("--threshold", type=float, default=0.9)
    ap.add_argument("--title-threshold", type=float, default=0.7)
    ap.add_argument("--limit", type=int, default=100000)
    ap.add_argument("--dry", action="store_true", help="match only, no downloads")
    ap.add_argument("--xlsx", default="docs-internal/egypt-run.xlsx")
    a = ap.parse_args()

    items = load_sources(a.sitemap_dir, a.sources.split(","))
    index = collections.defaultdict(list)
    yolo = collections.defaultdict(list)
    for it in items.values():
        it["text"], it["check"] = norm(it["text"]), norm(it["check"])
        t = tokens(it["text"])
        if t:
            index[t[0]].append(it)
        shade = yolo_shade_source(it["text"])
        if shade and yolo_shade_source(it["check"] or it["text"]) == shade:
            yolo[shade.lstrip("0") or "0"].append(it)

    done = C["load_manifest"]()
    rejected = json.load(io.open(C["REJECTED"], encoding="utf-8")) if os.path.exists(C["REJECTED"]) else {}
    catalog = [p for p in C["load_catalog"]() if p["code"] not in done and p["code"] not in rejected]

    cands = []
    for p in catalog:
        ym = YOLO_SHEET.match(p["en"])
        if ym:
            opts = sorted(yolo.get(ym.group(1).lstrip("0") or "0", []), key=lambda it: PRIORITY.index(it["source"]))
            if opts:
                cands.append(((1.0, 1.0, 0), p, opts[0]))
            continue
        name = norm(p["en"])
        t = tokens(name)
        if len(t) < 2:
            continue
        # The first word has to identify the maker. "BABY CREAM 30 GM" or
        # "CLOZAPINE 25MG" name no brand, so any store's listing with the same
        # words may be a different company's pack.
        ingredient = tokens(p.get("activeIngredient") or "")
        generic_drug = (p["cat"] in MEDICAL and t[0] in GENERIC_DRUGS and t[0] not in BRAND_EXEMPT)
        if t[0] in GENERIC_FIRST or generic_drug or (ingredient and ingredient[0] == t[0]):
            continue
        best = None
        for it in index.get(t[0], []):
            s = score(name, it["text"])
            if s < a.threshold or variant_conflict(name, it["text"]):
                continue
            s2 = max(score(name, it["check"]), score(name, file_words(it["image"])))
            if s2 < a.title_threshold:
                continue
            key = (s, s2, -PRIORITY.index(it["source"]))
            if best is None or key > best[0]:
                best = (key, it)
        if best:
            cands.append((best[0], p, best[1]))
    cands.sort(key=lambda c: (-c[0][0], -c[0][1]))
    claimed, trial = set(), []
    for key, p, it in cands:
        if len(trial) >= a.limit:
            break
        k = (it["source"], it["id"])
        if k in claimed:
            continue
        claimed.add(k)
        trial.append((key, p, it))

    by_src = collections.Counter(it["source"] for _, _, it in trial)
    by_cat = collections.Counter(p["cat"] for _, p, _ in trial)
    print(f"\ncatalog products without a photo: {len(catalog)} | double-checked matches: {len(trial)}")
    print("by source :", dict(by_src.most_common()))
    print("by section:", dict(by_cat.most_common()), flush=True)
    if a.dry:
        for key, p, it in trial[:: max(1, len(trial) // 40)]:
            print(f"  {key[0]:.2f}/{key[1]:.2f} {it['source']:10} {p['en'][:42]:42} <- {it['text'][:40]} | {it['check'][:40]}")
        return

    os.makedirs(PREVIEW, exist_ok=True)
    rows = []
    for i, (key, p, it) in enumerate(trial, 1):
        row = {"code": p["code"], "catalog_name": p["en"], "section": p["cat"], "price": p["price"],
               "chefaa_title": f"[{it['source']}] {it['check'] or it['text']}", "slug_score": key[0],
               "title_score": key[1], "status": "", "link": it["page"], "image_url": it["image"], "file": ""}
        dest = os.path.join(PREVIEW, f"{p['code']}.jpg")
        # the photo's source URL sits next to it, so a later run that picks a
        # different listing for this product re-downloads instead of silently
        # reusing the old photo
        src_note = dest + ".src"
        network = False
        try:
            fresh = (os.path.exists(dest) and os.path.exists(src_note)
                     and io.open(src_note, encoding="utf-8").read() == it["image"])
            if not fresh:
                network = True
                C["square_crop"](C["download"](it["image"])).save(
                    dest, "JPEG", quality=85, optimize=True, progressive=True)
                io.open(src_note, "w", encoding="utf-8").write(it["image"])
            row["file"], row["status"] = dest, "matched"
        except Exception as e:
            row["status"] = f"error: {type(e).__name__}"
        rows.append(row)
        if i % 25 == 0 or row["status"] != "matched":
            print(f"{i:5}/{len(trial)} [{row['status'][:22]:>22}] {it['source']:10} {p['en'][:40]}", flush=True)
        if network:
            time.sleep(DELAY.get(it["source"], DEFAULT_DELAY))

    C["write_xlsx"](rows, os.path.join(ROOT, a.xlsx))
    io.open(os.path.join(ROOT, "docs-internal", "egypt-run.json"), "w", encoding="utf-8").write(
        json.dumps(rows, ensure_ascii=False, indent=1))
    print(f"\nmatched {sum(r['status'] == 'matched' for r in rows)}/{len(rows)}   sheet: {a.xlsx}   previews: {PREVIEW}")


if __name__ == "__main__":
    main()
