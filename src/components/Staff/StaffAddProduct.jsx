import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../i18n/LanguageContext';
import { categories } from '../../data/categories';

export function StaffAddProduct({ branches, onDone }) {
  const { lang, t } = useLanguage();
  const [ar, setAr] = useState('');
  const [en, setEn] = useState('');
  const [cat, setCat] = useState(categories[0].id);
  const [price, setPrice] = useState('');
  const [rx, setRx] = useState(false);
  const [activeIngredient, setActiveIngredient] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!ar.trim() || !en.trim() || !price) {
      setError(t('fillRequiredFields'));
      return;
    }
    setSaving(true);
    setError('');

    const id = crypto.randomUUID();
    const { error: insertError } = await supabase.from('products').insert({
      id, ar: ar.trim(), en: en.trim(), cat, price: Number(price), rx,
      active_ingredient: activeIngredient.trim() || null,
    });
    if (insertError) {
      setSaving(false);
      setError(insertError.message);
      return;
    }

    // New product starts out of stock everywhere until staff confirms it's
    // actually on the shelf at each branch — safer default than "in stock
    // everywhere" for something just added to the catalog.
    const stockRows = branches.map((b) => ({ product_id: id, branch_id: b.id, in_stock: false }));
    const { error: stockError } = await supabase.from('branch_stock').insert(stockRows);
    setSaving(false);
    if (stockError) { setError(stockError.message); return; }

    setAr(''); setEn(''); setPrice(''); setRx(false); setActiveIngredient('');
    onDone();
  };

  return (
    <form onSubmit={submit} style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
      <label className="form-label">{t('staffNameAr')}</label>
      <input className="form-input" value={ar} onChange={(e) => setAr(e.target.value)} dir="rtl" />

      <label className="form-label">{t('staffNameEn')}</label>
      <input className="form-input" value={en} onChange={(e) => setEn(e.target.value)} dir="ltr" />

      <label className="form-label">{t('shopByCategory')}</label>
      <select className="form-input" value={cat} onChange={(e) => setCat(e.target.value)}>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{lang === 'ar' ? c.ar : c.en}</option>
        ))}
      </select>

      <label className="form-label">{t('staffPrice')}</label>
      <input className="form-input" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />

      <label className="form-label">{t('staffActiveIngredientOptional')}</label>
      <input className="form-input" value={activeIngredient} onChange={(e) => setActiveIngredient(e.target.value)} />

      <label className="staff-toggle" style={{ marginTop: 12 }}>
        <input type="checkbox" checked={rx} onChange={(e) => setRx(e.target.checked)} />
        <span>{t('rxRequired')}</span>
      </label>

      {error && <div className="account-status" style={{ background: '#fbe9e7', color: 'var(--danger)' }}>{error}</div>}

      <button type="submit" className="account-submit" disabled={saving}>
        {saving ? '…' : t('staffSaveProduct')}
      </button>
    </form>
  );
}
