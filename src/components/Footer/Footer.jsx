import { useLanguage } from '../../i18n/LanguageContext';
import { useCatalog } from '../../context/CatalogContext';
import { branchName, branchAddr } from '../../utils/branchText';
import { Ltr } from '../../utils/Ltr';
import { WhatsAppIcon } from '../WhatsAppIcon';

export function Footer() {
  const { lang, t } = useLanguage();
  const { branches } = useCatalog();

  return (
    <footer>
      <div className="foot-branches">
        {branches.map((b) => (
          <div key={b.id}>
            <strong>{branchName(b, lang)}</strong>
            <br />
            {branchAddr(b, lang)}
            <br />
            <WhatsAppIcon /> <Ltr>{b.waDisplay}</Ltr> · ☎ <Ltr>{b.callDisplay}</Ltr>
          </div>
        ))}
      </div>
      <div className="foot-note">{t('footNote')}</div>
    </footer>
  );
}
