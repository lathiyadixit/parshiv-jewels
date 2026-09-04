/* ══════════════════════════════════════════════════════════════
   HOME
   The original homepage, preserved section for section, extended
   with best sellers, new arrivals, an editorial break, a brand-story
   band, a social gallery and a newsletter signup.
   ══════════════════════════════════════════════════════════════ */
import { esc } from '../core/dom.js';
import { href } from '../core/router.js';
import {
  featured,
  bestSellers,
  newArrivals,
  getCategories,
  getCollections,
  imageUrl,
} from '../services/catalogService.js';
import { getRecentlyViewed } from '../services/recentlyViewedService.js';
import { productGrid, productRail } from '../components/productCard.js';
import { sectionHeading } from '../components/ui.js';
import { SITE } from '../config/site.config.js';
import { TESTIMONIALS, GALLERY_TILES } from '../data/content.js';

/* ─────────────── Hero (unchanged from the original) ─────────────── */
function hero() {
  return `
  <div class="relative flex min-h-[calc(100dvh-190px)] items-center overflow-hidden">
    <p class="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 select-none whitespace-nowrap font-display text-[16vw] leading-none text-ivory/[0.04]" aria-hidden="true">PARSHIV</p>
    <div class="sparkle" style="top:20%;left:10%"></div>
    <div class="sparkle" style="top:30%;left:52%;animation-delay:1.2s"></div>
    <div class="sparkle" style="top:16%;left:78%;animation-delay:.6s"></div>
    <div class="sparkle" style="top:70%;left:6%;animation-delay:2s"></div>

    <div class="mx-auto grid w-full max-w-[1500px] items-center gap-10 px-5 py-10 lg:grid-cols-2 lg:px-8">
      <div>
        <p class="eyebrow" data-reveal="up">The House of Parshiv</p>
        <h1 class="mt-6 font-display text-[9.5vw] font-semibold leading-[1.08] text-ivory sm:text-5xl lg:text-6xl xl:text-[64px]">
          <span class="mask-line"><span>Timeless Elegance,</span></span>
          <span class="mask-line"><span style="transition-delay:.15s">Crafted to <em class="shimmer font-accent italic">Shine</em></span></span>
        </h1>
        <p class="mt-6 max-w-lg text-base leading-relaxed text-sand lg:text-lg" data-reveal="up" style="transition-delay:.35s">Exquisite jewellery designed to celebrate your beauty, your style, and your unforgettable moments — handcrafted in the heart of Surat.</p>
        <div class="mt-8 flex flex-wrap gap-4" data-reveal="up" style="transition-delay:.5s">
          <a href="${href('/shop')}" class="btn-gold px-8 py-3.5">Explore Collection</a>
          <a href="${href('/shop/new-arrivals')}" class="btn-line px-8 py-3.5">New Arrivals</a>
        </div>
        <div class="mt-10 grid max-w-lg grid-cols-2 gap-5 sm:grid-cols-4" data-reveal="up" style="transition-delay:.65s">
          <div><p class="font-display text-3xl text-gold lg:text-4xl"><span class="counter" data-count="100">0</span>%</p><p class="mt-1 text-xs uppercase tracking-[0.18em] text-sand/80">Certified</p></div>
          <div class="sm:border-l sm:border-line/10 sm:pl-5"><p class="font-display text-3xl text-gold lg:text-4xl"><span class="counter" data-count="5000">0</span>+</p><p class="mt-1 text-xs uppercase tracking-[0.18em] text-sand/80">Happy Patrons</p></div>
          <div class="sm:border-l sm:border-line/10 sm:pl-5"><p class="font-display text-3xl text-gold lg:text-4xl"><span class="counter" data-count="250">0</span>+</p><p class="mt-1 text-xs uppercase tracking-[0.18em] text-sand/80">Signature Designs</p></div>
          <div class="sm:border-l sm:border-line/10 sm:pl-5"><p class="font-display text-3xl text-gold lg:text-4xl">4.9★</p><p class="mt-1 text-xs uppercase tracking-[0.18em] text-sand/80">Google Rating</p></div>
        </div>
      </div>

      <div class="relative mx-auto w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[350px]" data-reveal="zoom" style="transition-delay:.3s">
        <div class="pointer-events-none absolute -inset-3 rounded-t-[999px] border border-gold/25"></div>
        <div class="kenburns relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-t-[999px] border border-gold/30 shadow-soft">
          <img src="${imageUrl('photo-1599643478518-a784e5dc4c8f', 1000)}" onerror="imgFix(this)"
            alt="Parshiv Jewels signature diamond cascade necklace on a model" width="1000" height="1333"
            fetchpriority="high" decoding="async" class="h-full w-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent"></div>
        </div>
        <div class="floaty absolute -left-4 top-8 rounded-full border border-gold/30 bg-onyx/90 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-gold-light backdrop-blur">BIS Hallmarked</div>
        <div class="floaty absolute -right-2 bottom-14 rounded-full border border-gold/30 bg-onyx/90 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-gold-light backdrop-blur" style="animation-delay:1.4s">Insured Shipping</div>
        <p class="mt-6 text-center text-[10px] uppercase tracking-[0.4em] text-gold-light/90">Parshiv Jewels ◆ Fine Craft ◆ Surat</p>
      </div>
    </div>
    <div class="scroll-line absolute bottom-4 left-1/2 hidden h-12 w-px -translate-x-1/2 overflow-hidden bg-line/10 lg:block"><span class="block h-full w-full bg-gold"></span></div>
  </div>`;
}

