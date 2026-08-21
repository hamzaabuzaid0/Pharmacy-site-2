import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCustomer } from '../../context/CustomerContext';
import { useDrawer } from '../../context/DrawerContext';
import { CodeForm } from './CodeForm';
import { NewCustomerForm } from './NewCustomerForm';
import { GuestForm } from './GuestForm';

const TABS = [
  { id: 'code', key: 'tabCode' },
  { id: 'new', key: 'tabNew' },
  { id: 'guest', key: 'tabGuest' },
];

export function AccountDrawer() {
  const { t } = useLanguage();
  const { customer } = useCustomer();
  const { openDrawer, closeAccount, pendingCheckout } = useDrawer();
  const isOpen = openDrawer === 'account';

  const [activeTab, setActiveTab] = useState('code');
  const [status, setStatus] = useState(null); // { main, sub } | null

  // When the drawer opens because someone tried to check out without
  // delivery info yet, greet them with that explanation. Opening it
  // manually (account button) shows no hint.
  useEffect(() => {
    if (isOpen) {
      setStatus(pendingCheckout && !customer ? { main: t('needInfoFirst') } : null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleStatus = (main, sub) => setStatus({ main, sub });

  const switchTab = (id) => {
    setActiveTab(id);
    setStatus(null);
  };

  return (
    <div className={'cart-drawer' + (isOpen ? ' show' : '')}>
      <div className="cart-header">
        <h3>{t('accountTitle')}</h3>
        <button className="close-btn" onClick={closeAccount}>×</button>
      </div>
      <div className="cart-items">
        <div className="account-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={'account-tab' + (activeTab === tab.id ? ' active' : '')}
              onClick={() => switchTab(tab.id)}
            >
              {t(tab.key)}
            </button>
          ))}
        </div>

        <CodeForm active={activeTab === 'code'} onStatus={handleStatus} />
        <NewCustomerForm active={activeTab === 'new'} onStatus={handleStatus} />
        <GuestForm active={activeTab === 'guest'} onStatus={handleStatus} />

        {status && (
          <div className="account-status">
            <strong>{status.main}</strong>
            {status.sub && <><br />{status.sub}</>}
          </div>
        )}
      </div>
    </div>
  );
}
