/* Catalog taxonomy: categories, collections and facet vocabularies.
   Pure data — the catalog service derives everything else from it. */

export const CATEGORIES = [
  {
    slug: 'necklaces',
    name: 'Necklaces',
    legacy: 'necklace',
    tagline: 'Cascades, chokers & rani haars',
    description:
      'From feather-light everyday chains to ceremonial polki rani haars, each Parshiv necklace is strung, set and polished by hand in our Mahidharpura atelier.',
    image: 'photo-1599643478518-a784e5dc4c8f',
  },
  {
    slug: 'earrings',
    name: 'Earrings',
    legacy: 'earrings',
    tagline: 'Jhumkas, studs & chandbalis',
    description:
      'Heirloom jhumkas, whisper-light studs and chandelier drops — balanced for comfort so they can be worn from morning meetings to midnight celebrations.',
    image: 'photo-1535632066927-ab7c9ab60908',
  },
  {
    slug: 'rings',
    name: 'Rings',
    legacy: 'rings',
    tagline: 'Solitaires, bands & cocktail rings',
    description:
      'Certified solitaires, stackable bands and statement cocktail rings, each set with stones graded for cut, colour and clarity before they reach the bench.',
    image: 'photo-1602751584552-8ba73aad10e1',
  },
  {
    slug: 'bracelets',
    name: 'Bracelets',
    legacy: 'bracelet',
    tagline: 'Tennis lines, cuffs & kadas',
    description:
      'Fluid tennis lines, sculpted cuffs and traditional kadas — engineered with secure clasps and a comfort-fit inner profile.',
    image: 'photo-1611591437281-460bfbe1220a',
  },
];

export const COLLECTIONS = [
  {
    slug: 'bridal-heirloom',
    name: 'Bridal Heirloom',
    tagline: 'For the day everything changes',
    description:
      'Ceremonial sets in 22K gold, uncut polki and certified diamonds — designed to be worn once as a bride and then for a lifetime as an heirloom.',
    image: 'photo-1515562141207-7a88fb7ce338',
  },
  {
    slug: 'everyday-luxe',
    name: 'Everyday Luxe',
    tagline: 'Quiet luxury, worn daily',
    description:
      'Lightweight, low-profile pieces built for real life — secure clasps, snag-free settings and finishes that survive a working week.',
    image: 'photo-1611652022419-a9419f74343d',
  },
  {
    slug: 'celestial',
    name: 'Celestial',
    tagline: 'Stars, moons & constellations',
    description:
      'Crescents, stars and scattered pavé, inspired by the night sky above the Tapi. Our most gifted collection.',
    image: 'photo-1573408301185-9146fe634ad0',
  },
  {
    slug: 'solitaire-atelier',
    name: 'Solitaire Atelier',
    tagline: 'One perfect stone',
    description:
      'Certified solitaires set in platinum and 18K gold, each accompanied by its own grading report and serial-numbered warranty card.',
    image: 'photo-1603561591411-07134e71a2a9',
  },
  {
    slug: 'heritage-gold',
    name: 'Heritage Gold',
    tagline: 'Temple craft, modern hands',
    description:
      'Traditional Gujarati and South Indian silhouettes — temple motifs, filigree and repoussé work — executed by karigars trained across three generations.',
    image: 'photo-1602751584552-8ba73aad10e1',
  },
  {
    slug: 'pearl-reverie',
    name: 'Pearl Reverie',
    tagline: 'Lustre, softly stated',
    description:
      'Hand-knotted freshwater pearls in silver and gold settings, graded for lustre and matched by hand strand by strand.',
    image: 'photo-1573408301185-9146fe634ad0',
  },
];

export const MATERIALS = [
  '18K Yellow Gold',
  '18K Rose Gold',
  '18K White Gold',
  '22K Gold',
  'Platinum',
  '925 Sterling Silver',
];

export const COLORS = [
  { name: 'Gold', hex: '#d2a84f' },
  { name: 'Rose Gold', hex: '#e6b7a5' },
  { name: 'White Gold', hex: '#e8e6e1' },
  { name: 'Silver', hex: '#c9ccd1' },
  { name: 'Emerald', hex: '#1f6b4f' },
  { name: 'Ruby', hex: '#9b1c2e' },
  { name: 'Sapphire', hex: '#1b3a6b' },
  { name: 'Pearl White', hex: '#f1ece1' },
];