/* ─────────────── Shop by category (original mosaic) ─────────────── */
function categories() {
  const cats = getCategories();
  const layout = [
    'col-span-2 row-span-2',
    '',
    '',
    'col-span-2',
  ];
  const sizes = ['text-3xl', 'text-2xl', 'text-2xl', 'text-2xl'];

  return `
  <div class="mx-auto max-w-[1500px] px-5 py-24 lg:px-8">
    ${sectionHeading({
      eyebrow: 'Shop by category',
      title: 'Our',
      accent: 'Collections',
      action: { label: 'View All', href: '/shop' },
    })}
    <div class="mt-12 grid auto-rows-[210px] gap-5 sm:auto-rows-[230px] sm:grid-cols-2 lg:grid-cols-4">
      ${cats
        .map(
          (category, index) => `
        <a href="${href(`/shop/${category.slug}`)}" class="shine frame group relative overflow-hidden rounded-xl border border-line/5 text-left ${layout[index] || ''}"
          data-reveal="${index === 0 ? 'zoom' : 'up'}" style="transition-delay:${index * 80}ms">
          <img src="${imageUrl(category.image, index === 0 ? 1400 : 900)}" onerror="imgFix(this)"
            alt="${esc(category.name)} collection by Parshiv Jewels" loading="lazy" decoding="async"
            class="h-full w-full object-cover transition duration-[1.2s] group-hover:scale-110">
          <span class="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-transparent"></span>
          <span class="absolute bottom-0 block w-full p-6 sm:p-7">
            <span class="block text-[11px] tracking-[0.4em] text-gold">0${index + 1}</span>
            <span class="block font-display ${sizes[index]} text-ivory">${esc(category.name)}</span>
            <span class="mt-1 block text-[11px] uppercase tracking-[0.22em] text-sand/80">${esc(category.tagline)}</span>
            <span class="mt-1 block text-xs uppercase tracking-[0.3em] text-gold-light opacity-0 transition group-hover:opacity-100">Explore →</span>
          </span>
        </a>`
        )
        .join('')}
    </div>
  </div>`;
}

/* ─────────────── Product bands ─────────────── */
function band({ eyebrow, title, accent, products, action, tinted = false, id }) {
  if (!products.length) return '';
  return `
  <div class="${tinted ? 'border-y border-line/5 bg-onyx/60' : ''} py-24" ${id ? `id="${id}"` : ''}>
    <div class="mx-auto max-w-[1500px] px-5 lg:px-8">
      ${sectionHeading({ eyebrow, title, accent, align: 'center' })}
      <div class="mt-14">${productGrid(products, { columns: products.length > 3 ? 4 : 3, eagerCount: 0 })}</div>
      ${
        action
          ? `<div class="mt-12 text-center" data-reveal="up"><a href="${href(action.href)}" class="btn-gold px-10 py-4">${esc(action.label)}</a></div>`
          : ''
      }
    </div>
  </div>`;
}

