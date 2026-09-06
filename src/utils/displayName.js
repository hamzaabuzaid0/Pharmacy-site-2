// Product names show in English by default, regardless of site language —
// except items flagged arabicOnly: true, which are only ever branded/printed
// in Arabic in real life (no official English name exists), so those always
// display in Arabic. Search still matches typed Arabic or English against
// both fields either way (see matchesSearch in ProductGrid).
export function displayName(p) {
  return p.arabicOnly ? p.ar : formatEnglish(p.en);
}

// The inventory export is ALL-CAPS ("BIGEN POWDER HAIR COLOR 47"), which
// reads as shouting on a storefront. Title-case it for display only — the
// raw `en` is still what search matches against, and the WhatsApp order to
// the pharmacy is built from displayName() too so staff still get a name
// they recognise, just in normal case.
const KEEP_UPPER = new Set([
  'SPF', 'UV', 'BB', 'CC', 'HD', 'EDT', 'EDP', 'EDC', 'IU', 'PH', 'Q10',
  'AHA', 'BHA', 'DNA', 'N95', 'KN95', 'FFP2', '3M', 'UK', 'USA', 'US', 'ORS',
  'XL', 'XXL', 'XS', 'TENS', 'CoQ10',
]);
const UNIT = /^\d+(\.\d+)?(ml|mg|mcg|g|gm|gr|kg|l|cm|mm|iu|pcs?|tabs?|caps?|amp|sach|supp)$/i;

function cap(part) {
  const bare = part.replace(/[^A-Za-z0-9]/g, '');
  if (!bare) return part;
  if (KEEP_UPPER.has(bare.toUpperCase())) return part.toUpperCase();
  if (UNIT.test(part) || /^\d/.test(part)) return part.toLowerCase();   // "500ML" -> "500ml"
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

// title-case a whitespace token, also capitalising each part of a hyphen /
// slash compound ("roche-posay" -> "Roche-Posay", "5/3" left alone)
function titleWord(w) {
  return w.replace(/[A-Za-z][A-Za-z0-9]*/g, (m) => cap(m));
}

function formatEnglish(s) {
  if (!s) return s;
  if (s !== s.toUpperCase()) return s.trim();     // already mixed-case, leave alone
  return s
    .trim()
    .split(/(\s+)/)
    .map((tok) => (/^\s+$/.test(tok) ? ' ' : titleWord(tok)))
    .join('')
    .replace(/\s+/g, ' ')
    // unit tokens after a number read better lowercase: "400 Ml" -> "400 ml"
    .replace(/(\d)\s(Ml|Mg|Mcg|Gm|Gr|Kg|Iu|Cm|Mm|Pcs?|Tabs?|Caps?|Amp|Sach)\b/g,
      (_, n, u) => `${n} ${u.toLowerCase()}`)
    .replace(/(\d)(Ml|Mg|Mcg|Gm|Gr|Kg|Iu|Cm|Mm)\b/g, (_, n, u) => `${n} ${u.toLowerCase()}`);
}
