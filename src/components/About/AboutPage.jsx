import { useLanguage } from '../../i18n/LanguageContext';

export function AboutPage({ active }) {
  const { t } = useLanguage();

  return (
    <section className={'about-section page' + (active ? ' active' : '')} id="about">
      <div className="about-card">
        <div className="about-text">
          <h2>{t('aboutTitle')}</h2>
          <p>{t('aboutText')}</p>
        </div>
        <div className="about-stats">
          <div className="stat-box">
            <div className="stat-num" dir="ltr">{t('stat1Num')}</div>
            <div className="stat-label">{t('stat1Label')}</div>
          </div>
          <div className="stat-box">
            <div className="stat-num" dir="ltr">{t('stat2Num')}</div>
            <div className="stat-label">{t('stat2Label')}</div>
          </div>
          <div className="stat-box">
            <div className="stat-num" dir="ltr">{t('stat3Num')}</div>
            <div className="stat-label">{t('stat3Label')}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
