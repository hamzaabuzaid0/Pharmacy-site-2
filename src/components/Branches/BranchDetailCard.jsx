import { useLanguage } from '../../i18n/LanguageContext';
import { Ltr } from '../../utils/Ltr';
import { WhatsAppIcon } from '../WhatsAppIcon';
import { branchName, branchAddr } from '../../utils/branchText';

export function BranchDetailCard({ branch }) {
  const { lang, t } = useLanguage();

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
      <h4 style={{ margin: '0 0 6px', color: 'var(--teal-dark)' }}>{branchName(branch, lang)}</h4>
      <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>
        {branchAddr(branch, lang)}
      </p>
      <div className="branch-actions">
        <a
          className="branch-action-btn wa"
          href={`https://wa.me/${branch.waPhone}`}
          target="_blank"
          rel="noreferrer"
        >
          <WhatsAppIcon /> {t('orderWhatsapp')} (<Ltr>{branch.waDisplay}</Ltr>)
        </a>
        <a className="branch-action-btn call" href={`tel:+${branch.callPhone}`}>
          ☎ {t('callBranch')} (<Ltr>{branch.callDisplay}</Ltr>)
        </a>
      </div>
    </div>
  );
}
