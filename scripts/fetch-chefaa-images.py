# -*- coding: utf-8 -*-
"""
Product photos from Chefaa (chefaa.com, an Egyptian online pharmacy) via Scrapling.

Why this source: its catalog is Egyptian pharmacy stock, so it overlaps this
inventory far better than the European open databases tried before, and its
robots.txt disallows only the cart, query-string URLs and /waffar pages —
product pages under /eg-ar/nowProduct/ are open to crawlers.

How it stays polite and accurate:
  1. Matching is done against the product URLs listed in Chefaa's own public
     sitemap. No page is fetched to decide a match; only the chosen ones are.
  2. Only the trial's products are fetched, one at a time, with a pause.
  3. A match must pass twice: the URL slug against the catalog name, then the
     product page's own title against it again. A wrong photo on a pharmacy
     product is worse than none, so anything unsure is left out.
  4. Scrapling is used as a plain HTTP client — no stealth or fingerprint
     features. If a page refuses a normal request, the script stops rather
     than escalating.

Usage:
    python scripts/fetch-chefaa-images.py --limit 20            # dry run + Excel
    python scripts/fetch-chefaa-images.py --limit 20 --apply    # also write images
"""
import argparse, functools, io, json, os, re, sys, time, unicodedata, urllib.request

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  pip install pillow")
try:
    from scrapling.fetchers import Fetcher
except ImportError:
    sys.exit('Scrapling is required:  pip install "scrapling[fetchers]"')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG = os.path.join(ROOT, "src", "data", "catalog.generated.js")
IMG_DIR = os.path.join(ROOT, "public", "images", "products")
MANIFEST = os.path.join(ROOT, "src", "data", "productImages.generated.js")
REJECTED = os.path.join(ROOT, "scripts", "image-rejections.json")
SITEMAP = "https://chefaa.com/eg-ar/store_sitemap.xml"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"
HEADERS = {"User-Agent": UA, "Accept-Language": "ar,en;q=0.8"}
RETAIL = {"cosmetics", "fragrance", "baby", "skincare", "personal", "haircare", "oral"}

NOISE = set("""the a an of and for with plus new pack box bottle tube pcs pc piece pieces
set kit free offer price tab tabs tablet tablets cap caps capsule capsules""".split())
# words that mean the same thing on both sides
SYNONYM = {"parfum": "perfume", "fragrance": "perfume", "deodrant": "deodorant",
           "deo": "deodorant", "gm": "g", "gr": "g", "shampo": "shampoo",
           "toothpast": "toothpaste", "lotin": "lotion", "creme": "cream"}
SIZE_RX = re.compile(r"(\d+(?:\.\d+)?)\s*(ml|l|gm|gr|g|kg|mg)\b", re.I)


# ---------------------------------------------------------------- matching
def fold(s):
    s = unicodedata.normalize("NFKD", s or "")
    return "".join(c for c in s if not unicodedata.combining(c)).lower()


# every catalog name is compared against every sitemap slug (millions of
# pairs), so tokenising the same strings over and over dominates the run
@functools.lru_cache(maxsize=None)
def tokens(s):
    s = re.sub(r"(\d)(ml|gm|gr|g|kg|mg|l)\b", r"\1 \2", fold(s))   # "175ml" -> "175 ml"
    out = []
    for t in re.sub(r"[^a-z0-9 ]", " ", s).split():
        t = SYNONYM.get(t, t)
        if t in NOISE or t in ("ml", "g", "kg", "mg", "l"):
            continue
        out.append(t)
    return out


def size_of(s):
    m = SIZE_RX.search(fold(s).replace("-", " "))
    if not m:
        return None
    v, u = float(m.group(1)), m.group(2).lower()
    if u == "l":
        v, u = v * 1000, "ml"
    if u in ("gm", "gr"):
        u = "g"
    if u == "kg":
        v, u = v * 1000, "g"
    return (v, u)


def slug_text(url):
    slug = url.rstrip("/").rsplit("/", 1)[-1]
    slug = re.sub(r"-[a-z0-9]{4}$", "", slug)        # Chefaa appends a random 4-char id
    return slug.replace("-", " ")


def score(name, other):
    """Symmetric 0..1 similarity. Extra words on either side count against
    the match, a differing number (Blue 2 vs Blue 3) is heavily penalised,
    and a differing pack size caps the score below any accept threshold."""
    a, b = tokens(name), tokens(other)
    if len(a) < 2 or not b:
        return 0.0
    if a[0] not in b:                                  # brand must match
        return 0.0
    sa, sb = set(a), set(b)
    hit = sa & sb
    if not hit:
        return 0.0
    recall, precision = len(hit) / len(sa), len(hit) / len(sb)
    f1 = 2 * recall * precision / (recall + precision)
    na, nb = {t for t in sa if t.isdigit()}, {t for t in sb if t.isdigit()}
    if na != nb and (na or nb):
        f1 *= 0.35 if (na and nb) else 0.8
    za, zb = size_of(name), size_of(other)
    if za and zb:
        f1 = f1 * 0.4 if za != zb else min(1.0, f1 + 0.1)
    elif za or zb:
        f1 *= 0.85
    return round(f1, 3)


