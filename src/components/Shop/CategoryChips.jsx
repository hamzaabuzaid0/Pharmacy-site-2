import { useLanguage } from '../../i18n/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';
import { categories } from '../../data/categories';

export function CategoryChips() {
  const { lang, t } = useLanguage();
  const { activeCat, setActiveCat } = useNavigation();

  return (
    <div className="cat-scroll">
      <button
        type="button"
        className={'cat-chip' + (activeCat === 'all' ? ' active' : '')}
        onClick={() => setActiveCat('all')}
        aria-pressed={activeCat === 'all'}
      >
        {t('all')}
      </button>
      {categories.map((c) => (
        <button
          type="button"
          key={c.id}
          className={'cat-chip' + (activeCat === c.id ? ' active' : '')}
          onClick={() => setActiveCat(c.id)}
          aria-pressed={activeCat === c.id}
        >
          {lang === 'ar' ? c.ar : c.en}
        </button>
      ))}
    </div>
  );
}
