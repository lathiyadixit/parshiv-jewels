/* Shared presentational fragments. Every page composes these instead of
   re-declaring markup, so spacing, type scale and borders stay identical
   to the original design system. */
import { esc } from '../core/dom.js';
import { href } from '../core/router.js';
import { inr, stars } from '../core/format.js';

/** The site's standard eyebrow + heading block. */
export function sectionHeading({ eyebrow, title, accent, align = 'left', action, id }) {
  const centered = align === 'center';
  const heading = `<h2 ${id ? `id="${esc(id)}"` : ''} class="${centered ? 'draw-c' : 'draw'} mt-5 font-display text-4xl font-semibold text-ivory sm:text-5xl">${esc(
    title
  )}${accent ? ` <em class="accent-it">${esc(accent)}</em>` : ''}</h2>`;

  if (centered) {
    return `<div class="text-center" data-reveal="up">
      <p class="eyebrow justify-center">${esc(eyebrow)}</p>${heading}</div>`;
  }
  return `<div class="flex flex-wrap items-end justify-between gap-6" data-reveal="up">
    <div><p class="eyebrow">${esc(eyebrow)}</p>${heading}</div>
    ${action ? `<a href="${href(action.href)}" class="btn-line px-7 py-3">${esc(action.label)}</a>` : ''}
  </div>`;
}

/**
 * Page-level title block used by collection and informational pages.
 * The type scale steps down for longer titles — at the largest size a
 * sentence-length heading fills an entire phone screen before any content.
 */
export function pageHeading({ eyebrow, title, accent, description, align = 'left' }) {
  const centered = align === 'center';
  const full = `${title} ${accent || ''}`.trim();
  const length = full.length;
  // A heading wraps between words but never inside one, so the longest word
  // — not the total length — decides whether it fits a phone column.
  // "Cancellation" (12) at text-5xl is ~387px against a 333px column.
  const longestWord = full.split(/\s+/).reduce((n, w) => Math.max(n, w.length), 0);

  const byLength = length <= 24 ? 0 : length <= 40 ? 1 : 2;
  const byWord = longestWord <= 10 ? 0 : longestWord <= 13 ? 1 : 2;
  const size = ['text-5xl sm:text-6xl', 'text-4xl sm:text-5xl', 'text-[1.9rem] leading-[1.15] sm:text-4xl lg:text-5xl'][
    Math.max(byLength, byWord)
  ];

  return `
  <p class="eyebrow ${centered ? 'justify-center' : ''}" data-reveal="up">${esc(eyebrow)}</p>
  <h1 class="${centered ? 'draw-c text-center' : 'draw'} mt-5 font-display ${size} font-semibold text-ivory" data-reveal="up">${esc(
    title
  )}${accent ? ` <em class="accent-it">${esc(accent)}</em>` : ''}</h1>
  ${
    description
      ? `<p class="mt-6 max-w-2xl text-base leading-relaxed ${centered ? 'mx-auto text-center' : ''}" data-reveal="up">${esc(
          description
        )}</p>`
      : ''
  }`;
}

export function breadcrumbs(crumbs) {
  const items = crumbs
    .map((crumb, index) => {
      const last = index === crumbs.length - 1;
      const inner = last
        ? `<span class="text-gold-light" aria-current="page">${esc(crumb.label)}</span>`
        : `<a href="${href(crumb.href)}" class="transition hover:text-gold-light">${esc(crumb.label)}</a>`;
      return `<li class="flex items-center gap-2">${inner}${
        last ? '' : '<span class="text-gold/50" aria-hidden="true">◆</span>'
      }</li>`;
    })
    .join('');
  return `<nav aria-label="Breadcrumb"><ol class="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-sand/80">${items}</ol></nav>`;
}

export function ratingRow(product, { compact = false } = {}) {
  const count = product.reviewCount;
  const label = count ? `${product.rating.toFixed(1)} (${count})` : 'New';
  return `<span class="flex items-center gap-2 ${compact ? 'text-xs' : 'text-[15px]'}">
    <span class="text-gold" aria-hidden="true">${stars(product.rating)}</span>
    <span class="text-sand/80">${esc(label)}</span>
    <span class="sr-only">Rated ${product.rating} out of 5${count ? ` from ${count} reviews` : ''}</span>
  </span>`;
}

export function priceBlock(product, { size = 'md' } = {}) {
  const priceClass = size === 'lg' ? 'font-display text-3xl text-gold' : 'text-xl font-semibold text-gold';
  return `<div class="flex flex-wrap items-baseline gap-3">
    <p class="${priceClass}">${inr(product.price)}</p>
    ${
      product.onSale
        ? `<p class="text-sm text-sand/60 line-through">${inr(product.compareAt)}</p>
           <p class="text-xs font-medium uppercase tracking-[0.18em] text-success">Save ${inr(product.savings)}</p>`
        : ''
    }
  </div>`;
}

