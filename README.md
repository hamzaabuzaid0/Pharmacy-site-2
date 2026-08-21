# Pharmacy site — React version

## Structure
- `src/data/` — products, categories, branches. Edit these to update the catalog.
- `src/i18n/translations.js` — every UI text string, Arabic and English side by side.
- `src/context/` — shared app state (cart, customer/account, which drawer is open, current page).
- `src/components/` — one folder per section (Header, Nav, Home, Shop, Cart, Account, etc).

## Working on it
    npm install
    npm run dev       # local dev server with hot reload

## Building for deployment
    npm run build

This produces a single `dist/index.html` with everything (JS + CSS) bundled
inside it — no separate files, no build step needed wherever it's hosted.
Upload that one file to GitHub Pages (or wherever) exactly like the old
static version.
