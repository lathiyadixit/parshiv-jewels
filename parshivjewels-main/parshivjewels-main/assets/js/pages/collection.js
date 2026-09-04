/* ══════════════════════════════════════════════════════════════
   COLLECTION / CATEGORY LISTING
   One reusable listing page behind every browse URL:
     /shop                      all products
     /shop/:category            necklaces | earrings | rings | bracelets
     /shop/:edit                new-arrivals | best-sellers | sale
     /collections/:slug         curated collections
   Filter state lives in the query string, so every view is
   linkable, shareable and survives the Back button.
   ══════════════════════════════════════════════════════════════ */
import { $, $$, esc } from '../core/dom.js';
import { href, setQuery, getCurrent } from '../core/router.js';
import { inr, pluralise } from '../core/format.js';
import { toast } from '../core/toast.js';
import {
  query as runQuery,
  facets as computeFacets,
  paginate,
  toList,
  getCategory,
  getCollection,
  getEdit,
  getCategories,
  getCollections,
  priceRange,
  imageUrl,
} from '../services/catalogService.js';
import { MATERIALS, COLORS, SORT_OPTIONS, AVAILABILITY, PRICE_BUCKETS } from '../data/taxonomy.js';
import { productGrid } from '../components/productCard.js';
import { skeletonGrid } from '../components/skeleton.js';
import { breadcrumbs, emptyState, pageHeading } from '../components/ui.js';
import { itemListSchema, breadcrumbSchema } from '../services/seoService.js';

const PER_PAGE = 12;

/** Resolve the URL into a listing context: title, copy, base filter. */
function resolveContext({ params, path }) {
  const slug = params.slug || null;

  if (path.startsWith('/collections/')) {
    const collection = getCollection(slug);
    if (!collection) return null;
    return {
      kind: 'collection',
      slug,
      name: collection.name,
      eyebrow: collection.tagline,
      description: collection.description,
      image: collection.image,
      baseFilter: { collection: slug },
      crumbs: [
        { label: 'Home', href: '/' },
        { label: 'Collections', href: '/collections' },
        { label: collection.name, href: `/collections/${slug}` },
      ],
    };
  }

  if (!slug) {
    return {
      kind: 'all',
      slug: null,
      name: 'Shop All Products',
      eyebrow: 'The complete edit',
      description:
        'Every piece currently made in our Surat atelier — certified, hallmarked and ready to enquire about on WhatsApp.',
      baseFilter: {},
      crumbs: [{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }],
    };
  }

  const category = getCategory(slug);
  if (category) {
    return {
      kind: 'category',
      slug: category.slug,
      name: category.name,
      eyebrow: category.tagline,
      description: category.description,
      image: category.image,
      baseFilter: { category: category.slug },
      crumbs: [
        { label: 'Home', href: '/' },
        { label: 'Shop', href: '/shop' },
        { label: category.name, href: `/shop/${category.slug}` },
      ],
    };
  }

  const edit = getEdit(slug);
  if (edit) {
    return {
      kind: 'edit',
      slug,
      name: edit.name,
      eyebrow: edit.tagline,
      description: edit.description,
      image: edit.image,
      baseFilter: { edit: slug },
      crumbs: [
        { label: 'Home', href: '/' },
        { label: 'Shop', href: '/shop' },
        { label: edit.name, href: `/shop/${slug}` },
      ],
    };
  }

  return null;
}

/** Query string → filter object. */
function readFilters(queryParams, baseFilter) {
  return {
    ...baseFilter,
    materials: toList(queryParams.material),
    colors: toList(queryParams.color),
    sizes: toList(queryParams.size),
    availability: toList(queryParams.stock),
    min: queryParams.min || null,
    max: queryParams.max || null,
    sort: queryParams.sort || 'featured',
    q: queryParams.q || '',
  };
}

/* ─────────────── Filter UI ─────────────── */

