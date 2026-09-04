/* ══════════════════════════════════════════════════════════════
   SITE CONFIGURATION — single source of truth for brand,
   contact, commerce rules and WhatsApp integration.
   Nothing in here knows about the DOM.
   ══════════════════════════════════════════════════════════════ */

/**
 * Reads a configuration value that a deployment may override.
 *
 * Because the site is deployed as static files (Hostinger), there is no
 * build-time env substitution. Values may be supplied at runtime by
 * defining `window.__ENV__` in index.html before the app bundle loads:
 *
 *   <script>window.__ENV__={NEXT_PUBLIC_WHATSAPP_NUMBER:'919999999999'}</script>
 *
 * The key name matches the Next.js convention requested by the brief so the
 * same variable can be reused verbatim if the site ever moves to Next.js.
 */
function env(key, fallback) {
  const bag = typeof window !== 'undefined' ? window.__ENV__ : null;
  const value = bag && bag[key];
  return value == null || value === '' ? fallback : String(value);
}

/** Digits-only international number, no `+`, no spaces. */
export const WHATSAPP_NUMBER = env('NEXT_PUBLIC_WHATSAPP_NUMBER', '916351916996').replace(/\D/g, '');

export const SITE = {
  name: 'Parshiv Jewels',
  shortName: 'PARSHIV',
  tagline: 'Timeless Elegance, Crafted to Shine',
  since: '2026',
  origin: 'https://parshivjewels.in',
  email: 'Parshivjewels.in@gmail.com',
  phone: '+916351916996',
  phoneDisplay: '+91 63519 16996',
  // A second line for the shop. Leave blank to hide it everywhere.
  phoneSecondary: '+919099488850',
  phoneSecondaryDisplay: '+91 90994 88850',
  whatsappDisplay: '+91 63519 16996',
  instagram: 'https://www.instagram.com/parshivjewels.in/',
  instagramHandle: '@parshivjewels.in',
  facebook: 'https://www.facebook.com/',
  address: {
    street: '102, Shiv Narayan House, beside Shree Satynarayan Dev Temple, Kansara Seri, Mahidharpura',
    locality: 'Surat',
    region: 'Gujarat',
    postalCode: '395003',
    country: 'IN',
  },
  addressLines: [
    '102, Shiv Narayan House,',
    'beside Shree Satynarayan Dev Temple,',
    'Kansara Seri, Mahidharpura,',
    'Surat, Gujarat 395003',
  ],
  hours: [
    ['Mon – Fri', '9:00 AM – 6:00 PM'],
    ['Sat – Sun', '10:00 AM – 4:00 PM'],
  ],
  defaultOgImage:
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1200&auto=format&fit=crop',
};

/** Commerce rules. Kept declarative so pricing stays testable. */
export const COMMERCE = {
  currency: 'INR',
  currencySymbol: '₹',
  locale: 'en-IN',
  taxRate: 0.18,
  taxLabel: 'Tax (18%)',
  /** Shipping is complimentary and insured on every order — a brand promise. */
  shipping: { flat: 0, freeAbove: 0, label: 'Free · Insured' },
  /** Quantity a single line item may reach when inventory is unknown. */
  maxQtyPerLine: 10,
  lowStockThreshold: 4,
  dispatchDays: 1,
  deliveryDays: [3, 5],
  returnWindowDays: 30,
};

/**
 * Promo codes. `type` is 'percent' | 'flat'.
 * `collection` restricts the discount to matching line items.
 */
export const COUPONS = [
  {
    code: 'PARSHIV10',
    type: 'percent',
    value: 10,
    minSubtotal: 1500,
    description: '10% off orders above ₹1,500',
  },
  {
    code: 'FIRST500',
    type: 'flat',
    value: 500,
    minSubtotal: 4999,
    description: '₹500 off your first order above ₹4,999',
  },
  {
    code: 'BRIDAL15',
    type: 'percent',
    value: 15,
    minSubtotal: 0,
    collection: 'bridal-heirloom',
    description: '15% off the Bridal Heirloom collection',
  },
];

export const TRUST_BADGES = [
  { label: 'BIS Hallmarked', icon: 'shield' },
  { label: 'Certified Stones', icon: 'gem' },
  { label: 'Insured Shipping', icon: 'truck' },
  { label: '30-Day Returns', icon: 'refresh' },
];

export const STORAGE_KEYS = {
  cart: 'pj.cart.v1',
  recentlyViewed: 'pj.recentlyViewed.v1',
  recentSearches: 'pj.recentSearches.v1',
  lastEnquiry: 'pj.lastEnquiry.v1',
};
