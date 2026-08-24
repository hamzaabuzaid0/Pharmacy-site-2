import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useCustomer } from '../../context/CustomerContext';
import { useDrawer } from '../../context/DrawerContext';
import { BrandLogo } from './BrandLogo';
import { SearchIcon } from '../SearchIcon';
import { useNavigation } from '../../context/NavigationContext';

export function Header() {
  const { lang, t, toggleLang } = useLanguage();
  const { itemCount } = useCart();
  const { customer } = useCustomer();
  const { openCart, openAccount } = useDrawer();
  const { searchQuery, setSearchQuery } = useNavigation();

  const accountLabel = accountButtonLabel(customer, t);

  return (
    <header>
      <div className="top-bar">
        <div className="brand">
          <BrandLogo />
          <div>
            <div className="brand-name">{t('pharmacyName')}</div>
            <div className="brand-sub">{t('tagline')}</div>
          </div>
        </div>
        <div className="header-actions">
          <button className="lang-toggle" onClick={toggleLang}>
            {lang === 'ar' ? 'English' : 'عربي'}
          </button>
          <button className="cart-btn" onClick={() => openAccount(false)}>
            <span>👤</span>
            <span>{accountLabel}</span>
          </button>
          <button className="cart-btn" onClick={openCart}>
            <span>🛒</span>
            <span>{t('cart')}</span>
            {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
          </button>
        </div>
      </div>
      <div className="search-bar-wrap">
        <div className="search-bar">
          <SearchIcon />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              aria-label={t('clearSearch')}
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function accountButtonLabel(customer, t) {
  if (!customer) return t('accountGuestLabel');
  if (customer.mode === 'code') return `${t('accountLabelCode')}: ${customer.code}`;
  if (customer.mode === 'new') return `${t('accountLabelCode')}: ${customer.demoCode}`;
  if (customer.mode === 'guest') return t('accountLabelGuest');
  return t('accountGuestLabel');
}
