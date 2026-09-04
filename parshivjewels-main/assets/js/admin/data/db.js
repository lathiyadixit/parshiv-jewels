/* ══════════════════════════════════════════════════════════════
   DATA ACCESS LAYER
   Every repository talks to this, and only this. The interface is
   deliberately async and collection-oriented — the same shape a REST
   or Supabase client would expose — so replacing the localStorage
   driver with a real backend is a change to this one file.

   To move to an API later, reimplement these six functions with
   fetch() calls. No repository or page needs to change.
   ══════════════════════════════════════════════════════════════ */
import { read, write } from '../../core/storage.js';

const PREFIX = 'pj.admin.';
const key = (collection) => `${PREFIX}${collection}`;

/** Simulated latency keeps the UI honest about being asynchronous. */
const settle = (value) => Promise.resolve(value);

export function newId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

const clone = (value) => JSON.parse(JSON.stringify(value));

/* ─────────────── Core operations ─────────────── */

export function list(collection) {
  return settle(clone(read(key(collection), [])));
}

export async function find(collection, id) {
  const rows = await list(collection);
  return rows.find((row) => row.id === id) || null;
}

export async function insert(collection, record) {
  const rows = read(key(collection), []);
  const row = {
    ...record,
    id: record.id || newId(collection.slice(0, 3)),
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  rows.push(row);
  write(key(collection), rows);
  return settle(clone(row));
}

export async function update(collection, id, patch) {
  const rows = read(key(collection), []);
  const index = rows.findIndex((row) => row.id === id);
  if (index === -1) throw new Error(`${collection}: no record ${id}`);
  rows[index] = { ...rows[index], ...patch, id, updatedAt: new Date().toISOString() };
  write(key(collection), rows);
  return settle(clone(rows[index]));
}

export async function remove(collection, id) {
  const rows = read(key(collection), []);
  const next = rows.filter((row) => row.id !== id);
  write(key(collection), next);
  return settle(rows.length !== next.length);
}

/** Replace a whole collection — used by seeding and bulk reordering. */
export function replaceAll(collection, rows) {
  write(key(collection), rows);
  return settle(clone(rows));
}

/** Apply the same patch to many records in one write. */
export async function bulkUpdate(collection, ids, patch) {
  const rows = read(key(collection), []);
  const set = new Set(ids);
  const stamp = new Date().toISOString();
  const next = rows.map((row) => (set.has(row.id) ? { ...row, ...patch, updatedAt: stamp } : row));
  write(key(collection), next);
  return settle(next.filter((row) => set.has(row.id)).length);
}

export async function bulkRemove(collection, ids) {
  const rows = read(key(collection), []);
  const set = new Set(ids);
  const next = rows.filter((row) => !set.has(row.id));
  write(key(collection), next);
  return settle(rows.length - next.length);
}

/* ─────────────── Singletons (settings, content) ─────────────── */

export function getDoc(name, fallback = {}) {
  return settle(clone(read(key(name), fallback)));
}

export function setDoc(name, value) {
  write(key(name), value);
  return settle(clone(value));
}

export const COLLECTIONS = {
  products: 'products',
  categories: 'categories',
  collections: 'collections',
  enquiries: 'enquiries',
  orders: 'orders',
  customers: 'customers',
  coupons: 'coupons',
  reviews: 'reviews',
  media: 'media',
  users: 'users',
  inventoryLog: 'inventoryLog',
};
