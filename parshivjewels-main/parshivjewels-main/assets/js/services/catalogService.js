/* ══════════════════════════════════════════════════════════════
   CATALOG SERVICE
   The only module that knows how raw product data becomes a usable
   product: slugs, image URLs, variants, discounts, availability and
   ratings are all derived here so the data file stays declarative.

   Everything below is a pure read model — no DOM, no cart, no state.
   ══════════════════════════════════════════════════════════════ */
import { PRODUCTS, IMAGE_POOLS, FALLBACK_IMAGE_ID } from '../data/products.js';
import { REVIEWS, BASELINE_RATING } from '../data/reviews.js';
import { CATEGORIES, COLLECTIONS, EDITS } from '../data/taxonomy.js';
import { slugify, discountPercent } from '../core/format.js';
import { COMMERCE } from '../config/site.config.js';
import { asset, isLocalAssetPath } from '../core/assets.js';

const IMG_BASE = 'https://images.unsplash.com/';

/**
 * Resolve an image reference to a URL.
 *
 * Accepts either an Unsplash photo id (resized on their CDN) or a local
 * path such as "/assets/img/piece.webp". This is the swap-in point for real
 * photography — see the README — so no other module needs to change.
 */
export function imageUrl(ref, width = 900) {
  if (isLocalAssetPath(ref) || /^(https?:|data:)/.test(ref)) return asset(ref);
  return `${IMG_BASE}${ref}?q=80&w=${width}&auto=format&fit=crop`;
}

export const FALLBACK_IMAGE = imageUrl(FALLBACK_IMAGE_ID, 1200);

/** srcset for responsive delivery — meaningfully cheaper on mobile.
    Local files aren't resized on the fly, so they get no srcset. */
export function imageSrcSet(ref) {
  if (isLocalAssetPath(ref) || /^(https?:|data:)/.test(ref)) return '';
  return [400, 700, 900, 1400].map((w) => `${imageUrl(ref, w)} ${w}w`).join(', ');
}

function buildImages(product) {
  const pool = IMAGE_POOLS[product.category] || IMAGE_POOLS.necklaces;
  const start = product.imgStart || 0;
  return pool.map((_, index) => {
    const id = pool[(start + index) % pool.length];
    return {
      id,
      src: imageUrl(id, 900),
      srcset: imageSrcSet(id),
      alt:
        index === 0
          ? `${product.name} — ${product.material} jewellery by Parshiv Jewels`
          : `${product.name} — detail view ${index + 1}`,
    };
  });
}

function buildVariants(product) {
  const sizes = product.sizes && product.sizes.length ? product.sizes : ['One Size'];
  const total = product.inventory ?? 12;
  // Stock is held per size. A single-option product holds all of it; a sized
  // product holds a share, floored at 2 so a size is never "buy one only"
  // unless the piece is genuinely scarce.
  const perVariant = sizes.length === 1 ? total : Math.max(2, Math.round(total / sizes.length));

  return sizes.map((size, index) => {
    // Scarce pieces genuinely run out in the largest size first.
    const soldOut = total <= 4 && index === sizes.length - 1 && sizes.length > 1;
    const inventory = soldOut ? 0 : perVariant;
    return {
      id: slugify(size) || `v${index}`,
      label: size,
      sku: `${product.sku}-${slugify(size).toUpperCase() || index}`,
      price: product.price,
      compareAt: product.compareAt,
      inventory,
      available: inventory > 0,
    };
  });
}

