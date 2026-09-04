/* Full search results page — the destination for the overlay's
   "View all" and for shared /search?q= links. */
import { $, esc } from '../core/dom.js';
import { href, setQuery } from '../core/router.js';
import { pluralise } from '../core/format.js';
import { searchProducts, searchTaxonomy, POPULAR_SEARCHES } from '../services/catalogService.js';
import { recordSearch } from '../services/recentlyViewedService.js';
import { track, EVENTS } from '../services/analyticsService.js';
import { productGrid } from '../components/productCard.js';
import { breadcrumbs, emptyState, pageHeading } from '../components/ui.js';

export default function searchPage({ path, query }) {
  const term = (query.q || '').trim();
  const products = term ? searchProducts(term, 48) : [];
  const taxonomy = term ? searchTaxonomy(term) : [];
  if (term) {
    recordSearch(term);
    track(EVENTS.SEARCH, { term, results: products.length });
  }

  const body = !term
    ? emptyState({
        title: 'What are you looking for?',
        message: 'Search by name, category, material or occasion — or browse the full catalogue.',
        actions: [{ label: 'Shop All Jewellery', href: '/shop' }],
      })
    : products.length
    ? `${
        taxonomy.length
          ? `<div class="mt-10">
              <p class="text-[11px] uppercase tracking-[0.3em] text-gold">Categories &amp; collections</p>
              <div class="mt-4 flex flex-wrap gap-3">
                ${taxonomy
                  .map(
                    (entry) =>
                      `<a href="${href(entry.url)}" class="chip">${esc(entry.name)} <span class="text-sand/60">(${entry.count})</span></a>`
                  )
                  .join('')}
              </div>
            </div>`
          : ''
      }
      <div class="mt-10">${productGrid(products, { columns: 4, eagerCount: 4 })}</div>`
    : emptyState({
        title: `No matches for “${term}”`,
        message:
          'Try a broader term, check the spelling, or tell us what you have in mind — we take bespoke commissions on WhatsApp.',
        actions: [
          { label: 'Shop All Jewellery', href: '/shop' },
          { label: 'Ask a Specialist', href: '/contact' },
        ],
      });

  return {
    meta: {
      title: term ? `Search: ${term}` : 'Search',
      description: term
        ? `${pluralise(products.length, 'result')} for “${term}” at Parshiv Jewels.`
        : 'Search the Parshiv Jewels catalogue by name, category, material or occasion.',
      path,
      noindex: true,
    },
    html: `<div class="page-anim mx-auto max-w-[1500px] px-5 py-14 lg:px-8">
      ${breadcrumbs([{ label: 'Home', href: '/' }, { label: 'Search', href: '/search' }])}
      <div class="mt-6">
        ${pageHeading({
          eyebrow: term ? pluralise(products.length, 'result') : 'Find your piece',
          title: 'Search',
          accent: 'Results',
          description: term ? `Showing matches for “${term}”.` : '',
        })}
      </div>

      <form id="searchPageForm" class="mt-10 flex max-w-2xl gap-3" novalidate>
        <label class="sr-only" for="searchPageInput">Search products</label>
        <input id="searchPageInput" class="field flex-1" value="${esc(term)}"
          placeholder="Search necklaces, jhumkas, solitaires…" autocomplete="off">
        <button type="submit" class="btn-gold shrink-0 px-8 py-3">Search</button>
      </form>

      ${
        !term
          ? `<div class="mt-8 flex flex-wrap gap-3">
              ${POPULAR_SEARCHES.map(
                (t) => `<a href="${href('/search')}?q=${encodeURIComponent(t)}" class="chip">${esc(t)}</a>`
              ).join('')}
            </div>`
          : ''
      }
      ${body}
    </div>`,
    onMount: (scope) => {
      scope.on($('#searchPageForm'), 'submit', (event) => {
        event.preventDefault();
        setQuery({ q: $('#searchPageInput').value.trim() }, { replace: false, scroll: true });
      });
    },
  };
}
