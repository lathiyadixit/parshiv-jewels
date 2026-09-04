/* ══════════════════════════════════════════════════════════════
   INFORMATIONAL PAGES
   One renderer for About, Our Story, Shipping, Returns, Jewelry Care,
   Size Guide, Privacy and Terms — all driven from content.js so the
   layout, type scale and spacing are identical across them.
   ══════════════════════════════════════════════════════════════ */
import { esc } from '../core/dom.js';
import { href } from '../core/router.js';
import { imageUrl } from '../services/catalogService.js';
import { PAGES } from '../data/content.js';
import { breadcrumbs, pageHeading, ctaPanel } from '../components/ui.js';
import { breadcrumbSchema } from '../services/seoService.js';
import { SITE } from '../config/site.config.js';

/** Route slug → nav label, used for breadcrumbs and cross-links. */
const LABELS = {
  about: 'About Us',
  'our-story': 'Our Story',
  'shipping-delivery': 'Shipping & Delivery',
  'returns-refunds': 'Returns & Refunds',
  'cancellation-policy': 'Cancellation Policy',
  'jewelry-care': 'Jewelry Care',
  'size-guide': 'Size Guide',
  'diamond-guide': 'Diamond Guide',
  'certification-guide': 'Certification Guide',
  'privacy-policy': 'Privacy Policy',
  'terms-conditions': 'Terms & Conditions',
};

/**
 * Shared figure renderer for hero and in-section imagery.
 * `fit: 'contain'` is for documents and diagrams — they keep their own
 * proportions and lose the darkening scrim that suits a photograph.
 */
function figureImage({
  src,
  alt,
  caption,
  fit,
  bg = 'light',
  fullSize = false,
  height = '',
  priority = false,
  marginClass = 'mt-12',
}) {
  if (!src) return '';
  const isDocument = fit === 'contain';
  // A chart on a black ground belongs on the site's own dark surface; one on
  // white needs a light panel or it reads as a hole punched in the page.
  const backdrop = bg === 'dark' ? 'panel-artwork' : 'bg-white/95';
  const href = imageUrl(src, 1600);

  // Diagrams always scale to the column — never cropped, never clipped. Dense
  // ones get a link to the full-resolution file, since their labels are small
  // on a phone and the browser's own image view zooms better than we can.
  const image = `<img src="${href}" onerror="imgFix(this)" alt="${esc(alt)}"
      ${priority ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"
      class="${isDocument ? 'block h-auto w-full object-contain' : 'h-full w-full object-cover'}">`;

  const fullSizeLink = fullSize
    ? ` <a href="${href}" target="_blank" rel="noopener" class="whitespace-nowrap text-gold-light underline underline-offset-4 transition hover:text-gold">View full size ↗</a>`
    : '';

  return `<figure class="shine frame relative ${marginClass} overflow-hidden rounded-2xl border border-gold/20 ${
    isDocument ? backdrop : height
  }" data-reveal="zoom">
    ${image}
    ${isDocument ? '' : '<span class="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent"></span>'}
    ${
      caption || fullSize
        ? `<figcaption class="border-t border-gold/15 bg-onyx px-6 py-3.5 text-center text-[12px] leading-relaxed text-sand/90">${esc(
            caption || ''
          )}${fullSizeLink}</figcaption>`
        : ''
    }
  </figure>`;
}

function heroImage(content) {
  if (!content.hero) return '';
  return figureImage({
    src: content.hero,
    alt: content.heroAlt || `${content.title} ${content.accent} — ${SITE.name}`,
    caption: content.heroCaption,
    fit: content.heroFit,
    bg: content.heroBg,
    fullSize: content.heroFullSize,
    height: 'h-64 sm:h-80',
    priority: true,
  });
}

/** An image sitting inside a section, between its paragraphs. */
function sectionImage(image) {
  if (!image) return '';
  return figureImage({
    src: image.src,
    alt: image.alt,
    caption: image.caption,
    fit: image.fit,
    bg: image.bg,
    fullSize: image.fullSize,
    height: image.height || 'h-56 sm:h-72',
    marginClass: 'mt-7',
  });
}

