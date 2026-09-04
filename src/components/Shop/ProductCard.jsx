import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useCatalog } from '../../context/CatalogContext';
import { useDrawer } from '../../context/DrawerContext';
import { displayName } from '../../utils/displayName';
import { ProductVisual } from '../../utils/ProductVisual';
import { Ltr } from '../../utils/Ltr';
import { findAlternatives } from '../../utils/findAlternatives';
import { isInStock } from '../../utils/stock';

export function ProductCard({ product }) {
  const { t } = useLanguage();
  const { cart, changeQty, selectedBranch } = useCart();
  const { products } = useCatalog();
  const { openAltModal } = useDrawer();
  const qty = cart[product.id] || 0;
  const name = displayName(product);
  const inStock = isInStock(product, selectedBranch);
  const hasAlternative = !inStock && !product.rx && findAlternatives(product, products, selectedBranch).matches.length > 0;

  return (
    <div className="product-card">
      <div className="product-icon">
        <ProductVisual product={product} size="38px" />
      </div>

      {product.rx ? (
        <span className="stock-badge rx-badge">{t('rxRequired')}</span>
      ) : inStock ? (
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
      ) : !inStock ? (
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
