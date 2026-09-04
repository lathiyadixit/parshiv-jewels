/* ══════════════════════════════════════════════════════════════
   PRODUCT DETAIL
   Gallery with thumbnails and hover zoom, variant + quantity
   selection, Add to Cart, WhatsApp enquiry, specification and care
   accordions, reviews, related products and recently viewed.
   A sticky action bar appears on mobile once the buy box scrolls away.
   ══════════════════════════════════════════════════════════════ */
import { $, $$, esc, isTouchDevice, refreshImages } from '../core/dom.js';
import { href } from '../core/router.js';
import { inr, stars, formatDate, deliveryWindow } from '../core/format.js';
import { toast } from '../core/toast.js';
import {
  getBySlug,
  getVariant,
  firstAvailableVariant,
  relatedTo,
  youMayAlsoLike,
} from '../services/catalogService.js';
import * as cart from '../services/cartService.js';
import { openCart } from '../components/cartDrawer.js';
import { openWhatsApp, formatProductMessage, trackProductEnquiry } from '../services/whatsappService.js';
import { askForEnquiryDetails } from '../components/enquiryDialog.js';
import { track, EVENTS } from '../services/analyticsService.js';
import { recordView, getRecentlyViewed } from '../services/recentlyViewedService.js';
import { productRail } from '../components/productCard.js';
import { breadcrumbs, ratingRow, stockPill, accordion, WHATSAPP_ICON } from '../components/ui.js';
import { productSchema, breadcrumbSchema } from '../services/seoService.js';
import { COMMERCE } from '../config/site.config.js';

/* ─────────────── Gallery ─────────────── */

function gallery(product) {
  return `
  <div class="lg:sticky lg:top-40">
    <div class="relative overflow-hidden rounded-2xl border border-gold/20 bg-night" data-zoom-frame>
      <span class="pointer-events-none absolute left-3 top-3 z-10 h-4 w-4 border-l border-t border-gold/70"></span>
      <span class="pointer-events-none absolute right-3 top-3 z-10 h-4 w-4 border-r border-t border-gold/70"></span>
      <span class="pointer-events-none absolute bottom-3 left-3 z-10 h-4 w-4 border-b border-l border-gold/70"></span>
      <span class="pointer-events-none absolute bottom-3 right-3 z-10 h-4 w-4 border-b border-r border-gold/70"></span>
      <div class="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <span class="h-3 w-3 rotate-45 animate-ping bg-gold/60"></span>
      </div>
      <img id="galleryMain" src="${product.images[0].src}" ${product.images[0].srcset ? `srcset="${product.images[0].srcset}"
        sizes="(max-width: 1024px) 92vw, 46vw"` : ''} onerror="imgFix(this)"
        alt="${esc(product.images[0].alt)}" width="900" height="900" fetchpriority="high" decoding="async"
        class="relative aspect-square w-full object-cover transition-transform duration-300 will-change-transform">
      ${
        product.discount > 0
          ? `<span class="absolute left-6 top-6 z-10 rounded-full bg-gold px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink shadow-glow">${product.discount}% OFF</span>`
          : ''
      }
      <p class="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-gold/30 bg-night/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.22em] text-gold-light opacity-0 backdrop-blur transition duration-300 md:opacity-100" data-zoom-hint>Hover to zoom</p>
    </div>
    <div class="mt-4 grid grid-cols-4 gap-3" role="group" aria-label="Product images">
      ${product.images
        .map(
          (image, index) => `
        <button type="button" data-thumb="${index}" aria-label="View image ${index + 1} of ${product.images.length}"
          class="frame relative aspect-square overflow-hidden rounded-xl border transition ${
            index === 0 ? 'border-gold' : 'border-line/10 hover:border-gold/50'
          }">
          <img src="${image.src.replace(/([?&]w=)\d+/, '$1300')}" onerror="imgFix(this)" alt="${esc(image.alt)}"
            loading="lazy" decoding="async" class="h-full w-full object-cover">
        </button>`
        )
        .join('')}
    </div>
  </div>`;
}

/* ─────────────── Buy box ─────────────── */

