import { translations } from '../i18n/translations';
import { displayName } from './displayName';

// The WhatsApp message itself is always written in Arabic (that's how the
// pharmacy communicates), regardless of which language the site UI is
// currently showing — but medicine names always stay in English within it,
// since that's how products are usually labeled/packaged. Per-item prices
// are intentionally left out — only the final total (items + delivery) is
// shown, matching what the cart displays.
//
// `substitutes` (productId -> { originalId, matchType }, from CartContext)
// flags cart lines added via a "suggested alternative" — see
// findAlternatives.js. Each one gets an explicit note asking the pharmacist
// to confirm it's actually suitable and to report back a restock date for
// the item the customer originally wanted, rather than silently swapping
// products with no disclosure. Wording depends on matchType: 'ingredient'
// states the same-active-ingredient fact; 'similar' deliberately avoids
// that claim (it wasn't matched on ingredient at all) and says so.
export function buildWhatsappMessage({ cart, products, branch, customer, substitutes = {} }) {
  const ar = translations.ar;
  const lines = [];
  lines.push(`${ar.waMsgIntro} ${ar[branch.nameKey]}:`);
  lines.push('');

  if (customer) {
    if (customer.mode === 'code') {
      lines.push(`${ar.waMsgCustomerCode}: ${customer.code}`);
    } else if (customer.mode === 'new') {
      lines.push(`${ar.waMsgNewCustomer} — ${ar.waMsgProvisionalCode}: ${customer.demoCode}`);
      lines.push(`${ar.waMsgName}: ${customer.name}`);
      lines.push(`${ar.waMsgPhone}: ${customer.phone}`);
      lines.push(`${ar.waMsgAddress}: ${customer.address}`);
    } else if (customer.mode === 'guest') {
      lines.push(`${ar.waMsgGuestLabel}`);
      lines.push(`${ar.waMsgAddress}: ${customer.address}`);
    }
    lines.push('');
  }

  let total = 0;
  const substitutionNotes = [];
  Object.keys(cart).forEach((id) => {
    const p = products.find((pp) => pp.id === id);
    const qty = cart[id];
    total += p.price * qty;
    lines.push(`• ${displayName(p)} x${qty}`);

    const sub = substitutes[id];
    const original = sub && products.find((pp) => pp.id === sub.originalId);
    if (original) {
      const claim = sub.matchType === 'similar' ? ar.waMsgSubSimilarProduct : ar.waMsgSubSameIngredient;
      substitutionNotes.push(
        `${ar.waMsgSubPrefix} ${displayName(original)} ${ar.waMsgSubUnavailable} ${displayName(p)} ${claim}`
      );
    }
  });
  lines.push('');
  lines.push(`${ar.waMsgDelivery}: ${branch.deliveryFee} ${ar.egp}`);
  lines.push(`${ar.waMsgFinalTotal}: ${total + branch.deliveryFee} ${ar.egp}`);

  if (substitutionNotes.length > 0) {
    lines.push('');
    lines.push(ar.waMsgSubNotesTitle);
    substitutionNotes.forEach((note) => lines.push(`- ${note}`));
  }

  lines.push('');
  lines.push(ar.waMsgConfirm);

  return { text: lines.join('\n'), phone: branch.waPhone };
}
