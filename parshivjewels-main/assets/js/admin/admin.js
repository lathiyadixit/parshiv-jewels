/* ══════════════════════════════════════════════════════════════
   ADMIN BOOTSTRAP
   Auth gate → shell → routes. Every page module returns
   { html, onMount?, breadcrumb? } exactly like the storefront's,
   so the render loop and its teardown scope are shared behaviour.
   ══════════════════════════════════════════════════════════════ */
import { $, createScope, installImageFallback, refreshImages } from '../core/dom.js';
import { toast } from '../core/toast.js';
import { initTheme, toggle as toggleTheme } from '../core/theme.js';
import { FALLBACK_IMAGE } from '../services/catalogService.js';
import * as router from './core/adminRouter.js';
import { isAuthenticated, logout, touchSession, can, PERMISSIONS } from './core/auth.js';
import { seed } from './data/seed.js';
import { shellMarkup, renderSidebar, initShell, setBreadcrumb, closeSidebar } from './components/layout.js';
import { openModal, closeModal, confirmAction } from './components/modal.js';
import { collectAlerts, alertsMarkup, dismissAlert, dismissAllAlerts, restoreAlerts } from './repositories/alertsRepo.js';
import { syncEnquiriesFromEvents } from './repositories/commerceRepo.js';
import { errorState, emptyState, btn } from './components/ui.js';
import { loginMarkup, initLogin } from './pages/login.js';

import dashboardPage from './pages/dashboard.js';
import productsPage from './pages/products.js';
import productEditPage from './pages/productEdit.js';
import { categoriesPage, collectionsPage } from './pages/taxonomy.js';
import inventoryPage from './pages/inventory.js';
import enquiriesPage from './pages/enquiries.js';
import { ordersPage, customersPage } from './pages/orders.js';
import { couponsPage, reviewsPage } from './pages/promotions.js';
import { analyticsOverview, analyticsProducts, analyticsCategories, analyticsSearch } from './pages/analytics.js';
import { contentPage, mediaPage, settingsPage, usersPage } from './pages/settings.js';

let scope = null;
let alerts = { counts: {}, items: [] };

/* ─────────────── Routes ─────────────── */

function registerRoutes() {
  const P = PERMISSIONS;
  router.route('/', dashboardPage, { permission: P.ANALYTICS_VIEW });
  router.route('/products', productsPage, { permission: P.CATALOG_VIEW });
  router.route('/products/:id', productEditPage, { permission: P.CATALOG_EDIT });
  router.route('/categories', categoriesPage, { permission: P.CATALOG_EDIT });
  router.route('/collections', collectionsPage, { permission: P.CATALOG_EDIT });
  router.route('/inventory', inventoryPage, { permission: P.CATALOG_EDIT });
  router.route('/enquiries', enquiriesPage, { permission: P.ORDERS_VIEW });
  router.route('/orders', ordersPage, { permission: P.ORDERS_VIEW });
  router.route('/customers', customersPage, { permission: P.ORDERS_VIEW });
  router.route('/coupons', couponsPage, { permission: P.CATALOG_EDIT });
  router.route('/reviews', reviewsPage, { permission: P.CONTENT_EDIT });
  router.route('/analytics', analyticsOverview, { permission: P.ANALYTICS_VIEW });
  router.route('/analytics/products', analyticsProducts, { permission: P.ANALYTICS_VIEW });
  router.route('/analytics/categories', analyticsCategories, { permission: P.ANALYTICS_VIEW });
  router.route('/analytics/search', analyticsSearch, { permission: P.ANALYTICS_VIEW });
  router.route('/content', contentPage, { permission: P.CONTENT_EDIT });
  router.route('/media', mediaPage, { permission: P.CONTENT_EDIT });
  router.route('/settings', settingsPage, { permission: P.SETTINGS_EDIT });
  router.route('/settings/users', usersPage, { permission: P.SETTINGS_EDIT });

  router.setNotFound(() => ({
    breadcrumb: [{ label: 'Dashboard', path: '/' }],
    html: `<div class="py-10">${emptyState({
      title: 'Page not found',
      message: 'That admin screen does not exist.',
      action: btn('Back to dashboard', { variant: 'gold', size: 'sm', attrs: 'data-go-dashboard' }),
    })}</div>`,
  }));
}

