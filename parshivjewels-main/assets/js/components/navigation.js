/* ══════════════════════════════════════════════════════════════
   NAVIGATION
   Desktop: the original nav row, extended with a gold-framed mega
   menu built from the live catalog taxonomy.
   Mobile: the original toggle upgraded to a slide-in drawer that
   mirrors the cart drawer's motion and framing.
   ══════════════════════════════════════════════════════════════ */
import { $, $$, esc, on, delegate, lockScroll, unlockScroll, trapFocus } from '../core/dom.js';
import { href, getCurrent } from '../core/router.js';
import { getCategories, getCollections, getEdits, query, imageUrl } from '../services/catalogService.js';

/** Top-level navigation model — one place to change the menu. */
export function navModel() {
  const categories = getCategories();
  const collections = getCollections();
  const edits = getEdits();

  return [
    { label: 'New Arrivals', href: '/shop/new-arrivals', key: 'new-arrivals' },
    {
      label: 'Shop',
      href: '/shop',
      key: 'shop',
      mega: {
        columns: [
          {
            title: 'Categories',
            links: categories.map((category) => ({
              label: category.name,
              href: `/shop/${category.slug}`,
              meta: `${query({ category: category.slug }).length}`,
            })),
          },
          {
            title: 'Collections',
            links: collections.slice(0, 6).map((collection) => ({
              label: collection.name,
              href: `/collections/${collection.slug}`,
              meta: `${query({ collection: collection.slug }).length}`,
            })),
          },
          {
            title: 'Edits',
            links: [
              ...edits.map((edit) => ({ label: edit.name, href: `/shop/${edit.slug}` })),
              { label: 'Shop All', href: '/shop' },
              { label: 'Gift Guide', href: '/shop?sort=best-selling' },
            ],
          },
        ],
        feature: {
          title: 'Bridal Heirloom',
          copy: 'Ceremonial sets in 22K gold, uncut polki and certified diamonds.',
          href: '/collections/bridal-heirloom',
          image: imageUrl('photo-1515562141207-7a88fb7ce338', 700),
        },
      },
    },
    ...categories.map((category) => ({
      label: category.name,
      href: `/shop/${category.slug}`,
      key: category.slug,
    })),
    { label: 'Best Sellers', href: '/shop/best-sellers', key: 'best-sellers' },
    {
      label: 'Collections',
      href: '/collections',
      key: 'collections',
      mega: {
        columns: [
          {
            title: 'Signature Collections',
            links: collections.slice(0, 3).map((collection) => ({
              label: collection.name,
              href: `/collections/${collection.slug}`,
              meta: collection.tagline,
            })),
          },
          {
            title: 'More to Explore',
            links: collections.slice(3).map((collection) => ({
              label: collection.name,
              href: `/collections/${collection.slug}`,
              meta: collection.tagline,
            })),
          },
          {
            title: 'The House',
            links: [
              { label: 'Our Story', href: '/our-story' },
              { label: 'About Us', href: '/about' },
              { label: 'The Gallery', href: '/gallery' },
              { label: 'Design Your Own', href: '/custom-design' },
              { label: 'Jewelry Care', href: '/jewelry-care' },
              { label: 'Size Guide', href: '/size-guide' },
              { label: 'Diamond Guide', href: '/diamond-guide' },
              { label: 'Certification Guide', href: '/certification-guide' },
            ],
          },
        ],
      },
    },
    { label: 'Sale', href: '/shop/sale', key: 'sale', accent: true },
  ];
}

