/* Analytics — overview, per-product, per-category and search. */
import { $, esc } from '../../core/dom.js';
import { setQuery, href } from '../core/adminRouter.js';
import * as A from '../repositories/analyticsRepo.js';
import * as catalog from '../repositories/catalogRepo.js';
import { EVENTS } from '../../services/analyticsService.js';
import { pageHeader, table, kpi, card, sectionTitle, money, emptyState, badge, searchInput } from '../components/ui.js';
import { lineChart, barChart, donutChart, funnelChart } from '../components/charts.js';

const RANGE_KEYS = ['today', '7d', '30d', '90d', 'year', 'all'];

function ranger(active) {
  return `<div class="flex flex-wrap gap-2">${RANGE_KEYS.map((k) => `
    <button type="button" data-range="${k}" class="rounded-full border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.12em] transition ${
      active === k ? 'border-gold bg-gold/10 text-gold-light' : 'border-line/15 text-sand hover:border-gold/50 hover:text-ivory'
    }">${esc(A.RANGES[k].label)}</button>`).join('')}</div>`;
}

const wire = (scope) => {
  scope.delegate($('#adminMain'), 'click', '[data-range]', (e, el) => setQuery({ range: el.dataset.range }));
};

async function context(query) {
  const rangeKey = query.range || '30d';
  const range = A.resolveRange(rangeKey);
  const products = await catalog.listProducts();
  const events = A.inRange(A.allEvents(), range);
  return { rangeKey, range, products, events, perf: A.productPerformance(events, products) };
}

/* ─────────────── Overview ─────────────── */

export async function analyticsOverview({ query }) {
  const { rangeKey, range, events, perf } = await context(query);
  const stats = A.summarise(events);
  const prev = A.summarise(A.inRange(A.allEvents(), A.previousRange(range)));
  const t = (a, b) => A.trend(a, b);

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'Analytics', path: '/analytics' }],
    html: `<div class="space-y-5">
      ${pageHeader({ title: 'Analytics', subtitle: `${range.label} · ${range.from.toLocaleDateString('en-IN')} – ${range.to.toLocaleDateString('en-IN')}`, actions: [ranger(rangeKey)] })}

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${kpi({ label: 'Visitors', value: stats.visitors, trend: t(stats.visitors, prev.visitors), sub: `${stats.sessions} sessions`, tone: 'ivory' })}
        ${kpi({ label: 'Page views', value: stats.pageViews, trend: t(stats.pageViews, prev.pageViews), tone: 'ivory' })}
        ${kpi({ label: 'Product views', value: stats.productViews, trend: t(stats.productViews, prev.productViews), tone: 'ivory' })}
        ${kpi({ label: 'Searches', value: stats.searches, trend: t(stats.searches, prev.searches), tone: 'ivory' })}
      </div>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${kpi({ label: 'Added to cart', value: stats.addToCart, trend: t(stats.addToCart, prev.addToCart), sub: `${stats.addToCartRate}% of product views` })}
        ${kpi({ label: 'Removed from cart', value: stats.removeFromCart, tone: 'ivory' })}
        ${kpi({ label: 'WhatsApp enquiries', value: stats.whatsappClicks, trend: t(stats.whatsappClicks, prev.whatsappClicks), sub: `${stats.conversionRate}% of product views` })}
        ${kpi({ label: 'Estimated enquiry value', value: money(stats.enquiryValue), trend: t(stats.enquiryValue, prev.enquiryValue) })}
      </div>

      <div class="grid gap-5 xl:grid-cols-3">
        ${card(`${sectionTitle('Traffic & engagement')}
          <div class="mb-4 flex flex-wrap gap-2">
            <button type="button" data-s="${EVENTS.PAGE_VIEW}" class="chart-tab chart-tab-on">Page views</button>
            <button type="button" data-s="${EVENTS.PRODUCT_VIEW}" class="chart-tab">Product views</button>
            <button type="button" data-s="${EVENTS.ADD_TO_CART}" class="chart-tab">Cart adds</button>
            <button type="button" data-s="${EVENTS.WHATSAPP_CLICK}" class="chart-tab">Enquiries</button>
          </div>
          <div id="anSeries">${lineChart(A.timeSeries(events, range, EVENTS.PAGE_VIEW), { id: 'an' })}</div>`, 'p-5 xl:col-span-2')}
        ${card(`${sectionTitle('Funnel')}${funnelChart(A.funnel(events))}`, 'p-5')}
      </div>

      <div class="grid gap-5 xl:grid-cols-2">
        ${card(`${sectionTitle('Devices')}${donutChart(A.breakdown(events, 'device'))}`, 'p-5')}
        ${card(`${sectionTitle('Traffic sources')}${donutChart(A.breakdown(events, 'source'))}`, 'p-5')}
      </div>

      ${card(`${sectionTitle('Top products by views')}
        ${barChart(perf.slice(0, 8).filter((p) => p.views).map((p) => ({ label: p.name, value: p.views })))}`, 'p-5')}
    </div>`,
    onMount: (scope) => {
      wire(scope);
      scope.delegate($('#adminMain'), 'click', '[data-s]', (e, el) => {
        $('#adminMain').querySelectorAll('[data-s]').forEach((b) => b.classList.remove('chart-tab-on'));
        el.classList.add('chart-tab-on');
        $('#anSeries').innerHTML = lineChart(A.timeSeries(events, range, el.dataset.s), { id: 'an' });
      });
    },
  };
}

