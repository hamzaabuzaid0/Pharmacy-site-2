import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useDrawer } from '../../context/DrawerContext';
import { displayName } from '../../utils/displayName';
import { CategoryVisual } from '../../utils/categoryVisual';
import { Ltr } from '../../utils/Ltr';
import { findAlternatives } from '../../utils/findAlternatives';
import { products } from '../../data/products';

export function ProductCard({ product }) {
  const { t } = useLanguage();
  const { cart, changeQty } = useCart();
  const { openAltModal } = useDrawer();
  const qty = cart[product.id] || 0;
  const name = displayName(product);
  const hasAlternative = !product.stock && !product.rx && findAlternatives(product, products).matches.length > 0;

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
          {hasAlternative && (
            <button type="button" className="see-alt-link" onClick={() => openAltModal(product)}>
              {t('seeAlternative')}
            </button>
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
