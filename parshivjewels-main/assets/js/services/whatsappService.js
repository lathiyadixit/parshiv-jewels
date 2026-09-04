/* ══════════════════════════════════════════════════════════════
   WHATSAPP SERVICE
   Owns every part of the WhatsApp purchasing journey: formatting a
   cart into a readable enquiry, URL-encoding it, choosing the right
   endpoint for desktop vs mobile, and opening it.

   No DOM knowledge beyond `window.open`, so message building can be
   tested on its own (see formatCartMessage / buildUrl).
   ══════════════════════════════════════════════════════════════ */
import { WHATSAPP_NUMBER, SITE, COMMERCE, STORAGE_KEYS } from '../config/site.config.js';
import { inr } from '../core/format.js';
import { write, read } from '../core/storage.js';
import { track, EVENTS } from './analyticsService.js';

const RULE = '━━━━━━━━━━━━━━━━━━';

/** WhatsApp renders *text* as bold. */
const bold = (text) => `*${text}*`;

export function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

/** A short human-readable reference so staff can match chat to enquiry. */
export function enquiryReference(date = new Date()) {
  const stamp = date.toISOString().slice(2, 10).replace(/-/g, '');
  const seq = String(date.getTime()).slice(-4);
  return `PJ${stamp}-${seq}`;
}

/* ─────────────── Formatters ─────────────── */

/** "1. Aurelia Pearl Necklace (18") — Qty 2 × ₹1,499 = ₹2,998" */
export function formatLine(line, index) {
  const variant =
    line.variant && line.variant.label && line.variant.label !== 'One Size'
      ? ` (${line.variantLabel}: ${line.variant.label})`
      : '';
  return [
    `${index + 1}. ${bold(line.product.name)}${variant}`,
    `   Qty ${line.qty} × ${inr(line.price)} = ${inr(line.lineTotal)}`,
    `   SKU ${line.variant?.sku || line.product.sku}`,
    // WhatsApp cannot embed an image in a text message, so the piece is
    // identified by its page — which WhatsApp previews with the photo.
    `   ${SITE.origin}${line.product.url}`,
  ].join('\n');
}

/** The customer block, so an enquiry never arrives from an unknown number. */
function formatCustomer({ name, phone, note } = {}) {
  const lines = [];
  if (name) lines.push(`👤 ${bold('Name:')} ${name}`);
  if (phone) lines.push(`📞 ${bold('Phone:')} ${phone}`);
  if (note) lines.push(`📝 ${bold('Note:')} ${note}`);
  return lines;
}

/**
 * Build the complete enquiry message from a cart snapshot.
 * @param {{lines: Array, totals: object}} snapshot
 * @param {{reference?: string, note?: string}} options
 */
export function formatCartMessage(snapshot, options = {}) {
  const { lines, totals } = snapshot;
  const reference = options.reference || enquiryReference();

  const parts = [
    `✨ ${bold(SITE.name.toUpperCase())} ✨`,
    RULE,
    `🧾 ${bold('ORDER ENQUIRY')}  #${reference}`,
    `📅 ${new Date().toLocaleString(COMMERCE.locale, { dateStyle: 'medium', timeStyle: 'short' })}`,
    RULE,
    ...(() => {
      const block = formatCustomer(options.customer);
      return block.length ? [...block, RULE] : [];
    })(),
    'Hello, I would like to enquire about the following products:',
    '',
    ...lines.map(formatLine),
    '',
    RULE,
    `Subtotal : ${inr(totals.subtotal)}`,
  ];

  if (totals.catalogSavings > 0) {
    parts.push(`Catalogue saving : −${inr(totals.catalogSavings)}`);
  }
  if (totals.discount > 0 && totals.coupon) {
    parts.push(`Coupon ${totals.coupon.code} : −${inr(totals.discount)}`);
  }
  parts.push(
    `Shipping : ${totals.shipping === 0 ? 'FREE ✅ (Insured)' : inr(totals.shipping)}`,
    `${totals.taxLabel} : ${inr(totals.tax)}`,
    bold(`ESTIMATED TOTAL : ${inr(totals.total)}`),
    RULE
  );

  parts.push(
    'Please let me know about availability and delivery.',
    '',
    '🛡️ BIS Hallmarked • Insured Shipping • 30-Day Returns',
    `📍 ${SITE.address.locality}, ${SITE.address.region}`,
    `🙏 Thank you for choosing ${SITE.name}!`
  );

  return parts.join('\n');
}

/** Single-product enquiry, used by "Enquire on WhatsApp" on a product page. */
export function formatProductMessage(product, variant, qty = 1, customer = null) {
  const variantLine =
    variant && variant.label !== 'One Size' ? `\n${product.variantLabel}: ${variant.label}` : '';
  const who = formatCustomer(customer);
  return [
    `Hello ${SITE.name}, I'd like to enquire about:`,
    '',
    `${bold(product.name)}${variantLine}`,
    `SKU: ${variant?.sku || product.sku}`,
    `Price: ${inr(variant?.price ?? product.price)}`,
    `Quantity: ${qty}`,
    '',
    `${SITE.origin}${product.url}`,
    ...(who.length ? ['', RULE, ...who, RULE] : []),
    '',
    'Could you confirm availability and delivery time?',
  ].join('\n');
}

/** Contact-form enquiry. */
export function formatContactMessage({ name, email, phone, subject, message }) {
  return [
    `📩 ${bold(`NEW ENQUIRY — ${SITE.name.toUpperCase()}`)}`,
    RULE,
    `👤 ${bold('Name:')} ${name}`,
    `📧 ${bold('Email:')} ${email}`,
    `📞 ${bold('Phone:')} ${phone || '—'}`,
    `📌 ${bold('Subject:')} ${subject}`,
    `📝 ${bold('Message:')} ${message}`,
    RULE,
    `Sent from ${SITE.origin.replace(/^https?:\/\//, '')}`,
  ].join('\n');
}

