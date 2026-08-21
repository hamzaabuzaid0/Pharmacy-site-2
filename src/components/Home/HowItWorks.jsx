import { useLanguage } from '../../i18n/LanguageContext';

const STEPS = [
  { icon: '🔍', titleKey: 'howStep1Title', textKey: 'howStep1Text' },
  { icon: '🛒', titleKey: 'howStep2Title', textKey: 'howStep2Text' },
  { icon: '📲', titleKey: 'howStep3Title', textKey: 'howStep3Text' },
];

export function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section className="how-section">
      <div className="section-title" style={{ margin: '0 0 16px' }}>
        {t('howItWorks')}
      </div>
      <div className="how-steps">
        {STEPS.map((step, i) => (
          <div className="how-step" key={step.titleKey}>
            <div className="how-num">{i + 1}</div>
            <div className="how-icon">{step.icon}</div>
            <h4>{t(step.titleKey)}</h4>
            <p>{t(step.textKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
