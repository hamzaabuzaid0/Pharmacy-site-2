-- ============================================================
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
('b1', 'فرع 6 أكتوبر', '6th of October Branch', 'مدينة 6 أكتوبر، الحي الأول، 193، أمام معهد الجصري الأزهري', '6th of October City, Al Hai Al Awal, 193, in front of Al-Gasry Al-Azhari Institute', '201092901444', '201098342343', '0109 290 1444', '0109 834 2343', 25),
('b2', 'فرع حدائق أكتوبر', 'Hadayek October Branch', 'حدائق أكتوبر، الحي الأول، جاردنز مول 04', 'Hadayek October, Al Hai Al Awal, Gardenz Mall 04', '201070055592', '201070055579', '010 700 555 92', '010 700 555 79', 25)
on conflict (id) do nothing;

insert into products (id, ar, en, cat, price, rx, arabic_only, active_ingredient, similar_group, image_url) values
('p0', 'بانادول', 'Panadol', 'pain', 25, false, false, 'Paracetamol 500mg', null, 'images/products/p0.jpg'),
('p1', 'بانادول اكسترا', 'Panadol Extra', 'pain', 32, false, false, 'Paracetamol 500mg + Caffeine 65mg', null, 'images/products/p1.jpg'),
('p2', 'بروفين 400', 'Brufen 400 (Ibuprofen)', 'pain', 28, false, false, 'Ibuprofen 400mg', null, 'images/products/p2.jpg'),
('p3', 'فولتارين جل', 'Voltaren Gel', 'pain', 95, false, false, 'Diclofenac Diethylamine (topical)', null, 'images/products/p3.jpg'),
('p4', 'جل ديكلوفيناك - جينيريك', 'Diclofenac Gel (Generic)', 'pain', 75, false, false, 'Diclofenac Diethylamine (topical)', null, 'images/products/p4.jpg'),
('p5', 'كتافلام', 'Cataflam', 'pain', 40, false, false, 'Diclofenac Potassium (oral)', null, 'images/products/p5.jpg'),
('p6', 'استربسلز', 'Strepsils', 'cold', 35, false, false, null, null, 'images/products/p6.jpg'),
('p7', 'فيكس فيبوراب', 'Vicks Vaporub', 'cold', 60, false, false, null, null, 'images/products/p7.jpg'),
('p8', 'زيرتك', 'Zyrtec (Antihistamine)', 'cold', 45, false, false, 'Cetirizine 10mg', null, 'images/products/p8.jpg'),
('p9', 'كوديللار', 'Coldrelief', 'cold', 38, false, true, 'Paracetamol + Phenylephrine + Chlorpheniramine', null, 'images/products/p9.jpg'),
('p10', 'مضاد برد - جينيريك', 'Cold & Flu Relief (Generic)', 'cold', 30, false, false, 'Paracetamol + Phenylephrine + Chlorpheniramine', null, 'images/products/p10.jpg'),
('p11', 'أوجمنتين 1 جم', 'Augmentin 1g (Antibiotic)', 'cold', 110, true, false, 'Amoxicillin + Clavulanic Acid 1g', null, 'images/products/p11.jpg'),
('p12', 'فيتامين سي 1000', 'Vitamin C 1000mg', 'vit', 85, false, false, 'Ascorbic Acid 1000mg', null, 'images/products/p12.jpg'),
('p13', 'سنتروم ملتي فيتامين', 'Centrum Multivitamin', 'vit', 250, false, false, null, null, 'images/products/p13.jpg'),
('p14', 'أوميغا 3', 'Omega 3', 'vit', 180, false, false, 'Omega-3 Fish Oil', null, 'images/products/p14.jpg'),
('p15', 'فيتامين د3', 'Vitamin D3', 'vit', 120, false, false, 'Cholecalciferol (Vitamin D3)', null, 'images/products/p15.jpg'),
('p16', 'فيتامين د3 - جينيريك', 'Vitamin D3 (Generic)', 'vit', 90, false, false, 'Cholecalciferol (Vitamin D3)', null, 'images/products/p16.jpg'),
('p17', 'زنك بلس', 'Zinc Plus', 'vit', 95, false, false, 'Zinc', null, 'images/products/p17.jpg'),
('p18', 'حليب نان 1', 'Nan 1 Baby Formula', 'baby', 320, false, false, null, null, 'images/products/p18.jpg'),
('p19', 'بامبرز مقاس 3', 'Pampers Size 3', 'baby', 210, false, false, null, null, 'images/products/p19.jpg'),
('p20', 'مناديل مبللة للأطفال', 'Baby Wet Wipes', 'baby', 45, false, false, null, null, 'images/products/p20.jpg'),
('p21', 'كريم حفاضات', 'Diaper Rash Cream', 'baby', 70, false, false, null, 'diaper-rash-cream', 'images/products/p21.jpg'),
('p22', 'كريم حفاضات - بديل', 'Diaper Rash Cream (Alternative Brand)', 'baby', 65, false, false, null, 'diaper-rash-cream', 'images/products/p22.jpg'),
('p23', 'كريم نيفيا', 'Nivea Cream', 'skin', 90, false, false, null, 'face-moisturizer', 'images/products/p23.jpg'),
('p24', 'غسول سيتافيل', 'Cetaphil Cleanser', 'skin', 280, false, false, null, null, 'images/products/p24.jpg'),
('p25', 'واقي شمس لاروش', 'La Roche-Posay Sunscreen', 'skin', 450, false, false, null, null, 'images/products/p25.jpg'),
('p26', 'كريم مرطب للوجه', 'Facial Moisturizer', 'skin', 150, false, false, null, 'face-moisturizer', 'images/products/p26.jpg'),
('p27', 'شاش وضمادات', 'Gauze & Bandages', 'first', 20, false, false, null, null, 'images/products/p27.jpg'),
('p28', 'بيتادين مطهر', 'Betadine Antiseptic', 'first', 35, false, false, null, null, 'images/products/p28.jpg'),
('p29', 'ترمومتر رقمي', 'Digital Thermometer', 'first', 110, false, false, null, null, 'images/products/p29.jpg'),
('p30', 'جهاز ضغط الدم', 'Blood Pressure Monitor', 'first', 950, false, false, null, null, 'images/products/p30.jpg'),
('p31', 'معقم يدين', 'Hand Sanitizer', 'first', 30, false, false, null, null, 'images/products/p31.jpg'),
('p32', 'معجون أسنان سنسوداين', 'Sensodyne Toothpaste', 'personal', 95, false, false, null, null, 'images/products/p32.jpg'),
('p33', 'شامبو هيد اند شولدرز', 'Head & Shoulders Shampoo', 'personal', 140, false, false, null, null, 'images/products/p33.jpg'),
('p34', 'غسول فم ليسترين', 'Listerine Mouthwash', 'personal', 110, false, false, null, 'mouthwash', 'images/products/p34.jpg'),
('p35', 'غسول فم - بديل', 'Mouthwash (Alternative Brand)', 'personal', 85, false, false, null, 'mouthwash', 'images/products/p35.jpg')
on conflict (id) do nothing;

