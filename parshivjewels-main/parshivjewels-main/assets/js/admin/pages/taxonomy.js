/* Categories and collections — list, create, edit, reorder, assign products. */
import { $, $$, esc } from '../../core/dom.js';
import { refresh, href } from '../core/adminRouter.js';
import { toast } from '../../core/toast.js';
import * as catalog from '../repositories/catalogRepo.js';
import { confirmAction, openModal, closeModal } from '../components/modal.js';
import { pageHeader, table, statusBadge, btn, field, textarea, select, card, emptyState, badge } from '../components/ui.js';

const editorBody = (row = {}, kind) => `
  <div class="grid gap-4">
    ${field({ id: 'txName', label: 'Name', value: row.name || '', required: true })}
    ${field({ id: 'txSlug', label: 'Slug', value: row.slug || '', hint: 'Storefront URL segment. Generated from the name if blank.' })}
    ${field({ id: 'txTagline', label: 'Tagline', value: row.tagline || '' })}
    ${textarea({ id: 'txDescription', label: 'Description', value: row.description || '', rows: 3 })}
    ${field({ id: 'txImage', label: 'Image', value: row.image || '', hint: 'Unsplash photo id, or a path under /assets/img/.' })}
    ${kind === 'collection' ? '' : ''}
    <div class="grid gap-4 sm:grid-cols-2">
      ${field({ id: 'txSeoTitle', label: 'SEO title', value: row.seoTitle || '' })}
      ${select({ id: 'txStatus', label: 'Status', value: row.status || 'active', options: ['active', 'inactive'] })}
    </div>
    ${textarea({ id: 'txSeoDescription', label: 'SEO description', value: row.seoDescription || '', rows: 2 })}
  </div>`;

function readEditor() {
  return {
    name: $('#txName').value.trim(),
    slug: $('#txSlug').value.trim(),
    tagline: $('#txTagline').value.trim(),
    description: $('#txDescription').value.trim(),
    image: $('#txImage').value.trim(),
    seoTitle: $('#txSeoTitle').value.trim(),
    seoDescription: $('#txSeoDescription').value.trim(),
    status: $('#txStatus').value,
  };
}

function openEditor({ title, row, kind, onSave }) {
  const modal = openModal({
    title, size: 'max-w-2xl', body: editorBody(row, kind),
    footer: `<div class="flex justify-end gap-3">${btn('Cancel', { variant: 'ghost', attrs: 'data-modal-close' })}${btn('Save', { variant: 'gold', attrs: 'data-save' })}</div>`,
  });
  modal.querySelector('[data-save]').addEventListener('click', async () => {
    const data = readEditor();
    if (!data.name) { toast('A name is required', { tone: 'error' }); return; }
    await onSave(data);
    closeModal();
    refresh();
  });
}

/* ─────────────── Categories ─────────────── */

export async function categoriesPage() {
  const [rows, products] = await Promise.all([catalog.listCategories(), catalog.listProducts()]);
  const sorted = rows.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const countFor = (slug) => products.filter((p) => p.category === slug).length;

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'Categories', path: '/categories' }],
    html: `<div class="space-y-5">
      ${pageHeader({ title: 'Categories', subtitle: `${rows.length} categories`, actions: [btn('Add category', { variant: 'gold', attrs: 'data-new' })] })}
      ${table({
        columns: [
          { key: 'order', label: '', width: '70px', render: (r) => `<div class="flex gap-1">
              <button type="button" data-move="up" data-id="${r.id}" class="admin-icon-btn" aria-label="Move up">↑</button>
              <button type="button" data-move="down" data-id="${r.id}" class="admin-icon-btn" aria-label="Move down">↓</button></div>` },
          { key: 'name', label: 'Category', render: (r) => `<div><span class="font-medium text-ivory">${esc(r.name)}</span>
              <span class="block text-[11px] text-sand/70">/${esc(r.slug)}</span></div>` },
          { key: 'tagline', label: 'Tagline', nowrap: false, render: (r) => `<span class="text-sand">${esc(r.tagline || '—')}</span>` },
          { key: 'products', label: 'Products', align: 'right', render: (r) => `<a href="${href(`/products?category=${r.slug}`)}" class="tabular-nums text-gold-light">${countFor(r.slug)}</a>` },
          { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
          { key: 'actions', label: '', align: 'right', render: (r) => `<div class="flex justify-end gap-1">
              <button type="button" data-edit="${r.id}" class="admin-icon-btn" aria-label="Edit">✎</button>
              <button type="button" data-delete="${r.id}" data-name="${esc(r.name)}" data-count="${countFor(r.slug)}" class="admin-icon-btn hover:!text-danger" aria-label="Delete">✕</button></div>` },
        ],
        rows: sorted, empty: 'No categories yet.',
      })}
    </div>`,
    onMount: (scope) => {
      const root = $('#adminMain');
      scope.delegate(root, 'click', '[data-new]', () =>
        openEditor({ title: 'New category', row: {}, kind: 'category', onSave: (d) => catalog.createCategory(d) }));
      scope.delegate(root, 'click', '[data-edit]', async (e, el) => {
        const row = await catalog.getCategory(el.dataset.edit);
        openEditor({ title: 'Edit category', row, kind: 'category', onSave: (d) => catalog.updateCategory(row.id, d) });
      });
      scope.delegate(root, 'click', '[data-delete]', async (e, el) => {
        const count = Number(el.dataset.count);
        const ok = await confirmAction({
          title: 'Delete category?',
          message: count
            ? `“${el.dataset.name}” still has ${count} product${count === 1 ? '' : 's'}. They will keep the category value but it will no longer appear in navigation.`
            : `“${el.dataset.name}” will be removed.`,
        });
        if (!ok) return;
        await catalog.deleteCategory(el.dataset.delete);
        toast('Category deleted', { tone: 'success' });
        refresh();
      });
      scope.delegate(root, 'click', '[data-move]', async (e, el) => {
        const ids = sorted.map((r) => r.id);
        const i = ids.indexOf(el.dataset.id);
        const j = el.dataset.move === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= ids.length) return;
        [ids[i], ids[j]] = [ids[j], ids[i]];
        await catalog.reorderCategories(ids);
        refresh();
      });
    },
  };
}

