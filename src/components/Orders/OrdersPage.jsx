import { useLanguage } from '../../i18n/LanguageContext';
import { useOrderHistory } from '../../context/OrderHistoryContext';
import { useCart } from '../../context/CartContext';
import { useDrawer } from '../../context/DrawerContext';
import { displayName } from '../../utils/displayName';
import { Ltr } from '../../utils/Ltr';

function formatDate(iso, lang) {
  return new Date(iso).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-EG', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function OrdersPage({ active }) {
  const { lang, t } = useLanguage();
  const { orders } = useOrderHistory();
  const { changeQty, markSubstitute, setSelectedBranch } = useCart();
  const { openCart } = useDrawer();

  const reorder = (order) => {
    order.items.forEach((item) => {
      changeQty(item.id, item.qty);
      if (item.substituteFor) markSubstitute(item.id, item.substituteFor.id, item.substituteFor.matchType);
    });
    setSelectedBranch(order.branchId);
    openCart();
  };

  return (
    <section className={'about-section page' + (active ? ' active' : '')} id="orders">
      <div className="about-card" style={{ display: 'block' }}>
        <h2 style={{ margin: '0 0 10px', fontSize: '1.25rem', color: 'var(--teal-dark)' }}>
          {t('ordersTitle')}
        </h2>
        <p style={{ margin: '0 0 18px', color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          {t('ordersHint')}
        </p>

        {orders.length === 0 ? (
          <div className="cart-empty">🧾<br /><br />{t('ordersEmpty')}</div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              style={{
                border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px',
                marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  <Ltr>{formatDate(order.date, lang)}</Ltr> · {t(order.branchNameKey)}
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                  <Ltr>{order.grandTotal} {t('egp')}</Ltr>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--ink)', lineHeight: 1.9 }}>
                {order.items.map((item) => (
                  <div key={item.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{displayName(item)} × {item.qty}</span>
                      <span style={{ color: 'var(--muted)' }}><Ltr>{item.price * item.qty} {t('egp')}</Ltr></span>
                    </div>
                    {item.substituteFor && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: -4, marginBottom: 4 }}>
                        {t('substituteNoteLabel')}: {displayName(item.substituteFor)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="account-submit"
                style={{ width: 'auto', marginTop: 12, padding: '8px 18px', fontSize: '0.8rem' }}
                onClick={() => reorder(order)}
              >
                {t('ordersReorder')}
              </button>
            </div>
          ))
        )}

        {orders.length > 0 && <div className="offers-note">{t('ordersNote')}</div>}
      </div>
    </section>
  );
}
