/* ══════════════════════════════════════════════════════════════
   ROUTER
   Upgrades the original `#/page` router to real, SEO-friendly paths
   (`/product/aurelia-diamond-cascade-necklace`) while keeping every
   legacy hash link working.

   Mode selection is automatic:
     • http/https  → History API + clean URLs (needs the bundled .htaccess)
     • file://     → hash URLs, so the site still runs when opened directly
   ══════════════════════════════════════════════════════════════ */
import { createEmitter } from './emitter.js';
import { $$ } from './dom.js';

const emitter = createEmitter();
const routes = [];

/** Old hash routes → new paths, so shared links keep resolving. */
const LEGACY_REDIRECTS = {
  '': '/',
  '/': '/',
  '/products': '/shop',
  '/gallery': '/gallery',
  '/contact': '/contact',
  '/faqs': '/faq',
};

let hashMode = null;
/**
 * True when clean URLs can't work and hash routing must be used:
 *   • the page was opened from file:// (the standalone build)
 *   • or a deployment opted in, for a host that can't rewrite URLs
 *     (set NEXT_PUBLIC_FORCE_HASH_ROUTING in window.__ENV__)
 */
export function isHashMode() {
  if (hashMode === null) {
    if (typeof window === 'undefined') return false;
    const forced = window.__ENV__ && window.__ENV__.NEXT_PUBLIC_FORCE_HASH_ROUTING;
    hashMode =
      String(forced) === 'true' || !/^https?:$/.test(window.location.protocol);
  }
  return hashMode;
}

/**
 * Strip a trailing filename so the app still resolves when it is served as
 * `/index.html` or `/index.standalone.html` rather than from the root.
 */
function normalisePath(pathname) {
  const stripped = (pathname || '/').replace(/\/[^/]*\.html?$/i, '/');
  return stripped || '/';
}

let current = { path: '/', params: {}, query: {}, hash: '' };
let started = false;

function compile(pattern) {
  const keys = [];
  const source = pattern
    .replace(/\/$/, '')
    .replace(/[.+*?^${}()|[\]\\]/g, '\\$&')
    .replace(/\/:([A-Za-z0-9_]+)/g, (_, key) => {
      keys.push(key);
      return '/([^/]+)';
    });
  return { regex: new RegExp(`^${source || '/'}/?$`), keys };
}

/** Register a route. `handler` receives `{ params, query, path }`. */
export function route(pattern, handler, meta = {}) {
  routes.push({ pattern, ...compile(pattern), handler, meta });
}

let notFoundHandler = () => ({ html: '<p>Not found</p>' });
export function setNotFound(handler) {
  notFoundHandler = handler;
}

/** Build an href for a path in whichever mode the router is running. */
export function href(path = '/') {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return isHashMode() ? `#${normalised}` : normalised;
}

function parseQuery(search) {
  const query = {};
  new URLSearchParams(search).forEach((value, key) => {
    query[key] = value;
  });
  return query;
}

/** Serialise a query object, dropping empty values for tidy URLs. */
export function stringifyQuery(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value == null || value === '' || (Array.isArray(value) && !value.length)) return;
    params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  });
  const out = params.toString();
  return out ? `?${out}` : '';
}

