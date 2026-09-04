/* 404 — kept on-brand and useful, with routes back into the catalog. */
import { bestSellers } from '../services/catalogService.js';
import { productGrid } from '../components/productCard.js';
import { emptyState } from '../components/ui.js';

export default function notFoundPage({ path }) {
  return {
    meta: {
      title: 'Page Not Found',
      description: 'The page you were looking for has moved or no longer exists.',
      path,
      noindex: true,
    },
    html: `<div class="page-anim mx-auto max-w-[1200px] px-5 py-20 lg:px-8">
      <p class="text-center font-display text-[22vw] leading-none text-ivory/[0.06] sm:text-[12rem]" aria-hidden="true">404</p>
      <div class="-mt-8">
        ${emptyState({
          heading: 'h1',
          title: 'This page has slipped its setting',
          message:
            'The page you were looking for has moved or no longer exists. Here is where most people go next.',
          actions: [
            { label: 'Back to Home', href: '/' },
            { label: 'Shop All Jewellery', href: '/shop' },
          ],
        })}
      </div>
      <section class="mt-20" aria-labelledby="nf-heading">
        <h2 id="nf-heading" class="draw-c text-center font-display text-3xl font-semibold text-ivory">Best <em class="accent-it">Sellers</em></h2>
        <div class="mt-10">${productGrid(bestSellers(4), { columns: 4, eagerCount: 0, compact: true })}</div>
      </section>
    </div>`,
  };
}
