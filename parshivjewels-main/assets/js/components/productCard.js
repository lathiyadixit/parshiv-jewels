/* ══════════════════════════════════════════════════════════════
   PRODUCT CARD & GRID
   The original card markup, extended with quick view, quick add,
   stock state and accessible labelling. This is THE product card —
   home, collection, search, related and recommendation rails all
   render through it.
   ══════════════════════════════════════════════════════════════ */
import { esc } from '../core/dom.js';
import { href } from '../core/router.js';
import { inr } from '../core/format.js';
import { ratingRow } from './ui.js';

const EYE_ICON = `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;

/** Badge shown top-left: an explicit badge wins, then New / Bestseller. */
function badgeFor(product) {
  const label = product.badge || (product.isNew ? 'New' : product.isBestSeller ? 'Bestseller' : '');
  if (!label) return '';
  return `<span class="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink shadow-glow">${esc(
    label
  )}</span>`;
}

/**
 * @param {object} product
 * @param {{index?: number, eager?: boolean, compact?: boolean}} options
 */
export function productCard(product, { index = 0, eager = false, compact = false } = {}) {
  const soldOut = !product.inStock;
  const imageHeight = compact ? 'h-56' : 'h-72 sm:h-80';

  return `
<article style="transition-delay:${(index % 3) * 90}ms"
  class="tilt group panel flex h-full flex-col overflow-hidden rounded-xl transition duration-500 hover:-translate-y-1 hover:border-gold/50 hover:shadow-glow"
  data-reveal="up" data-product-card="${product.slug}">
  <div class="relative ${imageHeight} shrink-0 overflow-hidden bg-night">
    <a href="${href(product.url)}" class="block h-full w-full" aria-label="View ${esc(product.name)}">
      <img src="${product.image.src}" ${product.image.srcset ? `srcset="${product.image.srcset}"
        sizes="(max-width: 640px) 92vw, (max-width: 1280px) 45vw, 30vw"` : ''}
        onerror="imgFix(this)" alt="${esc(product.image.alt)}" width="900" height="1125"
        loading="${eager ? 'eager' : 'lazy'}" ${eager ? 'fetchpriority="high"' : ''} decoding="async"
        class="h-full w-full object-cover transition duration-[1.4s] group-hover:scale-110">
    </a>
    ${badgeFor(product)}
    ${
      product.discount > 0
        ? `<span class="absolute right-4 top-4 rounded-full border border-gold/40 bg-night/70 px-2.5 py-1 text-[11px] font-medium text-gold-light backdrop-blur">${product.discount}% OFF</span>`
        : ''
    }
    ${
      soldOut
        ? `<span class="absolute inset-0 flex items-center justify-center bg-night/70 font-display text-xl uppercase tracking-[0.3em] text-ivory backdrop-blur-[2px]">Sold Out</span>`
        : ''
    }
    <button type="button" data-quick-view="${product.slug}"
      class="absolute bottom-4 left-1/2 flex -translate-x-1/2 translate-y-4 items-center gap-2 rounded-full border border-gold/40 bg-night/85 px-5 py-2 text-[11px] uppercase tracking-[0.22em] text-gold-light opacity-0 backdrop-blur transition duration-300 hover:border-gold hover:bg-gold hover:text-ink focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100">
      ${EYE_ICON}Quick View
    </button>
  </div>
  <div class="flex flex-1 flex-col p-5">
    <p class="text-[11px] uppercase tracking-[0.3em] text-gold">${esc(product.categoryName)}</p>
    <h3 class="mt-1.5 font-display text-2xl leading-snug text-ivory">
      <a href="${href(product.url)}" class="transition hover:text-gold-light">${esc(product.name)}</a>
    </h3>
    <div class="mt-1.5">${ratingRow(product, { compact: true })}</div>
    <div class="mt-2 flex items-baseline gap-3">
      <p class="text-xl font-semibold text-gold">${inr(product.price)}</p>
      ${product.onSale ? `<p class="text-sm text-sand/60 line-through">${inr(product.compareAt)}</p>` : ''}
    </div>
    ${
      product.availability === 'low-stock'
        ? `<p class="mt-2 text-[11px] uppercase tracking-[0.18em] text-gold-light">Only ${product.inventory} left</p>`
        : ''
    }
    <div class="mt-auto flex flex-wrap gap-2.5 pt-5">
      <a href="${href(product.url)}" class="btn-line btn-compact min-w-[6rem] flex-1">View Details</a>
      ${
        soldOut
          ? `<button type="button" disabled class="btn-line btn-compact min-w-[6rem] flex-1 cursor-not-allowed opacity-40">Sold Out</button>`
          : `<button type="button" data-quick-add="${product.slug}" class="btn-gold btn-compact min-w-[6rem] flex-1">Add to Cart</button>`
      }
    </div>
  </div>
</article>`;
}

/** Responsive product grid used by every listing surface. */
export function productGrid(products, { columns = 3, eagerCount = 3, compact = false } = {}) {
  const cols =
    columns === 4
      ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : columns === 2
      ? 'sm:grid-cols-2'
      : 'sm:grid-cols-2 xl:grid-cols-3';
  return `<div class="grid gap-7 ${cols}">${products
    .map((product, index) => productCard(product, { index, eager: index < eagerCount, compact }))
    .join('')}</div>`;
}

/** Horizontally scrollable rail for related / recently viewed products. */
export function productRail(products, { title, eyebrow, id }) {
  if (!products.length) return '';
  return `<section class="mt-20" aria-labelledby="${id}-heading">
    <div class="flex items-end justify-between gap-6" data-reveal="up">
      <div>
        ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
        <h2 id="${id}-heading" class="draw mt-4 font-display text-3xl font-semibold text-ivory sm:text-4xl">${esc(title)}</h2>
      </div>
    </div>
    <div class="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
      ${products.map((product, index) => productCard(product, { index, compact: true })).join('')}
    </div>
  </section>`;
}
