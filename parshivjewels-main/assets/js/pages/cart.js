/* ══════════════════════════════════════════════════════════════
   CART PAGE
   The full-page counterpart to the drawer. Shares cartParts.js for
   line controls, coupon form and summary rows, so the two surfaces
   present identical numbers and behave identically.
   ══════════════════════════════════════════════════════════════ */
import { $, esc, refreshImages } from '../core/dom.js';
import { href } from '../core/router.js';
import { inr, pluralise } from '../core/format.js';
import { observeReveals } from '../core/reveal.js';
import { toast } from '../core/toast.js';
import * as cart from '../services/cartService.js';
import { track, EVENTS } from '../services/analyticsService.js';
import { recommendFor } from '../services/catalogService.js';
import { productGrid } from '../components/productCard.js';
import { lineControls, couponForm, summaryRows } from '../components/cartParts.js';
import { breadcrumbs, emptyState, pageHeading, WHATSAPP_ICON } from '../components/ui.js';
import { proceedToWhatsApp } from '../components/cartDrawer.js';
import { COUPONS } from '../config/site.config.js';

const CRUMBS = [{ label: 'Home', href: '/' }, { label: 'Cart', href: '/cart' }];

function lineRow(line) {
  const showVariant = line.variant.label && line.variant.label !== 'One Size';
  return `
  <div class="panel flex flex-col gap-5 p-5 sm:flex-row sm:items-center" data-cart-line="${line.key}" data-reveal="up">
    <a href="${href(line.product.url)}" class="shrink-0">
      <img src="${line.product.image.src}" onerror="imgFix(this)" alt="${esc(line.product.image.alt)}"
        width="128" height="160" loading="lazy" decoding="async"
        class="h-40 w-full rounded-xl bg-night object-cover sm:h-32 sm:w-28">
    </a>
    <div class="min-w-0 flex-1">
      <p class="text-[11px] uppercase tracking-[0.28em] text-gold">${esc(line.product.categoryName)}</p>
      <h2 class="mt-1 font-display text-2xl leading-tight text-ivory">
        <a href="${href(line.product.url)}" class="transition hover:text-gold-light">${esc(line.product.name)}</a>
      </h2>
      ${showVariant ? `<p class="mt-1 text-[13px] text-sand/80">${esc(line.variantLabel)}: <span class="text-ivory">${esc(line.variant.label)}</span></p>` : ''}
      <p class="mt-0.5 text-[12px] text-sand/60">SKU ${esc(line.variant.sku)}</p>
      <div class="mt-3 flex flex-wrap items-center gap-4">
        <p class="text-[15px] text-gold">${inr(line.price)}</p>
        ${line.compareAt > line.price ? `<p class="text-[13px] text-sand/60 line-through">${inr(line.compareAt)}</p>` : ''}
      </div>
      ${lineControls(line, { size: 'lg' })}
    </div>
    <div class="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-between sm:self-stretch">
      <button type="button" data-cart-remove class="text-[12px] uppercase tracking-[0.18em] text-sand transition hover:text-danger">Remove</button>
      <p class="font-display text-2xl text-ivory">${inr(line.lineTotal)}</p>
    </div>
  </div>`;
}

function couponHints(snapshot) {
  if (snapshot.totals.coupon) return '';
  const available = COUPONS.filter(
    (coupon) => !coupon.minSubtotal || snapshot.totals.subtotal >= coupon.minSubtotal * 0.6
  ).slice(0, 2);
  if (!available.length) return '';
  return `<div class="mt-4 space-y-1.5 text-[12px] text-sand/70">
    ${available
      .map(
        (coupon) =>
          `<p><button type="button" data-use-coupon="${esc(coupon.code)}" class="text-gold-light underline underline-offset-4 transition hover:text-gold">${esc(
            coupon.code
          )}</button> — ${esc(coupon.description)}</p>`
      )
      .join('')}
  </div>`;
}

