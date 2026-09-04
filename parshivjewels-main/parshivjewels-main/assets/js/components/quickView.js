/* ══════════════════════════════════════════════════════════════
   QUICK VIEW
   Reuses the existing #modal shell: image on the left, details and a
   variant picker on the right. Adds to cart without leaving the grid.
   ══════════════════════════════════════════════════════════════ */
import { $, esc, on, delegate, lockScroll, unlockScroll, trapFocus, refreshImages } from '../core/dom.js';
import { href } from '../core/router.js';
import { inr } from '../core/format.js';
import { toast } from '../core/toast.js';
import { getBySlug, getVariant, firstAvailableVariant } from '../services/catalogService.js';
import * as cart from '../services/cartService.js';
import { ratingRow, stockPill } from './ui.js';
import { openCart } from './cartDrawer.js';

let current = null;
let selectedVariantId = null;
let released = null;
let lastFocused = null;

function variantPicker(product) {
  if (product.variants.length <= 1) return '';
  return `<fieldset class="mt-5">
    <legend class="text-[11px] uppercase tracking-[0.28em] text-gold">${esc(product.variantLabel)}</legend>
    <div class="mt-3 flex flex-wrap gap-2">
      ${product.variants
        .map(
          (variant) => `
        <button type="button" data-qv-variant="${variant.id}" ${variant.available ? '' : 'disabled'}
          class="chip ${variant.id === selectedVariantId ? 'chip-on' : ''} ${
            variant.available ? '' : 'cursor-not-allowed line-through opacity-40'
          }" aria-pressed="${variant.id === selectedVariantId}">${esc(variant.label)}</button>`
        )
        .join('')}
    </div>
  </fieldset>`;
}

function render() {
  const product = current;
  if (!product) return;
  const variant = getVariant(product, selectedVariantId) || product.variants[0];

  const img = $('#modalImg');
  img.classList.remove('img-in');
  img.onerror = function handle() {
    this.onerror = null;
    window.imgFix(this);
  };
  img.src = product.image.src;
  img.alt = product.image.alt;
  if (img.complete && img.naturalWidth) requestAnimationFrame(() => img.classList.add('img-in'));

  $('#modalBody').innerHTML = `
    <p class="text-[11px] uppercase tracking-[0.35em] text-gold">${esc(product.categoryName)}</p>
    <h3 id="modalTitle" class="mt-2 font-display text-3xl font-semibold text-ivory">${esc(product.name)}</h3>
    <div class="mt-3">${ratingRow(product)}</div>
    <div class="mt-4 flex flex-wrap items-baseline gap-3">
      <p class="font-display text-3xl text-gold">${inr(variant.price)}</p>
      ${product.onSale ? `<p class="text-base text-sand/60 line-through">${inr(product.compareAt)}</p>
        <span class="rounded-full border border-gold/40 px-2.5 py-0.5 text-[11px] text-gold-light">${product.discount}% OFF</span>` : ''}
    </div>
    <div class="mt-3">${stockPill(product)}</div>
    <p class="mt-4 text-[15px] leading-relaxed">${esc(product.shortDescription)}</p>
    <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
      <div><dt class="text-sand/70">Material</dt><dd class="text-ivory">${esc(product.material)}</dd></div>
      <div><dt class="text-sand/70">SKU</dt><dd class="text-ivory">${esc(variant.sku)}</dd></div>
    </dl>
    ${variantPicker(product)}
    <div class="mt-auto flex flex-wrap gap-3 pt-8">
      ${
        product.inStock
          ? `<button type="button" id="modalAdd" class="btn-gold px-7 py-3">Add to Cart</button>`
          : `<button type="button" disabled class="btn-line cursor-not-allowed px-7 py-3 opacity-40">Sold Out</button>`
      }
      <a href="${href(product.url)}" id="modalDetails" class="btn-line px-7 py-3">Full Details</a>
    </div>`;
}

export function openQuickView(slug) {
  const product = getBySlug(slug);
  if (!product) return;
  current = product;
  selectedVariantId = (firstAvailableVariant(product) || product.variants[0])?.id ?? null;
  render();

  const modal = $('#modal');
  lastFocused = document.activeElement;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  lockScroll();
  released = trapFocus(modal);
  refreshImages(modal);
  requestAnimationFrame(() => $('#modalCloseBtn')?.focus());
}

export function closeQuickView() {
  const modal = $('#modal');
  if (!modal || modal.classList.contains('hidden')) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  unlockScroll();
  released?.();
  released = null;
  current = null;
  lastFocused?.focus?.();
}

export function initQuickView() {
  const modal = $('#modal');
  if (!modal) return;

  delegate(modal, 'click', '[data-close],#modalCloseBtn', closeQuickView);
  delegate(modal, 'click', '#modalDetails', closeQuickView);

  delegate(modal, 'click', '[data-qv-variant]', (event, el) => {
    selectedVariantId = el.dataset.qvVariant;
    render();
  });

  delegate(modal, 'click', '#modalAdd', () => {
    const result = cart.add(current.id, selectedVariantId, 1);
    toast(result.message, { tone: result.ok ? 'success' : 'error' });
    if (result.ok) {
      closeQuickView();
      openCart();
    }
  });

  on(document, 'keydown', (event) => {
    if (event.key === 'Escape') closeQuickView();
  });

  // Global quick view / quick add — works for every grid on the site.
  delegate(document, 'click', '[data-quick-view]', (event, el) => {
    event.preventDefault();
    openQuickView(el.dataset.quickView);
  });

  delegate(document, 'click', '[data-quick-add]', (event, el) => {
    event.preventDefault();
    const product = getBySlug(el.dataset.quickAdd);
    if (!product) return;
    // Products with real choices open quick view so the shopper picks one.
    if (product.variants.length > 1 && product.variantLabel !== 'Style') {
      openQuickView(product.slug);
      return;
    }
    const result = cart.add(product.id, firstAvailableVariant(product)?.id, 1);
    toast(result.message, { tone: result.ok ? 'success' : 'error' });
    if (result.ok) openCart();
  });
}
