/* Hash router for the admin panel.
   Hashes, not clean paths, so the whole panel works from a single
   admin.html on any host with no rewrite rules — including behind
   the .htaccess Basic Auth that should protect it. */
import { createEmitter } from '../../core/emitter.js';

const emitter = createEmitter();
const routes = [];
let current = { path: '/', params: {}, query: {} };
let notFound = () => ({ html: '<p>Not found</p>' });

function compile(pattern) {
  const keys = [];
  const source = pattern
    .replace(/\/$/, '')
    .replace(/[.+*?^${}()|[\]\\]/g, '\\$&')
    .replace(/\/:([A-Za-z0-9_]+)/g, (_, key) => { keys.push(key); return '/([^/]+)'; });
  return { regex: new RegExp(`^${source || '/'}/?$`), keys };
}

export function route(pattern, handler, meta = {}) {
  routes.push({ pattern, ...compile(pattern), handler, meta });
}
export const setNotFound = (handler) => { notFound = handler; };

export const href = (path) => `#${path}`;
export const getCurrent = () => current;

export function go(path, { replace = false } = {}) {
  if (replace) window.location.replace(`#${path}`);
  else window.location.hash = path;
}

function parse() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, search = ''] = raw.split('?');
  const query = {};
  new URLSearchParams(search).forEach((v, k) => { query[k] = v; });
  return { path: path || '/', query };
}

/** Merge params into the current URL without losing the route. */
export function setQuery(patch, { replace = true } = {}) {
  const next = { ...current.query, ...patch };
  Object.keys(next).forEach((k) => { if (next[k] === '' || next[k] == null) delete next[k]; });
  const qs = new URLSearchParams(next).toString();
  go(current.path + (qs ? `?${qs}` : ''), { replace });
}

let token = 0;

async function dispatch() {
  const { path, query } = parse();
  const found = routes.find((r) => r.regex.exec(path.replace(/\/$/, '') || '/'));
  const params = {};
  if (found) {
    const match = found.regex.exec(path.replace(/\/$/, '') || '/');
    found.keys.forEach((key, i) => { params[key] = decodeURIComponent(match[i + 1]); });
  }
  current = { path, params, query };
  const mine = ++token;
  const context = { ...current, meta: found?.meta || {} };

  emitter.emit('before', context);
  let view;
  try {
    view = await (found ? found.handler(context) : notFound(context));
  } catch (error) {
    console.error('[admin] route failed', error);
    emitter.emit('error', { context, error });
    return;
  }
  if (mine !== token) return;
  emitter.emit('after', { ...context, view });
}

export const onAfter = (h) => emitter.on('after', h);
export const onBefore = (h) => emitter.on('before', h);
export const onError = (h) => emitter.on('error', h);

export function start() {
  window.addEventListener('hashchange', dispatch);
  dispatch();
}
export const refresh = () => dispatch();
