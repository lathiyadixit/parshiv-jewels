/* ══════════════════════════════════════════════════════════════
   ENQUIRY DETAILS DIALOG
   Asked before handing a cart (or a single piece) to WhatsApp, so
   the shop knows who is asking and what about — rather than an
   anonymous message from an unknown number.

   Details are remembered locally, so a returning customer only
   confirms rather than retypes.
   ══════════════════════════════════════════════════════════════ */
import { $, esc, on, lockScroll, unlockScroll, trapFocus } from '../core/dom.js';
import { read, write } from '../core/storage.js';
import { inr } from '../core/format.js';
import { WHATSAPP_ICON } from './ui.js';

const KEY = 'pj.enquiryDetails.v1';

export const getSavedDetails = () => read(KEY, { name: '', phone: '', note: '' });
const saveDetails = ({ name, phone }) => write(KEY, { name, phone });

let released = null;
let lastFocused = null;

function host() {
  let el = $('#enquiryDialog');
  if (!el) {
    el = document.createElement('div');
    el.id = 'enquiryDialog';
    el.className = 'fixed inset-0 z-[125] hidden items-center justify-center p-4';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'enquiryDialogTitle');
    document.body.appendChild(el);
  }
  return el;
}

export function closeEnquiryDialog() {
  const el = host();
  if (el.classList.contains('hidden')) return;
  el.classList.add('hidden');
  el.classList.remove('flex');
  el.innerHTML = '';
  unlockScroll();
  released?.();
  released = null;
  lastFocused?.focus?.();
}

/* ─────────────── Validation ─────────────── */

const RULES = {
  eqName: (v) => (v.trim().length >= 2 ? '' : 'Please tell us your name.'),
  // Deliberately permissive: international formats vary, and a rejected
  // valid number costs a sale.
  eqPhone: (v) =>
    /^[+]?[\d][\d\s()-]{6,16}$/.test(v.trim()) ? '' : 'Enter a phone number we can reach you on.',
};

function showError(el, id, message) {
  const error = el.querySelector(`[data-error-for="${id}"]`);
  const input = el.querySelector(`#${id}`);
  if (error) {
    error.textContent = message;
    error.classList.toggle('hidden', !message);
  }
  input?.classList.toggle('!border-danger/60', !!message);
  input?.setAttribute('aria-invalid', String(!!message));
}

/* ─────────────── Dialog ─────────────── */

/**
 * @param {{title?:string, summary?:string, total?:number, itemCount?:number,
 *          submitLabel?:string}} options
 * @returns {Promise<{name,phone,note}|null>} null when dismissed
 */
export function askForEnquiryDetails(options = {}) {
  const {
    title = 'Almost there',
    summary = '',
    total = null,
    itemCount = 0,
    submitLabel = 'Continue to WhatsApp',
  } = options;

  const saved = getSavedDetails();

  return new Promise((resolve) => {
    const el = host();
    lastFocused = document.activeElement;
    el.innerHTML = `
      <div class="absolute inset-0 bg-veil/75 backdrop-blur-sm" data-dismiss></div>
      <div class="relative flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gold/30 bg-onyx shadow-soft" style="animation:menuIn .24s ease both">
        <span class="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l border-t border-gold/60"></span>
        <span class="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r border-t border-gold/60"></span>

        <div class="flex shrink-0 items-start justify-between gap-4 px-7 pb-2 pt-7">
          <div>
            <p class="text-[11px] uppercase tracking-[0.28em] text-gold">Your details</p>
            <h2 id="enquiryDialogTitle" class="mt-2 font-display text-2xl text-ivory">${esc(title)}</h2>
          </div>
          <button type="button" data-dismiss class="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line/15 text-ivory transition hover:border-gold hover:text-gold" aria-label="Close">✕</button>
        </div>

        <form id="enquiryDetailsForm" class="flex-1 overflow-y-auto px-7 pb-2" novalidate>
          <p class="text-[13px] leading-relaxed text-sand">
            ${esc(summary || 'So we can reply to the right person and keep your enquiry together.')}
          </p>

          ${total != null ? `
          <div class="mt-4 flex items-center justify-between rounded-xl border border-line/10 bg-night/50 px-4 py-3">
            <span class="text-[12px] uppercase tracking-[0.16em] text-sand">${itemCount} item${itemCount === 1 ? '' : 's'}</span>
            <span class="font-display text-lg text-gold">${inr(total)}</span>
          </div>` : ''}

          <div class="mt-5 space-y-4">
            <div>
              <label for="eqName" class="mb-1.5 block text-sm">Your name <span class="text-gold">*</span></label>
              <input id="eqName" name="name" value="${esc(saved.name || '')}" class="field" placeholder="Full name" autocomplete="name" required>
              <p data-error-for="eqName" class="mt-1.5 hidden text-[12px] text-danger" role="alert"></p>
            </div>
            <div>
              <label for="eqPhone" class="mb-1.5 block text-sm">Phone number <span class="text-gold">*</span></label>
              <input id="eqPhone" name="phone" type="tel" value="${esc(saved.phone || '')}" class="field" placeholder="+91 98765 43210" autocomplete="tel" required>
              <p data-error-for="eqPhone" class="mt-1.5 hidden text-[12px] text-danger" role="alert"></p>
            </div>
            <div>
              <label for="eqNote" class="mb-1.5 block text-sm">Notes <span class="text-sand/60">(optional)</span></label>
              <textarea id="eqNote" name="note" rows="3" class="field resize-none" placeholder="Sizing, a date you need it by, a question about the stones…"></textarea>
            </div>
          </div>
        </form>

        <div class="shrink-0 px-7 pb-7 pt-4">
          <button type="submit" form="enquiryDetailsForm" class="btn-gold w-full py-4">${WHATSAPP_ICON}${esc(submitLabel)}</button>
          <p class="mt-3 text-center text-[11px] leading-relaxed text-sand/70">
            We only use this to answer your enquiry. Your details are sent with your WhatsApp message.
          </p>
        </div>
      </div>`;

    el.classList.remove('hidden');
    el.classList.add('flex');
    lockScroll();
    released = trapFocus(el);

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      closeEnquiryDialog();
      resolve(value);
    };

    el.querySelectorAll('[data-dismiss]').forEach((b) => on(b, 'click', () => finish(null)));

    const form = el.querySelector('#enquiryDetailsForm');
    Object.keys(RULES).forEach((id) => {
      const input = el.querySelector(`#${id}`);
      on(input, 'blur', () => showError(el, id, RULES[id](input.value)));
      on(input, 'input', () => {
        if (input.getAttribute('aria-invalid') === 'true') showError(el, id, RULES[id](input.value));
      });
    });

    on(form, 'submit', (event) => {
      event.preventDefault();
      let firstInvalid = null;
      Object.keys(RULES).forEach((id) => {
        const input = el.querySelector(`#${id}`);
        const message = RULES[id](input.value);
        showError(el, id, message);
        if (message && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      const details = {
        name: el.querySelector('#eqName').value.trim(),
        phone: el.querySelector('#eqPhone').value.trim(),
        note: el.querySelector('#eqNote').value.trim(),
      };
      saveDetails(details);
      finish(details);
    });

    // Escape dismisses, matching every other dialog on the site.
    on(el, 'keydown', (event) => {
      if (event.key === 'Escape') finish(null);
    });

    requestAnimationFrame(() => {
      const name = el.querySelector('#eqName');
      (saved.name ? el.querySelector('#eqPhone') : name)?.focus();
    });
  });
}
