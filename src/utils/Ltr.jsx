// Wraps any Latin-digit content (phone numbers, prices) so it always renders
// left-to-right even inside Arabic (RTL) text — prevents the bidi algorithm
// from reordering space-separated digit groups.
export function Ltr({ children }) {
  return (
    <bdi style={{ direction: 'ltr', unicodeBidi: 'embed' }}>{children}</bdi>
  );
}
