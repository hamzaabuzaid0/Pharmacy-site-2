import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useCustomer } from '../../context/CustomerContext';
import { useDrawer } from '../../context/DrawerContext';
import { useOrderHistory } from '../../context/OrderHistoryContext';
import { products } from '../../data/products';
import { buildWhatsappMessage } from '../../utils/buildWhatsappMessage';
import { Ltr } from '../../utils/Ltr';
import { WhatsAppIcon } from '../WhatsAppIcon';
import { CartItemRow } from './CartItemRow';

export function CartDrawer() {
  const { lang, t } = useLanguage();
  const { cart, branch, itemsTotal, deliveryFee, grandTotal, itemCount, substitutes } = useCart();
  const { customer } = useCustomer();
  const { openDrawer, closeCart, openAccount } = useDrawer();
  const { addOrder } = useOrderHistory();

  const ids = Object.keys(cart);
  const isOpen = openDrawer === 'cart';

  const handleOrder = () => {
    if (!customer) {
      // Require delivery info before an order can be sent — open the
      // account drawer instead of sending. Marking this a pending checkout
      // means finishing the form returns straight back to the cart.
      openAccount(true);
      return;
    }
    const { text, phone } = buildWhatsappMessage({ cart, products, branch, customer, substitutes });
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

    addOrder({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      date: new Date().toISOString(),
      branchId: branch.id,
      branchNameKey: branch.nameKey,
      items: ids.map((id) => {
        const p = products.find((pp) => pp.id === id);
        const originalId = substitutes[id];
        const original = originalId && products.find((pp) => pp.id === originalId);
        return {
          id, en: p.en, ar: p.ar, arabicOnly: !!p.arabicOnly, price: p.price, qty: cart[id],
          substituteFor: original
            ? { id: original.id, en: original.en, ar: original.ar, arabicOnly: !!original.arabicOnly }
            : null,
        };
      }),
      itemsTotal,
      deliveryFee,
      grandTotal,
    });

    window.open(url, '_blank');
  };

  const branchNote =
    (lang === 'ar' ? 'سيتم إرسال الطلب إلى: ' : 'Order will be sent to: ') + t(branch.nameKey);

  return (
    <div className={'cart-drawer' + (isOpen ? ' show' : '')}>
      <div className="cart-header">
        <h3>{t('yourCart')}</h3>
        <button className="close-btn" onClick={closeCart}>×</button>
      </div>

      <div className="cart-items">
        {ids.length === 0 ? (
          <div className="cart-empty">🛒<br /><br />{t('cartEmpty')}</div>
        ) : (
          ids.map((id) => {
            const product = products.find((p) => p.id === id);
            return <CartItemRow key={id} productId={id} product={product} qty={cart[id]} />;
          })
        )}
      </div>

      <div className="cart-footer">
        <div
          className="total-row"
          style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 4 }}
        >
          <span>{t('subtotal')}</span>
          <span><Ltr>{itemsTotal} <span>{t('egp')}</span></Ltr></span>
        </div>
        <div
          className="total-row"
          style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 4 }}
        >
          <span>{t('waMsgDelivery')}</span>
          <span><Ltr>{deliveryFee} <span>{t('egp')}</span></Ltr></span>
        </div>
        <div className="total-row">
          <span>{t('total')}</span>
          <span><Ltr>{grandTotal} <span>{t('egp')}</span></Ltr></span>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 10 }}>
          <AccountSummaryText customer={customer} t={t} />
        </div>

        <button className="wa-order-btn" disabled={itemCount === 0} onClick={handleOrder}>
          <WhatsAppIcon size={18} />
          <span>{t('orderViaWhatsapp')}</span>
        </button>
        <div className="branch-note">{branchNote}</div>
      </div>
    </div>
  );
}

function AccountSummaryText({ customer, t }) {
  if (!customer) return null;
  if (customer.mode === 'code') return <>{t('accountLabelCode')}: {customer.code}</>;
  if (customer.mode === 'new') {
    return <>{t('accountLabelCode')}: {customer.demoCode} — {customer.name}</>;
  }
  if (customer.mode === 'guest') return <>{t('accountLabelGuest')} — {customer.address}</>;
  return null;
}
