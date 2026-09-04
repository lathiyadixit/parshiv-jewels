/* ══════════════════════════════════════════════════════════════
   ANALYTICS REPOSITORY
   Turns the raw event log into the numbers the dashboard shows.
   Pure functions over events + catalogue — no DOM, no formatting,
   so every figure can be checked in isolation.
   ══════════════════════════════════════════════════════════════ */
import { getEvents, EVENTS } from '../../services/analyticsService.js';

/* ─────────────── Date ranges ─────────────── */

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
const daysAgo = (n) => startOfDay(new Date(Date.now() - n * 86400000));

export const RANGES = {
  today: { label: 'Today', from: () => startOfDay(new Date()), to: () => endOfDay(new Date()) },
  yesterday: { label: 'Yesterday', from: () => daysAgo(1), to: () => endOfDay(daysAgo(1)) },
  '7d': { label: 'Last 7 days', from: () => daysAgo(6), to: () => endOfDay(new Date()) },
  '30d': { label: 'Last 30 days', from: () => daysAgo(29), to: () => endOfDay(new Date()) },
  '90d': { label: 'Last 90 days', from: () => daysAgo(89), to: () => endOfDay(new Date()) },
  year: { label: 'This year', from: () => new Date(new Date().getFullYear(), 0, 1), to: () => endOfDay(new Date()) },
  all: { label: 'All time', from: () => new Date(0), to: () => endOfDay(new Date()) },
};

export function resolveRange(key, custom = {}) {
  if (key === 'custom' && custom.from && custom.to) {
    return { from: startOfDay(custom.from), to: endOfDay(custom.to), label: 'Custom range' };
  }
  const range = RANGES[key] || RANGES['30d'];
  return { from: range.from(), to: range.to(), label: range.label };
}

/** The equivalent window immediately before this one, for trend arrows. */
export function previousRange({ from, to }) {
  const span = to - from;
  return { from: new Date(from.getTime() - span - 1), to: new Date(from.getTime() - 1) };
}

export const inRange = (events, { from, to }) =>
  events.filter((e) => { const t = new Date(e.at); return t >= from && t <= to; });

/* ─────────────── Aggregations ─────────────── */

const countOf = (events, type) => events.filter((e) => e.type === type).length;
const uniqueBy = (events, field) => new Set(events.map((e) => e[field])).size;

/** Percentage change, guarding against a zero baseline. */
export function trend(current, previous) {
  if (!previous) return current ? { direction: 'up', percent: 100 } : { direction: 'flat', percent: 0 };
  const change = ((current - previous) / previous) * 100;
  return {
    direction: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'flat',
    percent: Math.abs(Math.round(change)),
  };
}

export function summarise(events) {
  const whatsapp = events.filter((e) => e.type === EVENTS.WHATSAPP_CLICK);
  const adds = events.filter((e) => e.type === EVENTS.ADD_TO_CART);
  const enquiryValue = whatsapp.reduce((sum, e) => sum + (e.payload?.value || 0), 0);
  const cartValue = adds.reduce((sum, e) => sum + (e.payload?.price || 0) * (e.payload?.qty || 1), 0);

  return {
    pageViews: countOf(events, EVENTS.PAGE_VIEW),
    productViews: countOf(events, EVENTS.PRODUCT_VIEW),
    searches: countOf(events, EVENTS.SEARCH),
    addToCart: adds.length,
    removeFromCart: countOf(events, EVENTS.REMOVE_FROM_CART),
    cartViews: countOf(events, EVENTS.CART_VIEW),
    whatsappClicks: whatsapp.length,
    couponApplied: countOf(events, EVENTS.COUPON_APPLIED),
    visitors: uniqueBy(events, 'visitor'),
    sessions: uniqueBy(events, 'session'),
    enquiryValue: Math.round(enquiryValue),
    cartValue: Math.round(cartValue),
    avgEnquiryValue: whatsapp.length ? Math.round(enquiryValue / whatsapp.length) : 0,
    // Of the people who viewed a product, how many reached WhatsApp?
    conversionRate: countOf(events, EVENTS.PRODUCT_VIEW)
      ? Math.round((whatsapp.length / countOf(events, EVENTS.PRODUCT_VIEW)) * 1000) / 10
      : 0,
    addToCartRate: countOf(events, EVENTS.PRODUCT_VIEW)
      ? Math.round((adds.length / countOf(events, EVENTS.PRODUCT_VIEW)) * 1000) / 10
      : 0,
  };
}