insert into branch_stock (product_id, branch_id, in_stock) values
('p0', 'b1', true),
('p0', 'b2', true),
('p1', 'b1', true),
('p1', 'b2', true),
('p2', 'b1', true),
('p2', 'b2', true),
('p3', 'b1', false),
('p3', 'b2', false),
('p4', 'b1', true),
('p4', 'b2', true),
('p5', 'b1', true),
('p5', 'b2', true),
('p6', 'b1', true),
('p6', 'b2', true),
('p7', 'b1', true),
('p7', 'b2', true),
('p8', 'b1', true),
('p8', 'b2', true),
('p9', 'b1', false),
('p9', 'b2', false),
('p10', 'b1', true),
('p10', 'b2', true),
('p11', 'b1', true),
('p11', 'b2', true),
('p12', 'b1', true),
('p12', 'b2', true),
('p13', 'b1', true),
('p13', 'b2', true),
('p14', 'b1', true),
('p14', 'b2', true),
('p15', 'b1', false),
('p15', 'b2', false),
('p16', 'b1', true),
('p16', 'b2', true),
('p17', 'b1', true),
('p17', 'b2', true),
('p18', 'b1', true),
('p18', 'b2', true),
('p19', 'b1', true),
('p19', 'b2', true),
('p20', 'b1', true),
('p20', 'b2', true),
('p21', 'b1', false),
('p21', 'b2', false),
('p22', 'b1', true),
('p22', 'b2', true),
('p23', 'b1', true),
('p23', 'b2', true),
('p24', 'b1', true),
('p24', 'b2', true),
('p25', 'b1', true),
('p25', 'b2', true),
('p26', 'b1', false),
('p26', 'b2', false),
('p27', 'b1', true),
('p27', 'b2', true),
('p28', 'b1', true),
('p28', 'b2', true),
('p29', 'b1', true),
('p29', 'b2', true),
('p30', 'b1', true),
('p30', 'b2', true),
('p31', 'b1', true),
('p31', 'b2', true),
('p32', 'b1', true),
('p32', 'b2', true),
('p33', 'b1', true),
('p33', 'b2', true),
('p34', 'b1', false),
('p34', 'b2', false),
('p35', 'b1', true),
('p35', 'b2', true)
on conflict (product_id, branch_id) do nothing;
