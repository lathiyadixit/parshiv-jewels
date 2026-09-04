/* ══════════════════════════════════════════════════════════════
   SITE SETTINGS
   The storefront's contact details, with any admin overrides applied
   on top of the deployed defaults in site.config.js.

   The admin panel writes to `pj.admin.settings`; this reads it. The
   dependency is one-way and by key, so the storefront never imports
   admin code — and when a backend arrives, only the read below
   changes from localStorage to a fetch.

   ⚠ Overrides live in one browser's storage. Editing a number in the
   admin changes it for whoever made the edit, not for customers.
   To change it for everyone, edit site.config.js and redeploy (or
   connect a backend so settings are served, not stored locally).
   ══════════════════════════════════════════════════════════════ */
import { SITE } from '../config/site.config.js';
import { read } from '../core/storage.js';

const KEY = 'pj.admin.settings';

const digits = (value) => String(value || '').replace(/[^\d+]/g, '');

/** SITE, with admin-managed business details layered over it. */
export function getSiteSettings() {
  let business = {};
  try {
    business = read(KEY, {})?.business || {};
  } catch {
    business = {}; // a malformed settings doc must never break the storefront
  }

  const phoneDisplay = business.phone?.trim() || SITE.phoneDisplay;
  const secondaryDisplay = business.phoneSecondary?.trim() ?? SITE.phoneSecondaryDisplay;

  return {
    ...SITE,
    email: business.email?.trim() || SITE.email,
    phoneDisplay,
    phone: digits(phoneDisplay) || SITE.phone,
    phoneSecondaryDisplay: secondaryDisplay,
    phoneSecondary: digits(secondaryDisplay),
    address: business.address?.trim() || SITE.addressLines.join(' '),
    instagram: business.instagram?.trim() || SITE.instagram,
    facebook: business.facebook?.trim() || SITE.facebook,
  };
}

/**
 * Fill the static header/footer markup from the resolved settings.
 * Elements opt in with data-site-* attributes, so the HTML stays
 * readable and works as-is before this runs.
 */
export function hydrateSiteContacts(root = document) {
  const s = getSiteSettings();

  const setLink = (selector, href, text) => {
    root.querySelectorAll(selector).forEach((el) => {
      el.setAttribute('href', href);
      el.textContent = text;
    });
  };

  setLink('[data-site-phone]', `tel:${s.phone}`, s.phoneDisplay);
  setLink('[data-site-email]', `mailto:${s.email}`, s.email);

  // The second line is optional — hide its row entirely when unset.
  root.querySelectorAll('[data-site-phone-secondary]').forEach((el) => {
    const row = el.closest('li') || el;
    if (s.phoneSecondaryDisplay) {
      el.setAttribute('href', `tel:${s.phoneSecondary}`);
      el.textContent = s.phoneSecondaryDisplay;
      row.classList.remove('hidden');
    } else {
      row.classList.add('hidden');
    }
  });

  root.querySelectorAll('[data-site-address]').forEach((el) => { el.textContent = s.address; });
}
