/* ══════════════════════════════════════════════════════════════
   SEO SERVICE
   Keeps <title>, meta description, canonical, Open Graph, Twitter
   cards and JSON-LD in sync with the client-side route.
   ══════════════════════════════════════════════════════════════ */
import { SITE, COMMERCE } from '../config/site.config.js';
import { isHashMode } from '../core/router.js';
import { $ } from '../core/dom.js';

const MANAGED = 'data-seo-managed';

function upsertMeta(selector, attrs) {
  let el = $(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(MANAGED, '');
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
}

function setLink(rel, href) {
  let el = $(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/** Absolute, crawlable URL for the current route. */
export function canonicalFor(path) {
  const clean = path === '/' ? '/' : path.replace(/\/$/, '');
  return SITE.origin + (isHashMode() ? `/#${clean}` : clean);
}

/**
 * @param {object} meta title, description, path, image, type, noindex
 */
export function applyMeta(meta = {}) {
  const title = meta.title ? `${meta.title} | ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
  const description = meta.description || SITE.tagline;
  const url = canonicalFor(meta.path || '/');
  const image = meta.image || SITE.defaultOgImage;

  document.title = title;
  upsertMeta('meta[name="description"]', { name: 'description', content: description });
  setLink('canonical', url);

  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url });
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image });
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: meta.type || 'website' });

  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });

  upsertMeta('meta[name="robots"]', {
    name: 'robots',
    content: meta.noindex ? 'noindex,follow' : 'index,follow',
  });
}

/* ─────────────── Structured data ─────────────── */

const JSONLD_ID = 'route-jsonld';

/** Replace the route-scoped JSON-LD block (the site-wide one is untouched). */
export function applyJsonLd(graph) {
  let script = document.getElementById(JSONLD_ID);
  if (!graph) {
    script?.remove();
    return;
  }
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = JSONLD_ID;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(graph);
}

export function productSchema(product) {
  const availability = {
    'in-stock': 'https://schema.org/InStock',
    'low-stock': 'https://schema.org/LimitedAvailability',
    'out-of-stock': 'https://schema.org/OutOfStock',
  }[product.availability];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    sku: product.sku,
    image: product.images.map((img) => img.src),
    brand: { '@type': 'Brand', name: SITE.name },
    material: product.material,
    category: product.categoryName,
    offers: {
      '@type': 'Offer',
      url: SITE.origin + product.url,
      priceCurrency: COMMERCE.currency,
      price: product.price,
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: SITE.name },
    },
  };

  if (product.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    };
    schema.review = product.reviews.slice(0, 5).map((review) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: review.author },
      datePublished: review.date,
      name: review.title,
      reviewBody: review.body,
      reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5 },
    }));
  }
  return schema;
}

export function breadcrumbSchema(crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: canonicalFor(crumb.href || '/'),
    })),
  };
}

export function itemListSchema(products, name) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: SITE.origin + product.url,
      name: product.name,
    })),
  };
}

export function faqSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}
