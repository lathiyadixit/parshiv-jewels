/* ══════════════════════════════════════════════════════════════
   PRICING SERVICE
   All money maths lives here: line totals, coupons, shipping, tax.
   Pure functions over plain data, so the rules can be unit-tested
   without a browser and can never diverge between cart drawer,
   cart page and the WhatsApp message.
   ══════════════════════════════════════════════════════════════ */
import { COMMERCE, COUPONS } from '../config/site.config.js';

/**
 * Money is handled in whole rupees. Indian jewellery retail does not quote
 * paise, and rounding at every step keeps the cart, the summary and the
 * WhatsApp message showing exactly the same figures.
 */
const round = (value) => Math.round(Number(value) + Number.EPSILON);

export function findCoupon(code) {
  if (!code) return null;
  const needle = String(code).trim().toUpperCase();
  return COUPONS.find((coupon) => coupon.code === needle) || null;
}

/**
 * Validate a coupon against the current lines.
 * @returns {{ok: boolean, coupon?: object, reason?: string}}
 */
export function validateCoupon(code, lines) {
  const coupon = findCoupon(code);
  if (!coupon) return { ok: false, reason: 'That code isn’t valid.' };

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      reason: `Add ${COMMERCE.currencySymbol}${(coupon.minSubtotal - subtotal).toLocaleString(
        COMMERCE.locale
      )} more to use ${coupon.code}.`,
    };
  }
  if (coupon.collection) {
    const eligible = lines.some((line) => line.collections?.includes(coupon.collection));
    if (!eligible) {
      return { ok: false, reason: `${coupon.code} applies to the ${coupon.collection.replace(/-/g, ' ')} collection only.` };
    }
  }
  return { ok: true, coupon };
}

/** Amount a coupon takes off, capped at the eligible subtotal. */
export function discountFor(coupon, lines) {
  if (!coupon) return 0;
  const eligibleLines = coupon.collection
    ? lines.filter((line) => line.collections?.includes(coupon.collection))
    : lines;
  const eligibleSubtotal = eligibleLines.reduce((sum, line) => sum + line.lineTotal, 0);
  if (eligibleSubtotal <= 0) return 0;

  const raw = coupon.type === 'percent' ? (eligibleSubtotal * coupon.value) / 100 : coupon.value;
  return round(Math.min(raw, eligibleSubtotal));
}

export function shippingFor(subtotalAfterDiscount) {
  const { flat, freeAbove } = COMMERCE.shipping;
  if (flat === 0) return 0;
  return subtotalAfterDiscount >= freeAbove ? 0 : flat;
}

/**
 * Build the full money breakdown for a set of cart lines.
 * @param {Array<{lineTotal:number, compareAtTotal:number, collections:string[]}>} lines
 * @param {object|null} coupon
 */
export function totals(lines, coupon = null) {
  const subtotal = round(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const compareAtSubtotal = round(
    lines.reduce((sum, line) => sum + (line.compareAtTotal || line.lineTotal), 0)
  );
  const catalogSavings = round(Math.max(0, compareAtSubtotal - subtotal));

  const discount = discountFor(coupon, lines);
  const discountedSubtotal = round(Math.max(0, subtotal - discount));
  const shipping = shippingFor(discountedSubtotal);
  const tax = round(discountedSubtotal * COMMERCE.taxRate);
  const total = round(discountedSubtotal + shipping + tax);

  return {
    itemCount: lines.reduce((sum, line) => sum + line.qty, 0),
    lineCount: lines.length,
    subtotal,
    compareAtSubtotal,
    catalogSavings,
    coupon: coupon ? { ...coupon } : null,
    discount,
    discountedSubtotal,
    shipping,
    shippingLabel: shipping === 0 ? COMMERCE.shipping.label : null,
    tax,
    taxLabel: COMMERCE.taxLabel,
    total,
    totalSavings: round(catalogSavings + discount),
  };
}
