import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../context/CartContext';
import { branches } from '../../data/branches';

export function BranchStrip() {
  const { t } = useLanguage();
  const { selectedBranch, setSelectedBranch } = useCart();

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
          <h4><span className="radio" />{t(b.nameKey)}</h4>
          <p>{t(b.addrKey)}</p>
        </button>
      ))}
    </div>
  );
}
