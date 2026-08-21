import { useLanguage } from '../../i18n/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';
import { categories } from '../../data/categories';

export function CategoryChips() {
  const { lang, t } = useLanguage();
  const { activeCat, setActiveCat } = useNavigation();

  return (
    <div className="cat-scroll">
      <div
        className={'cat-chip' + (activeCat === 'all' ? ' active' : '')}
        onClick={() => setActiveCat('all')}
      >
        {t('all')}
      </div>
      {categories.map((c) => (
        <div
          key={c.id}
          className={'cat-chip' + (activeCat === c.id ? ' active' : '')}
          onClick={() => setActiveCat(c.id)}
        >
          {lang === 'ar' ? c.ar : c.en}
        </div>
      ))}
    </div>
  );
}
