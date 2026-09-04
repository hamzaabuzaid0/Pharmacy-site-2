import { useLanguage } from '../../i18n/LanguageContext';
import { useCatalog } from '../../context/CatalogContext';
import { BranchDetailCard } from './BranchDetailCard';

export function BranchesPage({ active }) {
  const { t } = useLanguage();
  const { branches } = useCatalog();

  return (
    <section
      className={'page' + (active ? ' active' : '')}
      id="branches"
      style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 0' }}
    >
      <div className="section-title" style={{ marginTop: 0 }}>{t('navBranches')}</div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {branches.map((b) => (
          <BranchDetailCard key={b.id} branch={b} />
        ))}
      </div>
      <div className="unverified-note">{t('unverifiedNumbers')}</div>
    </section>
  );
}
