/* Commerce repositories — enquiries, orders, customers, coupons, reviews.
   Money and status rules live here, never in a page. */
import * as db from '../data/db.js';
import { getEvents, EVENTS } from '../../services/analyticsService.js';

const C = db.COLLECTIONS;

export const ENQUIRY_STATUSES = ['new', 'contacted', 'in-discussion', 'converted', 'closed'];
export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

/* ─────────────── Enquiries ─────────────── */

/** Event ids whose enquiry the admin deleted; never import them again. */
const DISMISSED = 'dismissedEnquiries';

const listDismissed = async () => new Set(await db.getDoc(DISMISSED, []));
export const countDismissedEnquiries = async () => (await db.getDoc(DISMISSED, [])).length;

/**
 * Enquiries come from two places: rows the admin has already saved, and
 * WhatsApp-click events the storefront logged that aren't recorded yet.
 * Importing turns those events into editable records exactly once.
 *
 * Deleting an enquiry removes the record but not the event behind it — the
 * click genuinely happened and still counts in analytics — so deleted event
 * ids are tombstoned here, or the next sync would resurrect them.
 */
export async function syncEnquiriesFromEvents() {
  const existing = await db.list(C.enquiries);
  const known = new Set(existing.map((e) => e.eventId));
  const dismissed = await listDismissed();
  const clicks = getEvents().filter(
    (e) => e.type === EVENTS.WHATSAPP_CLICK && !known.has(e.id) && !dismissed.has(e.id)
  );

  let imported = 0;
  for (const event of clicks) {
    const p = event.payload || {};
    // The storefront now asks for these before handing off, so most
    // enquiries arrive already identified.
    const customer = p.customer || {};
    await db.insert(C.enquiries, {
      eventId: event.id,
      reference: p.reference || '',
      at: event.at,
      items: p.items || [],
      itemCount: p.itemCount || 0,
      value: p.value || 0,
      device: event.device,
      source: event.source,
      page: event.path,
      context: p.context || 'cart',
      customerName: customer.name || '',
      phone: customer.phone || '',
      customerNote: customer.note || '',
      // Bespoke commissions carry a brief instead of a basket.
      customDesign: p.customDesign || null,
      status: 'new',
      notes: '',
    });
    imported += 1;
  }
  return imported;
}

export const listEnquiries = () => db.list(C.enquiries);
export const getEnquiry = (id) => db.find(C.enquiries, id);
export const updateEnquiry = (id, patch) => db.update(C.enquiries, id, patch);
/** Remove an enquiry and remember not to re-import it from its event. */
export async function deleteEnquiry(id) {
  const enquiry = await db.find(C.enquiries, id);
  if (enquiry?.eventId) {
    const dismissed = await db.getDoc(DISMISSED, []);
    if (!dismissed.includes(enquiry.eventId)) {
      await db.setDoc(DISMISSED, [...dismissed, enquiry.eventId]);
    }
  }
  return db.remove(C.enquiries, id);
}

/** Clear the tombstones so every logged click is imported afresh. */
export async function restoreDismissedEnquiries() {
  const count = (await db.getDoc(DISMISSED, [])).length;
  await db.setDoc(DISMISSED, []);
  await syncEnquiriesFromEvents();
  return count;
}

export function queryEnquiries(rows, { search = '', status = '', from = null, to = null } = {}) {
  let out = rows.slice();
  if (search) {
    const q = search.toLowerCase();
    out = out.filter((e) =>
      [e.reference, e.customerName, e.phone, e.notes, (e.items || []).map((i) => i.name).join(' ')]
        .join(' ').toLowerCase().includes(q)
    );
  }
  if (status) out = out.filter((e) => e.status === status);
  if (from) out = out.filter((e) => new Date(e.at) >= from);
  if (to) out = out.filter((e) => new Date(e.at) <= to);
  return out.sort((a, b) => new Date(b.at) - new Date(a.at));
}

/* ─────────────── Orders ─────────────── */

/** Money is settled once, here, so every screen shows the same total. */
export function orderTotals({ items = [], discount = 0, shipping = 0, taxRate = 0 }) {
  const subtotal = items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
  const discounted = Math.max(0, subtotal - (Number(discount) || 0));
  const tax = Math.round(discounted * (Number(taxRate) || 0));
  const total = Math.round(discounted + (Number(shipping) || 0) + tax);
  return { subtotal: Math.round(subtotal), discount: Math.round(discount) || 0, shipping: Math.round(shipping) || 0, tax, total };
}

async function nextOrderNumber() {
  const rows = await db.list(C.orders);
  const year = new Date().getFullYear().toString().slice(-2);
  return `PJ${year}-${String(rows.length + 1).padStart(4, '0')}`;
}

export async function createOrder(data) {
  const totals = orderTotals(data);
  return db.insert(C.orders, {
    orderNumber: await nextOrderNumber(),
    status: 'pending',
    source: 'whatsapp',
    placedAt: new Date().toISOString(),
    ...data,
    ...totals,
  });
}