export const AVAILABILITY = [
  { value: 'in-stock', label: 'In Stock' },
  { value: 'low-stock', label: 'Low Stock' },
  { value: 'out-of-stock', label: 'Out of Stock' },
];

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'new', label: 'Newest First' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'discount', label: 'Biggest Saving' },
  { value: 'name', label: 'Name: A–Z' },
];

/** Virtual collections that behave like categories in navigation. */
export const EDITS = [
  {
    slug: 'new-arrivals',
    name: 'New Arrivals',
    tagline: 'Fresh from the bench',
    description: 'The newest pieces to leave our Surat workshop, added this season.',
    filter: { isNew: true },
    image: 'photo-1611652022419-a9419f74343d',
  },
  {
    slug: 'best-sellers',
    name: 'Best Sellers',
    tagline: 'Loved by 5,000+ patrons',
    description: 'The designs our patrons return for, reorder and gift most often.',
    filter: { isBestSeller: true },
    image: 'photo-1599643478518-a784e5dc4c8f',
  },
  {
    slug: 'sale',
    name: 'Sale',
    tagline: 'Atelier savings',
    description: 'Certified pieces marked down by 25% or more while stocks last — same craft, same guarantees.',
    // Every piece carries an MRP, so "on sale" alone would mean the whole
    // catalogue. The Sale edit is a genuine markdown threshold.
    filter: { minDiscount: 25 },
    image: 'photo-1611591437281-460bfbe1220a',
  },
];

export const PRICE_BUCKETS = [
  { label: 'Under ₹1,000', min: 0, max: 999 },
  { label: '₹1,000 – ₹2,500', min: 1000, max: 2500 },
  { label: '₹2,500 – ₹5,000', min: 2500, max: 5000 },
  { label: '₹5,000 – ₹10,000', min: 5000, max: 10000 },
  { label: 'Above ₹10,000', min: 10000, max: null },
];

/* ─────────────── Custom design vocabularies ───────────────
   Options for the "Design your own" brief. Kept here beside the rest of
   the catalogue vocabularies so the shop edits one file, not a form. */

export const JEWELLERY_TYPES = [
  { value: 'ring', label: 'Ring', sizeLabel: 'Ring size', sizes: ['12', '13', '14', '15', '16', '17', '18', '19', '20', 'Not sure yet'] },
  { value: 'earrings', label: 'Earrings', sizeLabel: 'Style', sizes: ['Studs', 'Drops', 'Jhumkas', 'Hoops', 'Chandbali', 'Not sure yet'] },
  { value: 'pendant', label: 'Pendant', sizeLabel: 'Chain length', sizes: ['16"', '18"', '20"', '22"', 'No chain needed', 'Not sure yet'] },
  { value: 'necklace', label: 'Necklace', sizeLabel: 'Length', sizes: ['14" Choker', '16" Princess', '18" Standard', '24" Opera', '30" Rope', 'Not sure yet'] },
  { value: 'bracelet', label: 'Bracelet', sizeLabel: 'Wrist size', sizes: ['6.5"', '7"', '7.5"', '8"', 'Bangle — slip on', 'Not sure yet'] },
  { value: 'bangle', label: 'Bangle / Kada', sizeLabel: 'Inner diameter', sizes: ['2.2"', '2.4"', '2.6"', '2.8"', 'Not sure yet'] },
];

export const BUDGET_RANGES = [
  'Under ₹25,000',
  '₹25,000 – ₹50,000',
  '₹50,000 – ₹1,00,000',
  '₹1,00,000 – ₹2,50,000',
  '₹2,50,000 – ₹5,00,000',
  'Above ₹5,00,000',
  'Advise me',
];

export const DIAMOND_OPTIONS = [
  'Natural diamond — certified',
  'Lab-grown diamond — certified',
  'Uncut / polki',
  'Coloured gemstone',
  'No stones — plain metal',
  'Advise me',
];

export const METAL_OPTIONS = ['22K Gold', '18K Gold', '14K Gold', 'Platinum', '925 Sterling Silver', 'Advise me'];

export const METAL_FINISHES = [
  { value: 'Yellow Gold', swatch: 'linear-gradient(135deg,#e8c25a,#b8912f 55%,#f0d98a)' },
  { value: 'White Gold', swatch: 'linear-gradient(135deg,#e9e9ec,#a9adb4 55%,#f4f4f6)' },
  { value: 'Rose Gold', swatch: 'linear-gradient(135deg,#e6b7a5,#c2856f 55%,#f2d3c6)' },
];

export const DESIGN_OCCASIONS = ['Engagement', 'Wedding / bridal', 'Anniversary', 'Gift', 'Everyday piece', 'Remodelling an heirloom', 'Not a specific occasion'];