/**
 * A custom design brief. Long, but a bespoke commission is a
 * conversation the shop needs the details for before it can quote.
 */
export function formatCustomDesignMessage(brief, reference) {
  const line = (label, value) => (value ? `${bold(`${label}:`)} ${value}` : null);

  return [
    `✨ ${bold(SITE.name.toUpperCase())} ✨`,
    RULE,
    `🎨 ${bold('CUSTOM DESIGN REQUEST')}  #${reference}`,
    `📅 ${new Date().toLocaleString(COMMERCE.locale, { dateStyle: 'medium', timeStyle: 'short' })}`,
    RULE,
    ...formatCustomer({ name: brief.name, phone: brief.phone }),
    brief.email ? `📧 ${bold('Email:')} ${brief.email}` : null,
    RULE,
    line('Piece', brief.type),
    line('Occasion', brief.occasion),
    line('Budget', brief.budget),
    line('Stones', brief.diamond),
    line('Metal', brief.metal),
    line('Finish', brief.finish),
    line(brief.sizeLabel || 'Size', brief.size),
    RULE,
    `📝 ${bold('What I have in mind:')}`,
    brief.brief,
    brief.referenceUrl ? `\n🔗 ${bold('Reference:')} ${brief.referenceUrl}` : null,
    brief.hasPhotos ? '\n📎 I have reference photos — I’ll send them in this chat.' : null,
    RULE,
    'Could you advise on feasibility, timeline and a price for this?',
    '',
    `🙏 Thank you, ${SITE.name}!`,
  ]
    .filter((row) => row !== null && row !== undefined && row !== '')
    .join('\n');
}

/** Generic "talk to us" opener used by informational-page CTAs. */
export function formatGeneralMessage(topic = '') {
  return topic
    ? `Hello ${SITE.name}, I'd like help with: ${topic}`
    : `Hello ${SITE.name}, I'd like to speak to a jewellery specialist.`;
}

/* ─────────────── URL building & opening ─────────────── */

/**
 * Build the WhatsApp deep link.
 * `wa.me` opens the native app on mobile; `web.whatsapp.com/send` opens
 * WhatsApp Web in a desktop browser tab.
 * @param {string} message plain text — encoded here, never by the caller
 */
export function buildUrl(message, { number = WHATSAPP_NUMBER, forceWeb = null } = {}) {
  const text = encodeURIComponent(String(message ?? ''));
  const useWeb = forceWeb == null ? !isMobile() : forceWeb;
  return useWeb
    ? `https://web.whatsapp.com/send?phone=${number}&text=${text}`
    : `https://wa.me/${number}?text=${text}`;
}

/** Convenience: the plain chat link with no prefilled message. */
export const chatUrl = () => `https://wa.me/${WHATSAPP_NUMBER}`;

/**
 * Open WhatsApp in a new tab/app.
 * @returns {{ok: boolean, url: string, blocked?: boolean}}
 */
export function trackProductEnquiry(product, variant, qty, customer = null) {
  const reference = enquiryReference();
  track(EVENTS.WHATSAPP_CLICK, {
    reference,
    context: 'product',
    value: (variant?.price ?? product.price) * qty,
    itemCount: qty,
    customer,
    items: [{
      slug: product.slug,
      name: product.name,
      sku: variant?.sku,
      variant: variant?.label,
      price: variant?.price ?? product.price,
      qty,
      image: product.image?.src || '',
      url: `${SITE.origin}${product.url}`,
    }],
  });
  return reference;
}

/** Log a custom design request so the admin sees it with the rest. */
export function trackCustomDesign(brief) {
  const reference = enquiryReference();
  track(EVENTS.WHATSAPP_CLICK, {
    reference,
    context: 'custom-design',
    value: 0, // no cart value — the shop quotes this by hand
    itemCount: 1,
    // The brief lives in `customDesign`; duplicating it as a note would
    // print it twice in the admin.
    customer: { name: brief.name, phone: brief.phone, note: '' },
    customDesign: brief,
    items: [],
  });
  return reference;
}

export function openWhatsApp(message, options = {}) {
  const url = buildUrl(message, options);
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  // Popup blockers return null — the caller can then render a manual link.
  return { ok: !!win, url, blocked: !win };
}

/* ─────────────── Enquiry hand-off ─────────────── */

/**
 * Send a cart to WhatsApp and remember the enquiry so the confirmation
 * screen can re-open it if the popup was blocked or the tab was closed.
 */
export function sendCart(snapshot, options = {}) {
  const reference = options.reference || enquiryReference();
  const message = formatCartMessage(snapshot, { ...options, reference });
  const result = openWhatsApp(message, options);

  write(STORAGE_KEYS.lastEnquiry, {
    reference,
    message,
    url: result.url,
    total: snapshot.totals.total,
    itemCount: snapshot.totals.itemCount,
    at: new Date().toISOString(),
  });

  // The admin panel builds its enquiry list from this event.
  track(EVENTS.WHATSAPP_CLICK, {
    reference,
    context: 'cart',
    value: snapshot.totals.total,
    itemCount: snapshot.totals.itemCount,
    customer: options.customer || null,
    items: snapshot.lines.map((line) => ({
      slug: line.product.slug,
      name: line.product.name,
      sku: line.variant?.sku,
      variant: line.variant?.label,
      price: line.price,
      qty: line.qty,
      image: line.product.image?.src || '',
      url: `${SITE.origin}${line.product.url}`,
    })),
  });

  return { ...result, reference, message };
}

export const getLastEnquiry = () => read(STORAGE_KEYS.lastEnquiry, null);