export async function updateOrder(id, patch) {
  const current = await db.find(C.orders, id);
  const merged = { ...current, ...patch };
  return db.update(C.orders, id, { ...patch, ...orderTotals(merged) });
}

export const listOrders = () => db.list(C.orders);
export const getOrder = (id) => db.find(C.orders, id);
export const deleteOrder = (id) => db.remove(C.orders, id);
export const setOrderStatus = (id, status) => db.update(C.orders, id, { status });

/** Turn an enquiry into an order and link the two. */
export async function convertEnquiry(enquiryId, extra = {}) {
  const enquiry = await db.find(C.enquiries, enquiryId);
  if (!enquiry) throw new Error('Enquiry not found');
  const order = await createOrder({
    enquiryId,
    customerName: extra.customerName || enquiry.customerName || 'WhatsApp customer',
    phone: extra.phone || enquiry.phone || '',
    items: (enquiry.items || []).map((i) => ({ name: i.name, sku: i.sku || '', price: i.price, qty: i.qty, variant: i.variant || '' })),
    discount: extra.discount || 0,
    shipping: extra.shipping || 0,
    taxRate: extra.taxRate || 0,
    notes: extra.notes || '',
    status: 'confirmed',
  });
  await db.update(C.enquiries, enquiryId, { status: 'converted', orderId: order.id });
  await upsertCustomerFrom(order);
  return order;
}

/* ─────────────── Customers ─────────────── */

/** Phone is the identity — it's the one thing WhatsApp always gives us. */
export async function upsertCustomerFrom(order) {
  if (!order.phone) return null;
  const rows = await db.list(C.customers);
  const existing = rows.find((c) => c.phone === order.phone);
  if (existing) {
    return db.update(C.customers, existing.id, {
      name: order.customerName || existing.name,
      orderCount: (existing.orderCount || 0) + 1,
      totalValue: (existing.totalValue || 0) + (order.total || 0),
      lastOrderAt: order.placedAt,
    });
  }
  return db.insert(C.customers, {
    name: order.customerName || 'WhatsApp customer',
    phone: order.phone,
    email: '',
    enquiryCount: 0,
    orderCount: 1,
    totalValue: order.total || 0,
    lastOrderAt: order.placedAt,
    notes: '',
  });
}

/** Recompute enquiry counts so the list reflects reality after edits. */
export async function listCustomers() {
  const [customers, enquiries] = await Promise.all([db.list(C.customers), db.list(C.enquiries)]);
  return customers.map((c) => {
    const mine = enquiries.filter((e) => e.phone && e.phone === c.phone);
    return {
      ...c,
      enquiryCount: mine.length,
      lastEnquiryAt: mine.length ? mine.sort((a, b) => new Date(b.at) - new Date(a.at))[0].at : null,
    };
  });
}
export const updateCustomer = (id, patch) => db.update(C.customers, id, patch);
export const deleteCustomer = (id) => db.remove(C.customers, id);

/* ─────────────── Coupons ─────────────── */

export const listCoupons = () => db.list(C.coupons);
export const getCoupon = (id) => db.find(C.coupons, id);
export const createCoupon = (data) =>
  db.insert(C.coupons, { status: 'active', usageCount: 0, ...data, code: String(data.code || '').toUpperCase().trim() });
export const updateCoupon = (id, patch) =>
  db.update(C.coupons, id, patch.code ? { ...patch, code: String(patch.code).toUpperCase().trim() } : patch);
export const deleteCoupon = (id) => db.remove(C.coupons, id);

export function couponState(coupon) {
  if (coupon.status !== 'active') return 'inactive';
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return 'expired';
  if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) return 'exhausted';
  return 'active';
}

/* ─────────────── Reviews ─────────────── */

export const listReviews = () => db.list(C.reviews);
export const updateReview = (id, patch) => db.update(C.reviews, id, patch);
export const deleteReview = (id) => db.remove(C.reviews, id);
export const bulkUpdateReviews = (ids, patch) => db.bulkUpdate(C.reviews, ids, patch);

export function queryReviews(rows, { search = '', status = '', rating = '', productId = '' } = {}) {
  let out = rows.slice();
  if (search) {
    const q = search.toLowerCase();
    out = out.filter((r) => [r.author, r.title, r.body, r.productName].join(' ').toLowerCase().includes(q));
  }
  if (status) out = out.filter((r) => r.status === status);
  if (rating) out = out.filter((r) => String(r.rating) === String(rating));
  if (productId) out = out.filter((r) => r.productId === productId);
  return out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/* ─────────────── Media ─────────────── */

export const listMedia = () => db.list(C.media);
export const createMedia = (data) => db.insert(C.media, data);
export const updateMedia = (id, patch) => db.update(C.media, id, patch);
export const deleteMedia = (id) => db.remove(C.media, id);
