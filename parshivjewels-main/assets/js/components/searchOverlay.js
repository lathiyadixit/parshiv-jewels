/* ══════════════════════════════════════════════════════════════
   SEARCH OVERLAY
   Site-wide search: live product and category results, recent and
   popular searches, and a clear no-results state. Full keyboard
   support — ↑ ↓ to move, Enter to open, Esc to dismiss.
   ══════════════════════════════════════════════════════════════ */
import { $, $$, esc, on, delegate, lockScroll, unlockScroll, trapFocus, refreshImages } from '../core/dom.js';
import { href, go } from '../core/router.js';
import { inr } from '../core/format.js';
import {
  searchProducts,
  searchTaxonomy,
  POPULAR_SEARCHES,
} from '../services/catalogService.js';
import {
  recordSearch,
  getRecentSearches,
  clearRecentSearches,
} from '../services/recentlyViewedService.js';

let released = null;
let lastFocused = null;
let activeIndex = -1;
let debounceTimer;

const SEARCH_ICON = `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`;

function chipRow(title, terms, { clearable = false } = {}) {
  if (!terms.length) return '';
  return `<div class="mt-8">
    <div class="flex items-center justify-between gap-4">
      <p class="text-[11px] uppercase tracking-[0.3em] text-gold">${esc(title)}</p>
      ${clearable ? `<button type="button" data-search-clear-recent class="text-[11px] uppercase tracking-[0.18em] text-sand transition hover:text-gold-light">Clear</button>` : ''}
    </div>
    <div class="mt-4 flex flex-wrap gap-3">
      ${terms.map((term) => `<button type="button" data-search-term="${esc(term)}" class="chip">${esc(term)}</button>`).join('')}
    </div>
  </div>`;
}

function resultRow(product, index) {
  return `<a href="${href(product.url)}" data-search-result data-index="${index}"
    class="group flex items-center gap-4 rounded-xl border border-line/5 bg-card p-3 transition hover:border-gold/40 hover:bg-gold/5">
    <img src="${product.image.src}" onerror="imgFix(this)" alt="${esc(product.image.alt)}"
      width="56" height="64" loading="lazy" decoding="async" class="h-16 w-14 shrink-0 rounded-lg bg-night object-cover">
    <span class="min-w-0 flex-1">
      <span class="block text-[11px] uppercase tracking-[0.26em] text-gold">${esc(product.categoryName)}</span>
      <span class="mt-0.5 block truncate font-display text-lg text-ivory group-hover:text-gold-light">${esc(product.name)}</span>
      <span class="mt-0.5 block truncate text-[13px] text-sand/80">${esc(product.material)}</span>
    </span>
    <span class="shrink-0 text-right">
      <span class="block text-[15px] font-semibold text-gold">${inr(product.price)}</span>
      ${product.onSale ? `<span class="block text-xs text-sand/60 line-through">${inr(product.compareAt)}</span>` : ''}
    </span>
  </a>`;
}

function emptyResults(term) {
  return `<div class="mt-10 flex flex-col items-center gap-4 py-10 text-center">
    <span class="text-4xl text-gold/40" aria-hidden="true">◆</span>
    <p class="font-display text-2xl text-ivory">No matches for “${esc(term)}”</p>
    <p class="max-w-md text-[15px]">Try a category like “earrings”, a material like “rose gold”, or browse the full collection.</p>
    <div class="mt-2 flex flex-wrap justify-center gap-3">
      <a href="${href('/shop')}" data-search-close class="btn-gold px-8 py-3">Shop All Jewellery</a>
      <a href="${href('/contact')}" data-search-close class="btn-line px-8 py-3">Ask a Specialist</a>
    </div>
  </div>`;
}

function renderIdle() {
  $('#searchResults').innerHTML = `
    ${chipRow('Recent searches', getRecentSearches(), { clearable: true })}
    ${chipRow('Popular searches', POPULAR_SEARCHES)}
    <p class="mt-10 text-center text-[13px] text-sand/70">Search our full catalogue by name, category, material or occasion.</p>`;
}

