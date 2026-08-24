import { useLanguage } from '../../i18n/LanguageContext';
import { branches } from '../../data/branches';
import { Ltr } from '../../utils/Ltr';
import { WhatsAppIcon } from '../WhatsAppIcon';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer>
      <div className="foot-branches">
        {branches.map((b) => (
          <div key={b.id}>
            <strong>{t(b.nameKey)}</strong>
            <br />
            {t(b.addrKey)}
            <br />
            <WhatsAppIcon /> <Ltr>{b.waDisplay}</Ltr> · ☎ <Ltr>{b.callDisplay}</Ltr>
          </div>
        ))}
      </div>
      <div className="foot-note">{t('footNote')}</div>
    </footer>
  );
}