function checkboxGroup({ title, name, options, selected, counts }) {
  return `<fieldset class="border-t border-line/5 pt-5">
    <legend class="text-[11px] uppercase tracking-[0.28em] text-gold">${esc(title)}</legend>
    <div class="mt-4 space-y-2.5">
      ${options
        .map((option) => {
          const value = option.value ?? option;
          const label = option.label ?? option;
          const count = counts?.get(value) ?? 0;
          const checked = selected.includes(value);
          return `<label class="flex cursor-pointer items-center gap-3 text-[14px] transition hover:text-gold-light ${
            count === 0 && !checked ? 'opacity-40' : ''
          }">
            <input type="checkbox" data-filter="${name}" value="${esc(value)}" ${checked ? 'checked' : ''}
              class="h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[4px] border border-line/25 bg-night/70 transition checked:border-gold checked:bg-gold">
            <span class="flex-1">${esc(label)}</span>
            <span class="text-[11px] text-sand/60">${count}</span>
          </label>`;
        })
        .join('')}
    </div>
  </fieldset>`;
}

function swatchGroup({ selected, counts }) {
  return `<fieldset class="border-t border-line/5 pt-5">
    <legend class="text-[11px] uppercase tracking-[0.28em] text-gold">Colour</legend>
    <div class="mt-4 flex flex-wrap gap-2.5">
      ${COLORS.map((color) => {
        const count = counts?.get(color.name) ?? 0;
        const active = selected.includes(color.name);
        return `<button type="button" data-filter-toggle="color" data-value="${esc(color.name)}"
          class="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition ${
            active ? 'border-gold bg-gold/10 text-gold-light' : 'border-line/15 text-sand hover:border-gold/60'
          } ${count === 0 && !active ? 'opacity-40' : ''}"
          aria-pressed="${active}">
          <span class="h-3 w-3 rounded-full border border-line/20" style="background:${color.hex}"></span>
          ${esc(color.name)}
        </button>`;
      }).join('')}
    </div>
  </fieldset>`;
}

