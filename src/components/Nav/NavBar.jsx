import { useLanguage } from '../../i18n/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';

const NAV_ITEMS = [
  { id: 'home', key: 'navHome' },
  { id: 'about', key: 'navAbout' },
  { id: 'offers', key: 'navOffers' },
  { id: 'shop', key: 'navShop' },
  { id: 'track', key: 'navTrack' },
  { id: 'branches', key: 'navBranches' },
];

export function NavBar() {
  const { t } = useLanguage();
  const { page, setPage } = useNavigation();

  return (
    <nav className="site-nav">
      <div className="site-nav-inner">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={'nav-link' + (page === item.id ? ' active' : '')}
            onClick={() => setPage(item.id)}
          >
            {t(item.key)}
          </button>
        ))}
      </div>
    </nav>
  );
}
