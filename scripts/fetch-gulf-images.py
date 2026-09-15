# -*- coding: utf-8 -*-
"""
Product photos from Gulf pharmacies: Nahdi, Al-Dawaa, Life Pharmacy.

Companion to fetch-chefaa-images.py and reuses its matching, cropping,
manifest and Excel code. Stricter than Chefaa, because these are Saudi/UAE
stores:

  * RETAIL SECTIONS ONLY. A Saudi Augmentin box is not the Egyptian box a
    customer here buys, so medicines, vitamins, first aid and devices are
    never matched from these sources.
  * The catalog's first word must also be the FIRST word of the source name
    (so a generic word like "acne" can't pass as a brand), and the score must
    be >= 0.9, with the product-type conflict rule from score().
  * Every photo this writes is a PREVIEW. Nothing reaches the site until a
    human has reviewed the contact sheet.

Sources (robots.txt checked 2026-09-15):
  nahdi    product pages allowed; image host asks Crawl-delay 5 -> 5 s between downloads.
           The sitemap already carries each product's image URL, so no page is fetched.
  aldawaa  product pages allowed (only /*?* etc. disallowed); image host allows all.
           Needs one page fetch per product for og:image; og:title is the second check.
  life     sitemap carries image URLs; honours the CDN's content-signal policy.

Usage:
    python scripts/fetch-gulf-images.py --sitemap-dir <dir with downloaded sitemaps> \
        --sources nahdi,aldawaa,life
"""
import argparse, glob, html, io, json, os, re, runpy, sys, time, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = runpy.run_path(os.path.join(ROOT, "scripts", "fetch-chefaa-images.py"))
score, tokens = C["score"], C["tokens"]

EXCLUDE = {"medicine", "pain", "cold", "digestive", "vitamins", "intimate", "firstaid", "devices"}
PREVIEW = os.path.join(ROOT, "docs-internal", "gulf-preview")
CACHE = os.path.join(ROOT, "docs-internal", "gulf-page-cache.json")
DELAY = {"nahdi": 5.0, "aldawaa": 2.0, "life": 2.0}
DIRECT_IMAGE = {"nahdi", "life"}          # preferred on a tie: no page fetch needed


def words(slug):
    return slug.replace("-", " ")


def parse_nahdi(d):
    out = {}
    for f in sorted(glob.glob(os.path.join(d, "nahdi*.xml"))):
        text = io.open(f, encoding="utf-8").read()
        for block in re.finditer(r"<url>(.*?)</url>", text, re.S):
            b = block.group(1)
            m = re.search(r"<loc>(https://www\.nahdionline\.com/en-[a-z]{2}/([^<]+)/pdp/(\d+))</loc>", b)
            img = re.search(r"<image:loc>([^<]+)</image:loc>", b)
            if not m or not img or m.group(3) in out:
                continue
            url = html.unescape(img.group(1))
            # 1000px render: the default 500px is soft, the raw file is 3500px
            url = url.split("?")[0] + "?width=1000&height=1000&canvas=1000,1000&optimize=high&bg-color=255,255,255&fit=bounds"
            out[m.group(3)] = {"source": "nahdi", "id": m.group(3), "text": words(m.group(2)),
                               "page": m.group(1), "image": url}
    return out


def parse_aldawaa(d):
    out = {}
    text = io.open(os.path.join(d, "aldawaa.xml"), encoding="utf-8").read()
    for m in re.finditer(r"<loc>(https://www\.al-dawaa\.com/en/p/(\d+)/([^<]+))</loc>", text):
        out[m.group(2)] = {"source": "aldawaa", "id": m.group(2), "text": words(m.group(3)),
                           "page": m.group(1), "image": None}
    return out


def parse_life(d):
    out = {}
    for f in sorted(glob.glob(os.path.join(d, "life-product-images-*.xml"))):
        text = io.open(f, encoding="utf-8").read()
        for m in re.finditer(r"<loc>(https://www\.lifepharmacy\.com/product/([^<]+))</loc>\s*<image:image>\s*"
                             r"<image:loc>([^<]+)</image:loc>", text):
            out[m.group(2)] = {"source": "life", "id": m.group(2), "text": words(m.group(2)),
                               "page": m.group(1), "image": html.unescape(m.group(3))}
    return out


PARSERS = {"nahdi": parse_nahdi, "aldawaa": parse_aldawaa, "life": parse_life}


