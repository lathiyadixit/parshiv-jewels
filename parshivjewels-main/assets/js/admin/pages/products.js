/* Product list — search, filter, sort, bulk actions, row actions. */
import { $, $$, esc } from '../../core/dom.js';
import { href, setQuery, go, refresh } from '../core/adminRouter.js';
import { toast } from '../../core/toast.js';
import * as catalog from '../repositories/catalogRepo.js';
import { confirmAction } from '../components/modal.js';
import { pageHeader, table, statusBadge, badge, money, btn, searchInput, select, emptyState, cardList } from '../components/ui.js';

const SORTS = [
  { value: 'updated', label: 'Recently updated' }, { value: 'created', label: 'Newest' },
  { value: 'name', label: 'Name A–Z' }, { value: 'price-desc', label: 'Price high → low' },
  { value: 'price-asc', label: 'Price low → high' }, { value: 'stock-asc', label: 'Stock low → high' },
];

const thumb = (p) => {
  const img = (p.images || []).find((i) => i.primary) || (p.images || [])[0];
  return `<img src="${img ? esc(img.src) : ''}" alt="" loading="lazy" decoding="async"
    class="h-11 w-11 shrink-0 rounded-lg border border-line/10 bg-night object-cover" onerror="this.style.visibility='hidden'">`;
};

const flagChips = (p) => [
  p.featured ? badge('Featured', 'gold') : '',
  p.bestSeller ? badge('Best seller', 'green') : '',
  p.newArrival ? badge('New', 'blue') : '',
].filter(Boolean).join(' ') || '<span class="text-sand/40">—</span>';

