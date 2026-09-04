/* Formatting helpers — pure functions, no DOM, no state. */
import { COMMERCE } from '../config/site.config.js';

/** ₹1,499 — the money format used everywhere on the site. */
export function inr(value) {
  const n = Number(value) || 0;
  return (
    COMMERCE.currencySymbol +
    n.toLocaleString(COMMERCE.locale, { maximumFractionDigits: 2 })
  );
}

/** Plain number for WhatsApp/schema output: "1,499" without the symbol. */
export function money(value) {
  return (Number(value) || 0).toLocaleString(COMMERCE.locale, { maximumFractionDigits: 2 });
}

export function discountPercent(price, compareAt) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round((1 - price / compareAt) * 100);
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function titleCase(text) {
  return String(text).replace(/(^|[\s-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

/** "★★★★☆" — rounded to the nearest half, rendered as full stars. */
export function stars(rating) {
  const filled = Math.round(Number(rating) || 0);
  return '★★★★★'.slice(0, filled) + '☆☆☆☆☆'.slice(0, 5 - filled);
}

export function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(COMMERCE.locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Business-day delivery window, e.g. "Tue, 3 Sep – Thu, 5 Sep". */
export function deliveryWindow(from = new Date()) {
  const [min, max] = COMMERCE.deliveryDays;
  const fmt = (days) => {
    const d = new Date(from);
    d.setDate(d.getDate() + days + COMMERCE.dispatchDays);
    return d.toLocaleDateString(COMMERCE.locale, { weekday: 'short', day: 'numeric', month: 'short' });
  };
  return `${fmt(min)} – ${fmt(max)}`;
}

export function pluralise(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
