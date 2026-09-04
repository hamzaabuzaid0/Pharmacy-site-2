// One-off generator: reads the current static data files and produces the
// full Supabase setup script (schema + RLS + realtime + seed data) so the
// seed rows are guaranteed to match products.js/branches.js exactly rather
// than being hand-typed. Run with: node scripts/generate-schema-sql.mjs
// Output: supabase/schema.sql
import { products } from '../src/data/products.js';
import { branches } from '../src/data/branches.js';
import { translations } from '../src/i18n/translations.js';
import { writeFileSync, mkdirSync } from 'fs';

function sqlStr(v) {
  if (v === null || v === undefined) return 'null';
  return `'${String(v).replace(/'/g, "''")}'`;
}
function sqlBool(v) { return v ? 'true' : 'false'; }

const branchRows = branches.map((b) => {
  const nameAr = translations.ar[b.nameKey];
  const nameEn = translations.en[b.nameKey];
  const addrAr = translations.ar[b.addrKey];
  const addrEn = translations.en[b.addrKey];
  return `(${sqlStr(b.id)}, ${sqlStr(nameAr)}, ${sqlStr(nameEn)}, ${sqlStr(addrAr)}, ${sqlStr(addrEn)}, ${sqlStr(b.waPhone)}, ${sqlStr(b.callPhone)}, ${sqlStr(b.waDisplay)}, ${sqlStr(b.callDisplay)}, ${b.deliveryFee})`;
}).join(',\n');

const productRows = products.map((p) => {
  return `(${sqlStr(p.id)}, ${sqlStr(p.ar)}, ${sqlStr(p.en)}, ${sqlStr(p.cat)}, ${p.price}, ${sqlBool(p.rx)}, ${sqlBool(!!p.arabicOnly)}, ${sqlStr(p.activeIngredient)}, ${sqlStr(p.similarGroup)}, ${sqlStr(p.image)})`;
}).join(',\n');

const stockRows = [];
products.forEach((p) => {
  branches.forEach((b) => {
    stockRows.push(`(${sqlStr(p.id)}, ${sqlStr(b.id)}, ${sqlBool(p.stock)})`);
  });
});

const sql = `-- ============================================================
-- Pharmacy site — Supabase setup script (auto-generated, do not hand-edit
-- the seed data section — regenerate with scripts/generate-schema-sql.mjs)
-- Paste this whole file into the Supabase SQL Editor and click Run.
-- ============================================================

create table if not exists branches (
  id text primary key,
  name_ar text not null,
  name_en text not null,
  addr_ar text not null,
  addr_en text not null,
  wa_phone text not null,
  call_phone text not null,
  wa_display text not null,
  call_display text not null,
  delivery_fee numeric not null default 25
);

create table if not exists products (
  id text primary key,
  ar text not null,
  en text not null,
  cat text not null,
  price numeric not null,
  rx boolean not null default false,
  arabic_only boolean not null default false,
  active_ingredient text,
  similar_group text,
  image_url text,
  created_at timestamptz not null default now()
);

-- One row per (product, branch) — the actual "is this in stock HERE" answer.
create table if not exists branch_stock (
  product_id text not null references products(id) on delete cascade,
  branch_id text not null references branches(id) on delete cascade,
  in_stock boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (product_id, branch_id)
);

-- ============================================================
-- Row Level Security — public can read everything (the anon key is meant
-- to be embedded in the site), only signed-in staff can write.
-- ============================================================
alter table branches enable row level security;
alter table products enable row level security;
alter table branch_stock enable row level security;

drop policy if exists "Public read branches" on branches;
create policy "Public read branches" on branches for select using (true);
drop policy if exists "Public read products" on products;
create policy "Public read products" on products for select using (true);
drop policy if exists "Public read branch_stock" on branch_stock;
create policy "Public read branch_stock" on branch_stock for select using (true);

drop policy if exists "Staff write branches" on branches;
create policy "Staff write branches" on branches for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "Staff write products" on products;
create policy "Staff write products" on products for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "Staff write branch_stock" on branch_stock;
create policy "Staff write branch_stock" on branch_stock for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- Realtime — lets the customer-facing site update instantly when staff
-- change stock, with no page refresh.
-- ============================================================
alter publication supabase_realtime add table branch_stock;
alter publication supabase_realtime add table products;

-- ============================================================
-- Storage bucket for product photos, publicly readable, staff-writable.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images" on storage.objects for select
  using (bucket_id = 'product-images');
drop policy if exists "Staff upload product images" on storage.objects;
create policy "Staff upload product images" on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
drop policy if exists "Staff update product images" on storage.objects;
create policy "Staff update product images" on storage.objects for update
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- ============================================================
-- Seed data — current demo catalog, generated from products.js/branches.js
-- ============================================================
insert into branches (id, name_ar, name_en, addr_ar, addr_en, wa_phone, call_phone, wa_display, call_display, delivery_fee) values
${branchRows}
on conflict (id) do nothing;

insert into products (id, ar, en, cat, price, rx, arabic_only, active_ingredient, similar_group, image_url) values
${productRows}
on conflict (id) do nothing;

insert into branch_stock (product_id, branch_id, in_stock) values
${stockRows.join(',\n')}
on conflict (product_id, branch_id) do nothing;
`;

mkdirSync(new URL('../supabase', import.meta.url), { recursive: true });
writeFileSync(new URL('../supabase/schema.sql', import.meta.url), sql);
console.log(`Wrote supabase/schema.sql — ${branches.length} branches, ${products.length} products, ${stockRows.length} stock rows.`);