function variantPicker(product) {
  if (product.variants.length <= 1) return '';
  const isRing = product.variantLabel === 'Ring Size';
  return `<fieldset class="mt-7">
    <div class="flex items-center justify-between gap-4">
      <legend class="text-[11px] uppercase tracking-[0.28em] text-gold">${esc(product.variantLabel)}</legend>
      ${isRing ? `<a href="${href('/size-guide')}" class="text-[11px] uppercase tracking-[0.18em] text-sand underline-offset-4 transition hover:text-gold-light hover:underline">Size guide</a>` : ''}
    </div>
    <div class="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="${esc(product.variantLabel)}">
      ${product.variants
        .map(
          (variant, index) => `
        <button type="button" role="radio" data-variant="${variant.id}"
          aria-checked="${index === 0}" ${variant.available ? '' : 'disabled'}
          class="chip ${index === 0 ? 'chip-on' : ''} ${
            variant.available ? '' : 'cursor-not-allowed line-through opacity-40'
          }">${esc(variant.label)}</button>`
        )
        .join('')}
    </div>
    <p class="mt-2.5 min-h-[18px] text-[12px] text-sand/80" data-variant-note></p>
  </fieldset>`;
}

function buyBox(product) {
  const variant = firstAvailableVariant(product) || product.variants[0];
  return `
  <div class="lg:pl-4">
    <p class="text-[11px] uppercase tracking-[0.32em] text-gold">${esc(product.categoryName)}</p>
    <h1 class="mt-3 font-display text-4xl font-semibold leading-tight text-ivory sm:text-5xl">${esc(product.name)}</h1>

    <div class="mt-4 flex flex-wrap items-center gap-4">
      <a href="#reviews" class="transition hover:text-gold-light">${ratingRow(product)}</a>
      ${stockPill(product)}
    </div>

    <div class="mt-6 flex flex-wrap items-baseline gap-4">
      <p class="font-display text-4xl text-gold" data-price>${inr(variant.price)}</p>
      ${
        product.onSale
          ? `<p class="text-lg text-sand/60 line-through">${inr(product.compareAt)}</p>
             <span class="rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-success">Save ${inr(product.savings)} · ${product.discount}%</span>`
          : ''
      }
    </div>
    <p class="mt-1.5 text-[12px] text-sand/70">Inclusive of all taxes · Complimentary insured shipping</p>

    <p class="mt-6 text-base leading-relaxed">${esc(product.shortDescription)}</p>

    ${variantPicker(product)}

    <div class="mt-7 flex flex-wrap items-end gap-5">
      <div>
        <label for="qtyInput" class="block text-[11px] uppercase tracking-[0.28em] text-gold">Quantity</label>
        <div class="qty mt-3">
          <button type="button" data-qty-step="-1" class="h-10 w-10 text-xl leading-none" aria-label="Decrease quantity">−</button>
          <input id="qtyInput" type="number" inputmode="numeric" min="1" max="${variant.inventory}" value="1"
            class="w-12 py-2 text-[16px]" aria-label="Quantity">
          <button type="button" data-qty-step="1" class="h-10 w-10 text-xl leading-none" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <p class="pb-2 text-[13px] text-sand/80">Line total <span class="font-semibold text-ivory" data-line-total>${inr(variant.price)}</span></p>
    </div>

    <div class="mt-8 flex flex-col gap-3 sm:flex-row">
      ${
        product.inStock
          ? `<button type="button" data-add-to-cart class="btn-gold flex-1 px-8 py-4">Add to Cart</button>`
          : `<button type="button" disabled class="btn-line flex-1 cursor-not-allowed px-8 py-4 opacity-40">Sold Out</button>`
      }
      <button type="button" data-wa-enquire
        class="btn-line flex-1 px-8 py-4 !border-success/40 !text-success hover:!border-success hover:!bg-success/10">
        ${WHATSAPP_ICON}Enquire on WhatsApp
      </button>
    </div>

    <div class="panel mt-8 divide-y divide-line/5">
      ${[
        ['📦', 'Free insured shipping', `Dispatched within ${COMMERCE.dispatchDays * 24} hours`],
        ['🚚', 'Estimated delivery', deliveryWindow()],
        ['↩', `${COMMERCE.returnWindowDays}-day returns`, 'Free insured collection from your address'],
        ['🛡', 'BIS hallmarked', 'Lifetime craftsmanship warranty'],
      ]
        .map(
          ([icon, title, detail]) => `
        <div class="flex items-center gap-4 px-6 py-4">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/30 text-sm" aria-hidden="true">${icon}</span>
          <span><span class="block text-[14px] text-ivory">${esc(title)}</span>
          <span class="block text-[12px] text-sand/80">${esc(detail)}</span></span>
        </div>`
        )
        .join('')}
    </div>
  </div>`;
}

/* ─────────────── Details, specs, reviews ─────────────── */

function detailAccordion(product) {
  const list = (items) => `<ul class="space-y-2">${items.map((item) => `<li class="flex gap-3"><span class="mt-2 h-1 w-1 shrink-0 rotate-45 bg-gold"></span><span>${esc(item)}</span></li>`).join('')}</ul>`;

  return accordion(
    [
      { title: 'Description', body: `<p>${esc(product.description)}</p>` },
      { title: 'Material & Details', body: list(product.details) },
      {
        title: 'Specifications',
        body: `<dl class="grid gap-x-8 gap-y-3 sm:grid-cols-2">${product.specs
          .map(
            (spec) =>
              `<div class="flex justify-between gap-4 border-b border-line/5 pb-2"><dt class="text-sand/70">${esc(
                spec.label
              )}</dt><dd class="text-right text-ivory">${esc(spec.value)}</dd></div>`
          )
          .join('')}</dl>`,
      },
      { title: 'Care Instructions', body: list(product.care) },
      {
        title: 'Shipping & Returns',
        body: `<p>Complimentary insured shipping on every order, dispatched within 24 hours and delivered in ${COMMERCE.deliveryDays[0]}–${COMMERCE.deliveryDays[1]} business days.</p>
          <p class="mt-3">Returns accepted within ${COMMERCE.returnWindowDays} days in unworn condition with documentation intact — we arrange free insured collection.
          <a href="${href('/returns-refunds')}" class="text-gold-light underline underline-offset-4">Read the full policy</a>.</p>`,
      },
    ],
    { openFirst: true, idPrefix: `pdp-${product.id}` }
  );
}

function reviewsSection(product) {
  const distribution = [5, 4, 3, 2, 1].map((score) => ({
    score,
    count: product.reviews.filter((review) => review.rating === score).length,
  }));
  const total = product.reviewCount;

  return `<section id="reviews" class="mt-20 scroll-mt-40" aria-labelledby="reviews-heading">
    <div class="flex flex-wrap items-end justify-between gap-6" data-reveal="up">
      <div>
        <p class="eyebrow">Verified purchases</p>
        <h2 id="reviews-heading" class="draw mt-4 font-display text-3xl font-semibold text-ivory sm:text-4xl">Reviews &amp; <em class="accent-it">Ratings</em></h2>
      </div>
    </div>

    <div class="mt-10 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div class="panel h-fit p-7 text-center" data-reveal="up">
        <p class="font-display text-5xl text-gold">${product.rating.toFixed(1)}</p>
        <p class="mt-2 text-xl text-gold" aria-hidden="true">${stars(product.rating)}</p>
        <p class="mt-2 text-[13px] text-sand/80">${total ? `Based on ${total} verified ${total === 1 ? 'review' : 'reviews'}` : 'Awaiting first review'}</p>
        <div class="mt-6 space-y-2">
          ${distribution
            .map(
              ({ score, count }) => `
            <div class="flex items-center gap-3 text-[12px]">
              <span class="w-8 shrink-0 text-sand/80">${score}★</span>
              <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-line/10">
                <span class="block h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-light" style="width:${
                  total ? (count / total) * 100 : 0
                }%"></span>
              </span>
              <span class="w-5 shrink-0 text-right text-sand/60">${count}</span>
            </div>`
            )
            .join('')}
        </div>
      </div>

      <div class="space-y-5">
        ${
          total
            ? product.reviews
                .map(
                  (review, index) => `
          <article class="panel p-7" data-reveal="up" style="transition-delay:${index * 70}ms">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="font-display text-lg text-ivory">${esc(review.author)}</p>
                ${review.verified ? `<p class="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-success">✓ Verified purchase</p>` : ''}
              </div>
              <div class="text-right">
                <p class="text-gold" aria-label="${review.rating} out of 5">${stars(review.rating)}</p>
                <p class="mt-0.5 text-[11px] text-sand/60">${esc(formatDate(review.date))}</p>
              </div>
            </div>
            <h3 class="mt-4 font-display text-xl text-gold-light">${esc(review.title)}</h3>
            <p class="mt-2 text-[15px] leading-relaxed text-ivory/90">${esc(review.body)}</p>
          </article>`
                )
                .join('')
            : `<div class="panel flex flex-col items-center gap-3 p-12 text-center">
                 <span class="text-4xl text-gold/40" aria-hidden="true">◆</span>
                 <p class="font-display text-2xl text-ivory">No reviews yet</p>
                 <p class="max-w-sm text-[15px]">Be the first to wear it. We ask every patron for an honest review after delivery.</p>
               </div>`
        }
      </div>
    </div>
  </section>`;
}

function stickyBar(product) {
  const variant = firstAvailableVariant(product) || product.variants[0];
  return `<div id="stickyBuy" class="fixed inset-x-0 bottom-0 z-[96] translate-y-full border-t border-gold/25 bg-onyx/95 px-4 py-3 shadow-soft backdrop-blur-md transition-transform duration-300 lg:hidden">
    <div class="flex items-center gap-3">
      <img src="${product.image.src.replace(/([?&]w=)\d+/, '$1200')}" onerror="imgFix(this)" alt=""
        width="44" height="44" loading="lazy" decoding="async" class="h-11 w-11 shrink-0 rounded-lg bg-night object-cover">
      <div class="min-w-0 flex-1">
        <p class="truncate text-[13px] text-ivory">${esc(product.name)}</p>
        <p class="text-[15px] font-semibold text-gold" data-sticky-price>${inr(variant.price)}</p>
      </div>
      ${
        product.inStock
          ? `<button type="button" data-add-to-cart class="btn-gold shrink-0 px-6 py-3 text-xs">Add to Cart</button>`
          : `<button type="button" disabled class="btn-line shrink-0 cursor-not-allowed px-6 py-3 text-xs opacity-40">Sold Out</button>`
      }
    </div>
  </div>`;
}

/* ─────────────── Route ─────────────── */

export default function productPage({ params, path }) {
  const product = getBySlug(params.slug);
  if (!product) return null;

  recordView(product);
  track(EVENTS.PRODUCT_VIEW, {
    slug: product.slug, name: product.name, sku: product.sku,
    price: product.price, category: product.categorySlug, collections: product.collections,
  });

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: product.categoryName, href: `/shop/${product.categorySlug}` },
    { label: product.name, href: product.url },
  ];

  const related = relatedTo(product, 4);
  const alsoLike = youMayAlsoLike(product, 4);
  const recent = getRecentlyViewed(product.slug, 4);

  return {
    meta: {
      title: `${product.name} — ${product.material}`,
      description: `${product.shortDescription} ${inr(product.price)}. BIS hallmarked, insured shipping, 30-day returns. Enquire on WhatsApp.`,
      path,
      image: product.images[0].src,
      type: 'product',
    },
    jsonLd: [productSchema(product), breadcrumbSchema(crumbs)],
    html: `<div class="page-anim mx-auto max-w-[1500px] px-5 py-10 pb-28 lg:px-8 lg:pb-20">
      ${breadcrumbs(crumbs)}
      <div class="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
        ${gallery(product)}
        ${buyBox(product)}
      </div>

      <div class="mt-20 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <h2 class="font-display text-3xl font-semibold text-ivory">The <em class="accent-it">Detail</em></h2>
          <div class="mt-8">${detailAccordion(product)}</div>
        </div>
        <aside class="panel h-fit p-8" data-reveal="right">
          <p class="eyebrow">Need a hand?</p>
          <h3 class="mt-4 font-display text-2xl text-ivory">Speak to a specialist</h3>
          <p class="mt-3 text-[15px] leading-relaxed">Questions about sizing, stones or a bespoke variation? Message us — a specialist who can see the piece will answer.</p>
          <button type="button" data-wa-enquire class="btn-line mt-6 w-full py-3.5 !border-success/40 !text-success hover:!border-success hover:!bg-success/10">
            ${WHATSAPP_ICON}Ask About This Piece
          </button>
          <a href="${href('/size-guide')}" class="btn-line mt-3 w-full py-3.5">Size Guide</a>
          <a href="${href('/jewelry-care')}" class="btn-line mt-3 w-full py-3.5">Care Guide</a>
        </aside>
      </div>

      ${reviewsSection(product)}
      ${productRail(related, { eyebrow: 'In the same spirit', title: 'Related Pieces', id: 'related' })}
      ${productRail(alsoLike, { eyebrow: 'Complete the look', title: 'You May Also Like', id: 'also-like' })}
      ${productRail(recent, { eyebrow: 'Your browsing', title: 'Recently Viewed', id: 'recent' })}
    </div>
    ${stickyBar(product)}`,
    onMount: (scope) => mount(product, scope),
  };
}

/* ─────────────── Behaviour ─────────────── */

function mount(product, scope) {
  const { on, delegate } = scope;
  const root = $('#main');
  let variantId = (firstAvailableVariant(product) || product.variants[0])?.id ?? null;
  let qty = 1;

  const currentVariant = () => getVariant(product, variantId) || product.variants[0];

  const syncPrice = () => {
    const variant = currentVariant();
    $$('[data-price]', root).forEach((el) => (el.textContent = inr(variant.price)));
    const total = $('[data-line-total]', root);
    if (total) total.textContent = inr(variant.price * qty);
    const sticky = $('[data-sticky-price]');
    if (sticky) sticky.textContent = inr(variant.price * qty);
    const note = $('[data-variant-note]', root);
    if (note) {
      note.textContent =
        variant.inventory > 0 && variant.inventory <= 4
          ? `Only ${variant.inventory} left in ${variant.label}.`
          : '';
    }
  };

  /* Gallery */
  const main = $('#galleryMain', root);
  delegate(root, 'click', '[data-thumb]', (event, button) => {
    const index = Number(button.dataset.thumb);
    const image = product.images[index];
    main.classList.remove('img-in');
    main.src = image.src;
    if (image.srcset) main.srcset = image.srcset;
    else main.removeAttribute('srcset');
    main.alt = image.alt;
    if (main.complete && main.naturalWidth) requestAnimationFrame(() => main.classList.add('img-in'));
    $$('[data-thumb]', root).forEach((el, i) => {
      el.classList.toggle('border-gold', i === index);
      el.classList.toggle('border-line/10', i !== index);
    });
  });

  /* Hover zoom — pointer-driven transform-origin, disabled on touch. */
  const frame = $('[data-zoom-frame]', root);
  if (frame && !isTouchDevice()) {
    on(frame, 'mousemove', (event) => {
      const rect = frame.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      main.style.transformOrigin = `${x}% ${y}%`;
      main.style.transform = 'scale(1.9)';
    });
    on(frame, 'mouseleave', () => {
      main.style.transform = '';
      main.style.transformOrigin = '';
    });
  } else {
    $('[data-zoom-hint]', root)?.remove();
  }

  /* Variants */
  delegate(root, 'click', '[data-variant]', (event, button) => {
    if (button.disabled) return;
    variantId = button.dataset.variant;
    $$('[data-variant]', root).forEach((el) => {
      const selected = el === button;
      el.classList.toggle('chip-on', selected);
      el.setAttribute('aria-checked', String(selected));
    });
    const input = $('#qtyInput', root);
    if (input) {
      input.max = currentVariant().inventory;
      if (qty > currentVariant().inventory) {
        qty = currentVariant().inventory;
        input.value = qty;
      }
    }
    syncPrice();
  });

  /* Quantity */
  const clampQty = (value) => {
    const cap = Math.min(COMMERCE.maxQtyPerLine, currentVariant().inventory || 1);
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(n, Math.max(1, cap));
  };

  delegate(root, 'click', '[data-qty-step]', (event, button) => {
    const next = clampQty(qty + Number(button.dataset.qtyStep));
    if (next === qty && Number(button.dataset.qtyStep) > 0) {
      toast(`Only ${currentVariant().inventory} available`, { tone: 'error' });
      return;
    }
    qty = next;
    $('#qtyInput', root).value = qty;
    syncPrice();
  });

  delegate(root, 'change', '#qtyInput', (event, input) => {
    qty = clampQty(input.value);
    input.value = qty;
    syncPrice();
  });

  /* Add to cart — both the buy box and the sticky mobile bar. */
  delegate(document, 'click', '[data-add-to-cart]', () => {
    const result = cart.add(product.id, variantId, qty);
    toast(result.message, { tone: result.ok ? 'success' : 'error' });
    if (result.ok) openCart();
  });

  /* WhatsApp enquiry for this specific piece. */
  delegate(document, 'click', '[data-wa-enquire]', async () => {
    const variant = currentVariant();
    const customer = await askForEnquiryDetails({
      title: 'Ask about this piece',
      summary: `Your details go with the enquiry so we can reply about ${product.name}.`,
      total: variant.price * qty,
      itemCount: qty,
      submitLabel: 'Send on WhatsApp',
    });
    if (!customer) return;
    toast('Opening WhatsApp…');
    trackProductEnquiry(product, variant, qty, customer);
    openWhatsApp(formatProductMessage(product, variant, qty, customer));
  });

  /* Sticky mobile bar appears once the main Add to Cart is out of view. */
  const sticky = $('#stickyBuy');
  const anchor = $('[data-add-to-cart]', root);
  if (sticky && anchor) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0].isIntersecting;
        sticky.classList.toggle('translate-y-full', visible);
      },
      { rootMargin: '-80px 0px 0px 0px' }
    );
    observer.observe(anchor);
    scope.observe(observer);
  }

  syncPrice();
  refreshImages(root);
}