/* ─────────────── Render ─────────────── */

async function render({ view, meta }) {
  const main = $('#adminMain');
  if (!main) return;

  scope?.dispose();
  scope = createScope();

  if (meta?.permission && !can(meta.permission)) {
    main.innerHTML = `<div class="py-10">${emptyState({
      icon: '⚠', title: 'You don’t have access to this section',
      message: 'Your role does not include the permission this screen requires.',
    })}</div>`;
    return;
  }

  main.innerHTML = view.html;
  setBreadcrumb(view.breadcrumb || [{ label: 'Dashboard', path: '/' }]);

  try {
    await view.onMount?.(scope);
  } catch (error) {
    console.error('[admin] mount failed', error);
    toast('Something went wrong on this screen', { tone: 'error' });
  }

  refreshImages(main);
  closeSidebar();
  main.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Refresh alerts so sidebar badges track the change just made.
  alerts = await collectAlerts();
  renderSidebar(alerts.counts);
  $('#adminAlertDot')?.classList.toggle('hidden', !alerts.counts.total);
  touchSession();
}

/**
 * The alerts panel. Dismissing re-renders the panel and the chrome in
 * place, so badges and the dashboard agree without a full navigation.
 */
async function openAlerts() {
  const modal = openModal({ title: 'Alerts', size: 'max-w-lg', body: alertsMarkup(alerts) });

  const rerender = async () => {
    alerts = await collectAlerts();
    modal.querySelector('[data-alerts-body]').outerHTML = alertsMarkup(alerts);
    renderSidebar(alerts.counts);
    $('#adminAlertDot')?.classList.toggle('hidden', !alerts.counts.total);
  };

  modal.addEventListener('click', async (event) => {
    const one = event.target.closest('[data-dismiss-alert]');
    if (one) {
      await dismissAlert(one.dataset.dismissAlert, one.dataset.count);
      await rerender();
      return;
    }
    if (event.target.closest('[data-dismiss-all]')) {
      const n = await dismissAllAlerts(alerts.items);
      await rerender();
      toast(`${n} alert${n === 1 ? '' : 's'} cleared`);
      return;
    }
    if (event.target.closest('[data-restore-alerts]')) {
      await restoreAlerts();
      await rerender();
      toast('Dismissed alerts restored');
    }
  });
}

/* ─────────────── Boot ─────────────── */

function showLogin() {
  document.body.innerHTML = loginMarkup() + '<div id="toast" role="status" aria-live="polite"><span id="toastMsg"></span></div>';
  initLogin(() => window.location.reload());
}

async function showAdmin() {
  document.body.innerHTML = shellMarkup() + '<div id="toast" role="status" aria-live="polite"><span id="toastMsg"></span></div>';

  await seed();
  // Turn any WhatsApp-click events into enquiry records before the first
  // render, so every screen agrees on how many enquiries exist.
  await syncEnquiriesFromEvents();
  alerts = await collectAlerts();
  renderSidebar(alerts.counts);

  initShell({
    onLogout: async () => {
      const ok = await confirmAction({
        title: 'Sign out?', message: 'You will need your passcode to get back in.',
        confirmLabel: 'Sign out', tone: 'gold',
      });
      if (!ok) return;
      logout();
      window.location.reload();
    },
    onToggleTheme: () => {
      const theme = toggleTheme();
      toast(`${theme === 'light' ? 'Light' : 'Dark'} mode on`);
    },
    onAlerts: () => openAlerts(),
  });

  registerRoutes();
  router.onAfter(render);
  router.onError(({ error }) => {
    $('#adminMain').innerHTML = `<div class="py-10">${errorState(error.message || 'Unknown error')}</div>`;
  });
  router.start();
}

function boot() {
  initTheme();
  installImageFallback(FALLBACK_IMAGE);
  if (isAuthenticated()) showAdmin(); else showLogin();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
