/* Product editor — tabbed form covering every field, with variants,
   image ordering, validation and an unsaved-changes guard. */
import { $, $$, esc } from '../../core/dom.js';
import { go, refresh } from '../core/adminRouter.js';
import { toast } from '../../core/toast.js';
import { slugify } from '../../core/format.js';
import * as catalog from '../repositories/catalogRepo.js';
import { listMedia } from '../repositories/commerceRepo.js';
import { confirmAction, openModal, closeModal } from '../components/modal.js';
import { field, textarea, select, toggle, btn, card, sectionTitle, money, badge, statusBadge } from '../components/ui.js';
import { MATERIALS, COLORS } from '../../data/taxonomy.js';

const TABS = [
  { id: 'basics', label: 'Basics' }, { id: 'pricing', label: 'Pricing' },
  { id: 'organisation', label: 'Organisation' }, { id: 'variants', label: 'Variants' },
  { id: 'images', label: 'Images' }, { id: 'inventory', label: 'Inventory' }, { id: 'seo', label: 'SEO' },
];

const blank = () => ({
  name: '', slug: '', sku: '', brand: 'Parshiv Jewels', shortDescription: '', description: '',
  price: 0, compareAt: 0, costPrice: 0, category: '', collections: [], material: '', colors: [], tags: [],
  variantLabel: 'Size', variants: [], images: [], inventory: 0, lowStockThreshold: 4,
  status: 'draft', featured: false, bestSeller: false, newArrival: false, badge: '',
  details: [], care: [], seoTitle: '', seoDescription: '',
});