export function stockPill(product) {
  const map = {
    'in-stock': ['text-success border-success/30 bg-success/10', 'In Stock'],
    'low-stock': ['text-gold-light border-gold/40 bg-gold/10', `Only ${product.inventory} left`],
    'out-of-stock': ['text-danger border-danger/30 bg-danger/10', 'Out of Stock'],
  };
  const [cls, label] = map[product.availability] || map['in-stock'];
  return `<span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${cls}">
    <span class="h-1.5 w-1.5 rotate-45 bg-current"></span>${esc(label)}</span>`;
}

/** Consistent empty state across shop, search and cart. */
export function emptyState({ title, message, actions = [], icon = '◆', heading = 'h2' }) {
  const tag = heading === 'h1' ? 'h1' : 'h2';
  return `<div class="panel mt-10 flex flex-col items-center justify-center gap-4 px-6 py-20 text-center" data-reveal="zoom">
    <span class="text-5xl text-gold/40" aria-hidden="true">${icon}</span>
    <${tag} class="font-display text-3xl text-ivory">${esc(title)}</${tag}>
    <p class="max-w-md text-[15px]">${esc(message)}</p>
    ${
      actions.length
        ? `<div class="mt-4 flex flex-wrap justify-center gap-3">${actions
            .map(
              (action, index) =>
                `<a href="${href(action.href)}" class="${
                  index === 0 ? 'btn-gold' : 'btn-line'
                } px-8 py-3.5">${esc(action.label)}</a>`
            )
            .join('')}</div>`
        : ''
    }
  </div>`;
}

/** Full-width error state for a route that failed to resolve. */
export function errorState(message) {
  return emptyState({
    icon: '⚠',
    title: 'Something went wrong',
    message,
    actions: [{ label: 'Back to Home', href: '/' }, { label: 'Shop All', href: '/shop' }],
  });
}

export function accordion(items, { openFirst = true, idPrefix = 'acc' } = {}) {
  return `<div class="space-y-4">${items
    .map(
      (item, index) => `
    <div class="faq-item panel overflow-hidden ${openFirst && index === 0 ? 'open' : ''}" data-reveal="up">
      <button class="faq-q flex w-full items-center justify-between gap-6 px-7 py-5 text-left font-display text-xl text-ivory"
        aria-expanded="${openFirst && index === 0}" aria-controls="${idPrefix}-${index}">
        ${esc(item.title)}
        <span class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold" aria-hidden="true">
          <span class="absolute h-px w-4 bg-current"></span>
          <span class="faq-v absolute h-px w-4 rotate-90 bg-current transition-transform duration-300"></span>
        </span>
      </button>
      <div class="acc-body" id="${idPrefix}-${index}"><div class="overflow-hidden">
        <div class="px-7 pb-6 text-[15px] leading-relaxed">${item.body}</div>
      </div></div>
    </div>`
    )
    .join('')}</div>`;
}

/** Gold-framed call-to-action panel used across informational pages. */
export function ctaPanel({ eyebrow, title, message, primary, secondary }) {
  return `<div class="shine relative mt-16 overflow-hidden rounded-2xl border border-gold/25 bg-card p-10 text-center shadow-soft sm:p-14" data-reveal="zoom">
    <div class="sparkle" style="top:20%;left:10%"></div>
    <div class="sparkle" style="top:60%;left:88%;animation-delay:1.2s"></div>
    ${eyebrow ? `<p class="eyebrow justify-center">${esc(eyebrow)}</p>` : ''}
    <h2 class="mt-5 font-display text-3xl font-semibold text-ivory sm:text-4xl">${esc(title)}</h2>
    <p class="mx-auto mt-4 max-w-2xl text-[15px]">${esc(message)}</p>
    <div class="mt-8 flex flex-wrap justify-center gap-4">
      ${primary ? `<a href="${primary.external ? primary.href : href(primary.href)}" ${primary.external ? 'target="_blank" rel="noopener"' : ''} class="btn-gold px-9 py-4">${esc(primary.label)}</a>` : ''}
      ${secondary ? `<a href="${secondary.external ? secondary.href : href(secondary.href)}" ${secondary.external ? 'target="_blank" rel="noopener"' : ''} class="btn-line px-9 py-4">${esc(secondary.label)}</a>` : ''}
    </div>
  </div>`;
}

export const WHATSAPP_ICON = `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

export function whatsappButton(label, { className = 'btn-line px-7 py-3', message = '' } = {}) {
  return `<button type="button" data-wa-general="${esc(message)}" class="${className} !border-success/40 !text-success hover:!border-success hover:!bg-success/10">
    ${WHATSAPP_ICON}<span>${esc(label)}</span></button>`;
}
