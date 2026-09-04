/* ══════════════════════════════════════════════════════════════
   ANALYTICS SERVICE
   One place where the storefront records what happened. UI never
   formats or stores an event itself — it calls track().

   Events are appended to a capped local log that the admin panel
   reads. `forward()` also hands each event to any provider present
   (gtag, dataLayer, Meta pixel), so connecting Google Analytics
   later needs no changes in the components.
   ══════════════════════════════════════════════════════════════ */
import { read, write } from '../core/storage.js';

const KEY = 'pj.events.v1';
const SESSION_KEY = 'pj.session.v1';
const MAX_EVENTS = 4000;

export const EVENTS = {
  PAGE_VIEW: 'page_view',
  PRODUCT_VIEW: 'product_view',
  SEARCH: 'search',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  UPDATE_CART_QTY: 'update_cart_qty',
  CART_VIEW: 'cart_view',
  WHATSAPP_CLICK: 'whatsapp_click',
  COUPON_APPLIED: 'coupon_applied',
  PRODUCT_SHARE: 'product_share',
};

/** Stable per-browser id, so the admin can count visitors rather than events. */
function visitorId() {
  let id = read('pj.visitor.v1', null);
  if (!id) {
    id = `v_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    write('pj.visitor.v1', id);
  }
  return id;
}

/** A session expires after 30 minutes of inactivity. */
function sessionId() {
  const now = Date.now();
  const current = read(SESSION_KEY, null, { session: true });
  if (current && now - current.at < 30 * 60 * 1000) {
    write(SESSION_KEY, { id: current.id, at: now }, { session: true });
    return current.id;
  }
  const id = `s_${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  write(SESSION_KEY, { id, at: now }, { session: true });
  return id;
}

export function deviceType() {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Android|iPhone|iPod|Mobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

/** Where the visit came from, resolved once per session. */
function trafficSource() {
  const ref = document.referrer;
  if (!ref) return 'direct';
  try {
    const host = new URL(ref).hostname.replace(/^www\./, '');
    if (host === window.location.hostname) return 'internal';
    if (/google|bing|duckduckgo|yahoo/.test(host)) return 'search';
    if (/instagram|facebook|whatsapp|t\.co|twitter|pinterest/.test(host)) return 'social';
    return host;
  } catch {
    return 'unknown';
  }
}

function forward(event) {
  // Hand off to whatever analytics provider the deployment has loaded.
  try {
    if (typeof window.gtag === 'function') window.gtag('event', event.type, event.payload);
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: event.type, ...event.payload });
  } catch {
    /* a provider failing must never break the storefront */
  }
}

/**
 * Record an event.
 * @param {string} type one of EVENTS
 * @param {object} payload event-specific detail
 */
export function track(type, payload = {}) {
  const event = {
    id: `e_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    type,
    at: new Date().toISOString(),
    visitor: visitorId(),
    session: sessionId(),
    device: deviceType(),
    source: trafficSource(),
    path: window.location.pathname + window.location.search,
    payload,
  };

  const log = read(KEY, []);
  log.push(event);
  // Cap the log so a long-lived browser can't fill its storage quota.
  write(KEY, log.length > MAX_EVENTS ? log.slice(-MAX_EVENTS) : log);
  forward(event);
  return event;
}

export const getEvents = () => read(KEY, []);
export const clearEvents = () => write(KEY, []);