function priceFilter(queryParams) {
  const { min: floor, max: ceiling } = priceRange();
  return `<fieldset class="border-t border-line/5 pt-5">
    <legend class="text-[11px] uppercase tracking-[0.28em] text-gold">Price</legend>
    <div class="mt-4 flex flex-wrap gap-2">
      ${PRICE_BUCKETS.map(
        (bucket) => `<button type="button" data-price-bucket="${bucket.min}:${bucket.max ?? ''}"
          class="chip ${
            String(queryParams.min ?? '') === String(bucket.min) &&
            String(queryParams.max ?? '') === String(bucket.max ?? '')
              ? 'chip-on'
              : ''
          } !px-3.5 !py-1.5 !text-[11px]">${esc(bucket.label)}</button>`
      ).join('')}
    </div>
    <div class="mt-4 flex items-center gap-2">
      <label class="sr-only" for="minPrice">Minimum price</label>
      <input id="minPrice" data-price-input="min" type="number" min="0" inputmode="numeric"
        value="${esc(queryParams.min ?? '')}" placeholder="₹ ${floor}" class="field w-full !px-4 !py-2 text-sm">
      <span class="text-sand/50">—</span>
      <label class="sr-only" for="maxPrice">Maximum price</label>
      <input id="maxPrice" data-price-input="max" type="number" min="0" inputmode="numeric"
        value="${esc(queryParams.max ?? '')}" placeholder="₹ ${ceiling}" class="field w-full !px-4 !py-2 text-sm">
    </div>
  </fieldset>`;
}

function filterPanel(context, filters, queryParams, facets) {
  const sizeOptions = [...facets.sizes.keys()].sort();
  return `
  <div class="space-y-5">
    <div class="flex items-center justify-between gap-4">
      <span class="flex items-center gap-2 font-display text-lg text-ivory">
        <span class="h-2 w-2 rotate-45 bg-gold"></span>Refine
      </span>
      <button type="button" data-clear-filters class="text-[11px] uppercase tracking-[0.18em] text-sand transition hover:text-gold-light">Clear all</button>
    </div>

    ${
      context.kind !== 'category'
        ? checkboxGroup({
            title: 'Category',
            name: 'category',
            options: getCategories().map((c) => ({ value: c.slug, label: c.name })),
            selected: toList(queryParams.category),
            counts: facets.categories,
          })
        : ''
    }
    ${priceFilter(queryParams)}
    ${checkboxGroup({
      title: 'Material',
      name: 'material',
      options: MATERIALS,
      selected: filters.materials,
      counts: facets.materials,
    })}
    ${swatchGroup({ selected: filters.colors, counts: facets.colors })}
    ${
      sizeOptions.length > 1
        ? checkboxGroup({
            title: 'Size',
            name: 'size',
            options: sizeOptions,
            selected: filters.sizes,
            counts: facets.sizes,
          })
        : ''
    }
    ${
      context.kind !== 'collection'
        ? checkboxGroup({
            title: 'Collection',
            name: 'collection',
            options: getCollections().map((c) => ({ value: c.slug, label: c.name })),
            selected: toList(queryParams.collection),
            counts: facets.collections,
          })
        : ''
    }
    ${checkboxGroup({
      title: 'Availability',
      name: 'stock',
      options: AVAILABILITY,
      selected: filters.availability,
      counts: facets.availability,
    })}
  </div>`;
}

/** Removable pills summarising what is currently filtered. */
function activePills(queryParams) {
  const pills = [];
  const push = (name, value, label) => pills.push({ name, value, label });

  toList(queryParams.category).forEach((v) => push('category', v, getCategory(v)?.name || v));
  toList(queryParams.collection).forEach((v) => push('collection', v, getCollection(v)?.name || v));
  toList(queryParams.material).forEach((v) => push('material', v, v));
  toList(queryParams.color).forEach((v) => push('color', v, v));
  toList(queryParams.size).forEach((v) => push('size', v, `Size ${v}`));
  toList(queryParams.stock).forEach((v) =>
    push('stock', v, AVAILABILITY.find((a) => a.value === v)?.label || v)
  );
  if (queryParams.min || queryParams.max) {
    push('price', 'price', `${inr(queryParams.min || 0)} – ${queryParams.max ? inr(queryParams.max) : 'Any'}`);
  }

  if (!pills.length) return '';
  return `<div class="mt-6 flex flex-wrap items-center gap-2.5" data-active-pills>
    ${pills
      .map(
        (pill) => `<button type="button" data-remove-filter="${pill.name}" data-value="${esc(pill.value)}"
          class="chip chip-on !py-1.5 !text-[11px]">${esc(pill.label)} <span aria-hidden="true" class="ml-1">✕</span>
          <span class="sr-only">Remove filter</span></button>`
      )
      .join('')}
    <button type="button" data-clear-filters class="text-[11px] uppercase tracking-[0.18em] text-sand underline-offset-4 transition hover:text-gold-light hover:underline">Clear all</button>
  </div>`;
}

/** How many filters are currently applied — shown on the mobile button. */
function activeFilterCount(queryParams) {
  const keys = ['category', 'collection', 'material', 'color', 'size', 'stock'];
  const listed = keys.reduce((sum, key) => sum + toList(queryParams[key]).length, 0);
  return listed + (queryParams.min || queryParams.max ? 1 : 0);
}

function sortSelect(current) {
  const label = SORT_OPTIONS.find((option) => option.value === current)?.label || 'Featured';
  return `<div class="csel relative w-full sm:w-56" id="sortSelect" data-value="${esc(current)}">
    <button type="button" class="cs-btn field flex items-center justify-between text-left" aria-haspopup="listbox" aria-expanded="false">
      <span class="cs-label">${esc(label)}</span>
      <svg class="cs-chev h-4 w-4 shrink-0 text-gold transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <div class="cs-menu" role="listbox">
      ${SORT_OPTIONS.map(
        (option) =>
          `<button type="button" role="option" aria-selected="${option.value === current}" data-val="${option.value}"
            class="cs-opt ${option.value === current ? 'bg-gold/15 text-gold-light' : ''}">${esc(option.label)}</button>`
      ).join('')}
    </div>
  </div>`;
}

function collectionHero(context) {
  if (!context.image) return '';
  return `<div class="shine frame relative mt-10 h-56 overflow-hidden rounded-2xl border border-gold/20 sm:h-72" data-reveal="zoom">
    <img src="${imageUrl(context.image, 1600)}" onerror="imgFix(this)"
      alt="${esc(context.name)} — Parshiv Jewels" fetchpriority="high" decoding="async"
      class="h-full w-full object-cover">
    <span class="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-transparent"></span>
  </div>`;
}

/* ─────────────── Page ─────────────── */

export default function collectionPage(routeContext) {
  const context = resolveContext(routeContext);
  if (!context) return null;

  const queryParams = routeContext.query;
  const filters = readFilters(queryParams, context.baseFilter);
  // Cross-cutting filters (category/collection) are additive on /shop.
  if (!context.baseFilter.category && toList(queryParams.category).length === 1) {
    filters.category = toList(queryParams.category)[0];
  }
  if (!context.baseFilter.collection && toList(queryParams.collection).length === 1) {
    filters.collection = toList(queryParams.collection)[0];
  }

  const all = runQuery({ ...context.baseFilter, sort: filters.sort });
  const results = runQuery(filters);
  const facets = computeFacets(all);
  const page = paginate(results, queryParams.page || 1, PER_PAGE);

  const heading = `
    ${breadcrumbs(context.crumbs)}
    <div class="mt-6">
      ${pageHeading({
        eyebrow: context.eyebrow,
        title: context.name.split(' ')[0],
        accent: context.name.split(' ').slice(1).join(' '),
        description: context.description,
      })}
    </div>
    ${collectionHero(context)}`;

  const body = results.length
    ? `<h2 class="sr-only">${esc(context.name)} products</h2>
       <div id="productResults" data-grid>${productGrid(page.items, { columns: 3, eagerCount: 3 })}</div>
       ${
         page.hasMore
           ? `<div class="mt-14 flex flex-col items-center gap-4" data-load-more-zone>
                <p class="text-[13px] text-sand/80">Showing ${page.items.length} of ${page.total}</p>
                <button type="button" data-load-more class="btn-line px-10 py-3.5">Load More</button>
              </div>`
           : `<p class="mt-14 text-center text-[13px] text-sand/70">You’ve seen all ${pluralise(
               page.total,
               'piece'
             )}.</p>`
       }`
    : emptyState({
        title: 'No pieces match those filters',
        message:
          'Try widening the price range or clearing a filter — or tell us what you are looking for and we will make it.',
        actions: [
          { label: 'Clear Filters', href: `/shop${context.slug ? `/${context.slug}` : ''}` },
          { label: 'Shop All', href: '/shop' },
        ],
      });

  return {
    meta: {
      title: `${context.name} — ${pluralise(results.length, 'piece')}`,
      description: context.description,
      path: routeContext.path,
      image: context.image ? imageUrl(context.image, 1200) : undefined,
    },
    jsonLd: [
      breadcrumbSchema(context.crumbs),
      itemListSchema(page.items, context.name),
    ],
    html: `<div class="page-anim mx-auto max-w-[1500px] px-5 py-14 lg:px-8">
      ${heading}

      <div class="mt-12 grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside class="hidden lg:block">
          <div class="panel sticky top-40 max-h-[calc(100dvh-12rem)] overflow-y-auto p-6" data-filter-panel>
            ${filterPanel(context, filters, queryParams, facets)}
          </div>
        </aside>

        <div>
          <div class="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-[13px] uppercase tracking-[0.18em] text-sand">
              <span class="text-ivory">${results.length}</span> of ${all.length} pieces
            </p>
            <div class="flex items-center gap-3">
              <button type="button" data-open-filters class="btn-line px-5 py-2.5 text-xs lg:hidden">
                Filters${activeFilterCount(queryParams) ? ` (${activeFilterCount(queryParams)})` : ''}
              </button>
              ${sortSelect(filters.sort)}
            </div>
          </div>
          ${activePills(queryParams)}
          <section class="mt-8" aria-label="Product results">${body}</section>
        </div>
      </div>

      <!-- Mobile filter sheet -->
      <div id="filterSheet" class="fixed inset-0 z-[112] hidden lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
        <div class="absolute inset-0 bg-veil/75 backdrop-blur-sm" data-close-filters></div>
        <div class="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-gold/25 bg-onyx p-6 shadow-soft">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="font-display text-2xl text-ivory">Filters</h2>
            <button type="button" data-close-filters class="flex h-10 w-10 items-center justify-center rounded-full border border-line/15 text-ivory transition hover:border-gold hover:text-gold" aria-label="Close filters">✕</button>
          </div>
          <div data-filter-panel>${filterPanel(context, filters, queryParams, facets)}</div>
          <button type="button" data-close-filters class="btn-gold mt-7 w-full py-4">Show ${results.length} results</button>
        </div>
      </div>
    </div>`,
    onMount: (scope) => mount(context, queryParams, results, scope),
  };
}

/* ─────────────── Behaviour ─────────────── */

function mount(context, queryParams, results, scope) {
  const { on, delegate } = scope;
  const root = $('#main');

  /** Merge a change into the URL query, resetting pagination. */
  const update = (changes) => {
    const next = { ...getCurrent().query, ...changes, page: undefined };
    Object.keys(next).forEach((key) => {
      if (next[key] == null || next[key] === '') delete next[key];
    });
    setQuery(next);
  };

  const toggleValue = (name, value) => {
    const current = toList(getCurrent().query[name]);
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
    update({ [name]: next.join(',') });
  };

  delegate(root, 'change', '[data-filter]', (event, input) => {
    toggleValue(input.dataset.filter, input.value);
  });

  delegate(root, 'click', '[data-filter-toggle]', (event, button) => {
    toggleValue(button.dataset.filterToggle, button.dataset.value);
  });

  delegate(root, 'click', '[data-price-bucket]', (event, button) => {
    const [min, max] = button.dataset.priceBucket.split(':');
    const active = button.classList.contains('chip-on');
    update({ min: active ? '' : min, max: active ? '' : max });
  });

  let priceTimer;
  delegate(root, 'input', '[data-price-input]', (event, input) => {
    clearTimeout(priceTimer);
    const which = input.dataset.priceInput;
    priceTimer = setTimeout(() => update({ [which]: input.value }), 450);
  });

  delegate(root, 'click', '[data-remove-filter]', (event, button) => {
    const name = button.dataset.removeFilter;
    if (name === 'price') return update({ min: '', max: '' });
    toggleValue(name, button.dataset.value);
  });

  delegate(root, 'click', '[data-clear-filters]', () => {
    setQuery({});
    toast('Filters cleared');
  });

  // Sort dropdown — same custom select behaviour as the original site.
  const sel = $('#sortSelect', root);
  if (sel) {
    const button = $('.cs-btn', sel);
    on(button, 'click', (event) => {
      event.stopPropagation();
      const open = sel.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
    $$('.cs-opt', sel).forEach((option) =>
      on(option, 'click', (event) => {
        event.stopPropagation();
        sel.classList.remove('open');
        update({ sort: option.dataset.val });
      })
    );
    on(document, 'click', () => sel.classList.remove('open'));
  }

  // Mobile filter sheet
  const sheet = $('#filterSheet', root);
  delegate(root, 'click', '[data-open-filters]', () => {
    sheet.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  });
  delegate(root, 'click', '[data-close-filters]', () => {
    sheet.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  });

  // Progressive loading. The page size lives in the URL (`?page=`) and the
  // router re-renders, so the expanded list is shareable and the Back button
  // steps through it. Manual DOM insertion here would fight that re-render.
  const zone = $('[data-load-more-zone]', root);
  if (zone) {
    let loading = false;

    const loadMore = () => {
      if (loading) return;
      loading = true;
      const nextPage = (Number(getCurrent().query.page) || 1) + 1;
      // A frame of skeleton keeps the interaction legible and stops the
      // observer re-firing against a button that is about to be replaced.
      zone.innerHTML = `<div class="w-full">${skeletonGrid(3, 4)}</div>`;
      setQuery({ ...getCurrent().query, page: nextPage }, { replace: false, scroll: false });
    };

    delegate(root, 'click', '[data-load-more]', loadMore);

    // Auto-load when the button scrolls into range (infinite scroll), while
    // the button itself remains for keyboard and reduced-motion users.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '300px' }
    );
    const button = $('[data-load-more]', root);
    if (button) observer.observe(button);
    scope.observe(observer);
  }
}