function statsBand(stats) {
  if (!stats) return '';
  return `<div class="panel mt-12 grid gap-6 p-9 sm:grid-cols-4" data-reveal="up">
    ${stats
      .map(
        ([value, label], index) => `
      <div class="${index ? 'sm:border-l sm:border-line/10 sm:pl-6' : ''}">
        <p class="font-display text-3xl text-gold lg:text-4xl">${esc(value)}</p>
        <p class="mt-1 text-xs uppercase tracking-[0.18em] text-sand/80">${esc(label)}</p>
      </div>`
      )
      .join('')}
  </div>`;
}

function timeline(entries) {
  if (!entries) return '';
  return `<div class="mt-14" data-reveal="up">
    <h2 class="font-display text-3xl font-semibold text-ivory">The <em class="accent-it">Timeline</em></h2>
    <ol class="mt-8 space-y-6 border-l border-gold/25 pl-8">
      ${entries
        .map(
          ([when, what]) => `
        <li class="relative">
          <span class="absolute -left-[2.35rem] top-2 h-2.5 w-2.5 rotate-45 bg-gold" aria-hidden="true"></span>
          <p class="text-[11px] uppercase tracking-[0.28em] text-gold">${esc(when)}</p>
          <p class="mt-2 text-[15px] leading-relaxed">${esc(what)}</p>
        </li>`
        )
        .join('')}
    </ol>
  </div>`;
}

/**
 * @param {object} table  { caption, head[], rows[][] }
 * @param {{nested?: boolean}} options nested tables sit inside a section and
 *   carry no heading of their own, since the section already has one.
 */