/* ─────────────── Products ─────────────── */

export async function analyticsProducts({ query }) {
  const { rangeKey, range, perf } = await context(query);
  let rows = perf;
  if (query.q) rows = rows.filter((p) => p.name.toLowerCase().includes(query.q.toLowerCase()));

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'Analytics', path: '/analytics' }, { label: 'Products', path: '/analytics/products' }],
    html: `<div class="space-y-5">
      ${pageHeader({ title: 'Product analytics', subtitle: range.label, actions: [ranger(rangeKey)] })}
      <div class="rounded-2xl border border-line/10 bg-card p-4">${searchInput('apSearch', 'Search products…', query.q || '')}</div>
      ${table({
        columns: [
          { key: 'name', label: 'Product', render: (p) => `<a href="${href(`/products/${p.id}`)}" class="text-ivory transition hover:text-gold-light">${esc(p.name)}</a>` },
          { key: 'category', label: 'Category', render: (p) => `<span class="capitalize text-sand">${esc(p.category)}</span>` },
          { key: 'views', label: 'Views', align: 'right', render: (p) => `<span class="tabular-nums text-ivory">${p.views}</span>` },
          { key: 'adds', label: 'Cart adds', align: 'right', render: (p) => `<span class="tabular-nums text-sand">${p.adds}</span>` },
          { key: 'addRate', label: 'Add rate', align: 'right', render: (p) => `<span class="tabular-nums ${p.addRate >= 20 ? 'text-success' : 'text-sand'}">${p.addRate}%</span>` },
          { key: 'enquiries', label: 'Enquiries', align: 'right', render: (p) => `<span class="tabular-nums text-sand">${p.enquiries}</span>` },
          { key: 'enquiryRate', label: 'Enquiry rate', align: 'right', render: (p) => `<span class="tabular-nums ${p.enquiryRate >= 10 ? 'text-success' : 'text-sand'}">${p.enquiryRate}%</span>` },
          { key: 'estValue', label: 'Est. value', align: 'right', render: (p) => `<span class="text-gold">${money(p.estValue)}</span>` },
        ],
        rows: rows.slice(0, 60), empty: 'No product activity in this period.',
      })}
    </div>`,
    onMount: (scope) => {
      wire(scope);
      let timer;
      scope.on($('#apSearch'), 'input', (e) => { clearTimeout(timer); timer = setTimeout(() => setQuery({ q: e.target.value }), 350); });
    },
  };
}

/* ─────────────── Categories & collections ─────────────── */