/* ─────────────── Collections ─────────────── */

export async function collectionsPage() {
  const [rows, products] = await Promise.all([catalog.listCollections(), catalog.listProducts()]);
  const sorted = rows.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'Collections', path: '/collections' }],
    html: `<div class="space-y-5">
      ${pageHeader({ title: 'Collections', subtitle: `${rows.length} collections`, actions: [btn('Add collection', { variant: 'gold', attrs: 'data-new' })] })}
      ${table({
        columns: [
          { key: 'name', label: 'Collection', render: (r) => `<div><span class="font-medium text-ivory">${esc(r.name)}</span>
              <span class="block text-[11px] text-sand/70">/${esc(r.slug)}</span></div>` },
          { key: 'tagline', label: 'Tagline', nowrap: false, render: (r) => `<span class="text-sand">${esc(r.tagline || '—')}</span>` },
          { key: 'products', label: 'Products', align: 'right', render: (r) => `<span class="tabular-nums text-gold-light">${(r.productIds || []).length}</span>` },
          { key: 'status', label: 'Status', render: (r) => statusBadge(r.status) },
          { key: 'actions', label: '', align: 'right', render: (r) => `<div class="flex justify-end gap-1">
              <button type="button" data-assign="${r.id}" class="admin-icon-btn" title="Assign products" aria-label="Assign products">⊞</button>
              <button type="button" data-edit="${r.id}" class="admin-icon-btn" aria-label="Edit">✎</button>
              <button type="button" data-delete="${r.id}" data-name="${esc(r.name)}" class="admin-icon-btn hover:!text-danger" aria-label="Delete">✕</button></div>` },
        ],
        rows: sorted, empty: 'No collections yet.',
      })}
    </div>`,
    onMount: (scope) => {
      const root = $('#adminMain');
      scope.delegate(root, 'click', '[data-new]', () =>
        openEditor({ title: 'New collection', row: {}, kind: 'collection', onSave: (d) => catalog.createCollection(d) }));
      scope.delegate(root, 'click', '[data-edit]', async (e, el) => {
        const row = await catalog.getCollection(el.dataset.edit);
        openEditor({ title: 'Edit collection', row, kind: 'collection', onSave: (d) => catalog.updateCollection(row.id, d) });
      });
      scope.delegate(root, 'click', '[data-delete]', async (e, el) => {
        const ok = await confirmAction({ title: 'Delete collection?', message: `“${el.dataset.name}” will be removed. Products stay in the catalogue.` });
        if (!ok) return;
        await catalog.deleteCollection(el.dataset.delete);
        toast('Collection deleted', { tone: 'success' });
        refresh();
      });

      /* Assign products */
      scope.delegate(root, 'click', '[data-assign]', async (e, el) => {
        const collection = await catalog.getCollection(el.dataset.assign);
        const chosen = new Set(collection.productIds || []);
        const list = (filter = '') => products
          .filter((p) => !filter || p.name.toLowerCase().includes(filter.toLowerCase()))
          .map((p) => `<label class="flex cursor-pointer items-center gap-3 rounded-xl border border-line/10 bg-night/40 p-2.5 transition hover:border-gold/30">
            <input type="checkbox" data-pick="${p.id}" ${chosen.has(p.id) ? 'checked' : ''} class="admin-check">
            <img src="${esc((p.images?.[0]?.src) || '')}" alt="" class="h-9 w-9 rounded-lg object-cover" onerror="this.style.visibility='hidden'">
            <span class="min-w-0 flex-1"><span class="block truncate text-[13px] text-ivory">${esc(p.name)}</span>
            <span class="block truncate text-[11px] text-sand/70">${esc(p.sku)}</span></span></label>`).join('');

        const modal = openModal({
          title: `Products in ${collection.name}`, size: 'max-w-2xl',
          body: `<input id="assignSearch" type="search" placeholder="Filter products…" class="admin-input mb-3">
                 <div id="assignList" class="grid gap-2 sm:grid-cols-2">${list()}</div>`,
          footer: `<div class="flex items-center justify-between gap-3">
            <span id="assignCount" class="text-[12px] text-sand">${chosen.size} selected</span>
            <div class="flex gap-3">${btn('Cancel', { variant: 'ghost', attrs: 'data-modal-close' })}${btn('Save', { variant: 'gold', attrs: 'data-save' })}</div></div>`,
        });
        const syncCount = () => { modal.querySelector('#assignCount').textContent = `${chosen.size} selected`; };
        modal.addEventListener('change', (ev) => {
          const cb = ev.target.closest('[data-pick]');
          if (!cb) return;
          cb.checked ? chosen.add(cb.dataset.pick) : chosen.delete(cb.dataset.pick);
          syncCount();
        });
        modal.querySelector('#assignSearch').addEventListener('input', (ev) => {
          modal.querySelector('#assignList').innerHTML = list(ev.target.value);
        });
        modal.querySelector('[data-save]').addEventListener('click', async () => {
          await catalog.setCollectionProducts(collection.id, [...chosen]);
          closeModal();
          toast('Collection updated', { tone: 'success' });
          refresh();
        });
      });
    },
  };
}
