import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useCatalog } from '../../context/CatalogContext';
import { branchName, branchAddr } from '../../utils/branchText';

// The branch the shop is showing, always visible at the top of the shop.
// Tapping the other branch asks for confirmation in the branch picker
// rather than switching silently, since switching changes which products
// are available and who prepares the order.
export function BranchStrip() {
  const { lang, t } = useLanguage();
  const { selectedBranch, needsBranch, openBranchPicker } = useCart();
  const { branches } = useCatalog();

  return (
    <div className="branch-strip-wrap">
      <div className="branch-strip-label">
        <span className="branch-strip-title">📍 {t('yourBranch')}</span>
        <span className="branch-strip-hint">{t('yourBranchHint')}</span>
      </div>
      <div className="branch-strip">
        {branches.map((b) => {
          const active = !needsBranch && selectedBranch === b.id;
          return (
            <button
              type="button"
              key={b.id}
              className={'branch-card' + (active ? ' active' : '')}
              onClick={() => (active ? null : openBranchPicker())}
              aria-pressed={active}
            >
              <h4><span className="radio" />{branchName(b, lang)}</h4>
              <p>{branchAddr(b, lang)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
