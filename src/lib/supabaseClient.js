import { createClient } from '@supabase/supabase-js';

// Vite exposes VITE_-prefixed vars from .env.local (gitignored — see
// .env.example for what to put there). Until real project credentials are
// set, this stays unconfigured and the app falls back to the bundled static
// catalog (src/data/products.js / branches.js) exactly as it always has —
// see CatalogContext.jsx. That fallback is deliberate: it means the site
// never breaks just because Supabase hasn't been wired up yet.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
