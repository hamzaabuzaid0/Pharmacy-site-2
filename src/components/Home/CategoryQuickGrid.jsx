import { useLanguage } from '../../i18n/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';
import { categories } from '../../data/categories';
import { CategoryVisual } from '../../utils/categoryVisual';

export function CategoryQuickGrid() {
  const { lang, t } = useLanguage();
  const { goToShopWithCategory } = useNavigation();

  return (
    <section className="cat-quick-section">
      <div className="section-title" style={{ margin: '0 0 12px' }}>
        {t('shopByCategory')}
      </div>
      <div className="cat-quick-grid">
        {categories.map((c) => (
          <button
            type="button"
            key={c.id}
            className="cat-quick-card"
            onClick={() => goToShopWithCategory(c.id)}
          >
            <div className="cat-quick-icon">
              <CategoryVisual catId={c.id} size="26px" />
            </div>
            <div className="cat-quick-label">{lang === 'ar' ? c.ar : c.en}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
