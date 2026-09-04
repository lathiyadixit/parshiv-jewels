/* ══════════════════════════════════════════════════════════════
   CART DRAWER
   Renders the cart-service snapshot into the existing #cartDrawer
   markup. Holds no cart logic of its own — every interaction goes
   through cartService, and the drawer simply re-renders on `change`.
   ══════════════════════════════════════════════════════════════ */
import { $, esc, delegate, on, lockScroll, unlockScroll, trapFocus, refreshImages } from '../core/dom.js';
import { inr } from '../core/format.js';
import { href, go } from '../core/router.js';
import { toast, toastError } from '../core/toast.js';
import * as cart from '../services/cartService.js';
import { recommendFor } from '../services/catalogService.js';
import { sendCart } from '../services/whatsappService.js';
import { askForEnquiryDetails } from './enquiryDialog.js';
import { lineControls, couponForm, summaryRows } from './cartParts.js';

let lastFocused = null;
let released = null;

export function isOpen() {
  return !$('#cartDrawer')?.classList.contains('translate-x-full');
}

export function openCart() {
  const drawer = $('#cartDrawer');
  if (!drawer || isOpen()) return;
  lastFocused = document.activeElement;
  drawer.classList.remove('translate-x-full');
  drawer.setAttribute('aria-hidden', 'false');
  $('#cartOverlay').classList.remove('opacity-0', 'pointer-events-none');
  lockScroll();
  released = trapFocus(drawer);
  requestAnimationFrame(() => $('#cartClose')?.focus());
}

export function closeCart() {
  const drawer = $('#cartDrawer');
  if (!drawer || !isOpen()) return;
  drawer.classList.add('translate-x-full');
  drawer.setAttribute('aria-hidden', 'true');
  $('#cartOverlay').classList.add('opacity-0', 'pointer-events-none');
  unlockScroll();
  released?.();
  released = null;
  lastFocused?.focus?.();
}

/* ─────────────── Rendering ─────────────── */

function lineItem(line) {
  const showVariant = line.variant.label && line.variant.label !== 'One Size';
  return `
  <div class="mb-4 flex gap-4 rounded-xl border border-line/5 bg-card p-3" data-cart-line="${line.key}">
    <a href="${href(line.product.url)}" data-cart-nav class="shrink-0">
      <img src="${line.product.image.src}" onerror="imgFix(this)" alt="${esc(line.product.image.alt)}"
        width="64" height="80" loading="lazy" decoding="async" class="h-20 w-16 rounded-lg bg-night object-cover">
    </a>
    <div class="min-w-0 flex-1">
      <a href="${href(line.product.url)}" data-cart-nav class="font-display text-lg leading-tight text-ivory transition hover:text-gold-light">${esc(
        line.product.name
      )}</a>
      ${showVariant ? `<p class="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-sand/80">${esc(line.variantLabel)}: ${esc(line.variant.label)}</p>` : ''}
      <p class="text-sm text-gold">${inr(line.price)}</p>
      ${lineControls(line)}
    </div>
    <div class="flex flex-col items-end justify-between">
      <button type="button" data-cart-remove="${line.key}" class="text-sand transition hover:text-danger"
        aria-label="Remove ${esc(line.product.name)} from cart">✕</button>
      <p class="text-[15px] font-medium text-ivory">${inr(line.lineTotal)}</p>
    </div>
  </div>`;
}

function emptyDrawer() {
  return `<div class="flex h-full flex-col items-center justify-center gap-4 text-center">
    <span class="text-5xl text-gold/40" aria-hidden="true">◆</span>
    <p class="font-display text-2xl text-ivory">Your cart is empty</p>
    <p class="text-sm">Discover pieces crafted for forever.</p>
    <a href="${href('/shop')}" data-cart-nav class="btn-gold mt-3 px-8 py-3">Start Shopping</a>
    <a href="${href('/shop/best-sellers')}" data-cart-nav class="btn-line px-8 py-3">View Best Sellers</a>
  </div>`;
}

function recommendations(snapshot) {
  const picks = recommendFor(snapshot.lines.map((l) => l.productId), 2);
  if (!picks.length) return '';
  return `<div class="mt-6 border-t border-line/5 pt-5">
    <p class="text-[11px] uppercase tracking-[0.3em] text-gold">Complete the look</p>
    <div class="mt-4 space-y-3">
      ${picks
        .map(
          (product) => `
        <div class="flex items-center gap-3 rounded-xl border border-line/5 bg-card/60 p-2.5">
          <a href="${href(product.url)}" data-cart-nav class="shrink-0">
            <img src="${product.image.src}" onerror="imgFix(this)" alt="${esc(product.image.alt)}"
              width="48" height="48" loading="lazy" decoding="async" class="h-12 w-12 rounded-lg bg-night object-cover">
          </a>
          <div class="min-w-0 flex-1">
            <a href="${href(product.url)}" data-cart-nav class="block truncate text-sm text-ivory transition hover:text-gold-light">${esc(product.name)}</a>
            <p class="text-xs text-gold">${inr(product.price)}</p>
          </div>
          <button type="button" data-quick-add="${product.slug}" class="btn-line shrink-0 px-4 py-1.5 text-[11px]">Add</button>
        </div>`
        )
        .join('')}
    </div>
  </div>`;
}