/* ─────────────── Editorial / promotional break ─────────────── */
function editorial() {
  const collection = getCollections()[0];
  return `
  <div class="mx-auto max-w-[1500px] px-5 py-24 lg:px-8">
    <div class="grid items-center gap-10 lg:grid-cols-2">
      <div class="shine frame relative overflow-hidden rounded-2xl border border-gold/20" data-reveal="left">
        <img src="${imageUrl(collection.image, 1200)}" onerror="imgFix(this)"
          alt="${esc(collection.name)} collection — bridal jewellery by Parshiv Jewels"
          loading="lazy" decoding="async" class="h-full max-h-[520px] w-full object-cover">
        <span class="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent"></span>
      </div>
      <div data-reveal="right">
        <p class="eyebrow">The bridal edit</p>
        <h2 class="draw mt-5 font-display text-4xl font-semibold text-ivory sm:text-5xl">${esc(collection.name)} <em class="accent-it">Collection</em></h2>
        <p class="mt-6 text-base leading-relaxed">${esc(collection.description)}</p>
        <ul class="mt-8 space-y-3 text-[15px]">
          <li class="flex items-start gap-3"><span class="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold"></span>Made to order in 7–21 working days by a single karigar.</li>
          <li class="flex items-start gap-3"><span class="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold"></span>Progress photographs shared with you on WhatsApp at every stage.</li>
          <li class="flex items-start gap-3"><span class="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold"></span>Serial-numbered warranty card and lifetime craftsmanship guarantee.</li>
        </ul>
        <div class="mt-9 flex flex-wrap gap-4">
          <a href="${href(`/collections/${collection.slug}`)}" class="btn-gold px-8 py-3.5">Explore the Edit</a>
          <a href="${href('/contact')}" class="btn-line px-8 py-3.5">Book a Consultation</a>
        </div>
      </div>
    </div>
  </div>`;
}

/* ─────────────── Why choose us ─────────────── */
function whyUs() {
  const pillars = [
    { icon: '◆', title: 'Certified & Hallmarked', copy: 'Every piece carries a BIS hallmark and, where stones are set, an independent grading report you can verify.' },
    { icon: '✦', title: 'Made in Our Atelier', copy: 'Cut, set and polished in Mahidharpura by karigars we employ directly — no outsourcing, no middlemen.' },
    { icon: '❖', title: 'Honest Pricing', copy: 'Making charges quoted upfront on WhatsApp. The price you are told is the price you pay.' },
    { icon: '◈', title: 'Insured Both Ways', copy: 'Complimentary insured shipping, and a 30-day return window with free insured collection.' },
  ];
  return `
  <div class="border-y border-line/5 bg-onyx/60 py-24">
    <div class="mx-auto max-w-[1500px] px-5 lg:px-8">
      ${sectionHeading({ eyebrow: 'Why Parshiv', title: 'The House', accent: 'Difference', align: 'center' })}
      <div class="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        ${pillars
          .map(
            (pillar, index) => `
          <div class="panel h-full p-8 transition duration-500 hover:border-gold/40 hover:shadow-glow" data-reveal="up" style="transition-delay:${index * 90}ms">
            <span class="flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 text-xl text-gold" aria-hidden="true">${pillar.icon}</span>
            <h3 class="mt-6 font-display text-2xl text-ivory">${esc(pillar.title)}</h3>
            <p class="mt-3 text-[15px] leading-relaxed">${esc(pillar.copy)}</p>
          </div>`
          )
          .join('')}
      </div>
      <div class="mt-12 text-center" data-reveal="up">
        <a href="${href('/our-story')}" class="btn-line px-9 py-3.5">Read Our Story</a>
      </div>
    </div>
  </div>`;
}

/* ─────────────── Testimonials (original marquee) ─────────────── */
function testimonialCard(item) {
  return `<div class="w-[330px] shrink-0 rounded-xl border border-gold/15 bg-card p-7">
    <p class="text-gold" aria-hidden="true">★★★★★</p>
    <p class="mt-4 text-[15px] leading-relaxed text-ivory/90">“${esc(item.body)}”</p>
    <p class="mt-5 font-display text-lg text-gold">${esc(item.author)}</p>
    <p class="mt-1 text-[11px] uppercase tracking-[0.2em] text-sand/70">${esc(item.context)}</p>
  </div>`;
}

function testimonials() {
  const track = TESTIMONIALS.map(testimonialCard).join('');
  return `
  <div class="overflow-hidden py-24">
    <p class="eyebrow justify-center" data-reveal="up">Words from our patrons</p>
    <h2 class="draw-c mt-5 text-center font-display text-4xl font-semibold text-ivory sm:text-5xl" data-reveal="up">Loved &amp; <em class="accent-it">Trusted</em></h2>
    <div class="marquee mt-12 overflow-hidden">
      <div class="marquee-track gap-6 pr-6" style="--sp:52s">
        <div class="flex shrink-0 gap-6">${track}</div>
        <div class="flex shrink-0 gap-6" aria-hidden="true">${track}</div>
      </div>
    </div>
  </div>`;
}

