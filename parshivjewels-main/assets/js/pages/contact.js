/* Contact — the original two-column layout, with client-side form
   validation and a WhatsApp hand-off. */
import { $, $$, esc } from '../core/dom.js';
import { href } from '../core/router.js';
import { toast } from '../core/toast.js';
import { openWhatsApp, formatContactMessage, chatUrl } from '../services/whatsappService.js';
import { breadcrumbs, pageHeading, WHATSAPP_ICON } from '../components/ui.js';
import { SITE } from '../config/site.config.js';
import { getSiteSettings } from '../services/siteSettingsService.js';

const CRUMBS = [{ label: 'Home', href: '/' }, { label: 'Contact', href: '/contact' }];

const ICONS = {
  mail: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>`,
  phone: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  clock: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  pin: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  instagram: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.148-.558-2.913-.306-.788-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.296-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>`,
};

function contactRow({ icon, label, value, url, external, tone = 'gold' }) {
  const badge =
    tone === 'green'
      ? 'border-success/40 bg-success/20 text-success group-hover:bg-success group-hover:text-ink'
      : 'border-gold/40 text-gold group-hover:bg-gold group-hover:text-ink';
  const inner = `<span class="social ${badge}">${icon}</span>
    <span><span class="block font-medium text-ivory">${esc(label)}</span>
    <span class="mt-1 block text-[15px] ${tone === 'green' ? 'font-medium text-success' : 'group-hover:text-gold-light'}">${value}</span></span>`;
  return url
    ? `<a href="${url}" ${external ? 'target="_blank" rel="noopener"' : ''} class="group flex items-start gap-5">${inner}</a>`
    : `<div class="flex items-start gap-5">${inner}</div>`;
}

function field({ id, label, type = 'text', required = false, placeholder, textarea = false, autocomplete }) {
  const control = textarea
    ? `<textarea id="${id}" name="${id}" rows="4" ${required ? 'required' : ''} class="field resize-none"
        placeholder="${esc(placeholder)}" aria-describedby="${id}-error"></textarea>`
    : `<input id="${id}" name="${id}" type="${type}" ${required ? 'required' : ''} ${
        autocomplete ? `autocomplete="${autocomplete}"` : ''
      } class="field" placeholder="${esc(placeholder)}" aria-describedby="${id}-error">`;
  return `<div>
    <label class="mb-1.5 block text-sm" for="${id}">${esc(label)}${required ? ' *' : ''}</label>
    ${control}
    <p id="${id}-error" class="mt-1.5 hidden text-[12px] text-danger" role="alert"></p>
  </div>`;
}

