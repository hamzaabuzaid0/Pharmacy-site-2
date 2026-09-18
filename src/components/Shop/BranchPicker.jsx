import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useCatalog } from '../../context/CatalogContext';
import { useNavigation } from '../../context/NavigationContext';
import { branchName, branchAddr } from '../../utils/branchText';
import { Ltr } from '../../utils/Ltr';

// The branch chooser. A customer can't shop, add to cart or order until
// they've picked a branch here, because the branch decides which products
// are available and who prepares and delivers the order.
//
// It opens by itself on the shop page when no branch is chosen yet, and on
// request (the "Change" buttons, or an "Add" tapped before choosing). While
// no branch is chosen it can't be dismissed — that's the point; once one is,
// it closes like any dialog.
export function BranchPicker() {
  const { lang, t } = useLanguage();
  const { branches, loading } = useCatalog();
  const { page } = useNavigation();
  const {
    selectedBranch, chooseBranch, needsBranch, itemCount,
    branchPickerOpen, closeBranchPicker,
  } = useCart();

  const open = branchPickerOpen || (page === 'shop' && needsBranch && !loading && branches.length > 0);
  const [choice, setChoice] = useState(null);

  // Start from the current branch when changing, from nothing when choosing
  // for the first time — a pre-ticked radio would just recreate the old
  // silent default.
  useEffect(() => {
    if (open) setChoice(needsBranch ? null : selectedBranch);
  }, [open, needsBranch, selectedBranch]);

  useEffect(() => {
    if (!open || needsBranch) return;
    const onKey = (e) => { if (e.key === 'Escape') closeBranchPicker(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, needsBranch, closeBranchPicker]);

  if (!open) return null;
  const changing = !needsBranch && choice && choice !== selectedBranch;

  return (
    <>
      <div className="branch-picker-backdrop" onClick={needsBranch ? undefined : closeBranchPicker} />
      <div className="branch-picker" role="dialog" aria-modal="true" aria-labelledby="branch-picker-title">
        {!needsBranch && (
          <button type="button" className="close-btn branch-picker-close" onClick={closeBranchPicker} aria-label={t('closeLabel')}>
            ×
          </button>
        )}
        <div className="branch-picker-icon" aria-hidden="true">📍</div>
        <h3 id="branch-picker-title">{t('branchPickTitle')}</h3>
        <p className="branch-picker-sub">{t('branchPickSub')}</p>

        <div className="branch-picker-list" role="radiogroup" aria-labelledby="branch-picker-title">
          {branches.map((b) => (
            <button
              type="button"
              key={b.id}
              role="radio"
              aria-checked={choice === b.id}
              className={'branch-option' + (choice === b.id ? ' active' : '')}
              onClick={() => setChoice(b.id)}
            >
              <span className="radio" aria-hidden="true" />
              <span className="branch-option-body">
                <span className="branch-option-name">{branchName(b, lang)}</span>
                <span className="branch-option-addr">{branchAddr(b, lang)}</span>
                <span className="branch-option-meta">
                  {b.waDisplay && <Ltr>{b.waDisplay}</Ltr>}
                  {b.waDisplay && ' · '}
                  {t('branchDeliveryFee')} <Ltr>{b.deliveryFee} {t('egp')}</Ltr>
                </span>
              </span>
            </button>
          ))}
        </div>

        {changing && itemCount > 0 && <p className="branch-picker-note">{t('branchPickCartNote')}</p>}

        <button
          type="button"
          className="branch-picker-confirm"
          disabled={!choice}
          onClick={() => chooseBranch(choice)}
        >
          {t('branchPickConfirm')}
        </button>
      </div>
    </>
  );
}