# ---------------------------------------------------------------- fetching
def get(url):
    page = Fetcher.get(url, headers=HEADERS, timeout=30)
    body = page.body if isinstance(page.body, str) else page.body.decode("utf-8", "ignore")
    return page.status, body


def product_page(url):
    status, body = get(url)
    if status != 200:
        return None
    img = re.search(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', body)
    title = re.search(r'<meta[^>]+property="og:title"[^>]+content="([^"]+)"', body)
    if not img:
        return None
    # keep the CDN's /filters:format(webp)/ URL as-is: counter-intuitively it
    # serves the full-resolution image (1289px in testing), while the bare
    # /public/uploads/ path returns a 336px thumbnail
    image = img.group(1)
    return {"image": image, "title": (title.group(1) if title else "").replace(" - شفاء", "").strip()}


# ---------------------------------------------------------------- images
def square_crop(data, size=800, margin=0.06, tol=18):
    im = Image.open(io.BytesIO(data))
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        white = Image.new("RGBA", im.size, (255, 255, 255, 255))
        white.alpha_composite(im)
        im = white
    im = im.convert("RGB")
    # trim near-white padding (not just exact white — JPEG edges are noisy)
    gray = im.convert("L").point(lambda v: 255 if v < 255 - tol else 0)
    box = gray.getbbox()
    if box:
        im = im.crop(box)
    side = int(max(im.size) * (1 + 2 * margin))
    canvas = Image.new("RGB", (side, side), (255, 255, 255))
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    if side > size:
        canvas = canvas.resize((size, size), Image.LANCZOS)
    return canvas


def download(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read()


# ---------------------------------------------------------------- main
def load_catalog():
    src = io.open(CATALOG, encoding="utf-8").read()
    return json.loads(src[src.index("["): src.rindex("]") + 1])


def load_manifest():
    if not os.path.exists(MANIFEST):
        return {}
    src = io.open(MANIFEST, encoding="utf-8").read()
    try:
        return json.loads(src[src.index("{"): src.rindex("}") + 1])
    except ValueError:
        return {}


def write_manifest(entries):
    body = json.dumps(dict(sorted(entries.items())), ensure_ascii=False, indent=2)
    io.open(MANIFEST, "w", encoding="utf-8").write(
        "// AUTO-GENERATED by scripts/fetch-chefaa-images.py — DO NOT EDIT BY HAND.\n"
        "// Product code -> photo info. src/data/products.js only shows a photo for\n"
        "// codes listed here, so a missing file can never render as a broken image.\n"
        f"export const productImages = {body};\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=20)
    ap.add_argument("--slug-threshold", type=float, default=0.8)
    ap.add_argument("--title-threshold", type=float, default=0.7)
    ap.add_argument("--delay", type=float, default=2.0, help="seconds between page fetches")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--xlsx", default="docs-internal/chefaa-image-trial.xlsx")
    ap.add_argument("--urls", default=None, help="local copy of the product URL list")
    a = ap.parse_args()

    # 1. product URLs from Chefaa's public sitemap
    if a.urls and os.path.exists(a.urls):
        urls = [u.strip() for u in io.open(a.urls, encoding="utf-8") if u.strip()]
    else:
        status, xml = get(SITEMAP)
        if status != 200:
            sys.exit(f"sitemap returned {status}")
        urls = re.findall(r"<loc>([^<]*/nowProduct/[^<]*)</loc>", xml)
    slugs = [(u, slug_text(u)) for u in urls]
    print(f"chefaa product urls: {len(urls)}")

    # 2. match catalog -> slug, no network
    catalog = [p for p in load_catalog() if p["cat"] in RETAIL]
    done = load_manifest()
    # Photos a human looked at and turned down (wrong variant, unbranded
    # stock shot, ...). Both automated checks passed for these, which is
    # exactly why they must be remembered — otherwise every future run would
    # propose the same wrong photo again.
    rejected = {}
    if os.path.exists(REJECTED):
        rejected = json.load(io.open(REJECTED, encoding="utf-8"))
    cands = []
    for p in catalog:
        if p["code"] in done or p["code"] in rejected:
            continue
        best = max(((score(p["en"], s), u, s) for u, s in slugs), default=(0, None, None))
        if best[0] >= a.slug_threshold:
            cands.append((best[0], p, best[1], best[2]))
    cands.sort(key=lambda c: -c[0])
    # a Chefaa product may only be claimed by one catalog product
    seen, trial = set(), []
    for c in cands:
        if c[2] in seen:
            continue
        seen.add(c[2])
        trial.append(c)
        if len(trial) >= a.limit:
            break
    print(f"catalog retail products: {len(catalog)} | confident slug matches: {len(cands)} | trying {len(trial)}\n")

    # 3. fetch only those pages, verify title, download + crop
    if a.apply:
        os.makedirs(IMG_DIR, exist_ok=True)
    rows = []
    for i, (s1, p, url, slug) in enumerate(trial, 1):
        row = {"code": p["code"], "catalog_name": p["en"], "section": p["cat"], "price": p["price"],
               "chefaa_title": "", "slug_score": s1, "title_score": 0, "link": url,
               "image_url": "", "status": "", "file": ""}
        try:
            info = product_page(url)
        except Exception as e:
            info, row["status"] = None, f"page error: {type(e).__name__}"
        if info:
            row["chefaa_title"], row["image_url"] = info["title"], info["image"]
            # Second, independent check — against the IMAGE FILE's own name
            # ("hero-baby-milk-ha-400gm-xyz1-01686069856.png"), not the page
            # title. Chefaa's titles are mostly Arabic, so comparing them to
            # an English catalog name rejected even perfect matches; the
            # filename is English and, more to the point, proves the photo
            # itself belongs to this product rather than just the page.
            img_name = info["image"].rsplit("/", 1)[-1]
            img_name = re.sub(r"\.(png|jpe?g|webp)$", "", img_name, flags=re.I)
            img_name = re.sub(r"-[a-z0-9]{4}-\d{6,}$|-\d{6,}$", "", img_name)
            row["title_score"] = max(score(p["en"], img_name.replace("-", " ")),
                                     score(p["en"], info["title"]))
            if row["title_score"] < a.title_threshold:
                row["status"] = "rejected: photo file name disagrees"
            else:
                try:
                    img = square_crop(download(info["image"]))
                    dest = os.path.join(IMG_DIR if a.apply else os.path.join(ROOT, "docs-internal", "chefaa-preview"),
                                        f"{p['code']}.jpg")
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    img.save(dest, "JPEG", quality=85, optimize=True, progressive=True)
                    row["file"], row["status"] = dest, "matched"
                except Exception as e:
                    row["status"] = f"image error: {type(e).__name__}"
        elif not row["status"]:
            row["status"] = "no image on page"
        rows.append(row)
        print(f"{i:3}. [{row['status'][:28]:>28}] slug {s1:.2f} title {row['title_score']:.2f}  "
              f"{p['en'][:40]:40} <- {row['chefaa_title'][:40]}")
        time.sleep(a.delay)

    write_xlsx(rows, os.path.join(ROOT, a.xlsx))
    ok = [r for r in rows if r["status"] == "matched"]
    print(f"\nmatched {len(ok)}/{len(rows)}   sheet: {a.xlsx}")

    if a.apply and ok:
        for r in ok:
            done[r["code"]] = {"src": f"images/products/{r['code']}.jpg",
                               "source": "chefaa.com", "page": r["link"]}
        write_manifest(done)
        print(f"manifest: {len(done)} products now have photos")


def write_xlsx(rows, path):
    import openpyxl
    from openpyxl.drawing.image import Image as XLImage
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Chefaa photos"
    head = ["Photo", "Code", "Catalog name", "Section", "Price EGP", "Chefaa product name",
            "Slug match", "Title match", "Status", "Product page", "Image URL"]
    ws.append(head)
    for c, w in enumerate([18, 10, 40, 11, 10, 42, 10, 10, 24, 50, 50], 1):
        ws.column_dimensions[get_column_letter(c)].width = w
        cell = ws.cell(row=1, column=c)
        cell.font, cell.fill = Font(bold=True, color="FFFFFF"), PatternFill("solid", fgColor="0F7A82")
    ws.freeze_panes = "B2"
    tmp = []
    for r in rows:
        ws.append(["", r["code"], r["catalog_name"], r["section"], r["price"], r["chefaa_title"],
                   r["slug_score"], r["title_score"], r["status"], r["link"], r["image_url"]])
        n = ws.max_row
        ws.row_dimensions[n].height = 100
        for col in (3, 6, 9, 10, 11):
            ws.cell(row=n, column=col).alignment = Alignment(wrap_text=True, vertical="center")
        ws.cell(row=n, column=9).fill = PatternFill("solid", fgColor="E4F4EA" if r["status"] == "matched" else "FBE8E5")
        for col, key in ((10, "link"), (11, "image_url")):
            if r[key]:
                ws.cell(row=n, column=col).hyperlink = r[key]
                ws.cell(row=n, column=col).font = Font(color="0F7A82", underline="single")
        if r["file"] and os.path.exists(r["file"]):
            thumb = Image.open(r["file"])
            thumb.thumbnail((125, 125))
            t = r["file"] + ".thumb.png"
            thumb.save(t)
            tmp.append(t)
            ws.add_image(XLImage(t), f"A{n}")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    wb.save(path)
    for t in tmp:
        os.remove(t)


if __name__ == "__main__":
    main()
