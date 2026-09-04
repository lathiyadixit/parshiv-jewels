/* localStorage / sessionStorage wrapper that degrades to memory when the
   browser blocks storage (private mode, disabled cookies, file:// quirks). */

const memory = new Map();

function backend(session) {
  try {
    const store = session ? window.sessionStorage : window.localStorage;
    const probe = '__pj_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

const local = backend(false);
const session = backend(true);

function pick(useSession) {
  return useSession ? session : local;
}

export function read(key, fallback = null, { session: useSession = false } = {}) {
  const store = pick(useSession);
  try {
    const raw = store ? store.getItem(key) : memory.get(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function write(key, value, { session: useSession = false } = {}) {
  const store = pick(useSession);
  const raw = JSON.stringify(value);
  try {
    if (store) store.setItem(key, raw);
    else memory.set(key, raw);
  } catch {
    memory.set(key, raw);
  }
}

export function remove(key, { session: useSession = false } = {}) {
  const store = pick(useSession);
  try {
    if (store) store.removeItem(key);
  } catch {
    /* ignore */
  }
  memory.delete(key);
}
