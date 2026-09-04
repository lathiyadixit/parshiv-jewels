/* Cart fragments shared by the drawer and the full cart page, so the two
   surfaces can never disagree about how a line or a total is presented. */
import { esc } from '../core/dom.js';
import { inr } from '../core/format.js';

/** Minus / value / plus control with a keyboard-editable number input. */
export function lineControls(line, { size = 'sm' } = {}) {
  const button = size === 'lg' ? 'h-9 w-9 text-lg' : 'h-7 w-7 text-base';
  const field = size === 'lg' ? 'w-11 py-1.5 text-[15px]' : 'w-9 py-1 text-[14px]';
  const atMax = line.qty >= line.maxQty;

  return `<div class="qty mt-3">
    <button type="button" data-cart-dec class="${button} leading-none"
      aria-label="Decrease quantity of ${esc(line.product.name)}">−</button>
    <label class="sr-only" for="qty-${line.key}">Quantity for ${esc(line.product.name)}</label>
    <input id="qty-${line.key}" data-cart-qty type="number" inputmode="numeric"
      min="1" max="${line.maxQty}" value="${line.qty}" class="${field}">
    <button type="button" data-cart-inc class="${button} leading-none" ${atMax ? 'disabled' : ''}
      aria-label="Increase quantity of ${esc(line.product.name)}">+</button>
  </div>`;
}

export function couponForm(snapshot, scope = 'page') {
  const applied = snapshot.totals.coupon;
  if (applied) {
    return `<div class="mt-4 flex items-center justify-between gap-3 rounded-full border border-success/30 bg-success/10 px-4 py-2.5">
      <span class="text-[13px] text-success">
        <span class="font-semibold uppercase tracking-[0.14em]">${esc(applied.code)}</span> applied
      </span>
      <button type="button" data-coupon-remove class="text-xs uppercase tracking-[0.18em] text-sand transition hover:text-danger">Remove</button>
    </div>`;
  }
  return `<form data-coupon-form class="mt-4 flex gap-2" novalidate>
    <label class="sr-only" for="coupon-${scope}">Promo code</label>
    <input id="coupon-${scope}" data-coupon-input class="field flex-1" placeholder="Promo code" autocomplete="off" spellcheck="false">
    <button type="submit" class="btn-line shrink-0 px-5 py-2.5 text-xs">Apply</button>
  </form>`;
}

export function summaryRows(totals) {
  const row = (label, value, extra = '') =>
    `<div class="flex justify-between ${extra}"><span>${label}</span><span class="text-ivory">${value}</span></div>`;

  return [
    row('Subtotal', inr(totals.subtotal)),
    totals.catalogSavings > 0
      ? `<div class="flex justify-between"><span>Catalogue saving</span><span class="text-success">−${inr(totals.catalogSavings)}</span></div>`
      : '',
    totals.discount > 0
      ? `<div class="flex justify-between"><span>Discount (${esc(totals.coupon.code)})</span><span class="text-success">−${inr(totals.discount)}</span></div>`
      : '',
    `<div class="flex justify-between"><span>Shipping</span><span class="font-medium text-success">${
      totals.shipping === 0 ? esc(totals.shippingLabel) : inr(totals.shipping)
    }</span></div>`,
    row(esc(totals.taxLabel), inr(totals.tax)),
    `<div class="flex justify-between border-t border-gold/20 pt-3 text-base font-semibold text-ivory"><span>Estimated Total</span><span class="text-gold">${inr(
      totals.total
    )}</span></div>`,
  ]
    .filter(Boolean)
    .join('');
}
