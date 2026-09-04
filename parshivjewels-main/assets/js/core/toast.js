/* Toast notifications — reuses the existing #toast element and styling. */
import { $ } from './dom.js';

let hideTimer;

/**
 * @param {string} message
 * @param {{tone?: 'default'|'success'|'error', duration?: number}} options
 */
export function toast(message, { tone = 'default', duration = 2600 } = {}) {
  const el = $('#toast');
  if (!el) return;
  const label = $('#toastMsg', el);
  const prefix = tone === 'success' ? '✓ ' : tone === 'error' ? '⚠ ' : '';
  label.textContent = prefix + message;

  el.classList.toggle('toast-error', tone === 'error');
  el.classList.add('show');
  el.setAttribute('aria-live', tone === 'error' ? 'assertive' : 'polite');

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => el.classList.remove('show'), duration);
}

export const toastSuccess = (message) => toast(message, { tone: 'success' });
export const toastError = (message) => toast(message, { tone: 'error' });