function ratingFor(id) {
  const list = REVIEWS[id];
  if (!list || !list.length) return { rating: BASELINE_RATING.rating, reviewCount: 0, reviews: [] };
  const total = list.reduce((sum, review) => sum + review.rating, 0);
  const reviews = list
    .map((review, index) => ({ id: `${id}-r${index + 1}`, ...review }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return {
    rating: Math.round((total / list.length) * 10) / 10,
    reviewCount: list.length,
    reviews,
  };
}

function availabilityOf(product) {
  const qty = product.inventory ?? 0;
  if (qty <= 0) return 'out-of-stock';
  if (qty <= COMMERCE.lowStockThreshold) return 'low-stock';
  return 'in-stock';
}

/** Raw record → fully derived product. */
function normalise(raw) {
  const slug = raw.slug || slugify(raw.name);
  const images = buildImages(raw);
  const { rating, reviewCount, reviews } = ratingFor(raw.id);
  const discount = discountPercent(raw.price, raw.compareAt);
  const category = CATEGORIES.find((c) => c.slug === raw.category) || CATEGORIES[0];

  return {
    ...raw,
    slug,
    url: `/product/${slug}`,
    images,
    image: images[0],
    categorySlug: category.slug,
    categoryName: category.name,
    collections: raw.collections || [],
    colors: raw.colors || [],
    sizes: raw.sizes || ['One Size'],
    variantLabel: raw.variantLabel || 'Option',
    variants: buildVariants(raw),
    tags: raw.tags || [],
    discount,
    onSale: discount > 0,
    savings: Math.max(0, (raw.compareAt || 0) - raw.price),
    availability: availabilityOf(raw),
    inStock: (raw.inventory ?? 0) > 0,
    rating,
    reviewCount,
    reviews,
    isNew: !!raw.isNew,
    isBestSeller: !!raw.isBestSeller,
    isFeatured: !!raw.isFeatured,
    shortDescription: raw.shortDescription || raw.description?.slice(0, 120) || '',
    details: raw.details || [],
    care: raw.care || [
      'Store each piece separately in the pouch provided to prevent scratching.',
      'Remove before swimming, bathing, sleeping or exercising.',
      'Apply perfume, hairspray and lotion before putting jewellery on.',
      'Clean with the supplied microfibre cloth; book a free professional polish with us yearly.',
    ],
    specs: [
      { label: 'SKU', value: raw.sku },
      { label: 'Category', value: category.name },
      { label: 'Metal', value: raw.material },
      { label: 'Finish', value: (raw.colors || []).join(', ') || '—' },
      { label: 'Hallmark', value: 'BIS Hallmarked' },
      { label: 'Warranty', value: 'Lifetime craftsmanship warranty' },
    ],
  };
}

/** The normalised catalog. Built once at module load. */
export const CATALOG = PRODUCTS.map(normalise);

const bySlug = new Map(CATALOG.map((p) => [p.slug, p]));
const byId = new Map(CATALOG.map((p) => [p.id, p]));

export const getAll = () => CATALOG;
export const getBySlug = (slug) => bySlug.get(slug) || null;
export const getById = (id) => byId.get(Number(id)) || null;

export function getVariant(product, variantId) {
  if (!product) return null;
  if (!variantId) return product.variants[0] || null;
  return product.variants.find((v) => v.id === variantId) || null;
}

/** First variant that can actually be bought — used by quick add. */
export function firstAvailableVariant(product) {
  return product.variants.find((v) => v.available) || product.variants[0] || null;
}

export const getCategories = () => CATEGORIES;
export const getCategory = (slug) =>
  CATEGORIES.find((c) => c.slug === slug || c.legacy === slug) || null;
export const getCollections = () => COLLECTIONS;
export const getCollection = (slug) => COLLECTIONS.find((c) => c.slug === slug) || null;
export const getEdits = () => EDITS;
export const getEdit = (slug) => EDITS.find((e) => e.slug === slug) || null;

export const countIn = (predicate) => CATALOG.filter(predicate).length;

export const featured = (limit = 6) => CATALOG.filter((p) => p.isFeatured).slice(0, limit);
export const bestSellers = (limit = 8) => CATALOG.filter((p) => p.isBestSeller).slice(0, limit);
export const newArrivals = (limit = 8) => CATALOG.filter((p) => p.isNew).slice(0, limit);
/** Genuinely marked-down pieces — see the `sale` edit in taxonomy.js. */
export const onSale = (limit = 8, minDiscount = 25) =>
  CATALOG.filter((p) => p.discount >= minDiscount)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, limit);

/* ─────────────── Filtering, sorting, pagination ─────────────── */

const SORTERS = {
  featured: (a, b) =>
    Number(b.isFeatured) - Number(a.isFeatured) ||
    Number(b.isBestSeller) - Number(a.isBestSeller) ||
    a.id - b.id,
  new: (a, b) => Number(b.isNew) - Number(a.isNew) || b.id - a.id,
  'best-selling': (a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || b.rating - a.rating,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
  discount: (a, b) => b.discount - a.discount,
  name: (a, b) => a.name.localeCompare(b.name),
};

/** Split a comma-separated query param into a trimmed list. */
export const toList = (value) =>
  !value ? [] : String(value).split(',').map((v) => v.trim()).filter(Boolean);

/**
 * Query the catalog.
 * @param {object} filters category, collection, edit, materials[], colors[],
 *   sizes[], availability[], min, max, sort, q
 */
export function query(filters = {}) {
  const {
    category,
    collection,
    edit,
    materials = [],
    colors = [],
    sizes = [],
    availability = [],
    min = null,
    max = null,
    sort = 'featured',
    q = '',
  } = filters;

  let list = CATALOG.slice();

  if (category) {
    const resolved = getCategory(category);
    if (resolved) list = list.filter((p) => p.categorySlug === resolved.slug);
  }
  if (collection) list = list.filter((p) => p.collections.includes(collection));
  if (edit) {
    const rules = getEdit(edit)?.filter || {};
    if (rules.isNew) list = list.filter((p) => p.isNew);
    if (rules.isBestSeller) list = list.filter((p) => p.isBestSeller);
    if (rules.onSale) list = list.filter((p) => p.onSale);
    if (rules.minDiscount) list = list.filter((p) => p.discount >= rules.minDiscount);
  }
  if (materials.length) list = list.filter((p) => materials.includes(p.material));
  if (colors.length) list = list.filter((p) => p.colors.some((c) => colors.includes(c)));
  if (sizes.length) list = list.filter((p) => p.sizes.some((s) => sizes.includes(s)));
  if (availability.length) list = list.filter((p) => availability.includes(p.availability));
  if (min != null && min !== '') list = list.filter((p) => p.price >= Number(min));
  if (max != null && max !== '') list = list.filter((p) => p.price <= Number(max));
  if (q) list = list.filter(matcher(q));

  return list.sort(SORTERS[sort] || SORTERS.featured);
}

/** Facet counts for the current result set, so filters can show numbers. */
export function facets(list) {
  const tally = (key, extract) => {
    const map = new Map();
    list.forEach((product) => {
      extract(product).forEach((value) => map.set(value, (map.get(value) || 0) + 1));
    });
    return map;
  };
  return {
    materials: tally('material', (p) => [p.material]),
    colors: tally('colors', (p) => p.colors),
    sizes: tally('sizes', (p) => p.sizes),
    availability: tally('availability', (p) => [p.availability]),
    collections: tally('collections', (p) => p.collections),
    categories: tally('category', (p) => [p.categorySlug]),
  };
}

export function paginate(list, page = 1, perPage = 12) {
  const totalPages = Math.max(1, Math.ceil(list.length / perPage));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  return {
    items: list.slice(0, safePage * perPage), // progressive "load more" window
    pageItems: list.slice((safePage - 1) * perPage, safePage * perPage),
    page: safePage,
    perPage,
    totalPages,
    total: list.length,
    hasMore: safePage < totalPages,
  };
}

/* ─────────────── Search & recommendations ─────────────── */

function matcher(term) {
  const needle = term.toLowerCase().trim();
  const words = needle.split(/\s+/).filter(Boolean);
  return (product) => {
    const haystack = [
      product.name,
      product.categoryName,
      product.material,
      product.shortDescription,
      ...product.colors,
      ...product.tags,
      ...product.collections,
    ]
      .join(' ')
      .toLowerCase();
    return words.every((word) => haystack.includes(word));
  };
}

/** Ranked product search used by the overlay and the search page. */
export function searchProducts(term, limit = 24) {
  if (!term || term.trim().length < 1) return [];
  const needle = term.toLowerCase().trim();
  return CATALOG.filter(matcher(needle))
    .map((product) => {
      const name = product.name.toLowerCase();
      let score = 0;
      if (name === needle) score += 100;
      if (name.startsWith(needle)) score += 50;
      if (name.includes(needle)) score += 25;
      if (product.tags.some((t) => t.toLowerCase().includes(needle))) score += 10;
      if (product.isBestSeller) score += 4;
      if (product.isFeatured) score += 2;
      return { product, score };
    })
    .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating)
    .slice(0, limit)
    .map((entry) => entry.product);
}

/** Categories, collections and edits matching a search term. */
export function searchTaxonomy(term) {
  if (!term) return [];
  const needle = term.toLowerCase().trim();
  const hit = (name) => name.toLowerCase().includes(needle);
  return [
    ...CATEGORIES.filter((c) => hit(c.name)).map((c) => ({
      type: 'Category',
      name: c.name,
      url: `/shop/${c.slug}`,
      count: countIn((p) => p.categorySlug === c.slug),
    })),
    ...COLLECTIONS.filter((c) => hit(c.name)).map((c) => ({
      type: 'Collection',
      name: c.name,
      url: `/collections/${c.slug}`,
      count: countIn((p) => p.collections.includes(c.slug)),
    })),
    ...EDITS.filter((e) => hit(e.name)).map((e) => ({
      type: 'Edit',
      name: e.name,
      url: `/shop/${e.slug}`,
      count: query({ edit: e.slug }).length,
    })),
  ];
}

export const POPULAR_SEARCHES = [
  'Jhumka',
  'Solitaire',
  'Pearl',
  'Bridal set',
  'Rose gold',
  'Tennis bracelet',
  'Under 1000',
];

/** Same category first, then shared collection — never the product itself. */
export function relatedTo(product, limit = 4) {
  if (!product) return [];
  const scored = CATALOG.filter((p) => p.id !== product.id).map((candidate) => {
    let score = 0;
    if (candidate.categorySlug === product.categorySlug) score += 6;
    score += candidate.collections.filter((c) => product.collections.includes(c)).length * 4;
    if (candidate.material === product.material) score += 2;
    if (Math.abs(candidate.price - product.price) < product.price * 0.4) score += 2;
    return { candidate, score };
  });
  return scored
    .sort((a, b) => b.score - a.score || b.candidate.rating - a.candidate.rating)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

/** Cross-category picks for "You may also like" and cart recommendations. */
export function youMayAlsoLike(product, limit = 4) {
  const pool = CATALOG.filter(
    (p) => p.id !== product?.id && p.categorySlug !== product?.categorySlug
  );
  return pool
    .sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || b.rating - a.rating)
    .slice(0, limit);
}

/** Recommendations for the cart, avoiding anything already in it. */
export function recommendFor(productIds = [], limit = 4) {
  const inCart = new Set(productIds.map(Number));
  const seedCategories = new Set(
    [...inCart].map((id) => getById(id)?.categorySlug).filter(Boolean)
  );
  return CATALOG.filter((p) => !inCart.has(p.id))
    .sort((a, b) => {
      const aMatch = seedCategories.size ? Number(!seedCategories.has(a.categorySlug)) : 0;
      const bMatch = seedCategories.size ? Number(!seedCategories.has(b.categorySlug)) : 0;
      return aMatch - bMatch || Number(b.isBestSeller) - Number(a.isBestSeller) || b.rating - a.rating;
    })
    .slice(0, limit);
}

export const priceRange = () => {
  const prices = CATALOG.map((p) => p.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
};
