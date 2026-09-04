/* ══════════════════════════════════════════════════════════════
   DESIGN YOUR OWN
   A commission brief. Everything the bench needs before it can
   quote — piece, budget, stones, metal, size and the customer's own
   description — handed to WhatsApp like every other enquiry.
   ══════════════════════════════════════════════════════════════ */
import { $, $$, esc } from '../core/dom.js';
import { href } from '../core/router.js';
import { toast } from '../core/toast.js';
import {
  JEWELLERY_TYPES, BUDGET_RANGES, DIAMOND_OPTIONS,
  METAL_OPTIONS, METAL_FINISHES, DESIGN_OCCASIONS,
} from '../data/taxonomy.js';
import { openWhatsApp, formatCustomDesignMessage, trackCustomDesign } from '../services/whatsappService.js';
import { getSavedDetails } from '../components/enquiryDialog.js';
import { breadcrumbs, pageHeading, WHATSAPP_ICON } from '../components/ui.js';
import { imageUrl } from '../services/catalogService.js';
import { SITE } from '../config/site.config.js';

const CRUMBS = [{ label: 'Home', href: '/' }, { label: 'Design Your Own', href: '/custom-design' }];

const selectField = ({ id, label, options, placeholder, required = true }) => `
  <div>
    <label for="${id}" class="mb-1.5 block text-sm">${esc(label)}${required ? ' <span class="text-gold">*</span>' : ''}</label>
    <div class="relative">
      <select id="${id}" class="field cursor-pointer appearance-none pr-11" ${required ? 'required' : ''}>
        <option value="">${esc(placeholder)}</option>
        ${options.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}
      </select>
      <span class="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gold" aria-hidden="true">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </span>
    </div>
    <p data-error-for="${id}" class="mt-1.5 hidden text-[12px] text-danger" role="alert"></p>
  </div>`;

const textField = ({ id, label, type = 'text', placeholder = '', autocomplete = '', required = true }) => `
  <div>
    <label for="${id}" class="mb-1.5 block text-sm">${esc(label)}${required ? ' <span class="text-gold">*</span>' : ''}</label>
    <input id="${id}" type="${type}" class="field" placeholder="${esc(placeholder)}" ${autocomplete ? `autocomplete="${autocomplete}"` : ''} ${required ? 'required' : ''}>
    <p data-error-for="${id}" class="mt-1.5 hidden text-[12px] text-danger" role="alert"></p>
  </div>`;

