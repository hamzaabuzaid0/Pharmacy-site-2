import { useLanguage } from '../../i18n/LanguageContext';
import { Ltr } from '../../utils/Ltr';

export function BranchDetailCard({ branch }) {
  const { t } = useLanguage();

  return (
    <div
      style={{
        flex: '1 1 280px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 16,
        boxShadow: 'var(--shadow)',
      }}
    >
      <h4 style={{ margin: '0 0 6px', color: 'var(--teal-dark)' }}>{t(branch.nameKey)}</h4>
      <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>
        {t(branch.addrKey)}
      </p>
      <div className="branch-actions">
        <a
          className="branch-action-btn wa"
          href={`https://wa.me/${branch.waPhone}`}
          target="_blank"
          rel="noreferrer"
        >
          📲 {t('orderWhatsapp')} (<Ltr>{branch.waDisplay}</Ltr>)
        </a>
        <a className="branch-action-btn call" href={`tel:+${branch.callPhone}`}>
          ☎ {t('callBranch')} (<Ltr>{branch.callDisplay}</Ltr>)
        </a>
      </div>
    </div>
  );
}
