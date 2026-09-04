import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useCatalog } from '../../context/CatalogContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { displayName } from '../../utils/displayName';
import { StaffProductRow } from './StaffProductRow';
import { StaffAddProduct } from './StaffAddProduct';

// The staff panel — reached via a #staff URL (see NavigationContext.jsx),
// not linked from the customer-facing nav. Toggling stock here writes
// straight to branch_stock; CatalogContext's realtime subscription pushes
// that to every open customer tab within about a second, no redeploy.
//
// Auth: plain Supabase email/password (supabase.auth). Whoever signs in
// gets full write access — see supabase/schema.sql's RLS policies, which
// gate writes on "is there any authenticated user" rather than per-branch
// roles. Fine for a small pharmacy where a handful of staff share access;
// revisit if that ever needs to be more granular.
export function StaffPage() {
  const { t } = useLanguage();
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setCheckingSession(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <div className="staff-page">
        <div className="staff-card">
          <h2>{t('staffNotConfiguredTitle')}</h2>
          <p>{t('staffNotConfiguredBody')}</p>
        </div>
      </div>
    );
  }

  if (checkingSession) {
    return <div className="staff-page"><div className="staff-card">…</div></div>;
  }

  if (!session) {
    return <StaffLogin />;
  }

  return <StaffDashboard session={session} />;
}

function StaffLogin() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  };

  return (
    <div className="staff-page">
      <form className="staff-card" onSubmit={submit}>
        <h2>{t('staffLoginTitle')}</h2>
        <label className="form-label">{t('staffEmail')}</label>
        <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label className="form-label">{t('staffPassword')}</label>
        <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div className="account-status" style={{ background: '#fbe9e7', color: 'var(--danger)' }}>{error}</div>}
        <button type="submit" className="account-submit" disabled={loading}>
          {loading ? '…' : t('staffLoginBtn')}
        </button>
      </form>
    </div>
  );
}

function StaffDashboard() {
  const { t } = useLanguage();
  const { products, branches, loading } = useCatalog();
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = products.filter((p) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return p.ar.toLowerCase().includes(q) || p.en.toLowerCase().includes(q);
  });

  return (
    <div className="staff-page">
      <div className="staff-topbar">
        <h2>{t('staffDashboardTitle')}</h2>
        <button type="button" className="scan-reset-link" onClick={() => supabase.auth.signOut()}>
          {t('staffLogout')}
        </button>
      </div>

      <div className="staff-card" style={{ marginBottom: 16 }}>
        <button type="button" className="account-submit" style={{ marginTop: 0 }} onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? t('staffCancelAdd') : t('staffAddProductBtn')}
        </button>
        {showAdd && <StaffAddProduct branches={branches} onDone={() => setShowAdd(false)} />}
      </div>

      <input
        className="form-input" style={{ marginBottom: 12 }}
        type="text" placeholder={t('staffSearchPlaceholder')}
        value={query} onChange={(e) => setQuery(e.target.value)}
      />

      {loading ? (
        <div className="staff-card">…</div>
      ) : (
        <div className="staff-product-list">
          {filtered.map((p) => (
            <StaffProductRow key={p.id} product={p} branches={branches} displayName={displayName(p)} />
          ))}
        </div>
      )}
    </div>
  );
}
