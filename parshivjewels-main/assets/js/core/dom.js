/* Tiny DOM helpers. Same shorthand the original engine used, kept so
   existing muscle memory (and markup) continues to work. */

export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** Escape untrusted text before it goes into a template literal. */
export function esc(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape a value used inside an attribute that is also a URL fragment. */
export const escAttr = esc;

export function on(target, type, handler, options) {
  if (!target) return () => {};
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}

/** Delegated listener: fires when the event path contains `selector`. */
export function delegate(root, type, selector, handler) {
  return on(root, type, (event) => {
    const match = event.target.closest(selector);
    if (match && root.contains(match)) handler(event, match);
  });
}

/** Fade images in once decoded — mirrors the original `img-in` behaviour. */
export function refreshImages(root = document) {
  $$('img', root).forEach((img) => {
    if (img.complete && img.naturalWidth) img.classList.add('img-in');
  });
}

/** Global fallback for broken remote imagery (kept on window for inline attrs). */
export function installImageFallback(fallbackSrc) {
  window.imgFix = function imgFix(el) {
    el.onerror = null;
    // srcset wins over src, so it has to go before the fallback will show.
    el.removeAttribute('srcset');
    el.removeAttribute('sizes');
    el.src = fallbackSrc;
    el.classList.add('img-in');
  };
  document.addEventListener(
    'load',
    (event) => {
      if (event.target.tagName === 'IMG') event.target.classList.add('img-in');
    },
    true
  );
}

let scrollLocks = 0;
/** Reference-counted scroll lock so drawer + modal can't fight each other. */
export function lockScroll() {
  scrollLocks += 1;
  document.body.classList.add('overflow-hidden');
}
export function unlockScroll(force = false) {
  scrollLocks = force ? 0 : Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) document.body.classList.remove('overflow-hidden');
}

/** Trap Tab focus inside a container (drawers, modals, search overlay). */
export function trapFocus(container) {
  const selector =
    'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  return on(container, 'keydown', (event) => {
    if (event.key !== 'Tab') return;
    const nodes = $$(selector, container).filter((el) => el.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * A disposable listener scope for a page render.
 *
 * `#main` is reused across client-side navigations, so listeners bound to
 * it (or to `document`) would otherwise accumulate one copy per visit and
 * fire an action several times. Pages register through a scope, and the
 * router disposes it before rendering the next route.
 */
export function createScope() {
  const disposers = [];
  const track = (off) => {
    disposers.push(off);
    return off;
  };
  return {
    on: (target, type, handler, options) => track(on(target, type, handler, options)),
    delegate: (root, type, selector, handler) => track(delegate(root, type, selector, handler)),
    /** Register any teardown function — observers, timers, subscriptions. */
    add: (dispose) => track(dispose),
    observe: (observer) => track(() => observer.disconnect()),
    dispose: () => disposers.splice(0).forEach((off) => off()),
  };
}
