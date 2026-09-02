import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useDrawer } from '../../context/DrawerContext';
import { displayName } from '../../utils/displayName';
import { findAlternatives } from '../../utils/findAlternatives';
import { CategoryVisual } from '../../utils/categoryVisual';
import { Ltr } from '../../utils/Ltr';
import { products } from '../../data/products';

// A small centered popup (shares the drawers' overlay) rather than living
// inline on the product card — keeps the shop grid clean, and only asks for
// attention when there's actually something to offer. Triggered from
// ProductCard's "See alternative" link on an out-of-stock item.
export function AlternativeModal() {
  const { t } = useLanguage();
  const { changeQty, markSubstitute } = useCart();
  const { openDrawer, altModalProduct, closeAltModal } = useDrawer();
  const [addedId, setAddedId] = useState(null);

  const isOpen = openDrawer === 'altModal';
  const { type, matches } = altModalProduct
    ? findAlternatives(altModalProduct, products)
    : { type: null, matches: [] };

  // Reset the "added" flash whenever a new product's popup opens.
  useEffect(() => {
    if (isOpen) setAddedId(null);
  }, [isOpen, altModalProduct]);

  if (!altModalProduct) return null;

  const handleAdd = (alt) => {
    changeQty(alt.id, 1);
    markSubstitute(alt.id, altModalProduct.id, type);
    setAddedId(alt.id);
    setTimeout(closeAltModal, 700);
  };

  return (
    <div className={'alt-modal' + (isOpen ? ' show' : '')} role="dialog" aria-modal="true">
      <div className="cart-header" style={{ padding: 0, border: 'none', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>{type === 'similar' ? t('altModalSimilarTitle') : t('altModalTitle')}</h3>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
            {t('substituteNoteLabel')}: {displayName(altModalProduct)}
          </div>
        </div>
        <button className="close-btn" onClick={closeAltModal}>×</button>
      </div>

      {type === 'similar' && <div className="alt-modal-caution">{t('altModalSimilarNote')}</div>}

      {matches.map((alt) => (
        <div className="alt-modal-row" key={alt.id}>
          <div className="cart-item-icon">
            <CategoryVisual catId={alt.cat} size="20px" />
          </div>
          <div className="cart-item-info">
            <div className="cart-item-name">{displayName(alt)}</div>
            <div className="cart-item-price"><Ltr>{alt.price} {t('egp')}</Ltr></div>
            {type === 'ingredient' && <div className="alt-modal-ingredient">{alt.activeIngredient}</div>}
          </div>
          <button
            type="button"
            className="alt-modal-add-btn"
            disabled={addedId === alt.id}
            onClick={() => handleAdd(alt)}
          >
            {addedId === alt.id ? t('altAdded') : t('addAlternative')}
          </button>
        </div>
      ))}
    </div>
  );
}
