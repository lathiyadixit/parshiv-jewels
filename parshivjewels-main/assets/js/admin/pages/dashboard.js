/* Dashboard — the business at a glance for the chosen period. */
import { esc } from '../../core/dom.js';
import { toast } from '../../core/toast.js';
import { href, setQuery, refresh } from '../core/adminRouter.js';
import * as catalog from '../repositories/catalogRepo.js';
import * as commerce from '../repositories/commerceRepo.js';
import * as A from '../repositories/analyticsRepo.js';
import { collectAlerts, dismissAlert, dismissAllAlerts } from '../repositories/alertsRepo.js';
import { EVENTS } from '../../services/analyticsService.js';
import { kpi, card, sectionTitle, table, badge, statusBadge, money, emptyState, btn } from '../components/ui.js';
import { lineChart, barChart, donutChart, funnelChart } from '../components/charts.js';

const RANGE_KEYS = ['today', 'yesterday', '7d', '30d', '90d', 'year', 'all'];

function rangePicker(active, custom) {
  return `<div class="flex flex-wrap items-center gap-2">
    ${RANGE_KEYS.map((key) => `<button type="button" data-range="${key}"
      class="rounded-full border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.12em] transition ${
        active === key ? 'border-gold bg-gold/10 text-gold-light' : 'border-line/15 text-sand hover:border-gold/50 hover:text-ivory'
      }">${esc(A.RANGES[key].label)}</button>`).join('')}
    <span class="flex items-center gap-1.5 rounded-full border ${active === 'custom' ? 'border-gold' : 'border-line/15'} px-3 py-1">
      <input type="date" data-custom-from value="${esc(custom.from || '')}" class="admin-date" aria-label="From date">
      <span class="text-sand/50">→</span>
      <input type="date" data-custom-to value="${esc(custom.to || '')}" class="admin-date" aria-label="To date">
    </span>
  </div>`;
}

export default async function dashboardPage({ query }) {
  const rangeKey = query.range || '30d';
  const custom = { from: query.from, to: query.to };
  const range = A.resolveRange(rangeKey, {
    from: custom.from ? new Date(custom.from) : null,
    to: custom.to ? new Date(custom.to) : null,
  });

  const [products, categories, collections, enquiries, orders, alerts] = await Promise.all([
    catalog.listProducts(), catalog.listCategories(), catalog.listCollections(),
    commerce.listEnquiries(), commerce.listOrders(), collectAlerts(),
  ]);

  const events = A.allEvents();
  const now = A.inRange(events, range);
  const before = A.inRange(events, A.previousRange(range));
  const stats = A.summarise(now);
  const prev = A.summarise(before);

  const perf = A.productPerformance(now, products);
  const mostViewed = perf[0];
  const bestSelling = [...perf].sort((a, b) => b.enquiries - a.enquiries || b.adds - a.adds)[0];

  const confirmedValue = orders
    .filter((o) => !['cancelled'].includes(o.status))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const active = products.filter((p) => p.status === 'active');
  const t = (cur, old) => A.trend(cur, old);

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }],
    html: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="font-display text-3xl font-semibold text-ivory sm:text-4xl">Dashboard</h1>
          <p class="mt-2 text-[13px] text-sand">${esc(range.label)} · ${range.from.toLocaleDateString('en-IN')} – ${range.to.toLocaleDateString('en-IN')}</p>
        </div>
        ${rangePicker(rangeKey, custom)}
      </div>

      ${alerts.items.length ? `
      <div class="rounded-2xl border border-gold/25 bg-gold/5 p-4">
        <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span class="text-[11px] uppercase tracking-[0.18em] text-gold">Needs attention</span>
          ${alerts.items.map((a) => `
            <span class="group inline-flex items-center gap-1.5">
              <a href="${href(a.path)}" class="text-[13px] text-ivory transition hover:text-gold-light">
                <span class="font-semibold text-gold">${a.count}</span> ${esc(a.label)}</a>
              <button type="button" data-dismiss-alert="${esc(a.id)}" data-count="${a.count}"
                class="rounded-md px-1 text-[11px] leading-none text-sand/50 transition hover:text-danger"
                title="Dismiss" aria-label="Dismiss ${esc(a.label)}">✕</button>
            </span>`).join('')}
          <button type="button" data-dismiss-all
            class="ml-auto rounded-full border border-gold/30 px-3.5 py-1 text-[10px] uppercase tracking-[0.12em] text-gold-light transition hover:bg-gold/10">Clear all</button>
        </div>
      </div>` : ''}

      <!-- Website activity -->
      <div>
        <p class="mb-3 text-[10px] uppercase tracking-[0.22em] text-sand/60">Website activity · ${esc(range.label)}</p>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          ${kpi({ label: 'Visitors', value: stats.visitors, trend: t(stats.visitors, prev.visitors), sub: `${stats.sessions} sessions`, tone: 'ivory' })}
          ${kpi({ label: 'Product views', value: stats.productViews, trend: t(stats.productViews, prev.productViews), tone: 'ivory' })}
          ${kpi({ label: 'Cart additions', value: stats.addToCart, trend: t(stats.addToCart, prev.addToCart), sub: `${stats.addToCartRate}% of views` })}
          ${kpi({ label: 'WhatsApp enquiries', value: stats.whatsappClicks, trend: t(stats.whatsappClicks, prev.whatsappClicks), sub: `${stats.conversionRate}% of views` })}
        </div>
      </div>

      <!-- Value -->
      <div>
        <p class="mb-3 text-[10px] uppercase tracking-[0.22em] text-sand/60">Value</p>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          ${kpi({ label: 'Estimated enquiry value', value: money(stats.enquiryValue), trend: t(stats.enquiryValue, prev.enquiryValue), sub: 'Website activity — not confirmed' })}
          ${kpi({ label: 'Average enquiry value', value: money(stats.avgEnquiryValue), trend: t(stats.avgEnquiryValue, prev.avgEnquiryValue) })}
          ${kpi({ label: 'Confirmed order value', value: money(confirmedValue), sub: `${orders.length} order${orders.length === 1 ? '' : 's'} recorded by you`, tone: 'ivory' })}
          ${kpi({ label: 'Enquiries logged', value: enquiries.length, sub: `${enquiries.filter((e) => e.status === 'new').length} new`, tone: 'ivory', href: href('/enquiries') })}
        </div>
      </div>

      <!-- Catalogue -->
      <div>
        <p class="mb-3 text-[10px] uppercase tracking-[0.22em] text-sand/60">Catalogue</p>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          ${kpi({ label: 'Total products', value: products.length, sub: `${active.length} active · ${products.length - active.length} draft/archived`, tone: 'ivory', href: href('/products') })}
          ${kpi({ label: 'Out of stock', value: alerts.outOfStock.length, tone: alerts.outOfStock.length ? 'gold' : 'ivory', sub: 'Active products', href: href('/inventory?stock=out-of-stock') })}
          ${kpi({ label: 'Low stock', value: alerts.lowStock.length, tone: alerts.lowStock.length ? 'gold' : 'ivory', sub: 'At or below threshold', href: href('/inventory?stock=low-stock') })}
          ${kpi({ label: 'Categories & collections', value: `${categories.length} / ${collections.length}`, tone: 'ivory' })}
        </div>
      </div>

      <div class="grid gap-5 xl:grid-cols-3">
        ${card(`${sectionTitle('Activity over time', 'Product views, cart additions and WhatsApp enquiries')}
          <div class="mb-4 flex flex-wrap gap-2">
            <button type="button" data-series="${EVENTS.PRODUCT_VIEW}" class="chart-tab chart-tab-on">Views</button>
            <button type="button" data-series="${EVENTS.ADD_TO_CART}" class="chart-tab">Cart adds</button>
            <button type="button" data-series="${EVENTS.WHATSAPP_CLICK}" class="chart-tab">Enquiries</button>
          </div>
          <div id="dashSeries">${lineChart(A.timeSeries(now, range, EVENTS.PRODUCT_VIEW), { id: 'ds' })}</div>`, 'p-5 xl:col-span-2')}

        ${card(`${sectionTitle('Conversion funnel')}${funnelChart(A.funnel(now))}`, 'p-5')}
      </div>

      <div class="grid gap-5 xl:grid-cols-3">
        ${card(`${sectionTitle('Estimated enquiry value', 'Cart value at the moment WhatsApp was opened')}
          ${lineChart(A.valueSeries(now, range, EVENTS.WHATSAPP_CLICK, 'value'), { id: 'dv', format: (v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}` })}`, 'p-5 xl:col-span-2')}
        ${card(`${sectionTitle('Devices')}${donutChart(A.breakdown(now, 'device'))}`, 'p-5')}
      </div>

      <div class="grid gap-5 xl:grid-cols-2">
        ${card(`${sectionTitle('Most viewed products')}
          ${barChart(perf.slice(0, 6).filter((p) => p.views).map((p) => ({ label: p.name, value: p.views })))}
          ${mostViewed?.views ? `<p class="mt-4 border-t border-line/10 pt-3 text-[12px] text-sand">Top: <span class="text-ivory">${esc(mostViewed.name)}</span> — ${mostViewed.views} views, ${mostViewed.adds} cart adds</p>` : ''}`, 'p-5')}
        ${card(`${sectionTitle('Category performance', 'Views across products in each category')}
          ${barChart(A.groupPerformance(perf, (p) => p.category).slice(0, 6).map((g) => ({ label: g.key, value: g.views })))}`, 'p-5')}
      </div>

      <div class="grid gap-5 xl:grid-cols-2">
        ${card(`${sectionTitle('Needs restocking')}
          ${[...alerts.outOfStock, ...alerts.lowStock].length
            ? table({
                columns: [
                  { key: 'name', label: 'Product', render: (r) => `<a href="${href(`/products/${r.id}`)}" class="text-ivory transition hover:text-gold-light">${esc(r.name)}</a>` },
                  { key: 'sku', label: 'SKU', render: (r) => `<span class="text-sand">${esc(r.sku)}</span>` },
                  { key: 'inventory', label: 'Stock', align: 'right', render: (r) => `<span class="tabular-nums">${r.inventory}</span>` },
                  { key: 'stockState', label: 'Status', align: 'right', render: (r) => statusBadge(r.stockState) },
                ],
                rows: [...alerts.outOfStock, ...alerts.lowStock].slice(0, 8),
              })
            : emptyState({ title: 'Everything is in stock', message: 'No active product is at or below its low-stock threshold.', icon: '✓' })}`, 'p-5')}

        ${card(`${sectionTitle('Latest enquiries')}
          ${enquiries.length
            ? table({
                columns: [
                  { key: 'at', label: 'When', render: (r) => `<span class="text-sand">${new Date(r.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>` },
                  { key: 'itemCount', label: 'Items', align: 'right' },
                  { key: 'value', label: 'Value', align: 'right', render: (r) => `<span class="text-gold">${money(r.value)}</span>` },
                  { key: 'status', label: 'Status', align: 'right', render: (r) => statusBadge(r.status) },
                ],
                rows: enquiries.slice(0, 8),
              })
            : emptyState({
                title: 'No enquiries yet',
                message: 'When a customer taps “Proceed to WhatsApp” on the storefront, it will appear here.',
                action: btn('Open storefront', { variant: 'line', size: 'sm', attrs: 'data-open-store' }),
              })}`, 'p-5')}
      </div>

      <p class="pt-2 text-center text-[11px] text-sand/60">
        Website activity is measured from this browser's event log. Confirmed order value comes only from orders you record.
      </p>
    </div>`,
    onMount: (scope) => {
      const root = document.getElementById('adminMain');
      scope.delegate(root, 'click', '[data-range]', (e, el) => setQuery({ range: el.dataset.range, from: '', to: '' }));
      scope.delegate(root, 'change', '[data-custom-from],[data-custom-to]', () => {
        const from = root.querySelector('[data-custom-from]').value;
        const to = root.querySelector('[data-custom-to]').value;
        if (from && to) setQuery({ range: 'custom', from, to });
      });
      scope.delegate(root, 'click', '[data-open-store]', () => window.open('/', '_blank', 'noopener'));

      scope.delegate(root, 'click', '[data-dismiss-alert]', async (e, el) => {
        await dismissAlert(el.dataset.dismissAlert, el.dataset.count);
        refresh();
      });
      scope.delegate(root, 'click', '[data-dismiss-all]', async () => {
        const n = await dismissAllAlerts(alerts.items);
        toast(`${n} alert${n === 1 ? '' : 's'} cleared`);
        refresh();
      });
      scope.delegate(root, 'click', '[data-series]', (e, el) => {
        root.querySelectorAll('[data-series]').forEach((b) => b.classList.remove('chart-tab-on'));
        el.classList.add('chart-tab-on');
        root.querySelector('#dashSeries').innerHTML = lineChart(A.timeSeries(now, range, el.dataset.series), { id: 'ds' });
      });
    },
  };
}
