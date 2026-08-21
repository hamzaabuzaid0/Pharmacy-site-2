import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCustomer } from '../../context/CustomerContext';
import { useDrawer } from '../../context/DrawerContext';

export function CodeForm({ onStatus, active }) {
  const { t } = useLanguage();
  const { setCode } = useCustomer();
  const { finishAccountFlow } = useDrawer();
  const [code, setCodeInput] = useState('');

  const submit = () => {
    const value = code.trim();
    if (!value) {
      onStatus(t('fillRequiredFields'));
      return;
    }
    setCode(value);
    onStatus(t('statusCodeSet') + ': ' + value);
    setTimeout(finishAccountFlow, 900);
  };

  return (
    <div className={'account-panel' + (active ? ' active' : '')} id="panel-code">
      <p className="account-hint">{t('codeHint')}</p>
      <label className="form-label">{t('codeLabel')}</label>
      <input
        type="text"
        className="form-input"
        inputMode="numeric"
        placeholder="مثال: 5255"
        value={code}
        onChange={(e) => setCodeInput(e.target.value)}
      />
      <button type="button" className="account-submit" onClick={submit}>
        {t('confirmCode')}
      </button>
    </div>
  );
}
