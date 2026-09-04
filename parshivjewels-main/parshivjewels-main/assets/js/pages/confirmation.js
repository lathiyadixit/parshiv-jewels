/* ══════════════════════════════════════════════════════════════
   ORDER ENQUIRY CONFIRMATION
   Shown after the cart is handed off to WhatsApp. The enquiry is
   stored by whatsappService, so this screen can re-open it if the
   popup was blocked or the tab was closed by accident.
   ══════════════════════════════════════════════════════════════ */
import { $, esc } from '../core/dom.js';
import { href } from '../core/router.js';
import { inr } from '../core/format.js';
import { toast } from '../core/toast.js';
import { getLastEnquiry, openWhatsApp } from '../services/whatsappService.js';
import { getCount } from '../services/cartService.js';
import { emptyState, WHATSAPP_ICON } from '../components/ui.js';
import { SITE } from '../config/site.config.js';

export default function confirmationPage({ path, query }) {
  const enquiry = getLastEnquiry();
  const reference = query.ref || enquiry?.reference || null;

  if (!enquiry) {
    return {
      meta: { title: 'Order Enquiry', path, noindex: true },
      html: `<div class="page-anim mx-auto max-w-[900px] px-5 py-20 lg:px-8">
        ${emptyState({
          title: 'No enquiry to show',
          message: 'Add pieces to your cart and choose “Proceed to WhatsApp” to prepare an enquiry.',
          actions: [{ label: 'Shop All Jewellery', href: '/shop' }, { label: 'View Cart', href: '/cart' }],
        })}
      </div>`,
    };
  }

  return {
    meta: {
      title: 'Your Order Enquiry Is Ready',
      description: 'Your Parshiv Jewels cart has been prepared in WhatsApp. Send the message to complete your enquiry.',
      path,
      noindex: true,
    },
    html: `<div class="page-anim mx-auto max-w-[900px] px-5 py-20 lg:px-8">
      <div class="panel relative overflow-hidden p-10 text-center sm:p-14" data-reveal="zoom">
        <span class="pointer-events-none absolute left-4 top-4 h-5 w-5 border-l border-t border-gold/60"></span>
        <span class="pointer-events-none absolute right-4 top-4 h-5 w-5 border-r border-t border-gold/60"></span>
        <span class="pointer-events-none absolute bottom-4 left-4 h-5 w-5 border-b border-l border-gold/60"></span>
        <span class="pointer-events-none absolute bottom-4 right-4 h-5 w-5 border-b border-r border-gold/60"></span>
        <div class="sparkle" style="top:18%;left:12%"></div>
        <div class="sparkle" style="top:64%;left:86%;animation-delay:1.2s"></div>

        <span class="pop mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-success/40 bg-success/10 text-3xl text-success" aria-hidden="true">✓</span>

        <p class="eyebrow mt-8 justify-center">Enquiry prepared</p>
        <h1 class="mt-5 font-display text-4xl font-semibold text-ivory sm:text-5xl">Your order enquiry is <em class="accent-it">ready</em></h1>
        <p class="mx-auto mt-5 max-w-lg text-base leading-relaxed">
          Your cart has been prepared in WhatsApp. Send the message to complete your enquiry — a specialist will confirm availability, final pricing and delivery.
        </p>

        <dl class="mx-auto mt-9 grid max-w-md grid-cols-2 gap-px overflow-hidden rounded-xl border border-line/10 bg-line/10 text-left">
          <div class="bg-card p-5"><dt class="text-[11px] uppercase tracking-[0.22em] text-gold">Reference</dt>
            <dd class="mt-1.5 font-display text-xl text-ivory">${esc(reference || '—')}</dd></div>
          <div class="bg-card p-5"><dt class="text-[11px] uppercase tracking-[0.22em] text-gold">Items</dt>
            <dd class="mt-1.5 font-display text-xl text-ivory">${enquiry.itemCount}</dd></div>
          <div class="bg-card p-5"><dt class="text-[11px] uppercase tracking-[0.22em] text-gold">Estimated total</dt>
            <dd class="mt-1.5 font-display text-xl text-gold">${inr(enquiry.total)}</dd></div>
          <div class="bg-card p-5"><dt class="text-[11px] uppercase tracking-[0.22em] text-gold">Sent to</dt>
            <dd class="mt-1.5 text-[15px] text-ivory">${esc(SITE.whatsappDisplay)}</dd></div>
        </dl>

        <div class="mt-10 flex flex-col flex-wrap gap-3 sm:flex-row sm:justify-center">
          <button type="button" data-reopen-wa class="btn-gold shrink-0 px-8 py-4">${WHATSAPP_ICON}Open WhatsApp</button>
          <a href="${href('/cart')}" class="btn-line shrink-0 px-8 py-4">View Cart${getCount() ? ` (${getCount()})` : ''}</a>
          <a href="${href('/shop')}" class="btn-line shrink-0 px-8 py-4">Back to Shopping</a>
        </div>

        <p class="mt-8 text-[12px] text-sand/70">
          WhatsApp didn’t open? Some browsers block pop-ups — use the button above, or
          <button type="button" data-copy-message class="text-gold-light underline underline-offset-4 transition hover:text-gold">copy the message</button>
          and send it to ${esc(SITE.whatsappDisplay)} yourself.
        </p>
      </div>

      <div class="mt-10 grid gap-5 sm:grid-cols-3">
        ${[
          ['1', 'Send the message', 'Tap send in WhatsApp — your items and totals are already written out.'],
          ['2', 'We confirm', 'A specialist checks availability and confirms final pricing, usually within a few hours.'],
          ['3', 'Pay & receive', 'Pay by a secure link in the chat. Insured dispatch within 24 hours.'],
        ]
          .map(
            ([step, title, copy], index) => `
          <div class="panel p-7" data-reveal="up" style="transition-delay:${index * 90}ms">
            <span class="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 font-display text-lg text-gold">${step}</span>
            <h2 class="mt-5 font-display text-xl text-ivory">${esc(title)}</h2>
            <p class="mt-2 text-[14px] leading-relaxed">${esc(copy)}</p>
          </div>`
          )
          .join('')}
      </div>
    </div>`,
    onMount: (scope) => {
      const root = $('#main');
      scope.delegate(root, 'click', '[data-reopen-wa]', () => {
        toast('Opening WhatsApp…');
        openWhatsApp(enquiry.message);
      });
      scope.delegate(root, 'click', '[data-copy-message]', async () => {
        try {
          await navigator.clipboard.writeText(enquiry.message);
          toast('Enquiry copied to clipboard', { tone: 'success' });
        } catch {
          toast('Copy failed — please open WhatsApp instead', { tone: 'error' });
        }
      });
    },
  };
}
