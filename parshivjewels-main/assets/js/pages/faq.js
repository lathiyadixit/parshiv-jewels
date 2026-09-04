/* FAQ — the original accordion, driven from content data and marked up
   with FAQPage structured data. */
import { esc } from '../core/dom.js';
import { FAQS } from '../data/content.js';
import { breadcrumbs, pageHeading, accordion, ctaPanel } from '../components/ui.js';
import { faqSchema, breadcrumbSchema } from '../services/seoService.js';

const CRUMBS = [{ label: 'Home', href: '/' }, { label: 'FAQ', href: '/faq' }];

export default function faqPage({ path }) {
  return {
    meta: {
      title: 'Frequently Asked Questions',
      description:
        'Returns, shipping, hallmarking, WhatsApp ordering, resizing and payment — answers to the questions our patrons ask most.',
      path,
    },
    jsonLd: [faqSchema(FAQS), breadcrumbSchema(CRUMBS)],
    html: `<div class="page-anim mx-auto max-w-[1100px] px-5 py-14 lg:px-8">
      ${breadcrumbs(CRUMBS)}
      <div class="mt-6">
        ${pageHeading({ eyebrow: 'Need help?', title: 'Frequently', accent: 'Asked', align: 'center' })}
      </div>
      <div class="mt-12">
        ${accordion(
          FAQS.map((item) => ({ title: item.q, body: `<p>${esc(item.a)}</p>` })),
          { openFirst: true, idPrefix: 'faq' }
        )}
      </div>
      ${ctaPanel({
        title: 'Still have questions?',
        message:
          'Our jewellery specialists answer on WhatsApp, usually within a few hours — and they can see the piece you are asking about.',
        primary: { label: 'Contact Us', href: '/contact' },
        secondary: { label: 'Shipping & Delivery', href: '/shipping-delivery' },
      })}
    </div>`,
  };
}