/** Read the location the browser is currently at, in either mode. */
function readLocation() {
  if (isHashMode()) {
    const raw = window.location.hash.replace(/^#/, '') || '/';
    const [path, search = ''] = raw.split('?');
    return { path: path || '/', query: parseQuery(search) };
  }
  return {
    path: normalisePath(window.location.pathname),
    query: parseQuery(window.location.search),
  };
}

function resolveLegacy(path) {
  return LEGACY_REDIRECTS[path.replace(/\/$/, '')] ?? null;
}

/** Programmatic navigation. */
export function go(path, { replace = false, query, scroll = true } = {}) {
  const target = path + (query ? stringifyQuery(query) : '');
  const url = href(target);
  if (isHashMode()) {
    if (replace) window.location.replace(url);
    else window.location.hash = url.replace(/^#/, '');
  } else {
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({}, '', url);
    dispatch({ scroll });
  }
  if (isHashMode() && replace) dispatch({ scroll });
}

/** Replace only the query string — used by filters so the Back button works. */
export function setQuery(query, { replace = true, scroll = false } = {}) {
  go(current.path, { query, replace, scroll });
}

export function getCurrent() {
  return current;
}

function match(path) {
  for (const entry of routes) {
    const found = entry.regex.exec(path.replace(/\/$/, '') || '/');
    if (!found) continue;
    const params = {};
    entry.keys.forEach((key, index) => {
      params[key] = decodeURIComponent(found[index + 1]);
    });
    return { entry, params };
  }
  return null;
}

let dispatchToken = 0;

async function dispatch({ scroll = true } = {}) {
  const { path, query } = readLocation();

  // A legacy hash link landed here (or the whole app is in hash mode with an
  // old path) — send the visitor to the modern equivalent.
  const legacy = resolveLegacy(path);
  if (legacy && legacy !== path) {
    go(legacy, { replace: true });
    return;
  }

  const found = match(path);
  const token = ++dispatchToken;
  current = { path, params: found ? found.params : {}, query, hash: '' };

  const context = { ...current, meta: found ? found.entry.meta : {} };
  emitter.emit('before', context);

  const handler = found ? found.entry.handler : notFoundHandler;
  let view;
  try {
    view = await handler(context);
  } catch (error) {
    console.error('[router] route handler failed', error);
    emitter.emit('error', { context, error });
    return;
  }
  if (token !== dispatchToken) return; // a newer navigation won the race

  emitter.emit('after', { ...context, view, scroll });
}

export const onBefore = (handler) => emitter.on('before', handler);
export const onAfter = (handler) => emitter.on('after', handler);
export const onError = (handler) => emitter.on('error', handler);

/** Rewrite static markup hrefs (header/footer) for the active mode. */
export function normaliseLinks(root = document) {
  $$('a[data-href]', root).forEach((anchor) => {
    anchor.setAttribute('href', href(anchor.dataset.href));
  });
}

function isInternalLink(anchor) {
  if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return false;
  const raw = anchor.getAttribute('href') || '';
  if (/^(https?:|mailto:|tel:)/.test(raw)) {
    return anchor.origin === window.location.origin;
  }
  return raw.startsWith('/') || raw.startsWith('#/');
}

export function start() {
  if (started) return;
  started = true;
  normaliseLinks();

  // A visitor arriving on a bookmarked legacy link (`/#/products`) while the
  // app is running in history mode: translate the hash to its modern path
  // before the first dispatch, so old links keep working.
  if (!isHashMode() && /^#\//.test(window.location.hash)) {
    const [legacyPath, legacySearch = ''] = window.location.hash.replace(/^#/, '').split('?');
    const target = resolveLegacy(legacyPath) ?? legacyPath;
    window.history.replaceState({}, '', target + (legacySearch ? `?${legacySearch}` : ''));
  }

  if (isHashMode()) {
    window.addEventListener('hashchange', () => dispatch());
  } else {
    window.addEventListener('popstate', () => dispatch());
    // An old `#/products` link followed from an already-open page is a
    // same-document navigation — translate it rather than doing nothing.
    window.addEventListener('hashchange', () => {
      if (!/^#\//.test(window.location.hash)) return;
      const legacyPath = window.location.hash.replace(/^#/, '').split('?')[0];
      go(resolveLegacy(legacyPath) ?? legacyPath, { replace: true });
    });
    // Intercept in-app links so navigation never reloads the document.
    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const anchor = event.target.closest('a');
      if (!isInternalLink(anchor)) return;
      const url = new URL(anchor.href, window.location.origin);
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
        return; // in-page anchor, let the browser handle it
      }
      event.preventDefault();
      go(url.pathname + url.search);
    });
  }

  dispatch();
}
