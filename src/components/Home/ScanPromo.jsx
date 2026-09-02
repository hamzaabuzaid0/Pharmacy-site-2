import { useLanguage } from '../../i18n/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';
import { CameraIcon } from '../Scan/ScanIcons';

// A headline-feature callout on the home page — the Scan page itself is
// reachable via the nav too, but this concept is meant to be the first
// thing people notice, not something they have to already know to look for.
export function ScanPromo() {
  const { t } = useLanguage();
  const { setPage } = useNavigation();

  return (
    <section className="scan-promo-section">
      <button type="button" className="scan-promo-card" onClick={() => setPage('scan')}>
        <div className="scan-promo-icon"><CameraIcon size={26} /></div>
        <div className="scan-promo-text">
          <div className="scan-promo-title">{t('scanPromoTitle')}</div>
          <div className="scan-promo-sub">{t('scanPromoSub')}</div>
        </div>
        <div className="scan-promo-cta">{t('scanPromoCta')}</div>
      </button>
    </section>
  );
}