export default async function productsPage({ query }) {
  const [all, categories, collections] = await Promise.all([
    catalog.listProducts(), catalog.listCategories(), catalog.listCollections(),
  ]);
  const rows = catalog.queryProducts(all, {
    search: query.q || '', category: query.category || '', collection: query.collection || '',
    status: query.status || '', stock: query.stock || '', featured: query.flag || '', sort: query.sort || 'updated',
  });

  const perPage = 20;
  const page = Math.max(1, Number(query.page) || 1);
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

  const columns = [
    { key: 'name', label: 'Product', nowrap: false, render: (p) => `
      <div class="flex items-center gap-3">${thumb(p)}
        <div class="min-w-0">
          <a href="${href(`/products/${p.id}`)}" class="block truncate font-medium text-ivory transition hover:text-gold-light">${esc(p.name)}</a>
          <span class="block truncate text-[11px] text-sand/70">${esc(p.sku)} · ${esc(p.material || '')}</span>
        </div>
      </div>` },
    { key: 'category', label: 'Category', render: (p) => `<span class="capitalize text-sand">${esc(p.category)}</span>` },
    { key: 'price', label: 'Price', align: 'right', render: (p) => `
      <span class="text-gold">${money(p.price)}</span>
      ${p.discount ? `<span class="ml-1.5 text-[11px] text-sand/60 line-through">${money(p.compareAt)}</span>` : ''}` },
    { key: 'inventory', label: 'Stock', align: 'right', render: (p) => `
      <span class="tabular-nums ${p.stockState === 'out-of-stock' ? 'text-danger' : p.stockState === 'low-stock' ? 'text-gold' : 'text-ivory'}">${p.inventory}</span>` },
    { key: 'stockState', label: 'Inventory', render: (p) => statusBadge(p.stockState) },
    { key: 'status', label: 'Status', render: (p) => statusBadge(p.status) },
    { key: 'flags', label: 'Flags', nowrap: false, render: flagChips },
    { key: 'actions', label: '', align: 'right', render: (p) => `
      <div class="flex justify-end gap-1">
        <a href="${href(`/products/${p.id}`)}" class="admin-icon-btn" title="Edit" aria-label="Edit ${esc(p.name)}">✎</a>
        <button type="button" data-duplicate="${p.id}" class="admin-icon-btn" title="Duplicate" aria-label="Duplicate ${esc(p.name)}">⧉</button>
        <button type="button" data-delete="${p.id}" data-name="${esc(p.name)}" class="admin-icon-btn hover:!text-danger" title="Delete" aria-label="Delete ${esc(p.name)}">✕</button>
      </div>` },
  ];

  const mobileCard = (p) => `
    <div class="rounded-2xl border border-line/10 bg-card p-4">
      <div class="flex gap-3">${thumb(p)}
        <div class="min-w-0 flex-1">
          <a href="${href(`/products/${p.id}`)}" class="block truncate font-medium text-ivory">${esc(p.name)}</a>
          <p class="truncate text-[11px] text-sand/70">${esc(p.sku)}</p>
          <p class="mt-1 text-[13px] text-gold">${money(p.price)}</p>
        </div>
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        ${statusBadge(p.status)}${statusBadge(p.stockState)}
        <span class="ml-auto text-[12px] text-sand">Stock ${p.inventory}</span>
      </div>
    </div>`;

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'Products', path: '/products' }],
    html: `
    <div class="space-y-5">
      ${pageHeader({
        title: 'Products',
        subtitle: `${rows.length} of ${all.length} products`,
        actions: [btn('Add product', { variant: 'gold', attrs: `onclick="location.hash='/products/new'"` })],
      })}

      <div class="rounded-2xl border border-line/10 bg-card p-4">
        <div class="flex flex-wrap items-center gap-2.5">
          ${searchInput('prodSearch', 'Search name, SKU, material…', query.q || '')}
          ${select({ id: 'fCategory', value: query.category || '', className: 'min-w-[140px]', options: [{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c.slug, label: c.name }))] })}
          ${select({ id: 'fCollection', value: query.collection || '', className: 'min-w-[150px]', options: [{ value: '', label: 'All collections' }, ...collections.map((c) => ({ value: c.slug, label: c.name }))] })}
          ${select({ id: 'fStatus', value: query.status || '', className: 'min-w-[120px]', options: [{ value: '', label: 'Any status' }, 'active', 'draft', 'archived'] })}
          ${select({ id: 'fStock', value: query.stock || '', className: 'min-w-[130px]', options: [{ value: '', label: 'Any stock' }, { value: 'in-stock', label: 'In stock' }, { value: 'low-stock', label: 'Low stock' }, { value: 'out-of-stock', label: 'Out of stock' }] })}
          ${select({ id: 'fFlag', value: query.flag || '', className: 'min-w-[130px]', options: [{ value: '', label: 'Any flag' }, { value: 'featured', label: 'Featured' }, { value: 'best-seller', label: 'Best seller' }, { value: 'new-arrival', label: 'New arrival' }] })}
          ${select({ id: 'fSort', value: query.sort || 'updated', className: 'min-w-[160px]', options: SORTS })}
          ${btn('Clear', { variant: 'ghost', size: 'sm', attrs: 'data-clear-filters' })}
        </div>
      </div>

      <div id="bulkBar" class="hidden items-center gap-3 rounded-2xl border border-gold/30 bg-gold/5 px-4 py-3">
        <span class="text-[12px] text-ivory"><span id="bulkCount">0</span> selected</span>
        <div class="ml-auto flex flex-wrap gap-2">
          ${btn('Activate', { size: 'sm', attrs: 'data-bulk="activate"' })}
          ${btn('Draft', { size: 'sm', attrs: 'data-bulk="draft"' })}
          ${btn('Feature', { size: 'sm', attrs: 'data-bulk="feature"' })}
          ${btn('Unfeature', { size: 'sm', attrs: 'data-bulk="unfeature"' })}
          ${btn('Delete', { variant: 'danger', size: 'sm', attrs: 'data-bulk="delete"' })}
        </div>
      </div>

      <div class="hidden lg:block">${table({ columns, rows: pageRows, selectable: true, empty: 'No products match those filters.' })}</div>
      <div class="lg:hidden">${cardList(pageRows, mobileCard, 'No products match those filters.')}</div>

      ${totalPages > 1 ? `
      <div class="flex items-center justify-between gap-4">
        <p class="text-[12px] text-sand">Page ${page} of ${totalPages}</p>
        <div class="flex gap-2">
          ${btn('Previous', { size: 'sm', attrs: `data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}` })}
          ${btn('Next', { size: 'sm', attrs: `data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}` })}
        </div>
      </div>` : ''}
    </div>`,
    onMount: (scope) => {
      const root = $('#adminMain');
      let timer;
      scope.on($('#prodSearch'), 'input', (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => setQuery({ q: e.target.value, page: '' }), 350);
      });
      const bind = (id, key) => scope.on($(`#${id}`), 'change', (e) => setQuery({ [key]: e.target.value, page: '' }));
      bind('fCategory', 'category'); bind('fCollection', 'collection'); bind('fStatus', 'status');
      bind('fStock', 'stock'); bind('fFlag', 'flag'); bind('fSort', 'sort');
      scope.delegate(root, 'click', '[data-clear-filters]', () => go('/products'));
      scope.delegate(root, 'click', '[data-page]', (e, el) => { if (!el.disabled) setQuery({ page: el.dataset.page }); });

      /* Selection + bulk actions */
      const selected = new Set();
      const sync = () => {
        $('#bulkCount').textContent = selected.size;
        $('#bulkBar').classList.toggle('hidden', selected.size === 0);
        $('#bulkBar').classList.toggle('flex', selected.size > 0);
      };
      scope.delegate(root, 'change', '[data-select]', (e, el) => {
        el.checked ? selected.add(el.dataset.select) : selected.delete(el.dataset.select);
        sync();
      });
      scope.delegate(root, 'change', '[data-select-all]', (e, el) => {
        selected.clear();
        $$('[data-select]', root).forEach((cb) => { cb.checked = el.checked; if (el.checked) selected.add(cb.dataset.select); });
        sync();
      });

      scope.delegate(root, 'click', '[data-bulk]', async (e, el) => {
        const ids = [...selected];
        if (!ids.length) return;
        const action = el.dataset.bulk;
        if (action === 'delete') {
          const ok = await confirmAction({
            title: `Delete ${ids.length} product${ids.length === 1 ? '' : 's'}?`,
            message: 'This removes them from the catalogue. It cannot be undone.',
            confirmLabel: `Delete ${ids.length}`,
          });
          if (!ok) return;
          await catalog.bulkDeleteProducts(ids);
          toast(`${ids.length} product${ids.length === 1 ? '' : 's'} deleted`, { tone: 'success' });
        } else {
          const patch = {
            activate: { status: 'active' }, draft: { status: 'draft' },
            feature: { featured: true }, unfeature: { featured: false },
          }[action];
          await catalog.bulkUpdateProducts(ids, patch);
          toast(`${ids.length} product${ids.length === 1 ? '' : 's'} updated`, { tone: 'success' });
        }
        refresh();
      });

      scope.delegate(root, 'click', '[data-duplicate]', async (e, el) => {
        const copy = await catalog.duplicateProduct(el.dataset.duplicate);
        toast('Duplicated as a draft', { tone: 'success' });
        go(`/products/${copy.id}`);
      });

      scope.delegate(root, 'click', '[data-delete]', async (e, el) => {
        const ok = await confirmAction({
          title: 'Delete product?',
          message: `“${el.dataset.name}” will be removed from the catalogue. This cannot be undone.`,
        });
        if (!ok) return;
        await catalog.deleteProduct(el.dataset.delete);
        toast('Product deleted', { tone: 'success' });
        refresh();
      });
    },
  };
}
