# -*- coding: utf-8 -*-
"""
Product-image trial: find a real photo for catalog products from OPEN DATA.

Source: Open Beauty Facts / Open Food Facts — public, documented APIs built
for programmatic access, whose product photos are contributed under a free
licence (CC-BY-SA, attribution required). That is a deliberate choice over
scraping a retailer: no robots.txt or terms to tiptoe around, no bot
protection to defeat, and an image licence that actually permits reuse on a
commercial pharmacy site.

Matching is conservative on purpose — a wrong photo on a medicine is worse
than no photo. A candidate is only accepted when the brand matches and most
of the product's own words are present; everything else is reported as a
miss so a human can look.

Usage:
    python scripts/fetch-product-images.py --limit 20
    python scripts/fetch-product-images.py --limit 20 --apply
"""
import argparse, io, json, os, re, sys, time, unicodedata, urllib.parse, urllib.request

try:
    from PIL import Image, ImageChops
except ImportError:
    sys.exit("Pillow is required:  pip install pillow")

try:
    from scrapling.fetchers import Fetcher
    HAVE_SCRAPLING = True
except Exception:
    HAVE_SCRAPLING = False

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG = os.path.join(ROOT, "src", "data", "catalog.generated.js")
OUT_IMG = os.path.join(ROOT, "public", "images", "products")
UA = "AhmedMaherPharmacySite/1.0 (+catalog image matching; contact: pharmacy site owner)"

SOURCES = [
    ("Open Beauty Facts", "https://world.openbeautyfacts.org"),
    ("Open Food Facts", "https://world.openfoodfacts.org"),
]

# words that say nothing about identity — dropped before matching
NOISE = set("""the a an of and for with plus new original classic pack box bottle tube
ml mg gm g kg l cm pcs pc tab tabs cap caps set kit free offer""".split())
SIZE_RX = re.compile(r"\b(\d+(?:\.\d+)?)\s*(ml|l|gm|g|kg|mg)\b", re.I)


def load_catalog():
    src = io.open(CATALOG, encoding="utf-8").read()
    raw = src[src.index("["): src.rindex("]") + 1]
    return json.loads(raw)


def tokens(s):
    # strip accents first — the catalog says AVENE, the open database says
    # "Avène", and without folding those the brand check never matches
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^A-Za-z0-9 ]", " ", s.lower())
    # digits are KEPT: "Blue 2" and "Blue 3" are different razors, "Molfix 2"
    # and "Molfix 4" different nappy sizes. Dropping them made those match
    # each other at full confidence. Pack sizes are handled by size_of() and
    # stripped there instead.
    return [t for t in s.split() if t and t not in NOISE]


def size_of(s):
    m = SIZE_RX.search(s or "")
    if not m:
        return None
    v, u = float(m.group(1)), m.group(2).lower()
    if u == "l":
        v, u = v * 1000, "ml"
    if u in ("g", "gm"):
        u = "g"
    if u == "kg":
        v, u = v * 1000, "g"
    return (v, u)


def http_json(url):
    """Fetch JSON — via Scrapling when available, urllib otherwise."""
    if HAVE_SCRAPLING:
        try:
            page = Fetcher.get(url, headers={"User-Agent": UA}, timeout=30)
            return json.loads(page.body if isinstance(page.body, str) else page.body.decode("utf-8"))
        except Exception:
            pass
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def search(base, terms):
    url = (base + "/cgi/search.pl?" + urllib.parse.urlencode({
        "search_terms": terms, "search_simple": 1, "action": "process",
        "json": 1, "page_size": 12,
    }))
    try:
        return http_json(url).get("products", []) or []
    except Exception:
        return []


def score(prod_tokens, prod_size, cand):
    """0..1 confidence that `cand` is the same product.

    Deliberately symmetric. An earlier version only asked "how many of my
    words appear in the candidate", which scored
      "Gillette Blue 2 10+2"          -> "Gillette Blue 3 Smooth 4stk"
      "Nivea After Shave Balm Sensitive" -> "Nivea After Shave Balm Moisturising"
    at full confidence, because the candidate's *extra* words — the very
    words naming a different variant — cost nothing. Unmatched words on the
    candidate's side now count against the match too.
    """
    title = " ".join(filter(None, [cand.get("product_name") or "",
                                   cand.get("brands") or ""]))
    qty = cand.get("quantity") or ""
    ct = set(tokens(title))
    pt = set(prod_tokens)
    if not ct or not pt:
        return 0.0
    # the brand (first meaningful word) has to be there — without it this is
    # a different company's product that happens to share a category word
    if prod_tokens[0] not in ct:
        return 0.0

    hit = pt & ct
    recall = len(hit) / len(pt)          # how much of my product is covered
    precision = len(hit) / len(ct)       # how much of the candidate is mine
    if recall + precision == 0:
        return 0.0
    f1 = 2 * recall * precision / (recall + precision)

    # a digit present on one side and absent on the other is almost always a
    # variant/size difference (Blue 2 vs Blue 3, Molfix 2 vs Molfix 4)
    my_nums, cand_nums = {t for t in pt if t.isdigit()}, {t for t in ct if t.isdigit()}
    if my_nums and cand_nums and not (my_nums & cand_nums):
        f1 *= 0.3

    cs = size_of(qty) or size_of(title)
    if prod_size and cs:
        if cs != prod_size:
            return f1 * 0.45              # right product line, wrong pack
        f1 = min(1.0, f1 + 0.1)           # pack size agrees
    return f1


