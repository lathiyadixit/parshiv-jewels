/* ══════════════════════════════════════════════════════════════
   CART SERVICE
   The single source of truth for cart state. Components never mutate
   the cart directly — they call these methods and re-render from the
   `change` event. Persisted to localStorage and revalidated against
   the catalog on every load, so a stale cart can never break a render.
   ══════════════════════════════════════════════════════════════ */
import { createEmitter } from '../core/emitter.js';
import { read, write } from '../core/storage.js';
import { STORAGE_KEYS, COMMERCE } from '../config/site.config.js';
import { getById, getVariant, firstAvailableVariant } from './catalogService.js';
import { totals, validateCoupon, findCoupon } from './pricingService.js';
import { track, EVENTS } from './analyticsService.js';

const emitter = createEmitter();
export const onChange = (handler) => emitter.on('change', handler);
export const onNotice = (handler) => emitter.on('notice', handler);

/** Persisted shape: `{ items: [{productId, variantId, qty, price}], coupon }` */
let state = { items: [], coupon: null };

const lineKey = (productId, variantId) => `${productId}::${variantId || 'default'}`;

/* ─────────────── Persistence & validation ─────────────── */

function persist() {
  write(STORAGE_KEYS.cart, {
    items: state.items.map(({ productId, variantId, qty, price }) => ({
      productId,
      variantId,
      qty,
      price,
    })),
    coupon: state.coupon ? state.coupon.code : null,
  });
}

/**
 * Reconcile a stored cart against the live catalog.
 * Handles: deleted products, removed variants, sold-out items, quantity
 * beyond stock, and price changes since the item was added.
 */
function reconcile(stored) {
  const notices = [];
  const items = [];
  const merged = new Map();

  (stored?.items || []).forEach((entry) => {
    const product = getById(entry.productId);
    if (!product) {
      notices.push('An item is no longer available and was removed from your cart.');
      return;
    }
    let variant = getVariant(product, entry.variantId);
    if (!variant) {
      variant = firstAvailableVariant(product);
      if (variant) notices.push(`${product.name}: your saved option is gone, we selected ${variant.label}.`);
    }
    if (!variant || !variant.available || !product.inStock) {
      notices.push(`${product.name} is out of stock and was removed from your cart.`);
      return;
    }

    const key = lineKey(product.id, variant.id);
    const cap = maxQtyFor(variant);
    let qty = clampQty(entry.qty, cap);

    // Duplicate lines for the same product+variant collapse into one.
    if (merged.has(key)) {
      const existing = merged.get(key);
      existing.qty = clampQty(existing.qty + qty, cap);
      return;
    }

    if (qty !== entry.qty) {
      // Distinguish "we ran out" from "that saved quantity was nonsense".
      notices.push(
        Number(entry.qty) > cap
          ? `${product.name}: quantity reduced to ${qty} — only ${cap} available.`
          : `${product.name}: saved quantity was invalid and has been reset to ${qty}.`
      );
    }
    if (entry.price != null && Number(entry.price) !== variant.price) {
      notices.push(`${product.name}: the price has been updated to the current price.`);
    }

    const line = { productId: product.id, variantId: variant.id, qty, price: variant.price };
    merged.set(key, line);
    items.push(line);
  });

  const coupon = findCoupon(stored?.coupon);
  return { cart: { items: [...merged.values()], coupon }, notices };
}

function clampQty(qty, cap) {
  const n = Math.floor(Number(qty));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, cap);
}

/** "Only 1 is available." / "Only 4 are available." */
function stockMessage(cap) {
  return `Only ${cap} ${cap === 1 ? 'is' : 'are'} available.`;
}

function maxQtyFor(variant) {
  return Math.max(1, Math.min(COMMERCE.maxQtyPerLine, variant.inventory || COMMERCE.maxQtyPerLine));
}

/* ─────────────── Read model ─────────────── */

/** Hydrate stored lines into renderable lines with product + money data. */
function buildLines() {
  return state.items
    .map((entry) => {
      const product = getById(entry.productId);
      if (!product) return null;
      const variant = getVariant(product, entry.variantId);
      if (!variant) return null;
      const price = variant.price;
      const compareAt = variant.compareAt || price;
      return {
        key: lineKey(product.id, variant.id),
        productId: product.id,
        variantId: variant.id,
        product,
        variant,
        variantLabel: product.variantLabel,
        qty: entry.qty,
        maxQty: maxQtyFor(variant),
        price,
        compareAt,
        lineTotal: price * entry.qty,
        compareAtTotal: compareAt * entry.qty,
        collections: product.collections,
      };
    })
    .filter(Boolean);
}

/** The complete cart view model: lines + every money figure. */
export function getSnapshot() {
  const lines = buildLines();
  return { lines, totals: totals(lines, state.coupon), coupon: state.coupon };
}

export const getCount = () => state.items.reduce((sum, item) => sum + item.qty, 0);
export const isEmpty = () => state.items.length === 0;
export const getLineQty = (productId, variantId) =>
  state.items.find((i) => lineKey(i.productId, i.variantId) === lineKey(productId, variantId))?.qty || 0;

/* ─────────────── Mutations ─────────────── */

function commit(reason, detail = {}) {
  persist();
  emitter.emit('change', { ...getSnapshot(), reason, detail });
}

/**
 * @returns {{ok: boolean, message: string, tone?: 'error'}}
 */
