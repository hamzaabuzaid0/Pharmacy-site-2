import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCustomer } from '../../context/CustomerContext';
import { useDrawer } from '../../context/DrawerContext';

export function GuestForm({ onStatus, active }) {
  const { t } = useLanguage();
  const { setGuest } = useCustomer();
  const { finishAccountFlow } = useDrawer();
  const [address, setAddress] = useState('');

  const submit = () => {
    const value = address.trim();
    if (!value) {
      onStatus(t('fillRequiredFields'));
      return;
    }
    setGuest(value);
    onStatus(t('statusGuestSet'));
    setTimeout(finishAccountFlow, 900);
  };

  return (
    <div className={'account-panel' + (active ? ' active' : '')} id="panel-guest">
      <p className="account-hint">{t('guestHint')}</p>
      <label className="form-label">{t('addressLabel')}</label>
      <textarea className="form-input" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
      <button type="button" className="account-submit" onClick={submit}>
        {t('continueGuest')}
      </button>
    </div>
  );
}
