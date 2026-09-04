import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useCatalog } from '../../context/CatalogContext';
import { displayName } from '../../utils/displayName';
import { ProductVisual } from '../../utils/ProductVisual';
import { Ltr } from '../../utils/Ltr';

export function CartItemRow({ productId, product, qty }) {
  const { t } = useLanguage();
  const { changeQty, removeItem, substitutes } = useCart();
  const { products } = useCatalog();
  const name = displayName(product);
  const lineTotal = product.price * qty;
  const sub = substitutes[productId];
  const original = sub ? products.find((p) => p.id === sub.originalId) : null;

  return (
    <div className="cart-item">
      <div className="cart-item-icon">
        <ProductVisual product={product} size="20px" />
      </div>
      <div className="cart-item-info">
        <div className="cart-item-name">{name}</div>
        {original && (
          <div className="cart-item-sub-note">{t('substituteNoteLabel')}: {displayName(original)}</div>
        )}
        <div className="cart-item-price">
          <Ltr>{product.price} {t('egp')} × {qty} = {lineTotal} {t('egp')}</Ltr>
        </div>
        <button className="remove-link" onClick={() => removeItem(productId)}>
          {t('remove')}
        </button>
      </div>
      <div className="qty-row">
        <button className="qty-btn" onClick={() => changeQty(productId, -1)}>−</button>
        <span>{qty}</span>
        <button className="qty-btn" onClick={() => changeQty(productId, 1)}>+</button>
      </div>
    </div>
  );
}
