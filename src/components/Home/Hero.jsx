import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';
import { SearchIcon } from '../SearchIcon';

export function Hero() {
  const { t } = useLanguage();
  const { setPage, goToShopWithSearch } = useNavigation();
  const [query, setQuery] = useState('');

  const submitSearch = () => goToShopWithSearch(query);

  return (
    <section className="hero">
      <div className="hero-inner">
        <h1>{t('heroTitle')}</h1>
        <p>{t('heroText')}</p>

        <div className="hero-search">
          <SearchIcon />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitSearch();
            }}
          />
          <button type="button" onClick={submitSearch}>
            {t('searchBtn')}
          </button>
        </div>

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
          <span className="hero-badge">📲 <span>{t('badgeWa')}</span></span>
        </div>
      </div>
    </section>
  );
}