/* ─────────────── Instagram gallery ─────────────── */
function instagram() {
  return `
  <div class="mx-auto max-w-[1500px] px-5 pb-8 lg:px-8">
    ${sectionHeading({ eyebrow: 'Follow our sparkle', title: 'From the', accent: 'Atelier', align: 'center' })}
    <div class="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      ${GALLERY_TILES.slice(0, 6)
        .map(
          (tile, index) => `
        <a href="${SITE.instagram}" target="_blank" rel="noopener"
          class="shine frame group relative aspect-square overflow-hidden rounded-xl border border-line/5"
          data-reveal="zoom" style="transition-delay:${index * 60}ms" aria-label="${esc(tile.caption)} on Instagram">
          <img src="${imageUrl(tile.image, 500)}" onerror="imgFix(this)" alt="${esc(tile.caption)}"
            loading="lazy" decoding="async" class="h-full w-full object-cover transition duration-700 group-hover:scale-110">
          <span class="absolute inset-0 flex items-center justify-center bg-night/70 opacity-0 transition duration-300 group-hover:opacity-100">
            <span class="text-[11px] uppercase tracking-[0.28em] text-gold-light">View</span>
          </span>
        </a>`
        )
        .join('')}
    </div>
    <div class="mt-10 text-center" data-reveal="up">
      <a href="${SITE.instagram}" target="_blank" rel="noopener" class="btn-gold px-9 py-4">Follow ${esc(SITE.instagramHandle)}</a>
    </div>
  </div>`;
}

/* ─────────────── Newsletter ─────────────── */
function newsletter() {
  return `
  <div class="mx-auto max-w-[1500px] px-5 py-24 lg:px-8">
    <div class="shine relative overflow-hidden rounded-2xl border border-gold/25 bg-card p-10 text-center shadow-soft sm:p-14" data-reveal="zoom">
      <div class="sparkle" style="top:20%;left:10%"></div>
      <div class="sparkle" style="top:60%;left:88%;animation-delay:1.2s"></div>
      <p class="eyebrow justify-center">The Parshiv letter</p>
      <h2 class="mt-5 font-display text-4xl font-semibold text-ivory sm:text-5xl">First Look, <em class="accent-it">Every Season</em></h2>
      <p class="mx-auto mt-4 max-w-xl text-[15px]">New collections, atelier stories and private previews — sent occasionally, never more than twice a month.</p>
      <form id="newsletterForm" class="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row" novalidate>
        <label class="sr-only" for="newsletterEmail">Email address</label>
        <input id="newsletterEmail" type="email" required autocomplete="email" class="field flex-1" placeholder="you@example.com">
        <button type="submit" class="btn-gold shrink-0 px-8 py-3.5">Subscribe</button>
      </form>
      <p id="newsletterMsg" class="mt-3 min-h-[20px] text-[13px]" role="status" aria-live="polite"></p>
      <p class="mt-2 text-[11px] uppercase tracking-[0.2em] text-sand/60">No spam. Unsubscribe any time.</p>
    </div>
  </div>`;
}

/* ─────────────── Route ─────────────── */
export default function homePage() {
  const recent = getRecentlyViewed(null, 4);

  return {
    meta: {
      title: `${SITE.tagline} — Luxury Jewellery Surat`,
      description:
        'Parshiv Jewels, Surat — BIS-hallmarked rings, necklaces, earrings & bracelets. Certified stones, insured shipping, 30-day returns. Order directly on WhatsApp.',
      path: '/',
    },
    html: `<div class="page-anim">
      ${hero()}
      ${categories()}
      ${band({
        eyebrow: 'Curated for you',
        title: 'Featured',
        accent: 'Collection',
        products: featured(3),
        action: { label: 'View All Products', href: '/shop' },
        tinted: true,
      })}
      ${band({
        eyebrow: 'Most loved',
        title: 'Best',
        accent: 'Sellers',
        products: bestSellers(4),
        action: { label: 'Shop Best Sellers', href: '/shop/best-sellers' },
      })}
      ${editorial()}
      ${band({
        eyebrow: 'Just arrived',
        title: 'New',
        accent: 'Arrivals',
        products: newArrivals(4),
        action: { label: 'Shop New Arrivals', href: '/shop/new-arrivals' },
        tinted: true,
      })}
      ${whyUs()}
      ${testimonials()}
      ${
        recent.length
          ? `<div class="mx-auto max-w-[1500px] px-5 pb-8 lg:px-8">${productRail(recent, {
              eyebrow: 'Pick up where you left off',
              title: 'Recently Viewed',
              id: 'home-recent',
            })}</div>`
          : ''
      }
      ${instagram()}
      ${newsletter()}
    </div>`,
  };
}
