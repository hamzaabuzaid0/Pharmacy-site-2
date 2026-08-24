import { useLanguage } from '../../i18n/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';
import { WhatsAppIcon } from '../WhatsAppIcon';

export function Hero() {
  const { t } = useLanguage();
  const { setPage } = useNavigation();

  return (
    <section className="hero">
      <div className="hero-inner">
        <h1>{t('heroTitle')}</h1>
        <p>{t('heroText')}</p>

        <div className="hero-cta">
          <button className="hero-btn primary" onClick={() => setPage('shop')}>
            {t('heroCtaShop')}
          </button>
          <button className="hero-btn secondary" onClick={() => setPage('branches')}>
            {t('heroCtaBranches')}
          </button>
        </div>

        <div className="hero-badges">
          <span className="hero-badge">🕐 <span>{t('badge247')}</span></span>
          <span className="hero-badge">📍 <span>{t('badge2branches')}</span></span>
          <span className="hero-badge"><WhatsAppIcon /> <span>{t('badgeWa')}</span></span>
        </div>
      </div>
    </section>
  );
}
