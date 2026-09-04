/* Admin chrome: sidebar navigation on desktop, a slide-in drawer on
   small screens, plus the top bar with alerts and the account menu. */
import { $, $$, esc, on, delegate, lockScroll, unlockScroll } from '../../core/dom.js';
import { href, getCurrent } from '../core/adminRouter.js';
import { getUser, logout, ROLES } from '../core/auth.js';

const icon = (d) =>
  `<svg class="h-[17px] w-[17px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

const ICONS = {
  dashboard: icon('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  products: icon('<path d="M20.5 7.5 12 3 3.5 7.5v9L12 21l8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>'),
  category: icon('<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>'),
  collection: icon('<path d="M4 7h16M4 12h16M4 17h10"/>'),
  inventory: icon('<path d="M3 7h18v13H3z"/><path d="M3 7l2-4h14l2 4M9 12h6"/>'),
  chat: icon('<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/>'),
  orders: icon('<path d="M6 2h12l2 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"/><path d="M4 7h16M9 11h6"/>'),
  customers: icon('<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0M17 11a3 3 0 1 0-1.5-5.6M21 20a5 5 0 0 0-3.5-4.8"/>'),
  coupon: icon('<path d="M3 9V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2.5 2.5 0 0 0 0 6v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2.5 2.5 0 0 0 0-6z"/><path d="M13 7v10"/>'),
  chart: icon('<path d="M3 21h18"/><rect x="5" y="11" width="3.5" height="7" rx="1"/><rect x="10.5" y="7" width="3.5" height="11" rx="1"/><rect x="16" y="13" width="3.5" height="5" rx="1"/>'),
  search: icon('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  content: icon('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14h8"/>'),
  media: icon('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5"/>'),
  reviews: icon('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>'),
  settings: icon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15a1.6 1.6 0 0 0-1.5-1H1.5a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 3 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 7 4.6h.1A1.6 1.6 0 0 0 9 3V2.9a2 2 0 1 1 4 0V3a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 19.4 9v.1a1.6 1.6 0 0 0 1.5 1h.1a2 2 0 1 1 0 4H21a1.6 1.6 0 0 0-1.6 1z"/>'),
  store: icon('<path d="M4 7h16v13H4z"/><path d="M4 7l1.5-4h13L20 7"/>'),
};

/** The navigation model — one place to add a section. */
export const NAV = [
  { items: [{ label: 'Dashboard', path: '/', icon: ICONS.dashboard, exact: true }] },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', path: '/products', icon: ICONS.products },
      { label: 'Categories', path: '/categories', icon: ICONS.category },
      { label: 'Collections', path: '/collections', icon: ICONS.collection },
      { label: 'Inventory', path: '/inventory', icon: ICONS.inventory, alert: 'lowStock' },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { label: 'WhatsApp Enquiries', path: '/enquiries', icon: ICONS.chat, alert: 'newEnquiries' },
      { label: 'Orders', path: '/orders', icon: ICONS.orders },
      { label: 'Customers', path: '/customers', icon: ICONS.customers },
      { label: 'Coupons', path: '/coupons', icon: ICONS.coupon },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Overview', path: '/analytics', icon: ICONS.chart },
      { label: 'Products', path: '/analytics/products', icon: ICONS.products },
      { label: 'Categories', path: '/analytics/categories', icon: ICONS.category },
      { label: 'Search', path: '/analytics/search', icon: ICONS.search },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Homepage', path: '/content', icon: ICONS.content },
      { label: 'Reviews', path: '/reviews', icon: ICONS.reviews, alert: 'pendingReviews' },
      { label: 'Media Library', path: '/media', icon: ICONS.media },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Store Settings', path: '/settings', icon: ICONS.settings },
      { label: 'Admin Users', path: '/settings/users', icon: ICONS.customers },
      { label: 'View Storefront', path: '/', icon: ICONS.store, external: '/' },
    ],
  },
];

function navItem(item, alerts) {
  const { path } = getCurrent();
  const active = item.exact ? path === item.path : path === item.path || path.startsWith(`${item.path}/`);
  const count = item.alert ? alerts[item.alert] || 0 : 0;
  const target = item.external || href(item.path);
  return `<a href="${target}" ${item.external ? 'target="_blank" rel="noopener"' : 'data-nav-close'}
    class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition ${
      active ? 'bg-gold/12 text-gold-light' : 'text-sand hover:bg-line/5 hover:text-ivory'
    }">
    <span class="${active ? 'text-gold' : 'text-sand/70 group-hover:text-gold'}">${item.icon}</span>
    <span class="flex-1 truncate">${esc(item.label)}</span>
    ${count ? `<span class="rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-ink">${count}</span>` : ''}
    ${item.external ? '<span class="text-[10px] text-sand/50">↗</span>' : ''}
  </a>`;
}

export function sidebarMarkup(alerts = {}) {
  return `
  <div class="flex h-full flex-col">
    <a href="${href('/')}" class="flex shrink-0 items-center gap-3 border-b border-line/10 px-5 py-5">
      <img src="/assets/img/logo-mark.webp" alt="" width="400" height="552" class="brand-logo h-10 w-auto shrink-0">
      <span>
        <span class="block font-display text-[15px] leading-tight tracking-[0.12em] text-ivory">PARSHIV</span>
        <span class="block text-[9px] tracking-[0.28em] text-gold">ADMIN</span>
      </span>
    </a>
    <nav class="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Admin">
      ${NAV.map((group) => `
        <div>
          ${group.title ? `<p class="px-3 pb-2 text-[9px] uppercase tracking-[0.24em] text-sand/50">${esc(group.title)}</p>` : ''}
          <div class="space-y-0.5">${group.items.map((i) => navItem(i, alerts)).join('')}</div>
        </div>`).join('')}
    </nav>
    ${accountBlock()}
  </div>`;
}

function accountBlock() {
  const user = getUser();
  if (!user) return '';
  return `<div class="shrink-0 border-t border-line/10 p-3">
    <div class="flex items-center gap-3 rounded-xl bg-night/40 p-3">
      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 font-display text-[13px] text-gold">${esc(user.name.slice(0, 1))}</span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-[12px] text-ivory">${esc(user.name)}</span>
        <span class="block truncate text-[10px] text-sand/70">${esc(ROLES[user.role]?.label || user.role)}</span>
      </span>
      <button type="button" id="adminLogout" class="shrink-0 rounded-lg p-1.5 text-sand transition hover:bg-line/10 hover:text-danger" aria-label="Sign out" title="Sign out">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
      </button>
    </div>
  </div>`;
}

export function shellMarkup() {
  return `
  <div class="flex min-h-dvh bg-night">
    <aside id="adminSidebar" class="fixed inset-y-0 left-0 z-[120] w-[260px] -translate-x-full border-r border-line/10 bg-onyx transition-transform duration-300 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0"></aside>
    <div id="adminSidebarOverlay" class="pointer-events-none fixed inset-0 z-[115] bg-veil/70 opacity-0 backdrop-blur-sm transition duration-300 lg:hidden"></div>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="sticky top-0 z-[100] flex items-center gap-3 border-b border-line/10 bg-night/90 px-4 py-3 backdrop-blur-md lg:px-8">
        <button id="adminMenuBtn" class="rounded-lg p-2 text-ivory transition hover:bg-line/10 lg:hidden" aria-label="Open menu">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
        </button>
        <div id="adminBreadcrumb" class="min-w-0 flex-1 truncate text-[12px] text-sand"></div>
        <button id="adminAlertsBtn" class="relative rounded-lg p-2 text-sand transition hover:bg-line/10 hover:text-gold" aria-label="Alerts">
          <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>
          <span id="adminAlertDot" class="absolute right-1.5 top-1.5 hidden h-2 w-2 rounded-full bg-gold"></span>
        </button>
        <button id="adminThemeBtn" class="rounded-lg p-2 text-sand transition hover:bg-line/10 hover:text-gold" aria-label="Toggle theme">
          <svg class="icon-to-dark h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
          <svg class="icon-to-light h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/></svg>
        </button>
      </header>
      <main id="adminMain" class="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8"></main>
    </div>
  </div>`;
}

/* ─────────────── Behaviour ─────────────── */

export function openSidebar() {
  $('#adminSidebar')?.classList.remove('-translate-x-full');
  $('#adminSidebarOverlay')?.classList.remove('opacity-0', 'pointer-events-none');
  if (window.matchMedia('(max-width: 1023px)').matches) lockScroll();
}
export function closeSidebar() {
  if (window.matchMedia('(min-width: 1024px)').matches) return;
  $('#adminSidebar')?.classList.add('-translate-x-full');
  $('#adminSidebarOverlay')?.classList.add('opacity-0', 'pointer-events-none');
  unlockScroll();
}

export function renderSidebar(alerts = {}) {
  const el = $('#adminSidebar');
  if (el) el.innerHTML = sidebarMarkup(alerts);
}

export function initShell({ onLogout, onToggleTheme, onAlerts }) {
  on($('#adminMenuBtn'), 'click', openSidebar);
  on($('#adminSidebarOverlay'), 'click', closeSidebar);
  delegate(document, 'click', '[data-nav-close]', closeSidebar);
  delegate(document, 'click', '#adminLogout', onLogout);
  on($('#adminThemeBtn'), 'click', onToggleTheme);
  on($('#adminAlertsBtn'), 'click', onAlerts);
}

export function setBreadcrumb(trail) {
  const el = $('#adminBreadcrumb');
  if (el) {
    el.innerHTML = trail
      .map((t, i) => (i === trail.length - 1
        ? `<span class="text-ivory">${esc(t.label)}</span>`
        : `<a href="${href(t.path)}" class="transition hover:text-gold-light">${esc(t.label)}</a> <span class="mx-1.5 text-gold/50">◆</span>`))
      .join('');
  }
}