export async function analyticsCategories({ query }) {
  const { rangeKey, range, perf } = await context(query);
  const byCategory = A.groupPerformance(perf, (p) => p.category);
  const byCollection = A.groupPerformance(perf, (p) => p.collections);

  const cols = [
    { key: 'key', label: 'Name', render: (g) => `<span class="capitalize text-ivory">${esc(String(g.key).replace(/-/g, ' '))}</span>` },
    { key: 'products', label: 'Products', align: 'right', render: (g) => `<span class="tabular-nums text-sand">${g.products}</span>` },
    { key: 'views', label: 'Views', align: 'right', render: (g) => `<span class="tabular-nums text-ivory">${g.views}</span>` },
    { key: 'adds', label: 'Cart adds', align: 'right', render: (g) => `<span class="tabular-nums text-sand">${g.adds}</span>` },
    { key: 'enquiries', label: 'Enquiries', align: 'right', render: (g) => `<span class="tabular-nums text-sand">${g.enquiries}</span>` },
    { key: 'estValue', label: 'Est. value', align: 'right', render: (g) => `<span class="text-gold">${money(g.estValue)}</span>` },
  ];

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'Analytics', path: '/analytics' }, { label: 'Categories', path: '/analytics/categories' }],
    html: `<div class="space-y-5">
      ${pageHeader({ title: 'Category & collection analytics', subtitle: range.label, actions: [ranger(rangeKey)] })}
      <div class="grid gap-5 xl:grid-cols-2">
        ${card(`${sectionTitle('Views by category')}${barChart(byCategory.map((g) => ({ label: String(g.key), value: g.views })))}`, 'p-5')}
        ${card(`${sectionTitle('Views by collection')}${barChart(byCollection.slice(0, 8).map((g) => ({ label: String(g.key).replace(/-/g, ' '), value: g.views })))}`, 'p-5')}
      </div>
      ${card(`${sectionTitle('Categories')}${table({ columns: cols, rows: byCategory, empty: 'No category activity yet.' })}`, 'p-5')}
      ${card(`${sectionTitle('Collections')}${table({ columns: cols, rows: byCollection, empty: 'No collection activity yet.' })}`, 'p-5')}
    </div>`,
    onMount: wire,
  };
}

/* ─────────────── Search ─────────────── */

export async function analyticsSearch({ query }) {
  const { rangeKey, range, events } = await context(query);
  const terms = A.searchTerms(events);
  const noResults = terms.filter((t) => t.noResults > 0);

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'Analytics', path: '/analytics' }, { label: 'Search', path: '/analytics/search' }],
    html: `<div class="space-y-5">
      ${pageHeader({ title: 'Search analytics', subtitle: range.label, actions: [ranger(rangeKey)] })}
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${kpi({ label: 'Searches', value: events.filter((e) => e.type === EVENTS.SEARCH).length, tone: 'ivory' })}
        ${kpi({ label: 'Unique terms', value: terms.length, tone: 'ivory' })}
        ${kpi({ label: 'Terms with no results', value: noResults.length, tone: noResults.length ? 'gold' : 'ivory', sub: 'Products customers wanted' })}
        ${kpi({ label: 'Top term', value: terms[0]?.term || '—', tone: 'ivory' })}
      </div>

      ${noResults.length ? card(`${sectionTitle('Searches that found nothing', 'The clearest signal of what to stock next')}
        <div class="flex flex-wrap gap-2">${noResults.slice(0, 20).map((t) => `
          <span class="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1.5 text-[12px] text-gold-light">
            ${esc(t.term)} <span class="text-sand/70">×${t.noResults}</span></span>`).join('')}</div>`, 'p-5') : ''}

      ${card(`${sectionTitle('All search terms')}
        ${table({
          columns: [
            { key: 'term', label: 'Term', render: (t) => `<span class="text-ivory">${esc(t.term)}</span>` },
            { key: 'count', label: 'Searches', align: 'right', render: (t) => `<span class="tabular-nums text-ivory">${t.count}</span>` },
            { key: 'withResults', label: 'With results', align: 'right', render: (t) => `<span class="tabular-nums text-success">${t.withResults}</span>` },
            { key: 'noResults', label: 'No results', align: 'right', render: (t) => `<span class="tabular-nums ${t.noResults ? 'text-danger' : 'text-sand'}">${t.noResults}</span>` },
            { key: 'lastAt', label: 'Last searched', align: 'right', render: (t) => `<span class="text-sand">${new Date(t.lastAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>` },
          ],
          rows: terms, empty: 'No searches recorded in this period.',
        })}`, 'p-5')}
    </div>`,
    onMount: wire,
  };
}
