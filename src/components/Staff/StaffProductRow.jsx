import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../i18n/LanguageContext';
import { branchName } from '../../utils/branchText';
import { ProductVisual } from '../../utils/ProductVisual';

// One row per product: a photo (tap to replace), and one in-stock toggle
// per branch — this is the "as fast as possible" part. Each toggle writes
// straight to Supabase; CatalogContext's realtime subscription does the
// rest, so the customer-facing site updates within about a second with no
// further action from staff.
export function StaffProductRow({ product, branches }) {
  const { lang, t } = useLanguage();
  const [saving, setSaving] = useState(null); // branchId currently being toggled, or 'photo'
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const toggleStock = async (branchId, current) => {
    setSaving(branchId);
    setError('');
    const { error } = await supabase
      .from('branch_stock')
      .update({ in_stock: !current, updated_at: new Date().toISOString() })
      .eq('product_id', product.id)
      .eq('branch_id', branchId);
    setSaving(null);
    if (error) setError(error.message);
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    setSaving('photo');
    setError('');
    const path = `${product.id}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
    if (uploadError) {
      setSaving(null);
      setError(uploadError.message);
      return;
    }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    const { error: updateError } = await supabase.from('products').update({ image_url: data.publicUrl }).eq('id', product.id);
    setSaving(null);
    if (updateError) setError(updateError.message);
  };

  return (
    <div className="staff-product-row">
      <button
        type="button"
        className="staff-photo-btn"
        onClick={() => fileRef.current.click()}
        aria-label={t('staffChangePhoto')}
      >
        <ProductVisual product={product} size="24px" />
        {saving === 'photo' && <span className="staff-photo-uploading">…</span>}
      </button>
      <input
        ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => uploadPhoto(e.target.files[0])}
      />

      <div className="staff-product-info">
        <div className="staff-product-name">{lang === 'ar' ? product.ar : product.en}</div>
        <div className="staff-product-meta">
          <span>{product.price} {t('egp')}</span>
          {product.rx && <span className="stock-badge rx-badge">{t('rxRequired')}</span>}
        </div>
      </div>

      <div className="staff-branch-toggles">
        {branches.map((b) => {
          const current = !!product.stockByBranch?.[b.id];
          return (
            <label key={b.id} className="staff-toggle">
              <span className="staff-toggle-label">{branchName(b, lang)}</span>
              <input
                type="checkbox"
                checked={current}
                disabled={saving === b.id}
                onChange={() => toggleStock(b.id, current)}
              />
              <span className={'staff-toggle-pill' + (current ? ' on' : '')}>
                {current ? t('inStock') : t('outOfStock')}
              </span>
            </label>
          );
        })}
      </div>

      {error && <div className="staff-row-error">{error}</div>}
    </div>
  );
}