const CHEVRON = `<svg class="h-3 w-3 shrink-0 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;

/* ─────────────── Desktop ─────────────── */

function megaPanel(item) {
  const { columns, feature } = item.mega;
  return `<div class="mega-panel" data-mega-panel role="menu" aria-label="${esc(item.label)} menu">
    <div class="mx-auto grid max-w-[1300px] gap-10 px-8 py-10 ${feature ? 'lg:grid-cols-[repeat(3,minmax(0,1fr))_320px]' : 'lg:grid-cols-3'}">
      ${columns
        .map(
          (column) => `
        <div>
          <p class="text-[11px] uppercase tracking-[0.32em] text-gold">${esc(column.title)}</p>
          <ul class="mt-5 space-y-3">
            ${column.links
              .map(
                (link) => `<li><a href="${href(link.href)}" class="f-link group flex items-baseline justify-between gap-4 text-[15px] text-ivory/85">
                  <span>${esc(link.label)}</span>
                  ${link.meta ? `<span class="shrink-0 text-[11px] uppercase tracking-[0.16em] text-sand/60">${esc(link.meta)}</span>` : ''}
                </a></li>`
              )
              .join('')}
          </ul>
        </div>`
        )
        .join('')}
      ${
        feature
          ? `<a href="${href(feature.href)}" class="shine frame group relative overflow-hidden rounded-xl border border-gold/20">
              <img src="${feature.image}" onerror="imgFix(this)" alt="${esc(feature.title)} collection"
                loading="lazy" decoding="async" class="h-full min-h-[220px] w-full object-cover transition duration-[1.2s] group-hover:scale-110">
              <span class="absolute inset-0 bg-gradient-to-t from-night via-night/75 to-night/20"></span>
              <span class="absolute bottom-0 block w-full p-6">
                <span class="block font-display text-2xl text-ivory">${esc(feature.title)}</span>
                <span class="mt-1 block text-[13px] leading-relaxed text-sand">${esc(feature.copy)}</span>
                <span class="mt-3 block text-[11px] uppercase tracking-[0.3em] text-gold-light">Explore →</span>
              </span>
            </a>`
          : ''
      }
    </div>
  </div>`;
}

function renderDesktopNav(model) {
  const nav = $('#primaryNav');
  if (!nav) return;
  nav.innerHTML = model
    .map((item) => {
      if (!item.mega) {
        return `<a href="${href(item.href)}" data-nav="${item.key}" class="nav-link ${
          item.accent ? 'nav-sale' : ''
        }">${esc(item.label)}</a>`;
      }
      return `<div class="mega" data-mega>
        <a href="${href(item.href)}" data-nav="${item.key}" class="nav-link inline-flex items-center gap-1.5"
          aria-haspopup="true" aria-expanded="false">${esc(item.label)}${CHEVRON}</a>
        ${megaPanel(item)}
      </div>`;
    })
    .join('');

  // Keyboard support: the trigger opens its panel, Escape closes it.
  $$('[data-mega]', nav).forEach((wrapper) => {
    const trigger = $('.nav-link', wrapper);
    on(trigger, 'keydown', (event) => {
      if (event.key === 'ArrowDown' || (event.key === 'Enter' && !wrapper.classList.contains('open'))) {
        event.preventDefault();
        closeAllMega();
        wrapper.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        $('a', $('[data-mega-panel]', wrapper))?.focus();
      }
    });
    on(wrapper, 'focusout', (event) => {
      if (!wrapper.contains(event.relatedTarget)) {
        wrapper.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

function closeAllMega() {
  $$('[data-mega]').forEach((wrapper) => {
    wrapper.classList.remove('open');
    $('.nav-link', wrapper)?.setAttribute('aria-expanded', 'false');
  });
}

/* ─────────────── Mobile drawer ─────────────── */

function renderMobileNav(model) {
  const list = $('#mobileNavList');
  if (!list) return;
  list.innerHTML = model
    .map((item, index) => {
      if (!item.mega) {
        return `<a href="${href(item.href)}" data-nav="${item.key}" data-mobile-close
          class="nav-link block border-b border-line/5 py-4 ${item.accent ? 'nav-sale' : ''}">${esc(item.label)}</a>`;
      }
      return `<div class="border-b border-line/5">
        <button type="button" data-mobile-toggle="${index}" aria-expanded="false"
          class="nav-link flex w-full items-center justify-between py-4">
          <span>${esc(item.label)}</span>${CHEVRON}
        </button>
        <div class="acc-body" data-mobile-panel="${index}"><div class="overflow-hidden">
          <div class="space-y-6 pb-5">
            ${item.mega.columns
              .map(
                (column) => `<div>
                  <p class="text-[11px] uppercase tracking-[0.3em] text-gold">${esc(column.title)}</p>
                  <ul class="mt-3 space-y-2.5">
                    ${column.links
                      .map(
                        (link) =>
                          `<li><a href="${href(link.href)}" data-mobile-close class="f-link block text-[15px] text-ivory/85">${esc(link.label)}</a></li>`
                      )
                      .join('')}
                  </ul>
                </div>`
              )
              .join('')}
          </div>
        </div></div>
      </div>`;
    })
    .join('');
}

let mobileReleased = null;

export function openMobileNav() {
  const drawer = $('#mobileNav');
  if (!drawer) return;
  drawer.classList.remove('-translate-x-full');
  drawer.setAttribute('aria-hidden', 'false');
  $('#mobileNavOverlay').classList.remove('opacity-0', 'pointer-events-none');
  $('#mobileMenuBtn')?.setAttribute('aria-expanded', 'true');
  lockScroll();
  mobileReleased = trapFocus(drawer);
  requestAnimationFrame(() => $('#mobileNavClose')?.focus());
}

export function closeMobileNav() {
  const drawer = $('#mobileNav');
  if (!drawer || drawer.classList.contains('-translate-x-full')) return;
  drawer.classList.add('-translate-x-full');
  drawer.setAttribute('aria-hidden', 'true');
  $('#mobileNavOverlay').classList.add('opacity-0', 'pointer-events-none');
  $('#mobileMenuBtn')?.setAttribute('aria-expanded', 'false');
  unlockScroll();
  mobileReleased?.();
  mobileReleased = null;
}

/* ─────────────── Active state ─────────────── */

/** Highlight the nav entry that matches the current route. */
export function syncActiveNav() {
  const { path } = getCurrent();
  $$('[data-nav]').forEach((link) => {
    const target = link.getAttribute('href').replace(/^#/, '');
    const active = target === path || (target !== '/' && path.startsWith(`${target}/`));
    link.classList.toggle('active', active);
  });
}

export function initNavigation() {
  const model = navModel();
  renderDesktopNav(model);
  renderMobileNav(model);

  on($('#mobileMenuBtn'), 'click', openMobileNav);
  on($('#mobileNavClose'), 'click', closeMobileNav);
  on($('#mobileNavOverlay'), 'click', closeMobileNav);
  delegate(document, 'click', '[data-mobile-close]', closeMobileNav);

  delegate(document, 'click', '[data-mobile-toggle]', (event, button) => {
    const index = button.dataset.mobileToggle;
    const panel = $(`[data-mobile-panel="${index}"]`);
    const open = panel.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
    button.querySelector('svg')?.classList.toggle('rotate-180', open);
  });

  on(document, 'keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeMobileNav();
    closeAllMega();
  });

  // Close the mega menu once a link inside it is followed.
  delegate(document, 'click', '[data-mega-panel] a', closeAllMega);

  syncActiveNav();
}
