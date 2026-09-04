/* Orders and customers — the record of what actually sold. */
import { $, esc } from '../../core/dom.js';
import { setQuery, refresh } from '../core/adminRouter.js';
import { toast } from '../../core/toast.js';
import * as commerce from '../repositories/commerceRepo.js';
import * as catalog from '../repositories/catalogRepo.js';
import { confirmAction, openModal, closeModal } from '../components/modal.js';
import { pageHeader, table, statusBadge, btn, searchInput, select, kpi, money, emptyState, field, textarea, cardList } from '../components/ui.js';

const STATUS_OPTIONS = commerce.ORDER_STATUSES.map((s) => ({ value: s, label: s }));

/* ─────────────── Orders ─────────────── */

export async function ordersPage({ query }) {
  const [all, products] = await Promise.all([commerce.listOrders(), catalog.listProducts()]);
  let rows = all.slice().sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
  if (query.q) {
    const q = query.q.toLowerCase();
    rows = rows.filter((o) => `${o.orderNumber} ${o.customerName} ${o.phone}`.toLowerCase().includes(q));
  }
  if (query.status) rows = rows.filter((o) => o.status === query.status);

  const live = all.filter((o) => o.status !== 'cancelled');
  const revenue = live.reduce((s, o) => s + (o.total || 0), 0);

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'Orders', path: '/orders' }],
    html: `<div class="space-y-5">
      ${pageHeader({ title: 'Orders', subtitle: `${rows.length} of ${all.length} orders`, actions: [btn('Record order', { variant: 'gold', attrs: 'data-new' })] })}

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${kpi({ label: 'Confirmed revenue', value: money(revenue), sub: 'Excludes cancelled' })}
        ${kpi({ label: 'Orders', value: live.length, tone: 'ivory' })}
        ${kpi({ label: 'Average order value', value: money(live.length ? revenue / live.length : 0) })}
        ${kpi({ label: 'Awaiting action', value: all.filter((o) => ['pending', 'confirmed', 'processing'].includes(o.status)).length, tone: 'ivory' })}
      </div>

      <div class="rounded-2xl border border-line/10 bg-card p-4">
        <div class="flex flex-wrap items-center gap-2.5">
          ${searchInput('ordSearch', 'Search order, customer, phone…', query.q || '')}
          ${select({ id: 'ordStatus', value: query.status || '', className: 'min-w-[150px]', options: [{ value: '', label: 'Any status' }, ...STATUS_OPTIONS] })}
          ${btn('Clear', { variant: 'ghost', size: 'sm', attrs: 'data-clear' })}
        </div>
      </div>

      ${all.length === 0
        ? emptyState({
            title: 'No orders recorded yet',
            message: 'Convert a WhatsApp enquiry once it becomes a real sale, or record an order directly.',
            action: btn('Record order', { variant: 'gold', size: 'sm', attrs: 'data-new' }),
          })
        : `<div class="hidden lg:block">${table({
            columns: [
              { key: 'orderNumber', label: 'Order', render: (o) => `<button type="button" data-open="${o.id}" class="font-medium text-ivory transition hover:text-gold-light">${esc(o.orderNumber)}</button>` },
              { key: 'placedAt', label: 'Date', render: (o) => `<span class="text-sand">${new Date(o.placedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>` },
              { key: 'customerName', label: 'Customer', render: (o) => `<div><span class="text-ivory">${esc(o.customerName)}</span><span class="block text-[11px] text-sand/70">${esc(o.phone || '—')}</span></div>` },
              { key: 'items', label: 'Items', align: 'right', render: (o) => `<span class="tabular-nums text-sand">${(o.items || []).reduce((s, i) => s + (i.qty || 0), 0)}</span>` },
              { key: 'total', label: 'Total', align: 'right', render: (o) => `<span class="text-gold">${money(o.total)}</span>` },
              { key: 'status', label: 'Status', render: (o) => statusBadge(o.status) },
              { key: 'actions', label: '', align: 'right', render: (o) => `<button type="button" data-open="${o.id}" class="admin-icon-btn" aria-label="Open order">›</button>` },
            ],
            rows, empty: 'No orders match those filters.',
          })}</div>
          <div class="lg:hidden">${cardList(rows, (o) => `
            <div class="rounded-2xl border border-line/10 bg-card p-4">
              <div class="flex items-start justify-between gap-3">
                <div><p class="font-medium text-ivory">${esc(o.orderNumber)}</p>
                  <p class="text-[11px] text-sand/70">${esc(o.customerName)} · ${new Date(o.placedAt).toLocaleDateString('en-IN')}</p></div>
                ${statusBadge(o.status)}
              </div>
              <p class="mt-2 text-[15px] text-gold">${money(o.total)}</p>
              <button type="button" data-open="${o.id}" class="btn-line btn-compact mt-3 w-full">Open</button>
            </div>`, 'No orders match those filters.')}</div>`}
    </div>`,

    onMount: (scope) => {
      const root = $('#adminMain');
      let timer;
      scope.on($('#ordSearch'), 'input', (e) => { clearTimeout(timer); timer = setTimeout(() => setQuery({ q: e.target.value }), 350); });
      scope.on($('#ordStatus'), 'change', (e) => setQuery({ status: e.target.value }));
      scope.delegate(root, 'click', '[data-clear]', () => setQuery({ q: '', status: '' }));
      scope.delegate(root, 'click', '[data-new]', () => openOrderEditor(null, products));
      scope.delegate(root, 'click', '[data-open]', async (e, el) => {
        const order = await commerce.getOrder(el.dataset.open);
        openOrderEditor(order, products);
      });
    },
  };
}

