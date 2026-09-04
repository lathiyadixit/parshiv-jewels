/* Modal, confirm and drawer. One host element, so only one dialog can
   ever be open and focus handling lives in a single place. */
import { $, esc, lockScroll, unlockScroll, trapFocus } from '../../core/dom.js';

let release = null;
let lastFocus = null;

function host() {
  let el = $('#adminModal');
  if (!el) {
    el = document.createElement('div');
    el.id = 'adminModal';
    el.className = 'fixed inset-0 z-[140] hidden items-center justify-center p-4';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    document.body.appendChild(el);
  }
  return el;
}

export function closeModal() {
  const el = host();
  if (el.classList.contains('hidden')) return;
  el.classList.add('hidden');
  el.classList.remove('flex');
  el.innerHTML = '';
  unlockScroll();
  release?.();
  release = null;
  lastFocus?.focus?.();
}

/**
 * @param {{title:string, body:string, footer?:string, size?:string}} cfg
 * @returns {HTMLElement} the modal panel, for wiring up its controls
 */
export function openModal({ title, body, footer = '', size = 'max-w-xl' }) {
  const el = host();
  lastFocus = document.activeElement;
  el.innerHTML = `
    <div class="absolute inset-0 bg-veil/75 backdrop-blur-sm" data-modal-close></div>
    <div class="relative flex max-h-[88dvh] w-full ${size} flex-col overflow-hidden rounded-2xl border border-gold/25 bg-onyx shadow-soft" style="animation:menuIn .22s ease both">
      <div class="flex shrink-0 items-center justify-between gap-4 border-b border-line/10 px-6 py-4">
        <h2 class="font-display text-xl text-ivory">${esc(title)}</h2>
        <button type="button" data-modal-close class="flex h-9 w-9 items-center justify-center rounded-full border border-line/15 text-ivory transition hover:border-gold hover:text-gold" aria-label="Close">✕</button>
      </div>
      <div class="flex-1 overflow-y-auto px-6 py-5" data-modal-body>${body}</div>
      ${footer ? `<div class="shrink-0 border-t border-line/10 bg-night/40 px-6 py-4">${footer}</div>` : ''}
    </div>`;
  el.classList.remove('hidden');
  el.classList.add('flex');
  lockScroll();
  release = trapFocus(el);
  el.querySelectorAll('[data-modal-close]').forEach((b) => b.addEventListener('click', closeModal));
  requestAnimationFrame(() => el.querySelector('input,select,textarea,button')?.focus());
  return el;
}

/**
 * Destructive actions must be confirmed. Resolves true only on confirm.
 * @returns {Promise<boolean>}
 */
export function confirmAction({ title, message, confirmLabel = 'Delete', tone = 'danger' }) {
  return new Promise((resolve) => {
    const el = openModal({
      title,
      size: 'max-w-md',
      body: `<p class="text-[14px] leading-relaxed text-sand">${esc(message)}</p>`,
      footer: `<div class="flex justify-end gap-3">
        <button type="button" data-cancel class="btn-line px-6 py-2.5 text-[12px]">Cancel</button>
        <button type="button" data-confirm class="${
          tone === 'danger'
            ? 'inline-flex items-center justify-center rounded-full border border-danger/50 bg-danger/10 px-6 py-2.5 font-body text-[12px] uppercase tracking-[0.14em] text-danger transition hover:bg-danger/20'
            : 'btn-gold px-6 py-2.5 text-[12px]'
        }">${esc(confirmLabel)}</button>
      </div>`,
    });
    let settled = false;
    const finish = (value) => { if (settled) return; settled = true; closeModal(); resolve(value); };
    el.querySelector('[data-confirm]').addEventListener('click', () => finish(true));
    el.querySelector('[data-cancel]').addEventListener('click', () => finish(false));
    el.querySelectorAll('[data-modal-close]').forEach((b) => b.addEventListener('click', () => finish(false)));
  });
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