export default function contactPage({ path }) {
  const site = getSiteSettings();
  return {
    meta: {
      title: 'Contact Us',
      description: `Speak to a Parshiv Jewels specialist in Surat — WhatsApp ${SITE.whatsappDisplay}, email ${site.email}, or visit our atelier.`,
      path,
    },
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Contact Parshiv Jewels',
        url: SITE.origin + '/contact',
      },
    ],
    html: `<div class="page-anim mx-auto max-w-[1200px] px-5 py-14 lg:px-8">
      ${breadcrumbs(CRUMBS)}
      <div class="mt-6">
        ${pageHeading({
          eyebrow: 'We’d love to hear from you',
          title: 'Contact',
          accent: 'Us',
          align: 'center',
          description:
            'The fastest way to reach us is WhatsApp — a specialist who can see the piece will answer, usually within a few hours.',
        })}
      </div>

      <div class="mt-14 grid items-start gap-8 lg:grid-cols-2">
        <div class="panel h-full p-9" data-reveal="left">
          <h2 class="font-display text-3xl font-semibold text-ivory">Get in Touch</h2>
          <div class="mt-8 space-y-6">
            ${contactRow({ icon: WHATSAPP_ICON, label: 'WhatsApp', value: 'Chat with us →', url: chatUrl(), external: true, tone: 'green' })}
            ${contactRow({ icon: ICONS.phone, label: 'Phone', value: esc(site.phoneDisplay), url: `tel:${site.phone}` })}
            ${site.phoneSecondaryDisplay
              ? contactRow({ icon: ICONS.phone, label: 'Alternate phone', value: esc(site.phoneSecondaryDisplay), url: `tel:${site.phoneSecondary}` })
              : ''}
            ${contactRow({ icon: ICONS.mail, label: 'Email', value: esc(site.email), url: `mailto:${site.email}` })}
            ${contactRow({ icon: ICONS.instagram, label: 'Instagram', value: esc(SITE.instagramHandle), url: SITE.instagram, external: true })}
            <div class="h-px bg-line/10"></div>
            ${contactRow({
              icon: ICONS.clock,
              label: 'Operating Hours',
              value: SITE.hours.map(([days, time]) => `${esc(days)}: ${esc(time)}`).join('<br>'),
            })}
            ${contactRow({
              icon: ICONS.pin,
              label: 'Atelier',
              value: `<span class="leading-relaxed">${SITE.addressLines.map(esc).join('<br>')}</span>`,
            })}
          </div>
          <a href="${chatUrl()}" target="_blank" rel="noopener"
            class="btn-line mt-9 w-full py-3.5 !border-success/40 !text-success hover:!border-success hover:!bg-success/10">
            ${WHATSAPP_ICON}Message Us on WhatsApp
          </a>
        </div>

        <div class="panel p-9" data-reveal="right">
          <h2 class="font-display text-3xl font-semibold text-ivory">Send us a Message</h2>
          <p class="mt-2 text-xs uppercase tracking-[0.2em] text-gold">Replies directly on WhatsApp</p>
          <form id="contactForm" class="mt-7 space-y-4" novalidate>
            ${field({ id: 'cfName', label: 'Name', required: true, placeholder: 'Your full name', autocomplete: 'name' })}
            ${field({ id: 'cfEmail', label: 'Email', type: 'email', required: true, placeholder: 'you@example.com', autocomplete: 'email' })}
            ${field({ id: 'cfPhone', label: 'Phone', type: 'tel', placeholder: '+91', autocomplete: 'tel' })}
            ${field({ id: 'cfSubject', label: 'Subject', required: true, placeholder: 'Bridal set enquiry…' })}
            ${field({ id: 'cfMsg', label: 'Message', required: true, placeholder: 'Your message…', textarea: true })}
            <button type="submit" class="btn-gold w-full py-4">Send via WhatsApp</button>
            <p class="text-center text-[12px] text-sand/70">This opens WhatsApp with your message ready to send.</p>
          </form>
        </div>
      </div>

      <div class="panel mt-10 overflow-hidden" data-reveal="up">
        <iframe title="Parshiv Jewels atelier location on Google Maps" loading="lazy" class="h-[360px] w-full border-0"
          referrerpolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=${encodeURIComponent(
            '102 Shiv Narayan House, Kansara Seri, Mahidharpura, Surat, Gujarat 395003'
          )}&output=embed"></iframe>
      </div>
    </div>`,
    onMount: (scope) => mount(scope),
  };
}

/* ─────────────── Validation ─────────────── */

const RULES = {
  cfName: (value) => (value.trim().length >= 2 ? '' : 'Please enter your name.'),
  cfEmail: (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? '' : 'Please enter a valid email address.'),
  cfPhone: (value) =>
    !value.trim() || /^[+]?[\d\s()-]{7,16}$/.test(value.trim()) ? '' : 'Please enter a valid phone number.',
  cfSubject: (value) => (value.trim().length >= 3 ? '' : 'Please add a subject.'),
  cfMsg: (value) => (value.trim().length >= 10 ? '' : 'Please tell us a little more (at least 10 characters).'),
};

function showError(id, message) {
  const input = $(`#${id}`);
  const error = $(`#${id}-error`);
  if (!input || !error) return;
  error.textContent = message;
  error.classList.toggle('hidden', !message);
  input.classList.toggle('!border-danger/60', !!message);
  input.setAttribute('aria-invalid', String(!!message));
}

function mount(scope) {
  const form = $('#contactForm');
  if (!form) return;

  Object.keys(RULES).forEach((id) => {
    const input = $(`#${id}`);
    // Validate on blur, then live once the field has been touched.
    scope.on(input, 'blur', () => showError(id, RULES[id](input.value)));
    scope.on(input, 'input', () => {
      if (input.getAttribute('aria-invalid') === 'true') showError(id, RULES[id](input.value));
    });
  });

  scope.on(form, 'submit', (event) => {
    event.preventDefault();
    let firstInvalid = null;
    Object.keys(RULES).forEach((id) => {
      const input = $(`#${id}`);
      const message = RULES[id](input.value);
      showError(id, message);
      if (message && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      toast('Please check the highlighted fields', { tone: 'error' });
      return;
    }

    toast('Opening WhatsApp…');
    openWhatsApp(
      formatContactMessage({
        name: $('#cfName').value.trim(),
        email: $('#cfEmail').value.trim(),
        phone: $('#cfPhone').value.trim(),
        subject: $('#cfSubject').value.trim(),
        message: $('#cfMsg').value.trim(),
      })
    );
    form.reset();
    $$('[id$="-error"]', form).forEach((el) => el.classList.add('hidden'));
  });
}