export function renderDrawer(snapshot = cart.getSnapshot()) {
  const { lines, totals } = snapshot;
  const badge = $('#cartCount');
  const items = $('#cartItems');
  const footer = $('#cartFooter');
  if (!items || !footer) return;

  if (badge) {
    badge.textContent = totals.itemCount;
    badge.classList.toggle('hidden', !totals.itemCount);
    badge.classList.toggle('flex', !!totals.itemCount);
    badge.classList.remove('pop');
    void badge.offsetWidth;
    badge.classList.add('pop');
  }
  const headerCount = $('#cartHeaderCount');
  if (headerCount) headerCount.textContent = `(${totals.itemCount})`;

  if (!lines.length) {
    items.innerHTML = emptyDrawer();
    footer.classList.add('hidden');
    return;
  }

  footer.classList.remove('hidden');
  items.innerHTML = lines.map(lineItem).join('') + recommendations(snapshot);
  footer.innerHTML = `
    <h3 class="font-display text-xl font-semibold text-ivory">Order Summary</h3>
    ${couponForm(snapshot, 'drawer')}
    <div class="mt-4 space-y-2.5 text-[15px]">${summaryRows(totals)}</div>
    <button type="button" id="waOrderBtn" class="btn-gold mt-5 w-full py-4">Proceed to WhatsApp</button>
    <div class="mt-3 grid grid-cols-2 gap-3">
      <a href="${href('/cart')}" data-cart-nav class="btn-line btn-compact">View Cart</a>
      <button type="button" id="continueShopping" class="btn-line btn-compact">Continue Shopping</button>
    </div>
    <p class="mt-4 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em] text-sand/80">
      <svg class="h-3.5 w-3.5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      Enquire securely on WhatsApp
    </p>`;
  refreshImages(items);
}

/* ─────────────── Proceed to WhatsApp ─────────────── */

export async function proceedToWhatsApp() {
  const snapshot = cart.getSnapshot();
  if (!snapshot.lines.length) {
    toastError('Cart is empty');
    return;
  }

  // Collect who is asking before handing off, so the shop can reply to a
  // name rather than an unknown number.
  closeCart();
  const customer = await askForEnquiryDetails({
    title: 'Send your enquiry',
    summary: 'Add your details so we can reply to you directly and keep your enquiry together.',
    total: snapshot.totals.total,
    itemCount: snapshot.totals.itemCount,
  });
  if (!customer) return; // dismissed — cart is untouched

  toast('Opening WhatsApp…');
  const result = sendCart(snapshot, { customer });
  go('/order-enquiry', { query: { ref: result.reference } });
  if (result.blocked) {
    toastError('Your browser blocked the WhatsApp tab — use the button below.');
  }
}

/* ─────────────── Wiring ─────────────── */

export function initCartDrawer() {
  const drawer = $('#cartDrawer');
  if (!drawer) return;

  on($('#cartBtn'), 'click', openCart);
  on($('#cartClose'), 'click', closeCart);
  on($('#cartOverlay'), 'click', closeCart);

  // Quantity, removal and coupon interactions inside the drawer.
  delegate(drawer, 'click', '[data-cart-inc],[data-cart-dec],[data-cart-remove]', (event, el) => {
    const line = findLine(el);
    if (!line) return;
    let result;
    if (el.hasAttribute('data-cart-inc')) result = cart.increment(line.productId, line.variantId);
    else if (el.hasAttribute('data-cart-dec')) result = cart.decrement(line.productId, line.variantId);
    else result = cart.remove(line.productId, line.variantId);
    if (result.message) toast(result.message, { tone: result.tone });
  });

  delegate(drawer, 'change', '[data-cart-qty]', (event, el) => {
    const line = findLine(el);
    if (!line) return;
    const result = cart.setQty(line.productId, line.variantId, el.value);
    if (result.message) toast(result.message, { tone: result.tone });
    if (!result.ok) renderDrawer();
  });

  delegate(drawer, 'submit', '[data-coupon-form]', (event, form) => {
    event.preventDefault();
    const input = $('[data-coupon-input]', form);
    const result = cart.applyCoupon(input.value);
    toast(result.message, { tone: result.tone });
    if (!result.ok) input.focus();
  });

  delegate(drawer, 'click', '[data-coupon-remove]', () => {
    const result = cart.removeCoupon();
    if (result.message) toast(result.message);
  });

  delegate(drawer, 'click', '#waOrderBtn', proceedToWhatsApp);
  delegate(drawer, 'click', '#continueShopping', () => {
    closeCart();
    go('/shop');
  });
  delegate(drawer, 'click', '[data-cart-nav]', closeCart);

  on(document, 'keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) closeCart();
  });

  cart.onChange(renderDrawer);
  renderDrawer();
}

/** Map a `data-cart-line` key back to product + variant ids. */
function findLine(el) {
  const key = el.closest('[data-cart-line]')?.dataset.cartLine;
  if (!key) return null;
  const [productId, variantId] = key.split('::');
  return { productId: Number(productId), variantId: variantId === 'default' ? null : variantId };
}
