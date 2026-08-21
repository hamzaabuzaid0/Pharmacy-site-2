import { useLanguage } from '../../i18n/LanguageContext';

const STEPS = [
  { titleKey: 'stepReceived', descKey: 'stepReceivedDesc', icon: '📥' },
  { titleKey: 'stepPreparing', descKey: 'stepPreparingDesc', icon: '🧪' },
  { titleKey: 'stepOutForDelivery', descKey: 'stepOutForDeliveryDesc', icon: '🚴' },
  { titleKey: 'stepDelivered', descKey: 'stepDeliveredDesc', icon: '✅' },
];

// currentStep is the index (0-3) of the furthest-reached step.
export function TrackTimeline({ currentStep }) {
  const { t } = useLanguage();

  return (
    <div className="track-timeline">
      {STEPS.map((step, i) => {
        const state = i < currentStep ? 'done' : i === currentStep ? 'current' : 'upcoming';
        return (
          <div className={'track-step ' + state} key={step.titleKey}>
            <div className="track-step-marker">{state === 'done' ? '✓' : step.icon}</div>
            <div className="track-step-body">
              <div className="track-step-title">{t(step.titleKey)}</div>
              <div className="track-step-desc">{t(step.descKey)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
