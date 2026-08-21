import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../context/CartContext';
import { displayName } from '../../utils/displayName';
import { CategoryVisual } from '../../utils/categoryVisual';
import { Ltr } from '../../utils/Ltr';

export function CartItemRow({ productId, product, qty }) {
  const { t } = useLanguage();
  const { changeQty, removeItem } = useCart();
  const name = displayName(product);
  const lineTotal = product.price * qty;

  return (
    <div className="cart-item">
      <div className="cart-item-icon">
        <CategoryVisual catId={product.cat} size="20px" />
      </div>
      <div className="cart-item-info">
        <div className="cart-item-name">{name}</div>
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