def best_match(product):
    name = product["en"]
    pt, ps = tokens(name), size_of(name)
    if len(pt) < 2:
        return None
    query = " ".join(pt[:4])
    best = None
    for label, base in SOURCES:
        for cand in search(base, query):
            img = cand.get("image_front_url") or cand.get("image_url")
            if not img:
                continue
            s = score(pt, ps, cand)
            if best is None or s > best["score"]:
                best = {
                    "score": round(s, 3), "source": label,
                    "title": (cand.get("product_name") or "").strip(),
                    "brand": (cand.get("brands") or "").strip(),
                    "quantity": (cand.get("quantity") or "").strip(),
                    "image": img,
                    "link": f"{base}/product/{cand.get('code','')}",
                }
        time.sleep(0.4)   # be polite to a volunteer-run service
    return best


def autocrop(img, margin=0.04):
    """Trim uniform border, then pad back to a square with a small margin."""
    rgb = img.convert("RGB")
    bg = Image.new("RGB", rgb.size, rgb.getpixel((0, 0)))
    diff = ImageChops.difference(rgb, bg)
    box = diff.getbbox()
    if box:
        rgb = rgb.crop(box)
    side = int(max(rgb.size) * (1 + margin * 2))
    canvas = Image.new("RGB", (side, side), (255, 255, 255))
    canvas.paste(rgb, ((side - rgb.width) // 2, (side - rgb.height) // 2))
    return canvas.resize((600, 600), Image.LANCZOS)


def download_image(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        data = r.read()
    img = Image.open(io.BytesIO(data))
    autocrop(img).save(dest, "JPEG", quality=86, optimize=True)
    return os.path.getsize(dest)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=20)
    ap.add_argument("--threshold", type=float, default=0.6,
                    help="minimum confidence to accept a match")
    ap.add_argument("--apply", action="store_true",
                    help="write the images into public/images/products/")
    ap.add_argument("--xlsx", default="docs-internal/product-image-trial.xlsx")
    a = ap.parse_args()

    catalog = load_catalog()
    # Trial set: the retail sections the pharmacy leads with, and products
    # with a recognisable international brand — the ones an open product
    # database plausibly holds. Medicines are excluded from the trial
    # entirely; a wrong box on a medicine is the worst failure mode here.
    RETAIL = {"cosmetics", "fragrance", "baby", "skincare", "personal", "haircare", "oral"}
    BRANDS = ("NIVEA", "DOVE", "PAMPERS", "GARNIER", "LOREAL", "VASELINE", "COLGATE",
              "SENSODYNE", "LISTERINE", "GILLETTE", "REXONA", "AXE", "ADIDAS",
              "JOHNSON", "HEAD", "PANTENE", "EUCERIN", "VICHY", "CERAVE", "BIODERMA",
              "NUTELLA", "ORAL-B", "ORAL B", "PALMOLIVE", "LUX", "SIGNAL", "MOLFIX",
              "HUGGIES", "CETAPHIL", "LA ROCHE", "NEUTROGENA", "AVENE", "BEESLINE")
    def brand_of(p):
        up = p["en"].upper()
        return next((b for b in BRANDS if b in up), None)

    pool = [p for p in catalog if p["cat"] in RETAIL and brand_of(p)]
    pool.sort(key=lambda p: p["en"])
    # Spread the trial across brands rather than taking the alphabetical
    # first N — otherwise "20 products" is really "one brand, 20 times",
    # which measures that brand's coverage instead of the approach's.
    by_brand = {}
    for p in pool:
        by_brand.setdefault(brand_of(p), []).append(p)
    trial, round_no = [], 0
    while len(trial) < a.limit and round_no < 40:
        for b in sorted(by_brand):
            if round_no < len(by_brand[b]) and len(trial) < a.limit:
                trial.append(by_brand[b][round_no])
        round_no += 1

    print(f"catalog {len(catalog)} products | eligible {len(pool)} | trying {len(trial)}")
    print(f"fetcher: {'scrapling' if HAVE_SCRAPLING else 'urllib'}\n")

    if a.apply:
        os.makedirs(OUT_IMG, exist_ok=True)

    rows = []
    for i, p in enumerate(trial, 1):
        m = best_match(p)
        ok = bool(m and m["score"] >= a.threshold)
        row = {
            "code": p["code"], "catalog_name": p["en"], "category": p["cat"],
            "price_egp": p["price"],
            "matched_name": (m or {}).get("title", ""),
            "matched_brand": (m or {}).get("brand", ""),
            "matched_size": (m or {}).get("quantity", ""),
            "confidence": (m or {}).get("score", 0),
            "source": (m or {}).get("source", ""),
            "link": (m or {}).get("link", ""),
            "image_url": (m or {}).get("image", ""),
            "status": "matched" if ok else ("low confidence" if m else "no candidate"),
            "saved_as": "",
        }
        if ok and a.apply:
            dest = os.path.join(OUT_IMG, f"{p['code']}.jpg")
            try:
                kb = download_image(m["image"], dest) // 1024
                row["saved_as"] = f"images/products/{p['code']}.jpg ({kb} KB)"
            except Exception as e:
                row["status"] = f"download failed: {e}"
        elif ok:
            row["saved_as"] = f"(dry run) images/products/{p['code']}.jpg"
        rows.append(row)
        print(f"{i:3}. [{row['status']:>15}] {row['confidence']:.2f}  {p['en'][:44]:44} -> {row['matched_name'][:34]}")

    write_xlsx(rows, os.path.join(ROOT, a.xlsx), apply=a.apply)

    got = sum(1 for r in rows if r["status"] == "matched")
    print(f"\nmatched {got}/{len(rows)}  ({got * 100 // max(1, len(rows))}%)")
    print(f"sheet: {a.xlsx}")
    if got and a.apply:
        codes = [r["code"] for r in rows if r["status"] == "matched"]
        print("\nAdd these to CODES_WITH_IMAGE in src/data/products.js:")
        print("  " + ", ".join(f"'{c}'" for c in codes))


def write_xlsx(rows, path, apply=False):
    import openpyxl
    from openpyxl.styles import Font, Alignment, PatternFill
    from openpyxl.utils import get_column_letter

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Image trial"
    headers = ["Photo", "Code", "Catalog name", "Section", "Price EGP",
               "Matched product", "Brand", "Size", "Confidence", "Source",
               "Source link", "Image URL", "Status"]
    ws.append(headers)
    head_fill = PatternFill("solid", fgColor="0F7A82")
    for c in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=c)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = head_fill
        cell.alignment = Alignment(vertical="center")
    ws.freeze_panes = "A2"

    widths = [16, 10, 42, 12, 10, 34, 16, 12, 11, 18, 46, 46, 18]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w

    ok_fill = PatternFill("solid", fgColor="E4F4EA")
    bad_fill = PatternFill("solid", fgColor="FBE8E5")

    for r in rows:
        ws.append(["", r["code"], r["catalog_name"], r["category"], r["price_egp"],
                   r["matched_name"], r["matched_brand"], r["matched_size"],
                   r["confidence"], r["source"], r["link"], r["image_url"], r["status"]])
        row_i = ws.max_row
        ws.row_dimensions[row_i].height = 84
        fill = ok_fill if r["status"] == "matched" else bad_fill
        ws.cell(row=row_i, column=13).fill = fill
        for col in (3, 6, 11, 12):
            ws.cell(row=row_i, column=col).alignment = Alignment(wrap_text=True, vertical="center")
        if r["link"]:
            link_cell = ws.cell(row=row_i, column=11)
            link_cell.hyperlink = r["link"]
            link_cell.font = Font(color="0F7A82", underline="single")
        # embed the photo itself so the sheet can be checked by eye
        local = os.path.join(OUT_IMG, f"{r['code']}.jpg")
        if r["status"] == "matched" and os.path.exists(local):
            try:
                from openpyxl.drawing.image import Image as XLImage
                thumb = Image.open(local).convert("RGB")
                thumb.thumbnail((104, 104))
                buf = os.path.join(OUT_IMG, f".thumb_{r['code']}.png")
                thumb.save(buf, "PNG")
                xi = XLImage(buf)
                ws.add_image(xi, f"A{row_i}")
            except Exception:
                pass

    os.makedirs(os.path.dirname(path), exist_ok=True)
    wb.save(path)
    # clean the temp thumbnails back out of the image folder
    for f in os.listdir(OUT_IMG) if os.path.isdir(OUT_IMG) else []:
        if f.startswith(".thumb_"):
            try:
                os.remove(os.path.join(OUT_IMG, f))
            except OSError:
                pass


if __name__ == "__main__":
    main()
