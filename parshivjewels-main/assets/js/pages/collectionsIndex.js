/* Collections index — a directory of every curated collection. */
import { esc } from '../core/dom.js';
import { href } from '../core/router.js';
import { pluralise } from '../core/format.js';
import { getCollections, query, imageUrl } from '../services/catalogService.js';
import { breadcrumbs, pageHeading, ctaPanel } from '../components/ui.js';
import { breadcrumbSchema } from '../services/seoService.js';

const CRUMBS = [{ label: 'Home', href: '/' }, { label: 'Collections', href: '/collections' }];

export default function collectionsIndexPage({ path }) {
  const collections = getCollections();

  return {
    meta: {
      title: 'Collections',
      description:
        'Bridal Heirloom, Everyday Luxe, Celestial, Solitaire Atelier, Heritage Gold and Pearl Reverie — the six collections of Parshiv Jewels.',
      path,
    },
    jsonLd: [breadcrumbSchema(CRUMBS)],
    html: `<div class="page-anim mx-auto max-w-[1500px] px-5 py-14 lg:px-8">
      ${breadcrumbs(CRUMBS)}
      <div class="mt-6">
        ${pageHeading({
          eyebrow: 'Six ways to wear it',
          title: 'Our',
          accent: 'Collections',
          description:
            'Each collection answers a different question — what to wear on the biggest day, what to wear every day, and everything in between.',
        })}
      </div>

      <div class="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        ${collections
          .map((collection, index) => {
            const count = query({ collection: collection.slug }).length;
            return `
          <a href="${href(`/collections/${collection.slug}`)}"
            class="shine frame group panel relative flex flex-col overflow-hidden rounded-xl transition duration-500 hover:-translate-y-1 hover:border-gold/50 hover:shadow-glow"
            data-reveal="up" style="transition-delay:${(index % 3) * 90}ms">
            <span class="relative block h-56 overflow-hidden bg-night">
              <img src="${imageUrl(collection.image, 900)}" onerror="imgFix(this)"
                alt="${esc(collection.name)} collection by Parshiv Jewels" loading="lazy" decoding="async"
                class="h-full w-full object-cover transition duration-[1.2s] group-hover:scale-110">
              <span class="absolute inset-0 bg-gradient-to-t from-night via-night/20 to-transparent"></span>
            </span>
            <span class="flex flex-1 flex-col p-7">
              <span class="text-[11px] uppercase tracking-[0.3em] text-gold">${esc(collection.tagline)}</span>
              <span class="mt-2 block font-display text-2xl text-ivory">${esc(collection.name)}</span>
              <span class="mt-3 block text-[15px] leading-relaxed">${esc(collection.description)}</span>
              <span class="mt-auto flex items-center justify-between pt-6 text-[11px] uppercase tracking-[0.24em]">
                <span class="text-sand/70">${pluralise(count, 'piece')}</span>
                <span class="text-gold-light opacity-0 transition group-hover:opacity-100">Explore →</span>
              </span>
            </span>
          </a>`;
          })
          .join('')}
      </div>

      ${ctaPanel({
        eyebrow: 'Commission a piece',
        title: 'Nothing quite right?',
        message:
          'We take bespoke commissions — a stone you already own, a design from a photograph, a set built around a wedding date. Tell us on WhatsApp.',
        primary: { label: 'Start a Commission', href: '/contact' },
        secondary: { label: 'Shop All Jewellery', href: '/shop' },
      })}
    </div>`,
  };
}
