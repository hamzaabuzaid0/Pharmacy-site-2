// NOTE: which number is WhatsApp vs phone-only is unconfirmed — waPhone/callPhone
// assignment below is a placeholder guess (first number = WhatsApp, second = call).
// Swap if the pharmacy confirms otherwise.
// deliveryFee is also a placeholder value — confirm the pharmacy's real fee (or
// whether it varies by area/order size) before this goes live.
export const branches = [
  {
    id: 'b1',
    nameKey: 'branch1Name',
    addrKey: 'branch1Addr',
    waPhone: '201092901444',
    callPhone: '201098342343',
    waDisplay: '0109 290 1444',
    callDisplay: '0109 834 2343',
    deliveryFee: 25,
  },
  {
    id: 'b2',
    nameKey: 'branch2Name',
    addrKey: 'branch2Addr',
    waPhone: '201070055592',
    callPhone: '201070055579',
    waDisplay: '010 700 555 92',
    callDisplay: '010 700 555 79',
    deliveryFee: 25,
  },
];
