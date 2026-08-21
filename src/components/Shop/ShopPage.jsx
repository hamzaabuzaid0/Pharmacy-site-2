import { useLanguage } from '../../i18n/LanguageContext';
import { BranchStrip } from './BranchStrip';
import { CategoryChips } from './CategoryChips';
import { ProductGrid } from './ProductGrid';

export function ShopPage({ active }) {
  const { t } = useLanguage();

  return (
    <div className={'page' + (active ? ' active' : '')} id="shop">
      <div className="section-title" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        {t('navShop')}
      </div>
      <BranchStrip />
      <CategoryChips />
      <main>
        <ProductGrid />
      </main>
    </div>
  );
}