def aldawaa_page(url):
    status, body = C["get"](url)
    if status != 200:
        return None
    img = re.search(r'og:image"\s+content="([^"]+)"', body)
    title = re.search(r'og:title"\s+content="([^"]+)"', body)
    if not img:
        return None
    return {"image": html.unescape(img.group(1)), "title": html.unescape(title.group(1)) if title else ""}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sitemap-dir", required=True)
    ap.add_argument("--sources", default="nahdi,aldawaa,life")
    ap.add_argument("--threshold", type=float, default=0.9)
    ap.add_argument("--title-threshold", type=float, default=0.7)
    ap.add_argument("--limit", type=int, default=1000)
    ap.add_argument("--xlsx", default="docs-internal/gulf-run.xlsx")
    a = ap.parse_args()

    items = {}
    for s in a.sources.split(","):
        parsed = PARSERS[s](a.sitemap_dir)
        print(f"{s}: {len(parsed)} products with a usable entry", flush=True)
        items.update({(s, k): v for k, v in parsed.items()})

    # index each source name by its FIRST word only (brand position)
    index = collections.defaultdict(list)
    for it in items.values():
        t = tokens(it["text"])
        if t:
            index[t[0]].append(it)

    done = C["load_manifest"]()
    rejected = json.load(io.open(C["REJECTED"], encoding="utf-8")) if os.path.exists(C["REJECTED"]) else {}
    catalog = [p for p in C["load_catalog"]()
               if p["cat"] not in EXCLUDE and p["code"] not in done and p["code"] not in rejected]

    cands = []
    for p in catalog:
        t = tokens(p["en"])
        if len(t) < 2:
            continue
        best = None
        for it in index.get(t[0], []):
            s = score(p["en"], it["text"])
            key = (s, it["source"] in DIRECT_IMAGE)
            if s >= a.threshold and (best is None or key > best[0]):
                best = (key, it)
        if best:
            cands.append((best[0][0], p, best[1]))
    cands.sort(key=lambda c: -c[0])
    claimed, trial = set(), []
    for s, p, it in cands:
        if len(trial) >= a.limit:
            break
        k = (it["source"], it["id"])
        if k in claimed:
            continue
        claimed.add(k)
        trial.append((s, p, it))
    print(f"retail catalog products without a photo: {len(catalog)} | strict matches: {len(trial)} "
          f"({dict(collections.Counter(it['source'] for _, _, it in trial))})\n", flush=True)

    cache = json.load(io.open(CACHE, encoding="utf-8")) if os.path.exists(CACHE) else {}
    os.makedirs(PREVIEW, exist_ok=True)
    rows = []
    for i, (s1, p, it) in enumerate(trial, 1):
        row = {"code": p["code"], "catalog_name": p["en"], "section": p["cat"], "price": p["price"],
               "chefaa_title": f"[{it['source']}] {it['text']}", "slug_score": s1, "title_score": "",
               "status": "", "link": it["page"], "image_url": it["image"] or "", "file": ""}
        dest = os.path.join(PREVIEW, f"{p['code']}.jpg")
        network = False
        try:
            if it["source"] == "aldawaa":
                info = cache.get(it["page"])
                if info is None:
                    network = True
                    info = aldawaa_page(it["page"])
                    cache[it["page"]] = info
                    io.open(CACHE, "w", encoding="utf-8").write(json.dumps(cache, ensure_ascii=False))
                if not info:
                    row["status"] = "no image on page"
                else:
                    row["image_url"] = info["image"]
                    row["chefaa_title"] = f"[aldawaa] {info['title']}"
                    row["title_score"] = score(p["en"], info["title"])
                    if row["title_score"] < a.title_threshold:
                        row["status"] = "rejected: page title disagrees"
            if not row["status"]:
                if not os.path.exists(dest):
                    network = True
                    C["square_crop"](C["download"](row["image_url"])).save(
                        dest, "JPEG", quality=85, optimize=True, progressive=True)
                row["file"], row["status"] = dest, "matched"
        except Exception as e:
            row["status"] = f"error: {type(e).__name__}"
        rows.append(row)
        print(f"{i:3}. [{row['status'][:26]:>26}] {s1:.2f} {it['source']:8} {p['en'][:40]:40} <- {it['text'][:44]}", flush=True)
        if network:
            time.sleep(DELAY[it["source"]])

    C["write_xlsx"](rows, os.path.join(ROOT, a.xlsx))
    print(f"\nmatched {sum(r['status'] == 'matched' for r in rows)}/{len(rows)}   sheet: {a.xlsx}   previews: {PREVIEW}")


if __name__ == "__main__":
    main()
