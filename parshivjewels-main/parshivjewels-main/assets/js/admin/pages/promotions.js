/* Coupons and reviews. */
import { $, esc } from '../../core/dom.js';
import { setQuery, refresh } from '../core/adminRouter.js';
import { toast } from '../../core/toast.js';
import * as commerce from '../repositories/commerceRepo.js';
import * as catalog from '../repositories/catalogRepo.js';
import { confirmAction, openModal, closeModal } from '../components/modal.js';
import { pageHeader, table, statusBadge, badge, btn, searchInput, select, kpi, money, emptyState, field, textarea } from '../components/ui.js';
import { stars } from '../../core/format.js';

/* ─────────────── Coupons ─────────────── */

export async function couponsPage() {
  const [rows, collections] = await Promise.all([commerce.listCoupons(), catalog.listCollections()]);
  const decorated = rows.map((c) => ({ ...c, state: commerce.couponState(c) }));

  const editor = (coupon = {}) => {
    const isNew = !coupon.id;
    const modal = openModal({
      title: isNew ? 'New coupon' : `Edit ${coupon.code}`, size: 'max-w-2xl',
      body: `<div class="grid gap-4 sm:grid-cols-2">
        ${field({ id: 'cpCode', label: 'Code', value: coupon.code || '', required: true, hint: 'Shoppers type this at checkout. Case-insensitive.' })}
        ${select({ id: 'cpType', label: 'Discount type', value: coupon.type || 'percent', options: [{ value: 'percent', label: 'Percentage off' }, { value: 'flat', label: 'Fixed amount off' }] })}
        ${field({ id: 'cpValue', label: 'Value', value: coupon.value ?? 10, type: 'number', attrs: 'min="0" step="1"', required: true })}
        ${field({ id: 'cpMin', label: 'Minimum cart value (₹)', value: coupon.minSubtotal || 0, type: 'number', attrs: 'min="0"' })}
        ${field({ id: 'cpMax', label: 'Maximum discount (₹)', value: coupon.maxDiscount || 0, type: 'number', attrs: 'min="0"', hint: '0 means no cap.' })}
        ${field({ id: 'cpLimit', label: 'Usage limit', value: coupon.usageLimit || 0, type: 'number', attrs: 'min="0"', hint: '0 means unlimited.' })}
        ${field({ id: 'cpExpiry', label: 'Expires on', value: (coupon.expiresAt || '').slice(0, 10), type: 'date' })}
        ${select({ id: 'cpCollection', label: 'Restrict to collection', value: coupon.collection || '', options: [{ value: '', label: 'Whole catalogue' }, ...collections.map((c) => ({ value: c.slug, label: c.name }))] })}
        ${select({ id: 'cpStatus', label: 'Status', value: coupon.status || 'active', options: ['active', 'inactive'] })}
        ${textarea({ id: 'cpDesc', label: 'Description', value: coupon.description || '', rows: 2, className: 'sm:col-span-2', hint: 'Shown to the shopper when the code is applied.' })}
      </div>`,
      footer: `<div class="flex justify-end gap-3">${btn('Cancel', { variant: 'ghost', attrs: 'data-modal-close' })}${btn('Save', { variant: 'gold', attrs: 'data-save' })}</div>`,
    });
    modal.querySelector('[data-save]').addEventListener('click', async () => {
      const data = {
        code: modal.querySelector('#cpCode').value.trim().toUpperCase(),
        type: modal.querySelector('#cpType').value,
        value: Number(modal.querySelector('#cpValue').value) || 0,
        minSubtotal: Number(modal.querySelector('#cpMin').value) || 0,
        maxDiscount: Number(modal.querySelector('#cpMax').value) || 0,
        usageLimit: Number(modal.querySelector('#cpLimit').value) || 0,
        expiresAt: modal.querySelector('#cpExpiry').value,
        collection: modal.querySelector('#cpCollection').value,
        status: modal.querySelector('#cpStatus').value,
        description: modal.querySelector('#cpDesc').value.trim(),
      };
      if (!data.code) { toast('A code is required', { tone: 'error' }); return; }
      if (data.value <= 0) { toast('Discount value must be above zero', { tone: 'error' }); return; }
      if (data.type === 'percent' && data.value > 100) { toast('A percentage cannot exceed 100', { tone: 'error' }); return; }
      if (isNew) await commerce.createCoupon(data); else await commerce.updateCoupon(coupon.id, data);
      closeModal(); toast('Coupon saved', { tone: 'success' }); refresh();
    });
  };

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'Coupons', path: '/coupons' }],
    html: `<div class="space-y-5">
      ${pageHeader({ title: 'Coupons', subtitle: `${rows.length} codes`, actions: [btn('New coupon', { variant: 'gold', attrs: 'data-new' })] })}
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${kpi({ label: 'Active codes', value: decorated.filter((c) => c.state === 'active').length, tone: 'ivory' })}
        ${kpi({ label: 'Expired', value: decorated.filter((c) => c.state === 'expired').length, tone: 'ivory' })}
        ${kpi({ label: 'Total redemptions', value: rows.reduce((s, c) => s + (c.usageCount || 0), 0), tone: 'ivory' })}
        ${kpi({ label: 'Inactive', value: decorated.filter((c) => c.state === 'inactive').length, tone: 'ivory' })}
      </div>
      ${table({
        columns: [
          { key: 'code', label: 'Code', render: (c) => `<div><span class="font-medium tracking-[0.1em] text-ivory">${esc(c.code)}</span>
              <span class="block text-[11px] text-sand/70">${esc(c.description || '—')}</span></div>` },
          { key: 'value', label: 'Discount', render: (c) => `<span class="text-gold">${c.type === 'percent' ? `${c.value}%` : money(c.value)}</span>${c.maxDiscount ? `<span class="block text-[11px] text-sand/70">max ${money(c.maxDiscount)}</span>` : ''}` },
          { key: 'minSubtotal', label: 'Min cart', align: 'right', render: (c) => `<span class="text-sand">${c.minSubtotal ? money(c.minSubtotal) : '—'}</span>` },
          { key: 'collection', label: 'Scope', render: (c) => `<span class="capitalize text-sand">${esc(c.collection ? c.collection.replace(/-/g, ' ') : 'All products')}</span>` },
          { key: 'usageCount', label: 'Used', align: 'right', render: (c) => `<span class="tabular-nums text-sand">${c.usageCount || 0}${c.usageLimit ? ` / ${c.usageLimit}` : ''}</span>` },
          { key: 'expiresAt', label: 'Expires', align: 'right', render: (c) => `<span class="text-sand">${c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Never'}</span>` },
          { key: 'state', label: 'Status', render: (c) => statusBadge(c.state) },
          { key: 'actions', label: '', align: 'right', render: (c) => `<div class="flex justify-end gap-1">
              <button type="button" data-toggle="${c.id}" data-status="${c.status}" class="admin-icon-btn" title="${c.status === 'active' ? 'Deactivate' : 'Activate'}">${c.status === 'active' ? '⏸' : '▶'}</button>
              <button type="button" data-edit="${c.id}" class="admin-icon-btn" aria-label="Edit">✎</button>
              <button type="button" data-delete="${c.id}" data-code="${esc(c.code)}" class="admin-icon-btn hover:!text-danger" aria-label="Delete">✕</button></div>` },
        ],
        rows: decorated, empty: 'No coupons yet.',
      })}
      <p class="text-center text-[11px] text-sand/60">Coupons here drive the storefront cart. Codes are validated against the same pricing rules customers see.</p>
    </div>`,
    onMount: (scope) => {
      const root = $('#adminMain');
      scope.delegate(root, 'click', '[data-new]', () => editor());
      scope.delegate(root, 'click', '[data-edit]', async (e, el) => editor(await commerce.getCoupon(el.dataset.edit)));
      scope.delegate(root, 'click', '[data-toggle]', async (e, el) => {
        await commerce.updateCoupon(el.dataset.toggle, { status: el.dataset.status === 'active' ? 'inactive' : 'active' });
        toast('Coupon updated', { tone: 'success' }); refresh();
      });
      scope.delegate(root, 'click', '[data-delete]', async (e, el) => {
        const ok = await confirmAction({ title: 'Delete coupon?', message: `${el.dataset.code} will stop working immediately.` });
        if (!ok) return;
        await commerce.deleteCoupon(el.dataset.delete);
        toast('Coupon deleted', { tone: 'success' }); refresh();
      });
    },
  };
}

/* ─────────────── Reviews ─────────────── */

export async function reviewsPage({ query }) {
  const all = await commerce.listReviews();
  const rows = commerce.queryReviews(all, {
    search: query.q || '', status: query.status || '', rating: query.rating || '',
  });

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'Reviews', path: '/reviews' }],
    html: `<div class="space-y-5">
      ${pageHeader({ title: 'Reviews', subtitle: `${rows.length} of ${all.length} reviews` })}
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${kpi({ label: 'Approved', value: all.filter((r) => r.status === 'approved').length, tone: 'ivory' })}
        ${kpi({ label: 'Awaiting moderation', value: all.filter((r) => r.status === 'pending').length, tone: all.some((r) => r.status === 'pending') ? 'gold' : 'ivory' })}
        ${kpi({ label: 'Hidden', value: all.filter((r) => r.status === 'hidden').length, tone: 'ivory' })}
        ${kpi({ label: 'Average rating', value: all.length ? (all.reduce((s, r) => s + r.rating, 0) / all.length).toFixed(1) : '—' })}
      </div>
      <div class="rounded-2xl border border-line/10 bg-card p-4">
        <div class="flex flex-wrap items-center gap-2.5">
          ${searchInput('revSearch', 'Search author, title, product…', query.q || '')}
          ${select({ id: 'revStatus', value: query.status || '', className: 'min-w-[150px]', options: [{ value: '', label: 'Any status' }, 'approved', 'pending', 'hidden'] })}
          ${select({ id: 'revRating', value: query.rating || '', className: 'min-w-[120px]', options: [{ value: '', label: 'Any rating' }, ...[5, 4, 3, 2, 1].map((n) => ({ value: n, label: `${n} stars` }))] })}
          ${btn('Clear', { variant: 'ghost', size: 'sm', attrs: 'data-clear' })}
        </div>
      </div>
      ${table({
        columns: [
          { key: 'productName', label: 'Product', render: (r) => `<span class="text-sand">${esc(r.productName || '—')}</span>` },
          { key: 'author', label: 'Customer', render: (r) => `<div><span class="text-ivory">${esc(r.author)}</span>
              ${r.verified ? '<span class="block text-[10px] text-success">✓ Verified</span>' : ''}</div>` },
          { key: 'rating', label: 'Rating', render: (r) => `<span class="text-gold" title="${r.rating} of 5">${stars(r.rating)}</span>` },
          { key: 'body', label: 'Review', nowrap: false, render: (r) => `<div class="max-w-md"><span class="block text-ivory">${esc(r.title || '')}</span>
              <span class="block truncate text-[12px] text-sand">${esc(r.body)}</span></div>` },
          { key: 'createdAt', label: 'Date', align: 'right', render: (r) => `<span class="text-sand">${new Date(r.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>` },
          { key: 'status', label: 'Status', render: (r) => `${statusBadge(r.status)}${r.featured ? ` ${badge('Featured', 'gold')}` : ''}` },
          { key: 'actions', label: '', align: 'right', render: (r) => `<div class="flex justify-end gap-1">
              ${r.status !== 'approved' ? `<button type="button" data-approve="${r.id}" class="admin-icon-btn hover:!text-success" title="Approve">✓</button>` : ''}
              ${r.status !== 'hidden' ? `<button type="button" data-hide="${r.id}" class="admin-icon-btn" title="Hide">◎</button>` : ''}
              <button type="button" data-feature="${r.id}" data-on="${r.featured ? '1' : ''}" class="admin-icon-btn ${r.featured ? '!text-gold' : ''}" title="Feature">★</button>
              <button type="button" data-delete="${r.id}" class="admin-icon-btn hover:!text-danger" title="Delete">✕</button></div>` },
        ],
        rows, empty: 'No reviews match those filters.',
      })}
    </div>`,
    onMount: (scope) => {
      const root = $('#adminMain');
      let timer;
      scope.on($('#revSearch'), 'input', (e) => { clearTimeout(timer); timer = setTimeout(() => setQuery({ q: e.target.value }), 350); });
      scope.on($('#revStatus'), 'change', (e) => setQuery({ status: e.target.value }));
      scope.on($('#revRating'), 'change', (e) => setQuery({ rating: e.target.value }));
      scope.delegate(root, 'click', '[data-clear]', () => setQuery({ q: '', status: '', rating: '' }));

      const set = async (id, patch, message) => { await commerce.updateReview(id, patch); toast(message, { tone: 'success' }); refresh(); };
      scope.delegate(root, 'click', '[data-approve]', (e, el) => set(el.dataset.approve, { status: 'approved' }, 'Review approved'));
      scope.delegate(root, 'click', '[data-hide]', (e, el) => set(el.dataset.hide, { status: 'hidden' }, 'Review hidden'));
      scope.delegate(root, 'click', '[data-feature]', (e, el) => set(el.dataset.feature, { featured: !el.dataset.on }, el.dataset.on ? 'Removed from featured' : 'Review featured'));
      scope.delegate(root, 'click', '[data-delete]', async (e, el) => {
        const ok = await confirmAction({ title: 'Delete review?', message: 'This removes the review permanently.' });
        if (!ok) return;
        await commerce.deleteReview(el.dataset.delete);
        toast('Review deleted', { tone: 'success' }); refresh();
      });
    },
  };
}
