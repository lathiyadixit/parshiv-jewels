/* Inventory — stock levels, bulk adjustment and an audit trail. */
import { $, $$, esc } from '../../core/dom.js';
import { setQuery, refresh, href } from '../core/adminRouter.js';
import { toast } from '../../core/toast.js';
import * as catalog from '../repositories/catalogRepo.js';
import { pageHeader, table, statusBadge, btn, searchInput, select, kpi, card, sectionTitle, emptyState, money } from '../components/ui.js';

export default async function inventoryPage({ query }) {
  const [products, log] = await Promise.all([catalog.listProducts(), catalog.listInventoryLog()]);
  let rows = products.filter((p) => p.status !== 'archived');

  if (query.q) {
    const q = query.q.toLowerCase();
    rows = rows.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(q));
  }
  if (query.stock) rows = rows.filter((p) => p.stockState === query.stock);
  if (query.category) rows = rows.filter((p) => p.category === query.category);
  rows.sort((a, b) => a.inventory - b.inventory);

  const out = products.filter((p) => p.stockState === 'out-of-stock').length;
  const low = products.filter((p) => p.stockState === 'low-stock').length;
  const stockValue = products.reduce((sum, p) => sum + p.inventory * (p.costPrice || 0), 0);
  const retailValue = products.reduce((sum, p) => sum + p.inventory * p.price, 0);

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'Inventory', path: '/inventory' }],
    html: `<div class="space-y-5">
      ${pageHeader({ title: 'Inventory', subtitle: `${rows.length} products shown`, actions: [btn('Save all changes', { variant: 'gold', attrs: 'data-save-all' })] })}

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${kpi({ label: 'Out of stock', value: out, tone: out ? 'gold' : 'ivory' })}
        ${kpi({ label: 'Low stock', value: low, tone: low ? 'gold' : 'ivory' })}
        ${kpi({ label: 'Units on hand', value: products.reduce((s, p) => s + p.inventory, 0), tone: 'ivory' })}
        ${kpi({ label: 'Stock value (retail)', value: money(retailValue), sub: `Cost ${money(stockValue)}` })}
      </div>

      <div class="rounded-2xl border border-line/10 bg-card p-4">
        <div class="flex flex-wrap items-center gap-2.5">
          ${searchInput('invSearch', 'Search product or SKU…', query.q || '')}
          ${select({ id: 'invStock', value: query.stock || '', className: 'min-w-[150px]', options: [
            { value: '', label: 'All stock states' }, { value: 'in-stock', label: 'In stock' },
            { value: 'low-stock', label: 'Low stock' }, { value: 'out-of-stock', label: 'Out of stock' }] })}
          ${btn('Clear', { variant: 'ghost', size: 'sm', attrs: 'data-clear' })}
        </div>
      </div>

      ${table({
        columns: [
          { key: 'name', label: 'Product', nowrap: false, render: (p) => `<div class="min-w-0">
              <a href="${href(`/products/${p.id}`)}" class="block truncate font-medium text-ivory transition hover:text-gold-light">${esc(p.name)}</a>
              <span class="block truncate text-[11px] text-sand/70">${esc(p.sku)}</span></div>` },
          { key: 'variants', label: 'Variants', align: 'right', render: (p) => `<span class="text-sand">${(p.variants || []).length || '—'}</span>` },
          { key: 'lowStockThreshold', label: 'Threshold', align: 'right', render: (p) => `<span class="tabular-nums text-sand">${p.lowStockThreshold}</span>` },
          { key: 'inventory', label: 'Stock', align: 'right', width: '150px', render: (p) => `
              <div class="flex items-center justify-end gap-1.5">
                <button type="button" data-step="-1" data-id="${p.id}" class="admin-icon-btn" aria-label="Decrease">−</button>
                <input type="number" min="0" value="${p.inventory}" data-stock="${p.id}" data-original="${p.inventory}"
                  class="admin-input w-[68px] !px-2 !py-1.5 text-center !text-[13px] tabular-nums">
                <button type="button" data-step="1" data-id="${p.id}" class="admin-icon-btn" aria-label="Increase">+</button>
              </div>` },
          { key: 'stockState', label: 'Status', align: 'right', render: (p) => `<span data-state-for="${p.id}">${statusBadge(p.stockState)}</span>` },
          { key: 'updatedAt', label: 'Last updated', align: 'right', render: (p) => `<span class="text-[11px] text-sand/70">${new Date(p.updatedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>` },
        ],
        rows, empty: 'No products match those filters.',
      })}

      ${card(`${sectionTitle('Recent stock changes', 'Every adjustment is recorded')}
        ${log.length
          ? table({
              columns: [
                { key: 'createdAt', label: 'When', render: (r) => `<span class="text-sand">${new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>` },
                { key: 'productName', label: 'Product', render: (r) => `<span class="text-ivory">${esc(r.productName)}</span>` },
                { key: 'delta', label: 'Change', align: 'right', render: (r) => `<span class="${r.delta > 0 ? 'text-success' : 'text-danger'} tabular-nums">${r.delta > 0 ? '+' : ''}${r.delta}</span>` },
                { key: 'to', label: 'New level', align: 'right', render: (r) => `<span class="tabular-nums text-ivory">${r.to}</span>` },
                { key: 'reason', label: 'Reason', nowrap: false, render: (r) => `<span class="text-sand">${esc(r.reason)}</span>` },
              ],
              rows: [...log].reverse().slice(0, 12),
            })
          : emptyState({ title: 'No changes recorded yet', message: 'Stock adjustments made here will be listed for audit.' })}`, 'p-5')}
    </div>`,
    onMount: (scope) => {
      const root = $('#adminMain');
      let timer;
      scope.on($('#invSearch'), 'input', (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => setQuery({ q: e.target.value }), 350);
      });
      scope.on($('#invStock'), 'change', (e) => setQuery({ stock: e.target.value }));
      scope.delegate(root, 'click', '[data-clear]', () => setQuery({ q: '', stock: '', category: '' }));

      const previewState = (input) => {
        const product = products.find((p) => p.id === input.dataset.stock);
        const qty = Math.max(0, Number(input.value) || 0);
        const state = qty <= 0 ? 'out-of-stock' : qty <= product.lowStockThreshold ? 'low-stock' : 'in-stock';
        const cell = root.querySelector(`[data-state-for="${product.id}"]`);
        if (cell) cell.innerHTML = statusBadge(state);
        input.classList.toggle('!border-gold/60', String(qty) !== input.dataset.original);
      };

      scope.delegate(root, 'click', '[data-step]', (e, el) => {
        const input = root.querySelector(`[data-stock="${el.dataset.id}"]`);
        input.value = Math.max(0, (Number(input.value) || 0) + Number(el.dataset.step));
        previewState(input);
      });
      scope.delegate(root, 'input', '[data-stock]', (e, el) => previewState(el));

      scope.delegate(root, 'click', '[data-save-all]', async () => {
        const changed = $$('[data-stock]', root)
          .filter((i) => String(Math.max(0, Number(i.value) || 0)) !== i.dataset.original)
          .map((i) => ({ id: i.dataset.stock, quantity: Math.max(0, Number(i.value) || 0) }));
        if (!changed.length) { toast('No stock changes to save'); return; }
        await catalog.bulkSetInventory(changed, 'Inventory screen');
        toast(`${changed.length} product${changed.length === 1 ? '' : 's'} updated`, { tone: 'success' });
        refresh();
      });
    },
  };
}
