import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useCatalog } from '../../context/CatalogContext';
import { useCustomer } from '../../context/CustomerContext';
import { useDrawer } from '../../context/DrawerContext';
import { useOrderHistory } from '../../context/OrderHistoryContext';
import { buildWhatsappMessage } from '../../utils/buildWhatsappMessage';
import { branchName, branchAddr } from '../../utils/branchText';
import { isInStock } from '../../utils/stock';
import { Ltr } from '../../utils/Ltr';
import { WhatsAppIcon } from '../WhatsAppIcon';
import { CartItemRow } from './CartItemRow';

export function CartDrawer() {
  const { lang, t } = useLanguage();
  const {
    cart, branch, selectedBranch, needsBranch, requireBranch, openBranchPicker,
    itemsTotal, deliveryFee, grandTotal, itemCount, substitutes, clearCart,
  } = useCart();
  const { products } = useCatalog();
  const { customer } = useCustomer();
  const { openDrawer, closeCart, openAccount } = useDrawer();
  const { pendingOrder, beginOrder, confirmPendingOrder, discardPendingOrder } = useOrderHistory();

  const ids = Object.keys(cart);
  const isOpen = openDrawer === 'cart';

  // Re-opens the same WhatsApp link without rebuilding the order — used by
  // "Open WhatsApp again" if the first popup was blocked or got closed
  // before the customer could hit Send there.
  const reopenWhatsapp = () => {
    if (pendingOrder) window.open(pendingOrder.waUrl, '_blank');
  };

  // Confirming a send both records the order and empties the basket, so the
  // same order can't be sent twice by accident. Delivery details are kept —
  // the next order shouldn't make you retype your address.
  const handleConfirmSent = () => {
    confirmPendingOrder();
    clearCart();
  };

  // Items the chosen branch can't supply — possible after switching branch
  // once each branch has its own stock. Ordering stays blocked until they're
  // removed or the branch is changed back, so the pharmacy never receives an
  // order it can't fill.
  const unavailable = needsBranch
    ? []
    : ids.filter((id) => {
        const p = products.find((pp) => pp.id === id);
        return p && !isInStock(p, selectedBranch);
      });

  const handleOrder = () => {
    if (needsBranch) {
      requireBranch(null);
      return;
    }
    if (!customer) {
      // Require delivery info before an order can be sent — open the
      // account drawer instead of sending. Marking this a pending checkout
      // means finishing the form returns straight back to the cart.
      openAccount(true);
      return;
    }
    const { text, phone } = buildWhatsappMessage({ cart, products, branch, customer, substitutes });
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

    // Stage the order — it is NOT added to "My Orders" yet. wa.me only opens
    // WhatsApp with the message pre-filled; whether the customer actually
    // presses Send there is invisible to this page, so recording it here
    // would log orders the pharmacy never received. The cart now asks for
    // explicit confirmation after the redirect (see the pendingOrder block
    // in the render below) — only that commits it to history.
    beginOrder({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      date: new Date().toISOString(),
      waUrl: url,
      branchId: branch.id,
      branchNameAr: branch.nameAr,
      branchNameEn: branch.nameEn,
      items: ids.map((id) => {
        const p = products.find((pp) => pp.id === id);
        const sub = substitutes[id];
        const original = sub && products.find((pp) => pp.id === sub.originalId);
        return {
          id, en: p.en, ar: p.ar, arabicOnly: !!p.arabicOnly, price: p.price, qty: cart[id],
          substituteFor: original
            ? { id: original.id, en: original.en, ar: original.ar, arabicOnly: !!original.arabicOnly, matchType: sub.matchType }
            : null,
        };
      }),
      itemsTotal,
      deliveryFee,
      grandTotal,
    });

    window.open(url, '_blank');
  };

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
        {/* Which branch prepares this order — always shown, never assumed. */}
        {needsBranch ? (
          <div className="cart-branch cart-branch-missing">
            <span className="cart-branch-text">{t('selectBranchFirst')}</span>
            <button type="button" className="cart-branch-btn" onClick={openBranchPicker}>
              {t('chooseBranchBtn')}
            </button>
          </div>
        ) : (
          <div className="cart-branch">
            <span className="cart-branch-pin" aria-hidden="true">📍</span>
            <span className="cart-branch-text">
              <span className="cart-branch-label">{t('deliveringFrom')}</span>
              <strong>{branchName(branch, lang)}</strong>
              <span className="cart-branch-addr">{branchAddr(branch, lang)}</span>
            </span>
            <button type="button" className="cart-branch-change" onClick={openBranchPicker}>
              {t('changeBranch')}
            </button>
          </div>
        )}
        {unavailable.length > 0 && <div className="cart-unavailable">{t('cartHasUnavailable')}</div>}

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

        {pendingOrder ? (
          <div className="order-confirm">
            <div className="order-confirm-text">{t('orderConfirmPrompt')}</div>
            <div className="order-confirm-actions">
              <button className="order-confirm-yes" onClick={handleConfirmSent}>
                {t('orderConfirmYes')}
              </button>
              <button className="order-confirm-no" onClick={discardPendingOrder}>
                {t('orderConfirmNo')}
              </button>
            </div>
            <button type="button" className="order-reopen-link" onClick={reopenWhatsapp}>
              {t('orderReopenWhatsapp')}
            </button>
          </div>
        ) : (
          <>
            <button
              className="wa-order-btn"
              disabled={itemCount === 0 || unavailable.length > 0}
              onClick={handleOrder}
            >
              <WhatsAppIcon size={18} />
              <span>{t('orderViaWhatsapp')}</span>
            </button>
          </>
        )}
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
