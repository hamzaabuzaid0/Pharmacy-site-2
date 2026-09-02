import { useState, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useDrawer } from '../../context/DrawerContext';
import { displayName } from '../../utils/displayName';
import { products } from '../../data/products';
import { Ltr } from '../../utils/Ltr';
import { CameraIcon, UploadIcon } from './ScanIcons';

// PITCH-DEMO NOTE: there is no OCR/AI reading the photo. This page exists to
// demonstrate the *concept* of prescription-scan ordering to the pharmacy
// owner before committing to build it for real — see the conversation this
// was built in. The "recognized items" are a fixed, curated demo list (not
// derived from the uploaded photo at all), and the UI says so via
// scanDemoNote (translations.js), matching how the rest of the site is
// upfront about its other demo/placeholder pieces (trackDemoNote,
// ordersNote, offersNote, etc.) rather than silently pretending it's real.
//
// A real version needs: a backend to hold a vision-AI API key (never ship a
// key like that in client code — it'd be trivially stolen from the bundle
// and abused), a per-scan cost, and — regardless of accuracy — a mandatory
// human-confirms-before-adding step like the one below, since silently
// auto-adding medicine based on a possibly-misread photo is a real safety
// concern for a pharmacy. Referenced by product `en` name below rather than
// id, since ids are just array-index based and shift whenever products.js
// gains or loses an entry earlier in the list.
const DEMO_ITEM_NAMES = ['Augmentin 1g (Antibiotic)', 'Panadol Extra', 'Vitamin C 1000mg'];

export function ScanPage({ active }) {
  const { t } = useLanguage();
  const { changeQty } = useCart();
  const { openCart } = useDrawer();

  const [step, setStep] = useState('idle'); // idle | scanning | results | done
  const [photoUrl, setPhotoUrl] = useState(null);
  const [checked, setChecked] = useState({});
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  const detected = DEMO_ITEM_NAMES.map((name) => products.find((p) => p.en === name)).filter(Boolean);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoUrl(e.target.result);
      setStep('scanning');
      setTimeout(() => {
        const initial = {};
        detected.forEach((p) => { initial[p.id] = true; });
        setChecked(initial);
        setStep('results');
      }, 2200);
    };
    reader.readAsDataURL(file);
  };

  const toggle = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const addSelected = () => {
    detected.forEach((p) => { if (checked[p.id]) changeQty(p.id, 1); });
    setStep('done');
  };

  const reset = () => {
    setPhotoUrl(null);
    setChecked({});
    setStep('idle');
  };

  return (
    <section className={'about-section page' + (active ? ' active' : '')} id="scan">
      <div className="about-card" style={{ display: 'block' }}>
        <h2 style={{ margin: '0 0 10px', fontSize: '1.25rem', color: 'var(--teal-dark)' }}>
          {t('scanTitle')}
        </h2>
        <p style={{ margin: '0 0 18px', color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          {t('scanHint')}
        </p>

        {step === 'idle' && (
          <div className="scan-upload-buttons">
            <button type="button" className="scan-upload-btn" onClick={() => cameraInputRef.current.click()}>
              <CameraIcon />
              <span>{t('scanTakePhoto')}</span>
            </button>
            <button type="button" className="scan-upload-btn" onClick={() => uploadInputRef.current.click()}>
              <UploadIcon />
              <span>{t('scanUploadPhoto')}</span>
            </button>
            <input
              ref={cameraInputRef} type="file" accept="image/*" capture="environment"
              style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])}
            />
            <input
              ref={uploadInputRef} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>
        )}

        {(step === 'scanning' || step === 'results' || step === 'done') && photoUrl && (
          <div className="scan-preview">
            <img src={photoUrl} alt="" />
            {step === 'scanning' && (
              <div className="scan-analyzing">
                <span className="scan-spinner" />
                <span>{t('scanAnalyzing')}</span>
              </div>
            )}
          </div>
        )}

        {step === 'results' && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--teal-dark)', marginBottom: 10 }}>
              {t('scanResultsTitle')}
            </div>
            {detected.map((p) => (
              <label className="scan-result-row" key={p.id}>
                <input type="checkbox" checked={!!checked[p.id]} onChange={() => toggle(p.id)} />
                <span className="scan-result-name">
                  {displayName(p)}
                  {p.rx && <span className="stock-badge rx-badge" style={{ marginInlineStart: 8 }}>{t('rxRequired')}</span>}
                </span>
                <span className="scan-result-price"><Ltr>{p.price} {t('egp')}</Ltr></span>
              </label>
            ))}
            <button
              type="button"
              className="account-submit"
              disabled={!Object.values(checked).some(Boolean)}
              onClick={addSelected}
            >
              {t('scanAddSelected')}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="account-status" style={{ marginTop: 16 }}>
            {t('scanAddedSuccess')}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" className="account-submit" style={{ width: 'auto', margin: 0, padding: '8px 16px' }} onClick={openCart}>
                {t('yourCart')}
              </button>
              <button type="button" className="scan-reset-link" onClick={reset}>
                {t('scanTryAnother')}
              </button>
            </div>
          </div>
        )}

        <div className="offers-note" style={{ marginTop: 18 }}>{t('scanDemoNote')}</div>
      </div>
    </section>
  );
}
