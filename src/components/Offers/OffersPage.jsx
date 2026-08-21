import { useLanguage } from '../../i18n/LanguageContext';

// Sample/placeholder promotional cards — swap for the pharmacy's real
// offers once they provide them. To add a new offer card, add an entry
// here plus an `.offer-N` background color rule in index.css (or set an
// inline background style instead).
const OFFERS = [
  { className: 'offer-1', tagKey: 'offerTagDiscount', titleKey: 'offer1Title', subKey: 'offer1Sub' },
  { className: 'offer-2', tagKey: 'offerTagNew', titleKey: 'offer2Title', subKey: 'offer2Sub' },
  { className: 'offer-3', tagKey: 'offerTagOffer', titleKey: 'offer3Title', subKey: 'offer3Sub' },
];

export function OffersPage({ active }) {
  const { t } = useLanguage();

  return (
    <section className={'offers-section page' + (active ? ' active' : '')} id="offers">
      <div className="section-title" style={{ marginTop: 0 }}>{t('offersTitle')}</div>
      <div className="offers-grid">
        {OFFERS.map((offer) => (
          <div className={'offer-card ' + offer.className} key={offer.titleKey}>
            <div className="offer-card-content">
              <span className="offer-tag">{t(offer.tagKey)}</span>
              <div className="offer-title">{t(offer.titleKey)}</div>
              <div className="offer-sub">{t(offer.subKey)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="offers-note">{t('offersNote')}</div>
    </section>
  );
}
