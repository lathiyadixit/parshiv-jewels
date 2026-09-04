/* Business alerts. One place decides what needs the owner's attention,
   so the sidebar badges, the bell menu and the dashboard always agree.

   Alerts are derived from live data, never stored — so dismissing one
   hides it rather than deleting anything. A dismissal records the count
   at the time, and the alert returns the moment the situation worsens:
   dismissing "7 low on stock" keeps quiet at 5, speaks up again at 9. */
import * as catalog from './catalogRepo.js';
import * as commerce from './commerceRepo.js';
import { href } from '../core/adminRouter.js';
import * as db from '../data/db.js';
import { esc } from '../../core/dom.js';

const DISMISSED = 'dismissedAlerts';

/** @returns {Record<string, number>} alert id → count when it was dismissed */
const readDismissed = () => db.getDoc(DISMISSED, {});

export async function collectAlerts() {
  const [products, enquiries, reviews, coupons, dismissed] = await Promise.all([
    catalog.listProducts(), commerce.listEnquiries(), commerce.listReviews(),
    commerce.listCoupons(), readDismissed(),
  ]);

  const outOfStock = products.filter((p) => p.stockState === 'out-of-stock' && p.status === 'active');
  const lowStock = products.filter((p) => p.stockState === 'low-stock' && p.status === 'active');
  const newEnquiries = enquiries.filter((e) => e.status === 'new');
  const pendingConversion = enquiries.filter((e) => ['contacted', 'in-discussion'].includes(e.status));
  const pendingReviews = reviews.filter((r) => r.status === 'pending');

  const soon = Date.now() + 7 * 86400000;
  const expiring = coupons.filter(
    (c) => c.status === 'active' && c.expiresAt && new Date(c.expiresAt) <= soon && new Date(c.expiresAt) >= Date.now()
  );

  const all = [];
  const add = (id, tone, label, count, path, badge = null) => {
    if (count) all.push({ id, tone, label, count, path, badge });
  };
  add('out-of-stock', 'red', 'products out of stock', outOfStock.length, '/inventory?stock=out-of-stock', 'lowStock');
  add('low-stock', 'gold', 'products low on stock', lowStock.length, '/inventory?stock=low-stock', 'lowStock');
  add('new-enquiries', 'blue', 'new WhatsApp enquiries', newEnquiries.length, '/enquiries?status=new', 'newEnquiries');
  add('pending-conversion', 'gold', 'enquiries awaiting conversion', pendingConversion.length, '/enquiries');
  add('pending-reviews', 'gold', 'reviews awaiting moderation', pendingReviews.length, '/reviews?status=pending', 'pendingReviews');
  add('expiring-coupons', 'red', 'coupons expiring this week', expiring.length, '/coupons');

  // Hidden only while the situation has not got worse than when dismissed.
  const items = all.filter((a) => !(a.id in dismissed) || a.count > dismissed[a.id]);
  const hiddenCount = all.length - items.length;

  // Sidebar badges follow what survived, so dismissing quietens them too.
  const badge = (key) => items.filter((a) => a.badge === key).reduce((sum, a) => sum + a.count, 0);

  return {
    items,
    all,
    hiddenCount,
    counts: {
      lowStock: badge('lowStock'),
      newEnquiries: badge('newEnquiries'),
      pendingReviews: badge('pendingReviews'),
      total: items.reduce((sum, i) => sum + i.count, 0),
    },
    outOfStock, lowStock, newEnquiries, pendingConversion, pendingReviews, expiring,
  };
}

/* ─────────────── Dismissal ─────────────── */

export async function dismissAlert(id, count) {
  const dismissed = await readDismissed();
  return db.setDoc(DISMISSED, { ...dismissed, [id]: Number(count) || 0 });
}

/** @param {Array<{id:string,count:number}>} items the alerts currently shown */
export async function dismissAllAlerts(items) {
  const dismissed = await readDismissed();
  const next = { ...dismissed };
  items.forEach((a) => { next[a.id] = a.count; });
  await db.setDoc(DISMISSED, next);
  return items.length;
}

export async function restoreAlerts() {
  const count = Object.keys(await readDismissed()).length;
  await db.setDoc(DISMISSED, {});
  return count;
}

/* ─────────────── Markup ─────────────── */

const DOT = { red: 'bg-danger', gold: 'bg-gold', blue: 'bg-sky-400' };

export function alertsMarkup(alerts) {
  const list = alerts.items.length
    ? `<ul class="space-y-1.5">${alerts.items.map((a) => `
        <li class="flex items-stretch gap-1.5">
          <a href="${href(a.path)}" data-modal-close class="flex flex-1 items-center gap-3 rounded-xl border border-line/10 bg-night/40 px-4 py-3 transition hover:border-gold/30">
            <span class="h-2 w-2 shrink-0 rounded-full ${DOT[a.tone] || 'bg-sand'}"></span>
            <span class="flex-1 text-[13px] text-ivory"><span class="font-semibold text-gold">${a.count}</span> ${esc(a.label)}</span>
            <span class="text-sand/50">›</span>
          </a>
          <button type="button" data-dismiss-alert="${esc(a.id)}" data-count="${a.count}"
            class="shrink-0 rounded-xl border border-line/10 px-3 text-[13px] text-sand transition hover:border-danger/40 hover:text-danger"
            title="Dismiss this alert" aria-label="Dismiss ${esc(a.label)}">✕</button>
        </li>`).join('')}</ul>`
    : `<div class="px-1 py-8 text-center">
         <p class="text-2xl text-success">✓</p>
         <p class="mt-2 text-[13px] text-sand">${alerts.hiddenCount ? 'All alerts are dismissed.' : 'Nothing needs your attention.'}</p>
       </div>`;

  const footer = `
    <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-line/10 pt-4">
      ${alerts.hiddenCount
        ? `<span class="text-[11px] text-sand/70">${alerts.hiddenCount} dismissed</span>`
        : ''}
      <span class="flex-1"></span>
      ${alerts.hiddenCount
        ? `<button type="button" data-restore-alerts class="rounded-full border border-line/15 px-4 py-1.5 text-[11px] uppercase tracking-[0.12em] text-sand transition hover:border-gold/50 hover:text-ivory">Show dismissed</button>`
        : ''}
      ${alerts.items.length
        ? `<button type="button" data-dismiss-all class="rounded-full border border-gold/40 px-4 py-1.5 text-[11px] uppercase tracking-[0.12em] text-gold-light transition hover:bg-gold/10">Clear all</button>`
        : ''}
    </div>
    <p class="mt-3 text-[11px] leading-relaxed text-sand/60">
      Dismissing hides an alert without changing any data. It returns if the situation gets worse.
    </p>`;

  return `<div data-alerts-body>${list}${footer}</div>`;
}