function lineRow(item, i) {
  return `<div class="grid items-end gap-2 rounded-xl border border-line/10 bg-night/40 p-3 sm:grid-cols-[2fr_1fr_0.8fr_auto]" data-line="${i}">
    <div><label class="mb-1 block text-[10px] uppercase tracking-[0.14em] text-sand/70">Product</label>
      <input value="${esc(item.name || '')}" data-l="name" class="admin-input !py-2 !text-[13px]"></div>
    <div><label class="mb-1 block text-[10px] uppercase tracking-[0.14em] text-sand/70">Unit price</label>
      <input type="number" min="0" value="${item.price || 0}" data-l="price" class="admin-input !py-2 !text-[13px]"></div>
    <div><label class="mb-1 block text-[10px] uppercase tracking-[0.14em] text-sand/70">Qty</label>
      <input type="number" min="1" value="${item.qty || 1}" data-l="qty" class="admin-input !py-2 !text-[13px]"></div>
    <button type="button" data-remove-line="${i}" class="admin-icon-btn mb-1 hover:!text-danger" aria-label="Remove line">✕</button>
  </div>`;
}

function openOrderEditor(order, products) {
  const isNew = !order;
  const draft = order
    ? JSON.parse(JSON.stringify(order))
    : { customerName: '', phone: '', items: [], discount: 0, shipping: 0, taxRate: 0, notes: '', status: 'pending', source: 'whatsapp' };

  const modal = openModal({
    title: isNew ? 'Record order' : `Order ${order.orderNumber}`, size: 'max-w-2xl',
    body: `<div class="space-y-5">
      <div class="grid gap-4 sm:grid-cols-2">
        ${field({ id: 'orName', label: 'Customer name', value: draft.customerName, required: true })}
        ${field({ id: 'orPhone', label: 'Phone', value: draft.phone, required: true })}
      </div>
      <div>
        <p class="mb-2 text-[11px] uppercase tracking-[0.16em] text-sand">Items</p>
        <div id="orLines" class="space-y-2.5"></div>
        <div class="mt-3 flex flex-wrap gap-2">
          ${btn('Add line', { size: 'sm', attrs: 'data-add-line' })}
          <select id="orPick" class="admin-input admin-select max-w-[240px] !py-2 !text-[12px]">
            <option value="">Add from catalogue…</option>
            ${products.map((p) => `<option value="${p.id}">${esc(p.name)} — ₹${p.price}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="grid gap-4 sm:grid-cols-3">
        ${field({ id: 'orDiscount', label: 'Discount (₹)', value: draft.discount, type: 'number', attrs: 'min="0"' })}
        ${field({ id: 'orShipping', label: 'Shipping (₹)', value: draft.shipping, type: 'number', attrs: 'min="0"' })}
        ${select({ id: 'orStatus', label: 'Status', value: draft.status, options: STATUS_OPTIONS })}
      </div>
      ${textarea({ id: 'orNotes', label: 'Notes', value: draft.notes, rows: 2 })}
      <div id="orTotals" class="rounded-xl border border-line/10 bg-night/40 p-4 text-[13px]"></div>
    </div>`,
    footer: `<div class="flex flex-wrap justify-end gap-3">
      ${!isNew ? btn('Delete', { variant: 'danger', size: 'sm', attrs: 'data-delete' }) : ''}
      <span class="flex-1"></span>
      ${btn('Cancel', { variant: 'ghost', size: 'sm', attrs: 'data-modal-close' })}
      ${btn(isNew ? 'Create order' : 'Save', { variant: 'gold', size: 'sm', attrs: 'data-save' })}
    </div>`,
  });

  const renderLines = () => {
    modal.querySelector('#orLines').innerHTML = draft.items.length
      ? draft.items.map(lineRow).join('')
      : '<p class="rounded-xl border border-dashed border-line/15 px-4 py-6 text-center text-[13px] text-sand/70">No items yet.</p>';
    renderTotals();
  };
  const renderTotals = () => {
    const t = commerce.orderTotals({
      items: draft.items,
      discount: Number(modal.querySelector('#orDiscount').value) || 0,
      shipping: Number(modal.querySelector('#orShipping').value) || 0,
      taxRate: draft.taxRate || 0,
    });
    modal.querySelector('#orTotals').innerHTML = `
      <div class="flex justify-between"><span class="text-sand">Subtotal</span><span class="text-ivory">${money(t.subtotal)}</span></div>
      ${t.discount ? `<div class="mt-1 flex justify-between"><span class="text-sand">Discount</span><span class="text-success">−${money(t.discount)}</span></div>` : ''}
      ${t.shipping ? `<div class="mt-1 flex justify-between"><span class="text-sand">Shipping</span><span class="text-ivory">${money(t.shipping)}</span></div>` : ''}
      <div class="mt-2 flex justify-between border-t border-line/10 pt-2 text-[15px]"><span class="text-ivory">Total</span><span class="text-gold">${money(t.total)}</span></div>`;
  };

  modal.addEventListener('input', (e) => {
    const cell = e.target.closest('[data-l]');
    if (cell) {
      const i = Number(cell.closest('[data-line]').dataset.line);
      const key = cell.dataset.l;
      draft.items[i][key] = key === 'name' ? cell.value : Number(cell.value) || 0;
      renderTotals();
      return;
    }
    if (e.target.matches('#orDiscount, #orShipping')) renderTotals();
  });
  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-add-line]')) { draft.items.push({ name: '', price: 0, qty: 1 }); renderLines(); }
    const rm = e.target.closest('[data-remove-line]');
    if (rm) { draft.items.splice(Number(rm.dataset.removeLine), 1); renderLines(); }
  });
  modal.querySelector('#orPick').addEventListener('change', (e) => {
    const p = products.find((x) => x.id === e.target.value);
    if (!p) return;
    draft.items.push({ name: p.name, sku: p.sku, price: p.price, qty: 1 });
    e.target.value = '';
    renderLines();
  });

  modal.querySelector('[data-save]').addEventListener('click', async () => {
    const payload = {
      customerName: modal.querySelector('#orName').value.trim(),
      phone: modal.querySelector('#orPhone').value.trim(),
      items: draft.items.filter((i) => i.name.trim()),
      discount: Number(modal.querySelector('#orDiscount').value) || 0,
      shipping: Number(modal.querySelector('#orShipping').value) || 0,
      taxRate: draft.taxRate || 0,
      status: modal.querySelector('#orStatus').value,
      notes: modal.querySelector('#orNotes').value.trim(),
    };
    if (!payload.customerName || !payload.phone) { toast('Customer name and phone are required', { tone: 'error' }); return; }
    if (!payload.items.length) { toast('Add at least one item', { tone: 'error' }); return; }
    if (isNew) {
      const created = await commerce.createOrder(payload);
      await commerce.upsertCustomerFrom(created);
      toast(`Order ${created.orderNumber} created`, { tone: 'success' });
    } else {
      await commerce.updateOrder(order.id, payload);
      toast('Order updated', { tone: 'success' });
    }
    closeModal(); refresh();
  });
  modal.querySelector('[data-delete]')?.addEventListener('click', async () => {
    const ok = await confirmAction({ title: 'Delete order?', message: `${order.orderNumber} will be removed permanently.` });
    if (!ok) return;
    await commerce.deleteOrder(order.id);
    closeModal(); toast('Order deleted', { tone: 'success' }); refresh();
  });

  renderLines();
}

/* ─────────────── Customers ─────────────── */

export async function customersPage({ query }) {
  const all = await commerce.listCustomers();
  let rows = all.slice().sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0));
  if (query.q) {
    const q = query.q.toLowerCase();
    rows = rows.filter((c) => `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(q));
  }

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'Customers', path: '/customers' }],
    html: `<div class="space-y-5">
      ${pageHeader({ title: 'Customers', subtitle: `${rows.length} customers` })}
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${kpi({ label: 'Customers', value: all.length, tone: 'ivory' })}
        ${kpi({ label: 'Total confirmed value', value: money(all.reduce((s, c) => s + (c.totalValue || 0), 0)) })}
        ${kpi({ label: 'Repeat customers', value: all.filter((c) => (c.orderCount || 0) > 1).length, tone: 'ivory' })}
        ${kpi({ label: 'Average customer value', value: money(all.length ? all.reduce((s, c) => s + (c.totalValue || 0), 0) / all.length : 0) })}
      </div>
      <div class="rounded-2xl border border-line/10 bg-card p-4">${searchInput('custSearch', 'Search name or phone…', query.q || '')}</div>
      ${all.length === 0
        ? emptyState({ title: 'No customers yet', message: 'A customer record is created when you convert an enquiry or record an order with a phone number.' })
        : table({
            columns: [
              { key: 'name', label: 'Customer', render: (c) => `<div><span class="text-ivory">${esc(c.name)}</span><span class="block text-[11px] text-sand/70">${esc(c.phone)}</span></div>` },
              { key: 'enquiryCount', label: 'Enquiries', align: 'right', render: (c) => `<span class="tabular-nums text-sand">${c.enquiryCount || 0}</span>` },
              { key: 'orderCount', label: 'Orders', align: 'right', render: (c) => `<span class="tabular-nums text-ivory">${c.orderCount || 0}</span>` },
              { key: 'totalValue', label: 'Confirmed value', align: 'right', render: (c) => `<span class="text-gold">${money(c.totalValue)}</span>` },
              { key: 'lastOrderAt', label: 'Last order', align: 'right', render: (c) => `<span class="text-sand">${c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}</span>` },
            ],
            rows, empty: 'No customers match that search.',
          })}
    </div>`,
    onMount: (scope) => {
      let timer;
      scope.on($('#custSearch'), 'input', (e) => { clearTimeout(timer); timer = setTimeout(() => setQuery({ q: e.target.value }), 350); });
    },
  };
}
