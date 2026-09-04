import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useCatalog } from '../../context/CatalogContext';
import { branchName, branchAddr } from '../../utils/branchText';

export function BranchStrip() {
  const { lang } = useLanguage();
  const { selectedBranch, setSelectedBranch } = useCart();
  const { branches } = useCatalog();

  return (
    <div className="branch-strip">
      {branches.map((b) => (
        <button
          type="button"
          key={b.id}
          className={'branch-card' + (selectedBranch === b.id ? ' active' : '')}
          onClick={() => setSelectedBranch(b.id)}
          aria-pressed={selectedBranch === b.id}
        >
          <h4><span className="radio" />{branchName(b, lang)}</h4>
          <p>{branchAddr(b, lang)}</p>
        </button>
      ))}
    </div>
  );
}
