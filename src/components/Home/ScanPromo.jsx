import { useLanguage } from '../../i18n/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';

function CameraIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}

// A headline-feature callout on the home page — the Scan page itself is
// reachable via the nav too, but this concept is meant to be the first
// thing people notice, not something they have to already know to look for.
export function ScanPromo() {
  const { t } = useLanguage();
  const { setPage } = useNavigation();

  return (
    <section className="scan-promo-section">
      <button type="button" className="scan-promo-card" onClick={() => setPage('scan')}>
        <div className="scan-promo-icon"><CameraIcon /></div>
        <div className="scan-promo-text">
          <div className="scan-promo-title">{t('scanPromoTitle')}</div>
          <div className="scan-promo-sub">{t('scanPromoSub')}</div>
        </div>
        <div className="scan-promo-cta">{t('scanPromoCta')}</div>
      </button>
    </section>
  );
}