export function add(productId, variantId = null, qty = 1) {
  const product = getById(productId);
  if (!product) return { ok: false, message: 'That piece is no longer available.', tone: 'error' };
  if (!product.inStock) return { ok: false, message: `${product.name} is out of stock.`, tone: 'error' };

  const variant = getVariant(product, variantId) || firstAvailableVariant(product);
  if (!variant) return { ok: false, message: 'No options available for this piece.', tone: 'error' };
  if (!variant.available) {
    return { ok: false, message: `${product.variantLabel} ${variant.label} is sold out.`, tone: 'error' };
  }

  const cap = maxQtyFor(variant);
  const requested = clampQty(qty, cap);
  const key = lineKey(product.id, variant.id);
  const existing = state.items.find((item) => lineKey(item.productId, item.variantId) === key);

  if (existing) {
    const next = Math.min(existing.qty + requested, cap);
    if (next === existing.qty) {
      return { ok: false, message: stockMessage(cap), tone: 'error' };
    }
    existing.qty = next;
  } else {
    state.items.push({ productId: product.id, variantId: variant.id, qty: requested, price: variant.price });
  }

  track(EVENTS.ADD_TO_CART, {
    slug: product.slug, name: product.name, sku: variant.sku,
    variant: variant.label, price: variant.price, qty: requested, category: product.categorySlug,
  });
  commit('add', { productId: product.id, variantId: variant.id });
  // Say so when we couldn't honour the whole requested quantity.
  if (requested < qty) {
    return { ok: true, message: `${product.name} added — ${stockMessage(cap)}`, tone: 'error' };
  }
  return { ok: true, message: `${product.name} added to cart` };
}

export function setQty(productId, variantId, qty) {
  const key = lineKey(productId, variantId);
  const item = state.items.find((i) => lineKey(i.productId, i.variantId) === key);
  if (!item) return { ok: false, message: 'That item is no longer in your cart.', tone: 'error' };

  const product = getById(productId);
  const variant = getVariant(product, variantId);
  const cap = variant ? maxQtyFor(variant) : COMMERCE.maxQtyPerLine;
  const next = Math.floor(Number(qty));

  if (!Number.isFinite(next) || next < 1) return remove(productId, variantId);
  if (next > cap) {
    item.qty = cap;
    commit('update', { productId, variantId });
    return { ok: false, message: `${stockMessage(cap)} Quantity set to ${cap}.`, tone: 'error' };
  }
  if (next === item.qty) return { ok: true, message: '' };

  item.qty = next;
  commit('update', { productId, variantId });
  return { ok: true, message: 'Quantity updated' };
}

export const increment = (productId, variantId) =>
  setQty(productId, variantId, getLineQty(productId, variantId) + 1);

export const decrement = (productId, variantId) => {
  const current = getLineQty(productId, variantId);
  if (current <= 1) return remove(productId, variantId);
  return setQty(productId, variantId, current - 1);
};

export function remove(productId, variantId) {
  const key = lineKey(productId, variantId);
  const index = state.items.findIndex((i) => lineKey(i.productId, i.variantId) === key);
  if (index === -1) return { ok: false, message: '' };
  const product = getById(productId);
  if (product) {
    track(EVENTS.REMOVE_FROM_CART, { slug: product.slug, name: product.name, price: product.price });
  }
  state.items.splice(index, 1);
  commit('remove', { productId, variantId });
  return { ok: true, message: `${product ? product.name : 'Item'} removed from cart` };
}

export function clear() {
  if (!state.items.length) return { ok: false, message: 'Your cart is already empty.' };
  state.items = [];
  state.coupon = null;
  commit('clear');
  return { ok: true, message: 'Cart cleared' };
}

/* ─────────────── Coupons ─────────────── */

export function applyCoupon(code) {
  const result = validateCoupon(code, buildLines());
  if (!result.ok) return { ok: false, message: result.reason, tone: 'error' };
  state.coupon = result.coupon;
  track(EVENTS.COUPON_APPLIED, { code: result.coupon.code, type: result.coupon.type, value: result.coupon.value });
  commit('coupon');
  return { ok: true, message: `${result.coupon.code} applied — ${result.coupon.description}` };
}

export function removeCoupon() {
  if (!state.coupon) return { ok: false, message: '' };
  const code = state.coupon.code;
  state.coupon = null;
  commit('coupon');
  return { ok: true, message: `${code} removed` };
}

/* ─────────────── Lifecycle ─────────────── */

/**
 * Load and revalidate the persisted cart. Returns any notices raised
 * during reconciliation so the caller can surface them once, on boot.
 */
export function hydrate() {
  const stored = read(STORAGE_KEYS.cart, null);
  const { cart, notices } = reconcile(stored);
  state = cart;

  // Re-validate a stored coupon against the reconciled lines.
  if (state.coupon) {
    const check = validateCoupon(state.coupon.code, buildLines());
    if (!check.ok) {
      notices.push(`${state.coupon.code} no longer applies and was removed.`);
      state.coupon = null;
    }
  }

  persist();
  emitter.emit('change', { ...getSnapshot(), reason: 'hydrate' });
  if (notices.length) emitter.emit('notice', notices);
  return notices;
}

/** Keep multiple open tabs in sync. */
export function watchOtherTabs() {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEYS.cart) return;
    const { cart } = reconcile(read(STORAGE_KEYS.cart, null));
    state = cart;
    emitter.emit('change', { ...getSnapshot(), reason: 'sync' });
  });
}
