/* Generates sitemap.xml from the live catalog.
   Run after adding or renaming products:  node tools/generate-sitemap.mjs */
import { writeFileSync } from 'node:fs';
import { CATALOG, getCategories, getCollections, getEdits } from '../assets/js/services/catalogService.js';
import { SITE } from '../assets/js/config/site.config.js';
import { INFO_LABELS } from '../assets/js/pages/info.js';

const today = new Date().toISOString().slice(0, 10);

const urls = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/shop', priority: '0.9', changefreq: 'weekly' },
  { loc: '/collections', priority: '0.8', changefreq: 'monthly' },
  { loc: '/gallery', priority: '0.6', changefreq: 'monthly' },
  { loc: '/contact', priority: '0.7', changefreq: 'yearly' },
  { loc: '/custom-design', priority: '0.7', changefreq: 'monthly' },
  { loc: '/faq', priority: '0.6', changefreq: 'monthly' },
  ...getCategories().map((c) => ({ loc: `/shop/${c.slug}`, priority: '0.9', changefreq: 'weekly' })),
  ...getEdits().map((e) => ({ loc: `/shop/${e.slug}`, priority: '0.8', changefreq: 'weekly' })),
  ...getCollections().map((c) => ({ loc: `/collections/${c.slug}`, priority: '0.8', changefreq: 'weekly' })),
  ...CATALOG.map((p) => ({ loc: p.url, priority: '0.8', changefreq: 'weekly' })),
  ...Object.keys(INFO_LABELS).map((slug) => ({ loc: `/${slug}`, priority: '0.5', changefreq: 'yearly' })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, priority, changefreq }) =>
      `  <url>\n    <loc>${SITE.origin}${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  )
  .join('\n')}
</urlset>
`;

writeFileSync(new URL('../sitemap.xml', import.meta.url), xml);
console.log(`sitemap.xml written with ${urls.length} URLs`);
