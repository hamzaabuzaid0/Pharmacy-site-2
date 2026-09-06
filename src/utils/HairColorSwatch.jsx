// Hair-colour products have no photo, but their shade number IS the product
// (Palette 8-0, Garnier 6.3, L'Oréal Casting 513, Bigen 47, ...). The
// build script (scripts/build-catalog.py) parses that code into an actual
// colour using the international hair-colour chart — leading digit = light-
// ness level 1(black)..10(lightest blonde), the rest = tone — and stores it
// as `swatch` (hex) with `shade` (the printed code). Here we just render
// that: a clean colour chip with the shade number, which is exactly what a
// customer scans a dye shelf for.

function readableOn(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // relative luminance
  const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return L > 0.55 ? '#2b2b2b' : '#f6f2ec';
}

export function HairColorSwatch({ product, size = '38px' }) {
  const hex = product.swatch || '#6b4a2e';
  const fg = readableOn(hex);
  const big = size !== '38px' && parseInt(size, 10) > 40;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, ${hex} 0%, ${hex} 55%, rgba(255,255,255,0.14) 100%), ${hex}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: fg,
      }}
    >
      {product.shade ? (
        <span
          style={{
            fontWeight: 700,
            fontSize: big ? '1.4rem' : '0.8rem',
            letterSpacing: '0.02em',
            fontVariantNumeric: 'tabular-nums',
            textShadow: fg === '#f6f2ec' ? '0 1px 2px rgba(0,0,0,0.35)' : 'none',
          }}
        >
          {product.shade}
        </span>
      ) : (
        <svg viewBox="0 0 24 24" width={big ? 28 : 16} height={big ? 28 : 16} fill="none"
          stroke={fg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3c4 4 6 7 6 11a6 6 0 0 1-12 0c0-4 2-7 6-11z" />
        </svg>
      )}
    </div>
  );
}
