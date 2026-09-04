/* Catalog repositories — products, categories, collections, inventory.
   All catalogue business rules live here; pages only render results. */
import * as db from '../data/db.js';
import { slugify } from '../../core/format.js';

const C = db.COLLECTIONS;

/* ─────────────── Derived product state ─────────────── */

export function stockState(product) {
  const qty = Number(product.inventory) || 0;
  const threshold = Number(product.lowStockThreshold) || 4;
  if (qty <= 0) return 'out-of-stock';
  if (qty <= threshold) return 'low-stock';
  return 'in-stock';
}

export const discountOf = (p) =>
  p.compareAt && p.compareAt > p.price ? Math.round((1 - p.price / p.compareAt) * 100) : 0;

export const marginOf = (p) =>
  p.costPrice ? Math.round(((p.price - p.costPrice) / p.price) * 100) : null;

const decorate = (p) => ({ ...p, stockState: stockState(p), discount: discountOf(p), margin: marginOf(p) });

/* ─────────────── Products ─────────────── */

export async function listProducts() {
  return (await db.list(C.products)).map(decorate);
}

export async function getProduct(id) {
  const p = await db.find(C.products, id);
  return p ? decorate(p) : null;
}

/** Filter, search and sort in one place so every screen agrees. */
export function queryProducts(products, opts = {}) {
  const { search = '', category = '', collection = '', status = '', stock = '', featured = '', sort = 'updated' } = opts;
  let rows = products.slice();

  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((p) =>
      [p.name, p.sku, p.material, p.category, ...(p.tags || [])].join(' ').toLowerCase().includes(q)
    );
  }
  if (category) rows = rows.filter((p) => p.category === category);
  if (collection) rows = rows.filter((p) => (p.collections || []).includes(collection));
  if (status) rows = rows.filter((p) => p.status === status);
  if (stock) rows = rows.filter((p) => p.stockState === stock);
  if (featured === 'featured') rows = rows.filter((p) => p.featured);
  if (featured === 'best-seller') rows = rows.filter((p) => p.bestSeller);
  if (featured === 'new-arrival') rows = rows.filter((p) => p.newArrival);

  const sorters = {
    updated: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    created: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    name: (a, b) => a.name.localeCompare(b.name),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    'stock-asc': (a, b) => a.inventory - b.inventory,
    'stock-desc': (a, b) => b.inventory - a.inventory,
  };
  return rows.sort(sorters[sort] || sorters.updated);
}

/** Slugs must stay unique or storefront URLs collide. */
export async function ensureUniqueSlug(slug, ignoreId = null) {
  const rows = await db.list(C.products);
  const base = slugify(slug) || 'product';
  let candidate = base;
  let n = 2;
  while (rows.some((r) => r.slug === candidate && r.id !== ignoreId)) candidate = `${base}-${n++}`;
  return candidate;
}

export async function createProduct(data) {
  const slug = await ensureUniqueSlug(data.slug || data.name);
  return db.insert(C.products, { status: 'draft', order: 999, ...data, slug });
}

export async function updateProduct(id, patch) {
  const next = { ...patch };
  if (patch.slug) next.slug = await ensureUniqueSlug(patch.slug, id);
  return db.update(C.products, id, next);
}

export async function duplicateProduct(id) {
  const source = await db.find(C.products, id);
  if (!source) throw new Error('Product not found');
  const copy = { ...source };
  delete copy.id;
  delete copy.createdAt;
  copy.name = `${source.name} (Copy)`;
  copy.slug = await ensureUniqueSlug(`${source.slug}-copy`);
  copy.sku = `${source.sku}-C`;
  copy.status = 'draft';
  copy.featured = false;
  copy.bestSeller = false;
  return db.insert(C.products, copy);
}

export const deleteProduct = (id) => db.remove(C.products, id);
export const bulkUpdateProducts = (ids, patch) => db.bulkUpdate(C.products, ids, patch);
export const bulkDeleteProducts = (ids) => db.bulkRemove(C.products, ids);

/* ─────────────── Inventory ─────────────── */

/** Adjust stock and record why, so the change is auditable. */
export async function setInventory(id, quantity, reason = 'Manual adjustment') {
  const product = await db.find(C.products, id);
  if (!product) throw new Error('Product not found');
  const from = Number(product.inventory) || 0;
  const to = Math.max(0, Math.floor(Number(quantity) || 0));

  const updated = await db.update(C.products, id, {
    inventory: to,
    variants: rebalanceVariants(product.variants, to),
  });
  await db.insert(C.inventoryLog, {
    productId: id,
    productName: product.name,
    sku: product.sku,
    from,
    to,
    delta: to - from,
    reason,
  });
  return decorate(updated);
}

/** Keep per-variant stock consistent with the product total. */
function rebalanceVariants(variants = [], total) {
  if (!variants.length) return variants;
  const per = Math.floor(total / variants.length);
  let remainder = total - per * variants.length;
  return variants.map((v) => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    const qty = per + extra;
    return { ...v, inventory: qty, available: qty > 0 };
  });
}

export const listInventoryLog = () => db.list(C.inventoryLog);

export async function bulkSetInventory(entries, reason = 'Bulk update') {
  let count = 0;
  for (const { id, quantity } of entries) {
    await setInventory(id, quantity, reason);
    count += 1;
  }
  return count;
}

/* ─────────────── Categories ─────────────── */

export const listCategories = () => db.list(C.categories);
export const getCategory = (id) => db.find(C.categories, id);
export const createCategory = (data) =>
  db.insert(C.categories, { status: 'active', order: 999, ...data, slug: slugify(data.slug || data.name) });
export const updateCategory = (id, patch) =>
  db.update(C.categories, id, patch.slug ? { ...patch, slug: slugify(patch.slug) } : patch);
export const deleteCategory = (id) => db.remove(C.categories, id);
export const reorderCategories = async (orderedIds) => {
  const rows = await db.list(C.categories);
  const byId = new Map(rows.map((r) => [r.id, r]));
  return db.replaceAll(
    C.categories,
    orderedIds.map((id, i) => ({ ...byId.get(id), order: i })).filter(Boolean)
  );
};

/* ─────────────── Collections ─────────────── */

export const listCollections = () => db.list(C.collections);
export const getCollection = (id) => db.find(C.collections, id);
export const createCollection = (data) =>
  db.insert(C.collections, { status: 'active', productIds: [], order: 999, ...data, slug: slugify(data.slug || data.name) });
export const updateCollection = (id, patch) =>
  db.update(C.collections, id, patch.slug ? { ...patch, slug: slugify(patch.slug) } : patch);
export const deleteCollection = (id) => db.remove(C.collections, id);

export async function setCollectionProducts(id, productIds) {
  return db.update(C.collections, id, { productIds });
}
