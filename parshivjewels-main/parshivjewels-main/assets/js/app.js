/* ══════════════════════════════════════════════════════════════
   APPLICATION BOOTSTRAP
   Wires routes to page modules, renders into #main, and keeps the
   cross-cutting concerns (SEO, reveals, scroll, chrome, preloader)
   in one place so page modules only have to return markup.
   ══════════════════════════════════════════════════════════════ */
import { $, $$, createScope, installImageFallback, refreshImages, prefersReducedMotion } from './core/dom.js';
import * as router from './core/router.js';
import { observeReveals } from './core/reveal.js';
import { initTheme, toggle as toggleTheme, getTheme } from './core/theme.js';
import { toast, toastError } from './core/toast.js';
import { applyMeta, applyJsonLd } from './services/seoService.js';
import { track, EVENTS } from './services/analyticsService.js';
import { FALLBACK_IMAGE } from './services/catalogService.js';
import { hydrateSiteContacts } from './services/siteSettingsService.js';
import * as cart from './services/cartService.js';
import { openWhatsApp, formatGeneralMessage } from './services/whatsappService.js';
import { initCartDrawer } from './components/cartDrawer.js';
import { initQuickView } from './components/quickView.js';
import { initNavigation, syncActiveNav, closeMobileNav } from './components/navigation.js';
import { initSearch } from './components/searchOverlay.js';
import { errorState } from './components/ui.js';

import homePage from './pages/home.js';
import collectionPage from './pages/collection.js';
import collectionsIndexPage from './pages/collectionsIndex.js';
import productPage from './pages/product.js';
import cartPage from './pages/cart.js';
import confirmationPage from './pages/confirmation.js';
import searchPage from './pages/search.js';
import galleryPage from './pages/gallery.js';
import contactPage from './pages/contact.js';
import customDesignPage from './pages/customDesign.js';
import faqPage from './pages/faq.js';
import infoPage, { INFO_LABELS } from './pages/info.js';
import notFoundPage from './pages/notFound.js';

/* ─────────────── Routes ─────────────── */

function registerRoutes() {
  router.route('/', homePage);
  router.route('/shop', collectionPage);
  router.route('/shop/:slug', collectionPage);
  router.route('/collections', collectionsIndexPage);
  router.route('/collections/:slug', collectionPage);
  router.route('/product/:slug', productPage);
  router.route('/cart', cartPage);
  router.route('/order-enquiry', confirmationPage);
  router.route('/search', searchPage);
  router.route('/gallery', galleryPage);
  router.route('/contact', contactPage);
  router.route('/custom-design', customDesignPage);
  router.route('/faq', faqPage);

  // Informational pages all share one renderer; the slug rides on meta.
  Object.keys(INFO_LABELS).forEach((slug) => {
    router.route(`/${slug}`, infoPage, { slug });
  });

  router.setNotFound(notFoundPage);
}

/* ─────────────── Rendering ─────────────── */

let activeScope = null;

/** Preserve scroll position when only the query string changed. */
let lastPath = null;

function render({ view, path, scroll }) {
  const main = $('#main');
  if (!main) return;

  // Tear down the previous page's listeners and observers first.
  activeScope?.dispose();
  activeScope = createScope();

  // A page handler returns null when its slug doesn't resolve (unknown
  // product, collection or category) — that is a 404, not an error.
  const resolved = view || notFoundPage({ path });

  main.innerHTML = resolved.html;

  applyMeta({ ...resolved.meta, path: resolved.meta?.path || path });
  applyJsonLd(resolved.jsonLd?.length === 1 ? resolved.jsonLd[0] : resolved.jsonLd || null);

  try {
    resolved.onMount?.(activeScope);
  } catch (error) {
    console.error('[app] page mount failed', error);
  }

  observeReveals(main);
  refreshImages(main);
  syncActiveNav();
  closeMobileNav();
  router.normaliseLinks(main);

  track(EVENTS.PAGE_VIEW, { path, title: resolved.meta?.title || '' });

  markReady();
  window.__pjBooted = true; // stands down the boot watchdog in index.html

  const samePage = lastPath === path;
  lastPath = path;
  if (scroll !== false && !samePage) {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'instant' });
  }
}

/* ─────────────── Page chrome ─────────────── */