function renderContents(snapshot) {
  const { lines, totals } = snapshot;

  if (!lines.length) {
    return emptyState({
      title: 'Your cart is empty',
      message: 'Nothing here yet. Discover pieces made to be worn for a very long time.',
      actions: [
        { label: 'Shop All Jewellery', href: '/shop' },
        { label: 'View Best Sellers', href: '/shop/best-sellers' },
      ],
    });
  }

  const picks = recommendFor(lines.map((line) => line.productId), 4);

  return `
  <div class="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
    <div>
      <div class="flex items-center justify-between gap-4">
        <p class="text-[13px] uppercase tracking-[0.18em] text-sand">${pluralise(totals.itemCount, 'item')} in your cart</p>
        <button type="button" data-clear-cart class="text-[12px] uppercase tracking-[0.18em] text-sand transition hover:text-danger">Clear cart</button>
      </div>
      <div class="mt-5 space-y-5">${lines.map(lineRow).join('')}</div>
      <a href="${href('/shop')}" class="btn-line mt-8 inline-flex px-8 py-3.5">← Continue Shopping</a>
    </div>

    <aside class="panel p-8 lg:sticky lg:top-40" aria-labelledby="summary-heading">
      <h2 id="summary-heading" class="font-display text-2xl font-semibold text-ivory">Order Summary</h2>
      ${couponForm(snapshot, 'page')}
      ${couponHints(snapshot)}
      <div class="mt-6 space-y-2.5 text-[15px]">${summaryRows(totals)}</div>
      ${
        totals.totalSavings > 0
          ? `<p class="mt-3 rounded-full border border-success/25 bg-success/10 px-4 py-2 text-center text-[13px] text-success">You’re saving ${inr(totals.totalSavings)} on this order</p>`
          : ''
      }
      <button type="button" data-proceed class="btn-gold mt-6 w-full py-4">${WHATSAPP_ICON}Proceed to WhatsApp</button>
      <p class="mt-3 text-center text-[12px] leading-relaxed text-sand/70">
        We’ll prepare your enquiry in WhatsApp with every item, quantity and the estimated total. A specialist confirms availability and final pricing before any payment.
      </p>
      <div class="mt-6 grid grid-cols-2 gap-3 border-t border-line/5 pt-5 text-center text-[11px] uppercase tracking-[0.16em] text-sand/70">
        <p>🛡 BIS Hallmarked</p><p>📦 Insured Shipping</p>
        <p>↩ 30-Day Returns</p><p>💬 Specialist Support</p>
      </div>
    </aside>
  </div>

  ${
    picks.length
      ? `<section class="mt-24" aria-labelledby="cart-recs">
          <div data-reveal="up">
            <p class="eyebrow">Chosen for you</p>
            <h2 id="cart-recs" class="draw mt-4 font-display text-3xl font-semibold text-ivory sm:text-4xl">You May Also <em class="accent-it">Like</em></h2>
          </div>
          <div class="mt-10">${productGrid(picks, { columns: 4, eagerCount: 0, compact: true })}</div>
        </section>`
      : ''
  }`;
}

export default function cartPage({ path }) {
  const snapshot = cart.getSnapshot();
  track(EVENTS.CART_VIEW, { value: snapshot.totals.total, itemCount: snapshot.totals.itemCount });

  return {
    meta: {
      title: 'Your Cart',
      description:
        'Review your Parshiv Jewels selection and send your enquiry directly to our specialists on WhatsApp.',
      path,
      noindex: true,
    },
    html: `<div class="page-anim mx-auto max-w-[1500px] px-5 py-14 lg:px-8">
      ${breadcrumbs(CRUMBS)}
      <div class="mt-6">
        ${pageHeading({ eyebrow: 'Almost yours', title: 'Your', accent: 'Cart' })}
      </div>
      <div id="cartPageContents">${renderContents(snapshot)}</div>
    </div>`,
    onMount: (scope) => mount(scope),
  };
}

function mount(scope) {
  const { delegate } = scope;
  const root = $('#main');

  const rerender = () => {
    const container = $('#cartPageContents', root);
    if (!container) return;
    container.innerHTML = renderContents(cart.getSnapshot());
    observeReveals(container);
    refreshImages(container);
  };

  const lineOf = (el) => {
    const key = el.closest('[data-cart-line]')?.dataset.cartLine;
    if (!key) return null;
    const [productId, variantId] = key.split('::');
    return { productId: Number(productId), variantId: variantId === 'default' ? null : variantId };
  };

  delegate(root, 'click', '[data-cart-inc],[data-cart-dec],[data-cart-remove]', (event, el) => {
    const line = lineOf(el);
    if (!line) return;
    let result;
    if (el.hasAttribute('data-cart-inc')) result = cart.increment(line.productId, line.variantId);
    else if (el.hasAttribute('data-cart-dec')) result = cart.decrement(line.productId, line.variantId);
    else result = cart.remove(line.productId, line.variantId);
    if (result.message) toast(result.message, { tone: result.tone });
  });

  delegate(root, 'change', '[data-cart-qty]', (event, el) => {
    const line = lineOf(el);
    if (!line) return;
    const result = cart.setQty(line.productId, line.variantId, el.value);
    if (result.message) toast(result.message, { tone: result.tone });
  });

  delegate(root, 'submit', '[data-coupon-form]', (event, form) => {
    event.preventDefault();
    const input = $('[data-coupon-input]', form);
    const result = cart.applyCoupon(input.value);
    toast(result.message, { tone: result.tone });
  });

  delegate(root, 'click', '[data-use-coupon]', (event, button) => {
    const result = cart.applyCoupon(button.dataset.useCoupon);
    toast(result.message, { tone: result.tone });
  });

  delegate(root, 'click', '[data-coupon-remove]', () => {
    const result = cart.removeCoupon();
    if (result.message) toast(result.message);
  });

  delegate(root, 'click', '[data-clear-cart]', () => {
    // Emptying a cart is destructive and easy to hit by accident.
    if (!window.confirm('Remove every item from your cart?')) return;
    const result = cart.clear();
    toast(result.message, { tone: result.tone });
  });

  delegate(root, 'click', '[data-proceed]', proceedToWhatsApp);

  // The page re-renders itself whenever cart state changes anywhere.
  scope.add(cart.onChange(rerender));
}
