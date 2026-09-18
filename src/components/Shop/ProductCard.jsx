import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useCatalog } from '../../context/CatalogContext';
import { useDrawer } from '../../context/DrawerContext';
import { displayName } from '../../utils/displayName';
import { ProductVisual } from '../../utils/ProductVisual';
import { Ltr } from '../../utils/Ltr';
import { findAlternatives } from '../../utils/findAlternatives';
import { isInStock, isInStockAnywhere } from '../../utils/stock';

export function ProductCard({ product }) {
  const { t } = useLanguage();
  const { cart, changeQty, selectedBranch, needsBranch, requireBranch } = useCart();
  const { products } = useCatalog();
  const { openAltModal } = useDrawer();
  const qty = cart[product.id] || 0;
  const name = displayName(product);
  // Before a branch is chosen, don't label everything "out of stock" — show
  // whether any branch has it; the picker then narrows it to the real branch.
  const inStock = needsBranch ? isInStockAnywhere(product) : isInStock(product, selectedBranch);
  const hasAlternative = !inStock && !product.rx && findAlternatives(product, products, selectedBranch).matches.length > 0;

  const brand = product.company && !/غير معرفة|^unknown$/i.test(product.company) ? product.company : null;
  const brandLine = product.shade
    ? `${t('shadeLabel')} ${product.shade}`
    : [brand, product.unit].filter(Boolean).join(' · ');

  return (
    <div className="product-card">
      <div className="product-media">
        {product.offer && <span className="offer-badge">{t('offerBadge')}</span>}
        <ProductVisual product={product} size="46px" />
        <span
          className={
            'stock-chip ' +
            (product.rx ? 'stock-rx' : inStock ? 'stock-yes' : 'stock-no')
          }
        >
          {product.rx ? t('rxRequired') : inStock ? t('inStock') : t('outOfStock')}
        </span>
      </div>

      <div className="product-name" title={name}>{name}</div>
      {brandLine && <div className="product-brand">{brandLine}</div>}

      <div className="price-row">
        <span className="price">
          <Ltr><span className="price-num">{product.price}</span> <span className="price-cur">{t('egp')}</span></Ltr>
        </span>
      </div>

      {product.rx ? (
        <div className="product-rx-note">{t('visitPharmacy')}</div>
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
        <button className="add-btn" onClick={() => requireBranch(() => changeQty(product.id, 1))}>{t('add')}</button>
      )}
    </div>
  );
}