export default async function productEditPage({ params }) {
  const isNew = params.id === 'new';
  const [categories, collections, media] = await Promise.all([
    catalog.listCategories(), catalog.listCollections(), listMedia(),
  ]);
  const product = isNew ? blank() : await catalog.getProduct(params.id);
  if (!product) return { notFound: true };

  // Working copy — nothing is persisted until Save.
  let draft = JSON.parse(JSON.stringify(product));
  let dirty = false;

  const tab = (id) => `<button type="button" data-tab="${id}" class="admin-tab">${esc(TABS.find((t) => t.id === id).label)}</button>`;

  return {
    breadcrumb: [
      { label: 'Dashboard', path: '/' }, { label: 'Products', path: '/products' },
      { label: isNew ? 'New product' : product.name, path: `/products/${params.id}` },
    ],
    html: `
    <form id="productForm" class="space-y-5" novalidate>
      <div class="flex flex-wrap items-start justify-between gap-4 border-b border-line/10 pb-5">
        <div class="min-w-0">
          <h1 class="truncate font-display text-2xl font-semibold text-ivory sm:text-3xl">${esc(isNew ? 'New product' : product.name)}</h1>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            ${isNew ? badge('Unsaved', 'gold') : statusBadge(product.status)}
            ${!isNew ? statusBadge(product.stockState) : ''}
            ${!isNew ? `<span class="text-[11px] text-sand/70">Updated ${new Date(product.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>` : ''}
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          ${btn('Cancel', { variant: 'ghost', attrs: 'data-cancel' })}
          ${!isNew ? btn('Duplicate', { attrs: 'data-duplicate' }) : ''}
          ${!isNew ? btn('Delete', { variant: 'danger', attrs: 'data-delete' }) : ''}
          ${btn(isNew ? 'Create product' : 'Save changes', { variant: 'gold', attrs: 'data-save' })}
        </div>
      </div>

      <div class="flex gap-1 overflow-x-auto border-b border-line/10 pb-px">${TABS.map((t) => tab(t.id)).join('')}</div>

      <!-- Basics -->
      <section data-panel="basics" class="space-y-5">
        ${card(`${sectionTitle('Basic information')}
          <div class="grid gap-4 sm:grid-cols-2">
            ${field({ id: 'name', label: 'Product name', value: draft.name, required: true, className: 'sm:col-span-2' })}
            ${field({ id: 'slug', label: 'Slug', value: draft.slug, hint: 'Used in the storefront URL. Leave blank to generate from the name.' })}
            ${field({ id: 'sku', label: 'SKU', value: draft.sku, required: true })}
            ${field({ id: 'brand', label: 'Brand', value: draft.brand })}
            ${field({ id: 'badge', label: 'Badge', value: draft.badge, hint: 'Small label on the product card, e.g. Bestseller.' })}
            ${textarea({ id: 'shortDescription', label: 'Short description', value: draft.shortDescription, rows: 2, hint: 'One line, shown on cards and in search.', className: 'sm:col-span-2' })}
            ${textarea({ id: 'description', label: 'Full description', value: draft.description, rows: 6, className: 'sm:col-span-2' })}
          </div>`, 'p-5')}
        ${card(`${sectionTitle('Details & care', 'One item per line')}
          <div class="grid gap-4 sm:grid-cols-2">
            ${textarea({ id: 'details', label: 'Material & details', value: (draft.details || []).join('\n'), rows: 5 })}
            ${textarea({ id: 'care', label: 'Care instructions', value: (draft.care || []).join('\n'), rows: 5 })}
          </div>`, 'p-5')}
      </section>

      <!-- Pricing -->
      <section data-panel="pricing" class="hidden space-y-5">
        ${card(`${sectionTitle('Pricing')}
          <div class="grid gap-4 sm:grid-cols-3">
            ${field({ id: 'price', label: 'Price (₹)', value: draft.price, type: 'number', required: true, attrs: 'min="0" step="1"' })}
            ${field({ id: 'compareAt', label: 'Compare-at price (₹)', value: draft.compareAt, type: 'number', attrs: 'min="0" step="1"', hint: 'Shown struck through.' })}
            ${field({ id: 'costPrice', label: 'Cost price (₹)', value: draft.costPrice, type: 'number', attrs: 'min="0" step="1"', hint: 'Internal only — never shown.' })}
          </div>
          <div id="priceSummary" class="mt-4 flex flex-wrap gap-6 border-t border-line/10 pt-4 text-[13px]"></div>`, 'p-5')}
      </section>

      <!-- Organisation -->
      <section data-panel="organisation" class="hidden space-y-5">
        ${card(`${sectionTitle('Organisation')}
          <div class="grid gap-4 sm:grid-cols-2">
            ${select({ id: 'category', label: 'Category', value: draft.category, options: [{ value: '', label: 'Select…' }, ...categories.map((c) => ({ value: c.slug, label: c.name }))] })}
            ${select({ id: 'material', label: 'Material', value: draft.material, options: [{ value: '', label: 'Select…' }, ...MATERIALS] })}
            ${field({ id: 'tags', label: 'Tags', value: (draft.tags || []).join(', '), hint: 'Comma separated. Used by search.', className: 'sm:col-span-2' })}
          </div>
          <div class="mt-5">
            <p class="mb-2 text-[11px] uppercase tracking-[0.16em] text-sand">Colours</p>
            <div class="flex flex-wrap gap-2">
              ${COLORS.map((c) => `<label class="flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition ${(draft.colors || []).includes(c.name) ? 'border-gold bg-gold/10 text-gold-light' : 'border-line/15 text-sand hover:border-gold/50'}">
                <input type="checkbox" data-color="${esc(c.name)}" ${(draft.colors || []).includes(c.name) ? 'checked' : ''} class="admin-check">
                <span class="h-2.5 w-2.5 rounded-full border border-line/20" style="background:${c.hex}"></span>${esc(c.name)}</label>`).join('')}
            </div>
          </div>
          <div class="mt-5">
            <p class="mb-2 text-[11px] uppercase tracking-[0.16em] text-sand">Collections</p>
            <div class="flex flex-wrap gap-2">
              ${collections.map((c) => `<label class="flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition ${(draft.collections || []).includes(c.slug) ? 'border-gold bg-gold/10 text-gold-light' : 'border-line/15 text-sand hover:border-gold/50'}">
                <input type="checkbox" data-collection="${esc(c.slug)}" ${(draft.collections || []).includes(c.slug) ? 'checked' : ''} class="admin-check">${esc(c.name)}</label>`).join('')}
            </div>
          </div>`, 'p-5')}

        ${card(`${sectionTitle('Status & visibility')}
          <div class="grid gap-3 sm:grid-cols-2">
            ${select({ id: 'status', label: 'Status', value: draft.status, options: [
              { value: 'active', label: 'Active — visible on the storefront' },
              { value: 'draft', label: 'Draft — hidden' },
              { value: 'archived', label: 'Archived — hidden, kept for records' }] })}
            <div class="grid gap-2 sm:col-span-2 sm:grid-cols-3">
              ${toggle({ id: 'featured', label: 'Featured', checked: draft.featured, hint: 'Shows in the homepage featured band.' })}
              ${toggle({ id: 'bestSeller', label: 'Best seller', checked: draft.bestSeller, hint: 'Appears in Best Sellers.' })}
              ${toggle({ id: 'newArrival', label: 'New arrival', checked: draft.newArrival, hint: 'Appears in New Arrivals.' })}
            </div>
          </div>`, 'p-5')}
      </section>

      <!-- Variants -->
      <section data-panel="variants" class="hidden space-y-5">
        ${card(`${sectionTitle('Variants', 'Each variant carries its own SKU, price and stock.')}
          <div class="mb-4 max-w-xs">${field({ id: 'variantLabel', label: 'Option name', value: draft.variantLabel, hint: 'e.g. Ring Size, Chain Length' })}</div>
          <div id="variantRows" class="space-y-2.5"></div>
          <div class="mt-4">${btn('Add variant', { size: 'sm', attrs: 'data-add-variant' })}</div>`, 'p-5')}
      </section>

      <!-- Images -->
      <section data-panel="images" class="hidden space-y-5">
        ${card(`${sectionTitle('Images', 'The first image is the primary one. Drag order with the arrows.')}
          <div id="imageGrid" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"></div>
          <div class="mt-4 flex flex-wrap gap-2">
            ${btn('Add from URL', { size: 'sm', attrs: 'data-add-image' })}
            ${btn('Choose from media library', { size: 'sm', attrs: 'data-pick-media' })}
          </div>`, 'p-5')}
      </section>

      <!-- Inventory -->
      <section data-panel="inventory" class="hidden space-y-5">
        ${card(`${sectionTitle('Inventory')}
          <div class="grid gap-4 sm:grid-cols-3">
            ${field({ id: 'inventory', label: 'Stock quantity', value: draft.inventory, type: 'number', attrs: 'min="0" step="1"', hint: 'Spread evenly across variants on save.' })}
            ${field({ id: 'lowStockThreshold', label: 'Low-stock threshold', value: draft.lowStockThreshold, type: 'number', attrs: 'min="0" step="1"' })}
            <div><p class="mb-1.5 text-[11px] uppercase tracking-[0.16em] text-sand">Current status</p>
              <div id="stockPreview" class="pt-2"></div></div>
          </div>`, 'p-5')}
      </section>

      <!-- SEO -->
      <section data-panel="seo" class="hidden space-y-5">
        ${card(`${sectionTitle('Search engine listing')}
          <div class="grid gap-4">
            ${field({ id: 'seoTitle', label: 'SEO title', value: draft.seoTitle, hint: 'Falls back to the product name.' })}
            ${textarea({ id: 'seoDescription', label: 'SEO description', value: draft.seoDescription, rows: 3, hint: 'Falls back to the short description.' })}
          </div>
          <div class="mt-5 rounded-xl border border-line/10 bg-night/40 p-4">
            <p class="text-[11px] uppercase tracking-[0.16em] text-sand/70">Preview</p>
            <p id="seoPreviewTitle" class="mt-2 text-[15px] text-sky-400"></p>
            <p id="seoPreviewUrl" class="text-[12px] text-success"></p>
            <p id="seoPreviewDesc" class="mt-1 text-[12px] text-sand"></p>
          </div>`, 'p-5')}
      </section>
    </form>`,

    onMount: (scope) => {
      const root = $('#adminMain');
      const form = $('#productForm');
      const val = (id) => form.querySelector(`#${id}`)?.value ?? '';
      const markDirty = () => { dirty = true; };

      /* Tabs */
      const showTab = (id) => {
        $$('[data-panel]', root).forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== id));
        $$('[data-tab]', root).forEach((t) => t.classList.toggle('admin-tab-on', t.dataset.tab === id));
      };
      scope.delegate(root, 'click', '[data-tab]', (e, el) => showTab(el.dataset.tab));
      showTab('basics');

      /* Live previews */
      const renderPriceSummary = () => {
        const price = Number(val('price')) || 0;
        const compare = Number(val('compareAt')) || 0;
        const cost = Number(val('costPrice')) || 0;
        const discount = compare > price ? Math.round((1 - price / compare) * 100) : 0;
        const margin = cost && price ? Math.round(((price - cost) / price) * 100) : null;
        $('#priceSummary').innerHTML = `
          <span class="text-sand">Customer pays <span class="text-gold">${money(price)}</span></span>
          ${discount ? `<span class="text-sand">Discount <span class="text-success">${discount}%</span></span>` : ''}
          ${margin !== null ? `<span class="text-sand">Margin <span class="${margin < 20 ? 'text-danger' : 'text-ivory'}">${margin}%</span></span>` : ''}
          ${cost && price && cost >= price ? '<span class="text-danger">Cost is above price</span>' : ''}`;
      };
      const renderStock = () => {
        const qty = Number(val('inventory')) || 0;
        const threshold = Number(val('lowStockThreshold')) || 0;
        const state = qty <= 0 ? 'out-of-stock' : qty <= threshold ? 'low-stock' : 'in-stock';
        $('#stockPreview').innerHTML = statusBadge(state);
      };
      const renderSeo = () => {
        $('#seoPreviewTitle').textContent = val('seoTitle') || `${val('name') || 'Product name'} | Parshiv Jewels`;
        $('#seoPreviewUrl').textContent = `parshivjewels.in/product/${slugify(val('slug') || val('name') || '')}`;
        $('#seoPreviewDesc').textContent = val('seoDescription') || val('shortDescription') || '—';
      };

      /* Variants */
      const renderVariants = () => {
        const label = val('variantLabel') || 'Option';
        $('#variantRows').innerHTML = draft.variants.length
          ? draft.variants.map((v, i) => `
            <div class="grid items-end gap-2 rounded-xl border border-line/10 bg-night/40 p-3 sm:grid-cols-[1.2fr_1.4fr_1fr_0.8fr_auto]" data-variant="${i}">
              <div><label class="mb-1 block text-[10px] uppercase tracking-[0.14em] text-sand/70">${esc(label)}</label>
                <input value="${esc(v.label)}" data-v="label" class="admin-input !py-2 !text-[13px]"></div>
              <div><label class="mb-1 block text-[10px] uppercase tracking-[0.14em] text-sand/70">SKU</label>
                <input value="${esc(v.sku)}" data-v="sku" class="admin-input !py-2 !text-[13px]"></div>
              <div><label class="mb-1 block text-[10px] uppercase tracking-[0.14em] text-sand/70">Price</label>
                <input type="number" min="0" value="${v.price}" data-v="price" class="admin-input !py-2 !text-[13px]"></div>
              <div><label class="mb-1 block text-[10px] uppercase tracking-[0.14em] text-sand/70">Stock</label>
                <input type="number" min="0" value="${v.inventory}" data-v="inventory" class="admin-input !py-2 !text-[13px]"></div>
              <button type="button" data-remove-variant="${i}" class="admin-icon-btn mb-1 hover:!text-danger" aria-label="Remove variant">✕</button>
            </div>`).join('')
          : '<p class="rounded-xl border border-dashed border-line/15 px-4 py-8 text-center text-[13px] text-sand/70">No variants. The product is sold as a single option.</p>';
      };
      scope.delegate(root, 'click', '[data-add-variant]', () => {
        draft.variants.push({ id: `v${draft.variants.length + 1}`, label: '', sku: `${val('sku')}-${draft.variants.length + 1}`, price: Number(val('price')) || 0, compareAt: Number(val('compareAt')) || 0, inventory: 0, available: false });
        markDirty(); renderVariants();
      });
      scope.delegate(root, 'click', '[data-remove-variant]', (e, el) => {
        draft.variants.splice(Number(el.dataset.removeVariant), 1); markDirty(); renderVariants();
      });
      scope.delegate(root, 'input', '[data-v]', (e, el) => {
        const i = Number(el.closest('[data-variant]').dataset.variant);
        const key = el.dataset.v;
        draft.variants[i][key] = key === 'price' || key === 'inventory' ? Number(el.value) || 0 : el.value;
        if (key === 'inventory') draft.variants[i].available = Number(el.value) > 0;
        markDirty();
      });

      /* Images */
      const renderImages = () => {
        $('#imageGrid').innerHTML = draft.images.length
          ? draft.images.map((img, i) => `
            <div class="overflow-hidden rounded-xl border ${img.primary ? 'border-gold/50' : 'border-line/10'} bg-night/40" data-image="${i}">
              <div class="relative aspect-square bg-night">
                <img src="${esc(img.src)}" alt="" loading="lazy" class="h-full w-full object-cover" onerror="this.style.opacity=.2">
                ${img.primary ? `<span class="absolute left-2 top-2">${badge('Primary', 'gold')}</span>` : ''}
              </div>
              <div class="space-y-2 p-3">
                <input value="${esc(img.alt || '')}" data-img-alt="${i}" placeholder="Alt text" class="admin-input !py-1.5 !text-[12px]">
                <div class="flex flex-wrap gap-1">
                  ${!img.primary ? `<button type="button" data-img-primary="${i}" class="admin-icon-btn" title="Make primary">★</button>` : ''}
                  <button type="button" data-img-up="${i}" class="admin-icon-btn" title="Move earlier" ${i === 0 ? 'disabled' : ''}>↑</button>
                  <button type="button" data-img-down="${i}" class="admin-icon-btn" title="Move later" ${i === draft.images.length - 1 ? 'disabled' : ''}>↓</button>
                  <button type="button" data-img-replace="${i}" class="admin-icon-btn" title="Replace">⟳</button>
                  <button type="button" data-img-remove="${i}" class="admin-icon-btn hover:!text-danger" title="Remove">✕</button>
                </div>
              </div>
            </div>`).join('')
          : '<p class="col-span-full rounded-xl border border-dashed border-line/15 px-4 py-10 text-center text-[13px] text-sand/70">No images yet.</p>';
      };
      const reorder = (from, to) => {
        if (to < 0 || to >= draft.images.length) return;
        const [moved] = draft.images.splice(from, 1);
        draft.images.splice(to, 0, moved);
        draft.images.forEach((img, i) => { img.order = i; img.primary = i === 0 ? img.primary : img.primary; });
        markDirty(); renderImages();
      };
      scope.delegate(root, 'click', '[data-img-up]', (e, el) => reorder(Number(el.dataset.imgUp), Number(el.dataset.imgUp) - 1));
      scope.delegate(root, 'click', '[data-img-down]', (e, el) => reorder(Number(el.dataset.imgDown), Number(el.dataset.imgDown) + 1));
      scope.delegate(root, 'click', '[data-img-primary]', (e, el) => {
        draft.images.forEach((img, i) => { img.primary = i === Number(el.dataset.imgPrimary); });
        markDirty(); renderImages();
      });
      scope.delegate(root, 'click', '[data-img-remove]', (e, el) => {
        draft.images.splice(Number(el.dataset.imgRemove), 1);
        if (draft.images.length && !draft.images.some((i) => i.primary)) draft.images[0].primary = true;
        markDirty(); renderImages();
      });
      scope.delegate(root, 'input', '[data-img-alt]', (e, el) => { draft.images[Number(el.dataset.imgAlt)].alt = el.value; markDirty(); });

      const askForUrl = (title, onOk) => {
        const modal = openModal({
          title, size: 'max-w-lg',
          body: `${field({ id: 'imgUrl', label: 'Image URL', placeholder: 'https://… or /assets/img/piece.webp' })}
                 ${field({ id: 'imgAlt', label: 'Alt text', placeholder: 'Describe the piece for screen readers' })}`,
          footer: `<div class="flex justify-end gap-3">${btn('Cancel', { variant: 'ghost', attrs: 'data-modal-close' })}${btn('Add', { variant: 'gold', attrs: 'data-ok' })}</div>`,
        });
        modal.querySelector('[data-ok]').addEventListener('click', () => {
          const src = modal.querySelector('#imgUrl').value.trim();
          if (!src) return;
          onOk(src, modal.querySelector('#imgAlt').value.trim());
          closeModal(); markDirty(); renderImages();
        });
      };
      scope.delegate(root, 'click', '[data-add-image]', () => askForUrl('Add image', (src, alt) => {
        draft.images.push({ id: `img_${Date.now()}`, src, alt, primary: draft.images.length === 0, order: draft.images.length });
      }));
      scope.delegate(root, 'click', '[data-img-replace]', (e, el) => {
        const i = Number(el.dataset.imgReplace);
        askForUrl('Replace image', (src, alt) => { draft.images[i].src = src; if (alt) draft.images[i].alt = alt; });
      });
      scope.delegate(root, 'click', '[data-pick-media]', () => {
        const modal = openModal({
          title: 'Media library', size: 'max-w-3xl',
          body: media.length
            ? `<div class="grid grid-cols-3 gap-3 sm:grid-cols-4">${media.map((m) => `
                <button type="button" data-media="${esc(m.src)}" data-alt="${esc(m.alt || '')}" class="overflow-hidden rounded-lg border border-line/10 transition hover:border-gold">
                  <img src="${esc(m.src)}" alt="${esc(m.alt || '')}" loading="lazy" class="aspect-square w-full object-cover"></button>`).join('')}</div>`
            : '<p class="py-8 text-center text-[13px] text-sand">The media library is empty.</p>',
        });
        modal.querySelectorAll('[data-media]').forEach((b) => b.addEventListener('click', () => {
          draft.images.push({ id: `img_${Date.now()}`, src: b.dataset.media, alt: b.dataset.alt, primary: draft.images.length === 0, order: draft.images.length });
          closeModal(); markDirty(); renderImages();
        }));
      });

      /* Colours & collections */
      scope.delegate(root, 'change', '[data-color]', (e, el) => {
        const name = el.dataset.color;
        draft.colors = el.checked ? [...new Set([...(draft.colors || []), name])] : (draft.colors || []).filter((c) => c !== name);
        el.closest('label').className = `flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition ${el.checked ? 'border-gold bg-gold/10 text-gold-light' : 'border-line/15 text-sand hover:border-gold/50'}`;
        markDirty();
      });
      scope.delegate(root, 'change', '[data-collection]', (e, el) => {
        const slug = el.dataset.collection;
        draft.collections = el.checked ? [...new Set([...(draft.collections || []), slug])] : (draft.collections || []).filter((c) => c !== slug);
        el.closest('label').className = `flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition ${el.checked ? 'border-gold bg-gold/10 text-gold-light' : 'border-line/15 text-sand hover:border-gold/50'}`;
        markDirty();
      });

      scope.on(form, 'input', () => { markDirty(); renderPriceSummary(); renderStock(); renderSeo(); });
      scope.on(form, 'change', () => { markDirty(); renderVariants(); });

      /* Validation + save */
      const showError = (id, message) => {
        const el = form.querySelector(`[data-error-for="${id}"]`);
        if (el) { el.textContent = message; el.classList.toggle('hidden', !message); }
        form.querySelector(`#${id}`)?.classList.toggle('!border-danger/60', !!message);
      };
      const validate = () => {
        const errors = {};
        if (!val('name').trim()) errors.name = 'A product needs a name.';
        if (!val('sku').trim()) errors.sku = 'A SKU is required.';
        const price = Number(val('price'));
        if (!Number.isFinite(price) || price <= 0) errors.price = 'Enter a price above zero.';
        const compare = Number(val('compareAt')) || 0;
        if (compare && compare <= price) errors.compareAt = 'Compare-at should be higher than the price, or left empty.';
        ['name', 'sku', 'price', 'compareAt'].forEach((id) => showError(id, errors[id] || ''));
        return errors;
      };

      const collect = () => ({
        ...draft,
        name: val('name').trim(),
        slug: slugify(val('slug') || val('name')),
        sku: val('sku').trim(),
        brand: val('brand').trim(),
        badge: val('badge').trim(),
        shortDescription: val('shortDescription').trim(),
        description: val('description').trim(),
        details: val('details').split('\n').map((s) => s.trim()).filter(Boolean),
        care: val('care').split('\n').map((s) => s.trim()).filter(Boolean),
        price: Number(val('price')) || 0,
        compareAt: Number(val('compareAt')) || 0,
        costPrice: Number(val('costPrice')) || 0,
        category: val('category'),
        material: val('material'),
        tags: val('tags').split(',').map((s) => s.trim()).filter(Boolean),
        variantLabel: val('variantLabel'),
        inventory: Number(val('inventory')) || 0,
        lowStockThreshold: Number(val('lowStockThreshold')) || 0,
        status: val('status'),
        featured: form.querySelector('#featured').checked,
        bestSeller: form.querySelector('#bestSeller').checked,
        newArrival: form.querySelector('#newArrival').checked,
        seoTitle: val('seoTitle').trim(),
        seoDescription: val('seoDescription').trim(),
      });

      scope.delegate(root, 'click', '[data-save]', async () => {
        const errors = validate();
        if (Object.keys(errors).length) {
          const first = Object.keys(errors)[0];
          const panel = form.querySelector(`#${first}`)?.closest('[data-panel]');
          if (panel) showTab(panel.dataset.panel);
          form.querySelector(`#${first}`)?.focus();
          toast('Please fix the highlighted fields', { tone: 'error' });
          return;
        }
        const payload = collect();
        try {
          if (isNew) {
            const created = await catalog.createProduct(payload);
            dirty = false;
            toast('Product created', { tone: 'success' });
            go(`/products/${created.id}`);
          } else {
            await catalog.updateProduct(params.id, payload);
            if (payload.inventory !== product.inventory) {
              await catalog.setInventory(params.id, payload.inventory, 'Edited in product form');
            }
            dirty = false;
            toast('Changes saved', { tone: 'success' });
            refresh();
          }
        } catch (error) {
          toast(error.message || 'Could not save', { tone: 'error' });
        }
      });

      scope.delegate(root, 'click', '[data-cancel]', async () => {
        if (dirty) {
          const leave = await confirmAction({
            title: 'Discard changes?', message: 'You have unsaved edits on this product.',
            confirmLabel: 'Discard', tone: 'danger',
          });
          if (!leave) return;
        }
        dirty = false;
        go('/products');
      });

      scope.delegate(root, 'click', '[data-duplicate]', async () => {
        const copy = await catalog.duplicateProduct(params.id);
        dirty = false;
        toast('Duplicated as a draft', { tone: 'success' });
        go(`/products/${copy.id}`);
      });

      scope.delegate(root, 'click', '[data-delete]', async () => {
        const ok = await confirmAction({ title: 'Delete product?', message: `“${product.name}” will be removed. This cannot be undone.` });
        if (!ok) return;
        await catalog.deleteProduct(params.id);
        dirty = false;
        toast('Product deleted', { tone: 'success' });
        go('/products');
      });

      // Warn before a hard reload or tab close with unsaved work.
      const beforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
      window.addEventListener('beforeunload', beforeUnload);
      scope.add(() => window.removeEventListener('beforeunload', beforeUnload));
      scope.add(() => { dirty = false; });

      renderVariants(); renderImages(); renderPriceSummary(); renderStock(); renderSeo();
    },
  };
}