function renderResults(term) {
  const container = $('#searchResults');
  const products = searchProducts(term, 8);
  const taxonomy = searchTaxonomy(term);
  activeIndex = -1;

  if (!products.length && !taxonomy.length) {
    container.innerHTML = emptyResults(term);
    return;
  }

  container.innerHTML = `
    ${
      taxonomy.length
        ? `<div class="mt-8">
            <p class="text-[11px] uppercase tracking-[0.3em] text-gold">Categories &amp; collections</p>
            <div class="mt-4 flex flex-wrap gap-3">
              ${taxonomy
                .map(
                  (entry) =>
                    `<a href="${href(entry.url)}" data-search-close class="chip">${esc(entry.name)} <span class="text-sand/60">(${entry.count})</span></a>`
                )
                .join('')}
            </div>
          </div>`
        : ''
    }
    ${
      products.length
        ? `<div class="mt-8">
            <div class="flex items-center justify-between gap-4">
              <p class="text-[11px] uppercase tracking-[0.3em] text-gold">Products</p>
              <a href="${href('/search')}?q=${encodeURIComponent(term)}" data-search-close class="text-[11px] uppercase tracking-[0.18em] text-gold-light transition hover:text-gold">View all →</a>
            </div>
            <div class="mt-4 grid gap-3">${products.map(resultRow).join('')}</div>
          </div>`
        : ''
    }`;
  refreshImages(container);
}

function update(term) {
  const clean = term.trim();
  if (clean.length < 2) renderIdle();
  else renderResults(clean);
}

export function openSearch(initial = '') {
  const overlay = $('#searchOverlay');
  if (!overlay) return;
  lastFocused = document.activeElement;
  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  overlay.setAttribute('aria-hidden', 'false');
  lockScroll();
  released = trapFocus(overlay);
  const input = $('#searchInput');
  input.value = initial;
  update(initial);
  requestAnimationFrame(() => input.focus());
}

export function closeSearch() {
  const overlay = $('#searchOverlay');
  if (!overlay || overlay.classList.contains('hidden')) return;
  overlay.classList.add('hidden');
  overlay.classList.remove('flex');
  overlay.setAttribute('aria-hidden', 'true');
  unlockScroll();
  released?.();
  released = null;
  lastFocused?.focus?.();
}

function submitSearch(term) {
  const clean = term.trim();
  if (!clean) return;
  recordSearch(clean);
  closeSearch();
  go('/search', { query: { q: clean } });
}

function moveActive(delta) {
  const rows = $$('[data-search-result]');
  if (!rows.length) return;
  activeIndex = (activeIndex + delta + rows.length) % rows.length;
  rows.forEach((row, index) => row.classList.toggle('search-active', index === activeIndex));
  rows[activeIndex].scrollIntoView({ block: 'nearest' });
}

export function initSearch() {
  const overlay = $('#searchOverlay');
  if (!overlay) return;

  on($('#searchBtn'), 'click', () => openSearch());
  delegate(overlay, 'click', '[data-search-close],#searchClose,[data-search-backdrop]', closeSearch);

  const input = $('#searchInput');
  on(input, 'input', (event) => {
    clearTimeout(debounceTimer);
    const value = event.target.value;
    debounceTimer = setTimeout(() => update(value), 120);
  });

  on($('#searchForm'), 'submit', (event) => {
    event.preventDefault();
    const rows = $$('[data-search-result]');
    if (activeIndex >= 0 && rows[activeIndex]) {
      const url = rows[activeIndex].getAttribute('href');
      closeSearch();
      go(url.replace(/^#/, ''));
      return;
    }
    submitSearch(input.value);
  });

  delegate(overlay, 'click', '[data-search-term]', (event, el) => {
    input.value = el.dataset.searchTerm;
    update(input.value);
    input.focus();
  });

  delegate(overlay, 'click', '[data-search-clear-recent]', () => {
    clearRecentSearches();
    renderIdle();
  });

  delegate(overlay, 'click', '[data-search-result]', (event, el) => {
    recordSearch(input.value);
    closeSearch();
  });

  on(document, 'keydown', (event) => {
    // "/" or Cmd/Ctrl-K opens search from anywhere.
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
    if ((event.key === '/' && !typing) || ((event.metaKey || event.ctrlKey) && event.key === 'k')) {
      event.preventDefault();
      openSearch();
      return;
    }
    if (overlay.classList.contains('hidden')) return;
    if (event.key === 'Escape') closeSearch();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    }
  });
}

export { SEARCH_ICON };