export default function customDesignPage({ path }) {
  const saved = getSavedDetails();

  return {
    meta: {
      title: 'Design Your Own — Bespoke Jewellery',
      description:
        'Commission a bespoke piece from the Parshiv Jewels atelier in Surat. Tell us the piece, budget, stones and metal, and a specialist will quote it on WhatsApp.',
      path,
      image: imageUrl('photo-1603561591411-07134e71a2a9', 1200),
    },
    jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Bespoke jewellery design',
      provider: { '@type': 'JewelryStore', name: SITE.name },
      areaServed: 'IN',
      description: 'Custom and made-to-order jewellery designed and made in Surat.',
    }],
    html: `<div class="page-anim mx-auto max-w-[1100px] px-5 py-14 lg:px-8">
      ${breadcrumbs(CRUMBS)}
      <div class="mt-6">
        ${pageHeading({
          eyebrow: 'Commission a piece',
          title: 'Design Your',
          accent: 'Own Style',
          description:
            'Tell us what you have in mind and a specialist will come back with feasibility, a timeline and a price. Most commissions take 7–21 working days on the bench.',
        })}
      </div>

      <form id="designForm" class="mt-12 space-y-8" novalidate>

        <section class="panel p-7 sm:p-9" data-reveal="up">
          <p class="eyebrow">Step 1 · About you</p>
          <div class="mt-6 grid gap-5 sm:grid-cols-2">
            ${textField({ id: 'cdName', label: 'Your name', placeholder: 'Full name', autocomplete: 'name' })}
            ${textField({ id: 'cdEmail', label: 'Email', type: 'email', placeholder: 'you@example.com', autocomplete: 'email', required: false })}
            ${textField({ id: 'cdPhone', label: 'Contact number', type: 'tel', placeholder: '+91 98765 43210', autocomplete: 'tel' })}
            ${selectField({ id: 'cdBudget', label: 'Budget', options: BUDGET_RANGES, placeholder: 'Select a range' })}
          </div>
        </section>

        <section class="panel p-7 sm:p-9" data-reveal="up">
          <p class="eyebrow">Step 2 · The piece</p>

          <fieldset class="mt-6">
            <legend class="mb-3 block text-sm">What would you like made? <span class="text-gold">*</span></legend>
            <div class="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Type of piece">
              ${JEWELLERY_TYPES.map((t, i) => `
                <button type="button" role="radio" aria-checked="${i === 0}" data-type="${esc(t.value)}"
                  class="chip ${i === 0 ? 'chip-on' : ''}">${esc(t.label)}</button>`).join('')}
            </div>
            <p data-error-for="cdType" class="mt-1.5 hidden text-[12px] text-danger" role="alert"></p>
          </fieldset>

          <div class="mt-6 grid gap-5 sm:grid-cols-2">
            ${selectField({ id: 'cdOccasion', label: 'Occasion', options: DESIGN_OCCASIONS, placeholder: 'Select an occasion', required: false })}
            ${selectField({ id: 'cdDiamond', label: 'Stones', options: DIAMOND_OPTIONS, placeholder: 'Select stones' })}
            ${selectField({ id: 'cdMetal', label: 'Metal', options: METAL_OPTIONS, placeholder: 'Select a metal' })}
            <div>
              <label for="cdSize" class="mb-1.5 block text-sm"><span data-size-label>Ring size</span> <span class="text-gold">*</span></label>
              <div class="relative">
                <select id="cdSize" class="field cursor-pointer appearance-none pr-11" required></select>
                <span class="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gold" aria-hidden="true">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </div>
              <p class="mt-1.5 text-[11px] text-sand/70">Unsure? Choose “Not sure yet” — we’ll size it with you.
                <a href="${href('/size-guide')}" class="text-gold-light underline underline-offset-2">Size guide</a></p>
              <p data-error-for="cdSize" class="mt-1.5 hidden text-[12px] text-danger" role="alert"></p>
            </div>
          </div>

          <fieldset class="mt-6">
            <legend class="mb-3 block text-sm">Metal finish</legend>
            <div class="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Metal finish">
              ${METAL_FINISHES.map((f, i) => `
                <button type="button" role="radio" aria-checked="${i === 0}" data-finish="${esc(f.value)}"
                  class="flex items-center gap-2.5 rounded-full border px-3.5 py-2 text-[12px] transition ${i === 0 ? 'border-gold bg-gold/10 text-gold-light' : 'border-line/15 text-sand hover:border-gold/50'}">
                  <span class="h-5 w-8 rounded-md border border-line/20" style="background:${f.swatch}"></span>${esc(f.value)}</button>`).join('')}
            </div>
          </fieldset>
        </section>

        <section class="panel p-7 sm:p-9" data-reveal="up">
          <p class="eyebrow">Step 3 · Your brief</p>
          <div class="mt-6 grid gap-5">
            <div>
              <label for="cdBrief" class="mb-1.5 block text-sm">Tell us what to make, modify, or keep exactly the same <span class="text-gold">*</span></label>
              <textarea id="cdBrief" rows="5" class="field resize-none"
                placeholder="A pendant like the one my grandmother wore — a single solitaire, milgrain edge, on a fine chain. Keep the setting low so it sits flat."></textarea>
              <p data-error-for="cdBrief" class="mt-1.5 hidden text-[12px] text-danger" role="alert"></p>
            </div>
            <div>
              <label for="cdReference" class="mb-1.5 block text-sm">Reference image link <span class="text-sand/60">(optional)</span></label>
              <input id="cdReference" type="url" class="field" placeholder="https://instagram.com/p/… or a Pinterest link">
              <p class="mt-2 flex items-start gap-2 text-[12px] leading-relaxed text-sand/80">
                <span class="mt-0.5 shrink-0 text-gold" aria-hidden="true">📎</span>
                <span>Have photos on your phone? Tick the box below and send them straight into the WhatsApp chat once it opens — that is the quickest way to get them to the bench.</span>
              </p>
              <label for="cdPhotos" class="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-line/10 bg-night/40 p-3.5 transition hover:border-gold/30">
                <input id="cdPhotos" type="checkbox" class="h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[4px] border border-line/25 bg-night/70 transition checked:border-gold checked:bg-gold">
                <span class="text-[13px] text-ivory">I’ll send reference photos in the WhatsApp chat</span>
              </label>
            </div>
          </div>
        </section>

        <div class="flex flex-col items-center gap-3">
          <button type="submit"
            class="btn-gold w-full !whitespace-normal px-8 py-4 text-center leading-snug sm:w-auto sm:!whitespace-nowrap sm:px-10">${WHATSAPP_ICON}Send my brief on WhatsApp</button>
          <p class="text-center text-[12px] text-sand/70">Opens WhatsApp with your brief written out. Nothing is sent until you press send.</p>
        </div>
      </form>

      <div class="mt-16 grid gap-5 sm:grid-cols-3">
        ${[
          ['1', 'You brief us', 'Send the form. A specialist replies on WhatsApp, usually within a few hours.'],
          ['2', 'We quote and sketch', 'Feasibility, stone options, a firm price and a timeline — agreed before anything begins.'],
          ['3', 'It goes to the bench', 'Made in our Surat atelier in 7–21 working days, with progress photographs as it is built.'],
        ].map(([step, title, copy], i) => `
          <div class="panel p-7" data-reveal="up" style="transition-delay:${i * 90}ms">
            <span class="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 font-display text-lg text-gold">${step}</span>
            <h2 class="mt-5 font-display text-xl text-ivory">${esc(title)}</h2>
            <p class="mt-2 text-[14px] leading-relaxed">${esc(copy)}</p>
          </div>`).join('')}
      </div>
    </div>`,

    onMount: (scope) => {
      const root = $('#main');
      const form = $('#designForm');
      let type = JEWELLERY_TYPES[0];
      let finish = METAL_FINISHES[0].value;

      // Prefill from a previous enquiry so returning customers don't retype.
      if (saved.name) $('#cdName').value = saved.name;
      if (saved.phone) $('#cdPhone').value = saved.phone;

      /* Size options follow the chosen piece — a ring size makes no
         sense once someone has asked for a bracelet. */
      const renderSizes = () => {
        $('[data-size-label]', root).textContent = type.sizeLabel;
        $('#cdSize', root).innerHTML =
          `<option value="">Select ${type.sizeLabel.toLowerCase()}</option>` +
          type.sizes.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
      };

      scope.delegate(root, 'click', '[data-type]', (e, el) => {
        type = JEWELLERY_TYPES.find((t) => t.value === el.dataset.type) || type;
        $$('[data-type]', root).forEach((b) => {
          const on = b === el;
          b.classList.toggle('chip-on', on);
          b.setAttribute('aria-checked', String(on));
        });
        renderSizes();
      });

      scope.delegate(root, 'click', '[data-finish]', (e, el) => {
        finish = el.dataset.finish;
        $$('[data-finish]', root).forEach((b) => {
          const on = b === el;
          b.setAttribute('aria-checked', String(on));
          b.className = `flex items-center gap-2.5 rounded-full border px-3.5 py-2 text-[12px] transition ${
            on ? 'border-gold bg-gold/10 text-gold-light' : 'border-line/15 text-sand hover:border-gold/50'
          }`;
        });
      });

      /* Validation */
      const RULES = {
        cdName: (v) => (v.trim().length >= 2 ? '' : 'Please tell us your name.'),
        cdPhone: (v) => (/^[+]?[\d][\d\s()-]{6,16}$/.test(v.trim()) ? '' : 'Enter a number we can reach you on.'),
        cdEmail: (v) => (!v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter a valid email, or leave it blank.'),
        cdBudget: (v) => (v ? '' : 'Choose a budget so we can advise properly.'),
        cdDiamond: (v) => (v ? '' : 'Choose the stones, or pick “Advise me”.'),
        cdMetal: (v) => (v ? '' : 'Choose a metal, or pick “Advise me”.'),
        cdSize: (v) => (v ? '' : 'Choose a size, or pick “Not sure yet”.'),
        cdBrief: (v) => (v.trim().length >= 15 ? '' : 'A sentence or two about what you want made.'),
      };

      const showError = (id, message) => {
        const error = root.querySelector(`[data-error-for="${id}"]`);
        const input = $(`#${id}`, root);
        if (error) {
          error.textContent = message;
          error.classList.toggle('hidden', !message);
        }
        input?.classList.toggle('!border-danger/60', !!message);
        input?.setAttribute('aria-invalid', String(!!message));
      };

      Object.keys(RULES).forEach((id) => {
        const input = $(`#${id}`, root);
        if (!input) return;
        scope.on(input, 'blur', () => showError(id, RULES[id](input.value)));
        scope.on(input, 'change', () => showError(id, RULES[id](input.value)));
        scope.on(input, 'input', () => {
          if (input.getAttribute('aria-invalid') === 'true') showError(id, RULES[id](input.value));
        });
      });

      scope.on(form, 'submit', (event) => {
        event.preventDefault();
        let firstInvalid = null;
        Object.keys(RULES).forEach((id) => {
          const input = $(`#${id}`, root);
          if (!input) return;
          const message = RULES[id](input.value);
          showError(id, message);
          if (message && !firstInvalid) firstInvalid = input;
        });
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ block: 'center', behavior: 'smooth' });
          firstInvalid.focus({ preventScroll: true });
          toast('Please check the highlighted fields', { tone: 'error' });
          return;
        }

        const brief = {
          name: $('#cdName').value.trim(),
          email: $('#cdEmail').value.trim(),
          phone: $('#cdPhone').value.trim(),
          budget: $('#cdBudget').value,
          type: type.label,
          occasion: $('#cdOccasion').value,
          diamond: $('#cdDiamond').value,
          metal: $('#cdMetal').value,
          finish,
          sizeLabel: type.sizeLabel,
          size: $('#cdSize').value,
          brief: $('#cdBrief').value.trim(),
          referenceUrl: $('#cdReference').value.trim(),
          hasPhotos: $('#cdPhotos').checked,
        };

        const reference = trackCustomDesign(brief);
        toast('Opening WhatsApp…');
        openWhatsApp(formatCustomDesignMessage(brief, reference));
      });

      renderSizes();
    },
  };
}
