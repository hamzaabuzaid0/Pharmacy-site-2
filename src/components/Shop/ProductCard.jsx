import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../context/CartContext';
import { displayName } from '../../utils/displayName';
import { CategoryVisual } from '../../utils/categoryVisual';
import { Ltr } from '../../utils/Ltr';
import { findAlternatives } from '../../utils/findAlternatives';
import { products } from '../../data/products';

export function ProductCard({ product }) {
  const { t } = useLanguage();
  const { cart, changeQty, markSubstitute } = useCart();
  const qty = cart[product.id] || 0;
  const name = displayName(product);
  const alternatives = !product.stock && !product.rx ? findAlternatives(product, products) : [];

  const addAlternative = (alt) => {
    changeQty(alt.id, 1);
    markSubstitute(alt.id, product.id);
  };

  return (
    <div className="product-card">
      <div className="product-icon">
        <CategoryVisual catId={product.cat} size="38px" />
      </div>

      {product.rx ? (
        <span className="stock-badge rx-badge">{t('rxRequired')}</span>
      ) : product.stock ? (
        <span className="stock-badge stock-yes">{t('inStock')}</span>
      ) : (
        <span className="stock-badge stock-no">{t('outOfStock')}</span>
      )}

      <div className="product-name">{name}</div>

      <div className="price-row">
        <span className="price"><Ltr>{product.price} {t('egp')}</Ltr></span>
      </div>

      {product.rx ? (
        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>
          {t('visitPharmacy')}
        </div>
      ) : !product.stock ? (
        <>
          <button className="add-btn" disabled>{t('add')}</button>
          {alternatives.length > 0 && (
            <div className="alt-suggestion">
              <div className="alt-suggestion-label">{t('altSuggestionLabel')}</div>
              {alternatives.map((alt) => (
                <button
                  key={alt.id}
                  type="button"
                  className="alt-suggestion-btn"
                  onClick={() => addAlternative(alt)}
                >
                  {displayName(alt)} · {t('addAlternative')}
                </button>
              ))}
            </div>
          )}
        </>
      ) : qty > 0 ? (
        <div className="qty-row">
          <button className="qty-btn" onClick={() => changeQty(product.id, -1)}>−</button>
          <span>{qty}</span>
          <button className="qty-btn" onClick={() => changeQty(product.id, 1)}>+</button>
        </div>
      ) : (
        <button className="add-btn" onClick={() => changeQty(product.id, 1)}>{t('add')}</button>
      )}
    </div>
  );
}