/** Bucket events per day for the trend charts. */
export function timeSeries(events, { from, to }, types) {
  const wanted = new Set([].concat(types));
  const days = Math.max(1, Math.ceil((to - from) / 86400000));
  const buckets = new Map();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(from.getTime() + i * 86400000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  events.forEach((e) => {
    if (!wanted.has(e.type)) return;
    const day = e.at.slice(0, 10);
    if (buckets.has(day)) buckets.set(day, buckets.get(day) + 1);
  });
  return [...buckets.entries()].map(([label, value]) => ({ label, value }));
}

/** Same buckets, but summing a numeric payload field instead of counting. */
export function valueSeries(events, { from, to }, type, field = 'value') {
  const days = Math.max(1, Math.ceil((to - from) / 86400000));
  const buckets = new Map();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(from.getTime() + i * 86400000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  events.forEach((e) => {
    if (e.type !== type) return;
    const day = e.at.slice(0, 10);
    if (buckets.has(day)) buckets.set(day, buckets.get(day) + (e.payload?.[field] || 0));
  });
  return [...buckets.entries()].map(([label, value]) => ({ label, value: Math.round(value) }));
}

/** Per-product performance, joined onto the catalogue. */
export function productPerformance(events, products) {
  const stats = new Map();
  const bump = (slug, field, amount = 1) => {
    if (!slug) return;
    if (!stats.has(slug)) stats.set(slug, { views: 0, adds: 0, enquiries: 0, value: 0 });
    stats.get(slug)[field] += amount;
  };

  events.forEach((e) => {
    const p = e.payload || {};
    if (e.type === EVENTS.PRODUCT_VIEW) bump(p.slug, 'views');
    if (e.type === EVENTS.ADD_TO_CART) {
      bump(p.slug, 'adds');
      bump(p.slug, 'value', (p.price || 0) * (p.qty || 1));
    }
    if (e.type === EVENTS.WHATSAPP_CLICK) (p.items || []).forEach((i) => {
      bump(i.slug, 'enquiries');
      bump(i.slug, 'value', (i.price || 0) * (i.qty || 1));
    });
  });

  return products
    .map((product) => {
      const s = stats.get(product.slug) || { views: 0, adds: 0, enquiries: 0, value: 0 };
      return {
        ...product,
        views: s.views,
        adds: s.adds,
        enquiries: s.enquiries,
        estValue: Math.round(s.value),
        addRate: s.views ? Math.round((s.adds / s.views) * 1000) / 10 : 0,
        enquiryRate: s.views ? Math.round((s.enquiries / s.views) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.views - a.views || b.adds - a.adds);
}

/** Roll product performance up to a grouping key (category or collection). */
export function groupPerformance(perf, keyOf) {
  const groups = new Map();
  perf.forEach((p) => {
    [].concat(keyOf(p) || []).forEach((key) => {
      if (!key) return;
      if (!groups.has(key)) groups.set(key, { key, views: 0, adds: 0, enquiries: 0, estValue: 0, products: 0 });
      const g = groups.get(key);
      g.views += p.views; g.adds += p.adds; g.enquiries += p.enquiries;
      g.estValue += p.estValue; g.products += 1;
    });
  });
  return [...groups.values()].sort((a, b) => b.views - a.views);
}

/** Search terms, split by whether they returned anything. */
export function searchTerms(events) {
  const terms = new Map();
  events.filter((e) => e.type === EVENTS.SEARCH).forEach((e) => {
    const term = (e.payload?.term || '').trim().toLowerCase();
    if (!term) return;
    if (!terms.has(term)) terms.set(term, { term, count: 0, withResults: 0, noResults: 0, lastAt: e.at });
    const t = terms.get(term);
    t.count += 1;
    if (e.payload?.results > 0) t.withResults += 1; else t.noResults += 1;
    if (e.at > t.lastAt) t.lastAt = e.at;
  });
  return [...terms.values()].sort((a, b) => b.count - a.count);
}

export function breakdown(events, field) {
  const map = new Map();
  events.forEach((e) => map.set(e[field], (map.get(e[field]) || 0) + 1));
  return [...map.entries()]
    .map(([label, value]) => ({ label: label || 'unknown', value }))
    .sort((a, b) => b.value - a.value);
}

/** Funnel from arrival to WhatsApp hand-off. */
export function funnel(events) {
  const s = summarise(events);
  return [
    { label: 'Visitors', value: s.visitors },
    { label: 'Product views', value: s.productViews },
    { label: 'Added to cart', value: s.addToCart },
    { label: 'Viewed cart', value: s.cartViews },
    { label: 'WhatsApp enquiry', value: s.whatsappClicks },
  ];
}

export const allEvents = () => getEvents();