function dataTable(table, { nested = false } = {}) {
  if (!table) return '';
  return `<div class="${nested ? 'mt-7' : 'mt-14'}" ${nested ? '' : 'data-reveal="up"'}>
    ${
      nested
        ? `<p class="text-[11px] uppercase tracking-[0.28em] text-gold">${esc(table.caption)}</p>`
        : `<h2 class="font-display text-3xl font-semibold text-ivory">${esc(table.caption)}</h2>`
    }
    <div class="panel mt-6 overflow-x-auto">
      <table class="w-full text-left text-[14px]" style="min-width:${Math.min(560, table.head.length * 140)}px">
        <caption class="sr-only">${esc(table.caption)}</caption>
        <thead>
          <tr class="border-b border-gold/20">
            ${table.head
              .map(
                (cell) =>
                  `<th scope="col" class="px-6 py-4 text-[11px] uppercase tracking-[0.22em] text-gold">${esc(cell)}</th>`
              )
              .join('')}
          </tr>
        </thead>
        <tbody>
          ${table.rows
            .map(
              (row) => `<tr class="border-b border-line/5 transition last:border-0 hover:bg-gold/5">
                ${row
                  .map(
                    (cell, index) =>
                      `<td class="px-6 py-4 ${index === 0 ? 'font-medium text-ivory' : ''}">${esc(cell)}</td>`
                  )
                  .join('')}
              </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

/**
 * Bulleted guidance, using the same gold diamond marker as the rest of the site.
 * Each item is either a plain string, or `{ term, detail }` for the
 * definition style used by the buying guides.
 */
function bulletList(items, { emphasis = false } = {}) {
  if (!items || !items.length) return '';
  return `<ul class="mt-5 space-y-3 ${emphasis ? 'text-[17px]' : 'text-base'} leading-relaxed">
    ${items
      .map((item) => {
        const content =
          typeof item === 'string'
            ? esc(item)
            : `<span class="font-medium text-ivory">${esc(item.term)}</span> — ${esc(item.detail)}`;
        return `<li class="flex gap-3"><span class="mt-2.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" aria-hidden="true"></span><span>${content}</span></li>`;
      })
      .join('')}
  </ul>`;
}

function relatedLinks(currentSlug) {
  const related = Object.entries(LABELS).filter(([slug]) => slug !== currentSlug);
  return `<div class="mt-16 border-t border-line/5 pt-10" data-reveal="up">
    <p class="text-[11px] uppercase tracking-[0.3em] text-gold">More information</p>
    <div class="mt-5 flex flex-wrap gap-3">
      ${related.map(([slug, label]) => `<a href="${href(`/${slug}`)}" class="chip">${esc(label)}</a>`).join('')}
      <a href="${href('/faq')}" class="chip">FAQ</a>
    </div>
  </div>`;
}

export default function infoPage({ path, meta }) {
  const slug = meta.slug;
  const content = PAGES[slug];
  if (!content) return null;

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: LABELS[slug] || content.title, href: `/${slug}` },
  ];

  return {
    meta: {
      title: LABELS[slug] || `${content.title} ${content.accent}`,
      description: content.description,
      path,
      image: content.hero ? imageUrl(content.hero, 1200) : undefined,
    },
    jsonLd: [breadcrumbSchema(crumbs)],
    html: `<div class="page-anim mx-auto max-w-[1100px] px-5 py-14 lg:px-8">
      ${breadcrumbs(crumbs)}
      <div class="mt-6">
        ${pageHeading({
          eyebrow: content.eyebrow,
          title: content.title,
          accent: content.accent,
          description: content.description,
        })}
      </div>
      ${content.updated ? `<p class="mt-4 text-[12px] uppercase tracking-[0.2em] text-sand/60">${esc(content.updatedLabel || 'Last updated')} ${esc(content.updated)}</p>` : ''}
      ${heroImage(content)}
      ${statsBand(content.stats)}

      <div class="mt-14 space-y-12">
        ${content.sections
          .map(
            (section, index) => `
          <section data-reveal="up" style="transition-delay:${(index % 3) * 70}ms"
            class="${section.highlight ? 'relative overflow-hidden rounded-2xl border border-gold/35 bg-gold/[0.06] p-7 sm:p-9' : ''}">
            ${
              section.highlight
                ? `<span class="pointer-events-none absolute left-4 top-4 h-4 w-4 border-l border-t border-gold/60"></span>
                   <span class="pointer-events-none absolute right-4 top-4 h-4 w-4 border-r border-t border-gold/60"></span>
                   <span class="pointer-events-none absolute bottom-4 left-4 h-4 w-4 border-b border-l border-gold/60"></span>
                   <span class="pointer-events-none absolute bottom-4 right-4 h-4 w-4 border-b border-r border-gold/60"></span>
                   ${section.flag ? `<p class="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-gold-light">${esc(section.flag)}</p>` : ''}`
                : ''
            }
            <h2 class="font-display text-3xl font-semibold text-ivory">${esc(section.heading)}</h2>
            ${
              section.body && section.body.length
                ? `<div class="mt-5 space-y-4 text-base leading-relaxed">
                    ${section.body.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}
                  </div>`
                : ''
            }
            ${sectionImage(section.image)}
            ${
              section.bodyAfter && section.bodyAfter.length
                ? `<div class="mt-7 space-y-4 text-base leading-relaxed">
                    ${section.bodyAfter.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}
                  </div>`
                : ''
            }
            ${bulletList(section.list, { emphasis: section.highlight })}
            ${dataTable(section.table, { nested: true })}
          </section>`
          )
          .join('')}
      </div>

      ${timeline(content.timeline)}
      ${dataTable(content.table)}

      ${ctaPanel({
        eyebrow: content.cta?.eyebrow || 'Talk to us',
        title: content.cta?.title || 'Still need a hand?',
        message:
          content.cta?.message ||
          `A specialist is on WhatsApp at ${SITE.whatsappDisplay} — they can see the piece you are asking about and usually reply within a few hours.`,
        primary: { label: 'Message on WhatsApp', href: `https://wa.me/${SITE.phone.replace(/\D/g, '')}`, external: true },
        secondary: { label: 'Contact Page', href: '/contact' },
      })}

      ${relatedLinks(slug)}
    </div>`,
  };
}

export { LABELS as INFO_LABELS };
