/* Gallery — the original atelier gallery, extended and made linkable
   through to the matching category pages. */
import { esc } from '../core/dom.js';
import { href } from '../core/router.js';
import { imageUrl } from '../services/catalogService.js';
import { GALLERY_TILES } from '../data/content.js';
import { breadcrumbs, pageHeading, ctaPanel } from '../components/ui.js';
import { SITE } from '../config/site.config.js';

const CRUMBS = [{ label: 'Home', href: '/' }, { label: 'Gallery', href: '/gallery' }];

export default function galleryPage({ path }) {
  return {
    meta: {
      title: 'The Gallery',
      description:
        'Inside the Parshiv Jewels atelier in Mahidharpura, Surat — gemstone rings, diamond necklaces, heritage jhumkas and tennis bracelets.',
      path,
    },
    html: `<div class="page-anim mx-auto max-w-[1300px] px-5 py-14 lg:px-8">
      ${breadcrumbs(CRUMBS)}
      <div class="mt-6">
        ${pageHeading({
          eyebrow: 'From our atelier',
          title: 'The',
          accent: 'Gallery',
          description:
            'Photographed on the bench where they were made, in Kansara Seri, Surat. No renders, no stock imagery of pieces we do not sell.',
        })}
      </div>

      <div class="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        ${GALLERY_TILES.map(
          (tile, index) => `
        <figure class="shine frame group relative h-60 overflow-hidden rounded-xl border border-line/5 sm:h-64"
          data-reveal="zoom" style="transition-delay:${(index % 3) * 80}ms">
          <img src="${imageUrl(tile.image, 900)}" onerror="imgFix(this)" alt="${esc(tile.caption)} — Parshiv Jewels atelier"
            loading="${index < 3 ? 'eager' : 'lazy'}" decoding="async"
            class="h-full w-full object-cover transition duration-700 group-hover:scale-105">
          <figcaption class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night to-transparent p-5 font-display text-xl text-ivory">${esc(tile.caption)}</figcaption>
        </figure>`
        ).join('')}
      </div>

      ${ctaPanel({
        eyebrow: 'Follow our sparkle',
        title: SITE.instagramHandle,
        message:
          'Daily drops of bridal sets, bespoke rings and behind-the-scenes craftsmanship from our Surat atelier.',
        primary: { label: 'Follow on Instagram', href: SITE.instagram, external: true },
        secondary: { label: 'Shop the Collection', href: '/shop' },
      })}
    </div>`,
  };
}
