# -*- coding: utf-8 -*-
"""
Collect Egyptian product names + pack photos from talabat pharmacy vendors.

Why talabat: https://www.talabat.com/robots.txt is `User-agent: *` with NO
Disallow lines and two public sitemaps, and the image host (talabat.dhmedia.io)
publishes no robots.txt at all. No AI agent is named anywhere. Pages are
server-rendered, so this reads the page's own embedded JSON (__NEXT_DATA__)
instead of touching any internal API, one page at a time with a pause.

(For the record: InstaShop, same corporate group, DISALLOWS /product/* for
every crawler — so it stays off-limits. This is a different site with
different, permissive rules.)

Output: docs-internal/talabat-products.json  [{name, image, sku, page, cat}]

Usage:
    python scripts/fetch-talabat-catalog.py --vendor <vendor-url-without-category>
"""
import argparse, io, json, os, re, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs-internal", "talabat-products.json")
CACHE = os.path.join(ROOT, "docs-internal", "talabat-page-cache.json")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0 Safari/537.36")


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", "ignore")


def next_data(html):
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    return json.loads(m.group(1)) if m else None


def walk_items(node, found):
    """Product records carry both a sku and an image URL."""
    if isinstance(node, list):
        for v in node:
            walk_items(v, found)
    elif isinstance(node, dict):
        if node.get("sku") and isinstance(node.get("image"), str) and "dhmedia" in node["image"]:
            found.append(node)
        for v in node.values():
            walk_items(v, found)
    return found


def categories(data):
    """Leaf categories with their item counts, from the page's own tree."""
    out = []
    def walk(node):
        if isinstance(node, list):
            for v in node:
                walk(v)
        elif isinstance(node, dict):
            subs = node.get("subCategories")
            if isinstance(subs, list) and node.get("slug"):
                if subs:
                    for s in subs:
                        if s.get("slug"):
                            out.append((node["slug"], s["slug"], s.get("count") or 0))
                    for s in subs:
                        walk(s)
            for v in node.values():
                if isinstance(v, (list, dict)) and v is not subs:
                    walk(v)
    walk(data.get("props", {}).get("pageProps", {}).get("initialState", {}).get("categories", []))
    seen, uniq = set(), []
    for parent, slug, n in out:
        if (parent, slug) not in seen:
            seen.add((parent, slug))
            uniq.append((parent, slug, n))
    return uniq


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--vendor", required=True, help="e.g. https://www.talabat.com/egypt/grocery/720810/<slug>")
    ap.add_argument("--aid", default="")
    ap.add_argument("--delay", type=float, default=2.0)
    ap.add_argument("--max-pages", type=int, default=40)
    a = ap.parse_args()

    cache = json.load(io.open(CACHE, encoding="utf-8")) if os.path.exists(CACHE) else {}
    products = {}
    if os.path.exists(OUT):
        for r in json.load(io.open(OUT, encoding="utf-8")):
            products[r["sku"]] = r

    suffix = f"?aid={a.aid}" if a.aid else ""
    # a category page carries the whole tree; the vendor landing page does not.
    # NOTE: vendor URLs only resolve with the area id (?aid=...).
    first = get(a.vendor + "/medicines" + suffix)
    cats = categories(next_data(first))
    print(f"leaf categories: {len(cats)} | items advertised: {sum(c[2] for c in cats)}", flush=True)

    for parent, slug, count in cats:
        pages = max(1, min(a.max_pages, (count + 19) // 20))
        for page in range(1, pages + 1):
            url = f"{a.vendor}/{parent}/{slug}{suffix}{'&' if suffix else '?'}page={page}"
            if url in cache:
                html = None
                items = cache[url]
            else:
                try:
                    html = get(url)
                except Exception as e:
                    print(f"  ERR {type(e).__name__} {url}", flush=True)
                    time.sleep(a.delay)
                    continue
                data = next_data(html)
                items = []
                for it in walk_items(data, []):
                    items.append({"name": it.get("title") or it.get("name") or "",
                                  "slug": it.get("slug", ""), "image": it["image"],
                                  "sku": str(it["sku"]), "page": url, "cat": f"{parent}/{slug}"})
                cache[url] = items
                io.open(CACHE, "w", encoding="utf-8").write(json.dumps(cache, ensure_ascii=False))
            for it in items:
                products.setdefault(it["sku"], it)
            if html is not None:
                time.sleep(a.delay)
            if not items:
                break
        print(f"  {parent}/{slug}: advertised {count} | collected so far {len(products)}", flush=True)
        io.open(OUT, "w", encoding="utf-8").write(json.dumps(list(products.values()), ensure_ascii=False, indent=1))

    io.open(OUT, "w", encoding="utf-8").write(json.dumps(list(products.values()), ensure_ascii=False, indent=1))
    print(f"\ncollected {len(products)} products -> {OUT}")


if __name__ == "__main__":
    main()
