import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { TrackTimeline } from './TrackTimeline';

// No real backend/order database exists yet, so there's nothing real to
// track. This derives a deterministic (same code always gives the same
// result) but varied-looking demo status from the code itself, purely so
// the tracking page has something believable to show during the pitch.
// Swap this for a real order-status lookup once a backend exists.
function demoStepForCode(code) {
  const digits = code.replace(/\D/g, '');
  if (!digits) return 0;
  const sum = digits.split('').reduce((acc, d) => acc + Number(d), 0);
  return sum % 4;
}

export function TrackPage({ active }) {
  const { t } = useLanguage();
  const [inputCode, setInputCode] = useState('');
  const [trackedCode, setTrackedCode] = useState(null);
  const [error, setError] = useState('');

  const submit = () => {
    const value = inputCode.trim();
    if (!value) {
      setError(t('trackEnterCodeFirst'));
      setTrackedCode(null);
      return;
    }
    setError('');
    setTrackedCode(value);
  };

  return (
    <section className={'about-section page' + (active ? ' active' : '')} id="track">
      <div className="about-card" style={{ display: 'block' }}>
        <h2 style={{ margin: '0 0 10px', fontSize: '1.25rem', color: 'var(--teal-dark)' }}>
          {t('trackTitle')}
        </h2>
        <p style={{ margin: '0 0 18px', color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          {t('trackHint')}
        </p>

        <label className="form-label">{t('trackCodeLabel')}</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            style={{ maxWidth: 220 }}
            inputMode="numeric"
            placeholder={t('trackCodePlaceholder')}
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          />
          <button
            type="button"
            className="account-submit"
            style={{ width: 'auto', marginTop: 0, padding: '10px 20px' }}
            onClick={submit}
          >
            {t('trackBtn')}
          </button>
        </div>

        {error && (
          <div className="account-status" style={{ background: '#fbe9e7', color: 'var(--danger)', marginTop: 14 }}>
            {error}
          </div>
        )}

        {trackedCode && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--teal-dark)', marginBottom: 14 }}>
              {t('trackOrderFor')}: {trackedCode}
            </div>
            <TrackTimeline currentStep={demoStepForCode(trackedCode)} />
            <div className="offers-note" style={{ marginTop: 18 }}>{t('trackDemoNote')}</div>
          </div>
        )}
      </div>
    </section>
  );
}