function initChrome() {
  const navbar = $('#navbar');
  const progress = $('#progress');
  const backTop = $('#backTop');

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      navbar?.classList.toggle('shadow-soft', window.scrollY > 40);
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.width = `${height > 0 ? (window.scrollY / height) * 100 : 0}%`;
      const show = window.scrollY > 600;
      backTop?.classList.toggle('opacity-0', !show);
      backTop?.classList.toggle('translate-y-20', !show);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  backTop?.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  );

  // Card tilt — pointer-fine devices only, as in the original build.
  if (window.matchMedia('(pointer:fine)').matches && !prefersReducedMotion()) {
    document.addEventListener(
      'mousemove',
      (event) => {
        const card = event.target.closest('.tilt');
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
      },
      { passive: true }
    );
    document.addEventListener('mouseover', (event) => {
      if (!event.target.closest('.tilt')) $$('.tilt').forEach((card) => (card.style.transform = ''));
    });
  }

  // FAQ / detail accordions, wherever they are rendered.
  document.addEventListener('click', (event) => {
    const question = event.target.closest('.faq-q');
    if (!question) return;
    const item = question.closest('.faq-item');
    const container = item.parentElement;
    const wasOpen = item.classList.contains('open');
    $$('.faq-item.open', container).forEach((other) => {
      other.classList.remove('open');
      $('.faq-q', other)?.setAttribute('aria-expanded', 'false');
    });
    item.classList.toggle('open', !wasOpen);
    question.setAttribute('aria-expanded', String(!wasOpen));
  });

  // Generic WhatsApp CTAs rendered by informational pages.
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-wa-general]');
    if (!button) return;
    toast('Opening WhatsApp…');
    openWhatsApp(formatGeneralMessage(button.dataset.waGeneral));
  });

  // Newsletter signup (homepage) — validated locally, no third-party script.
  document.addEventListener('submit', (event) => {
    const form = event.target.closest('#newsletterForm');
    if (!form) return;
    event.preventDefault();
    const input = $('#newsletterEmail');
    const message = $('#newsletterMsg');
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
    message.textContent = valid
      ? 'Thank you — you’re on the list. Watch for our next letter.'
      : 'Please enter a valid email address.';
    message.className = `mt-3 min-h-[20px] text-[13px] ${valid ? 'text-success' : 'text-danger'}`;
    input.setAttribute('aria-invalid', String(!valid));
    if (valid) {
      form.reset();
      toast('Subscribed to the Parshiv letter', { tone: 'success' });
    }
  });
}

/* ─────────────── Preloader ─────────────── */

let markReady = () => {};

function initPreloader() {
  const overlay = $('#preloader');
  const bar = $('#loadBar');
  const percent = $('#loadPct');
  if (!overlay) return;

  let loaded = false;
  let value = 0;

  const finish = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    document.body.classList.remove('overflow-hidden');
    document.body.classList.add('loaded');
    setTimeout(() => overlay.remove(), 700);
  };

  const timer = setInterval(() => {
    value = loaded ? Math.min(100, value + 8) : Math.min(90, value + Math.random() * 7);
    bar.style.width = `${value}%`;
    percent.textContent = `${Math.floor(value)}%`;
    if (value >= 100) {
      clearInterval(timer);
      finish();
    }
  }, 70);

  // The first route render is the real "ready" moment — waiting for every
  // remote image to decode would hold the curtain up for seconds.
  markReady = () => {
    loaded = true;
  };
  window.addEventListener('load', markReady);
  // Never trap the visitor behind the preloader if an asset stalls.
  setTimeout(markReady, 3500);
}

/* ─────────────── Boot ─────────────── */

/** Wire the header theme switch and keep its label describing the next state. */
function initThemeToggle() {
  const button = $('#themeBtn');
  if (!button) return;
  const label = () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    button.setAttribute('aria-label', `Switch to ${next} mode`);
    button.setAttribute('title', `Switch to ${next} mode`);
  };
  label();
  button.addEventListener('click', () => {
    const theme = toggleTheme();
    label();
    toast(`${theme === 'light' ? 'Light' : 'Dark'} mode on`);
  });
}

function boot() {
  initTheme();
  installImageFallback(FALLBACK_IMAGE);
  initPreloader();

  registerRoutes();
  router.onAfter(render);
  router.onError(({ error }) => {
    const main = $('#main');
    if (main) main.innerHTML = `<div class="mx-auto max-w-[900px] px-5 py-20">${errorState(error.message)}</div>`;
    toastError('Something went wrong loading that page.');
  });

  // Apply any admin-managed contact details over the markup's defaults.
  hydrateSiteContacts();

  initNavigation();
  initSearch();
  initCartDrawer();
  initQuickView();
  initChrome();
  initThemeToggle();

  // Subscribe before hydrating so reconciliation notices are surfaced.
  cart.onNotice((messages) =>
    messages.forEach((message, index) =>
      setTimeout(() => toast(message, { tone: 'error', duration: 4200 }), 900 + index * 1200)
    )
  );
  cart.hydrate();
  cart.watchOtherTabs();

  router.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
