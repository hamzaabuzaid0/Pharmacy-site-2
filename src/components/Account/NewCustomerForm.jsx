import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCustomer } from '../../context/CustomerContext';
import { useDrawer } from '../../context/DrawerContext';

export function NewCustomerForm({ onStatus, active }) {
  const { t } = useLanguage();
  const { setNewCustomer } = useCustomer();
  const { finishAccountFlow } = useDrawer();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const submit = () => {
    const n = name.trim();
    const p = phone.trim();
    const a = address.trim();
    if (!n || !p || !a) {
      onStatus(t('fillRequiredFields'));
      return;
    }
    const demoCode = setNewCustomer(n, p, a);
    onStatus(t('statusNewSet') + ': ' + demoCode, t('statusNewNote'));
    setTimeout(finishAccountFlow, 1400);
  };

  return (
    <div className={'account-panel' + (active ? ' active' : '')} id="panel-new">
      <p className="account-hint">{t('newHint')}</p>
      <label className="form-label">{t('nameLabel')}</label>
      <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
      <label className="form-label">{t('phoneLabel')}</label>
      <input type="tel" className="form-input" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <label className="form-label">{t('addressLabel')}</label>
      <textarea className="form-input" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
      <button type="button" className="account-submit" onClick={submit}>
        {t('createAccount')}
      </button>
    </div>
  );
}
