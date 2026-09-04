/* Recently viewed products and recent searches — small, isolated
   persistence concerns kept out of the pages that use them. */
import { read, write } from '../core/storage.js';
import { STORAGE_KEYS } from '../config/site.config.js';
import { getBySlug } from './catalogService.js';

const MAX_VIEWED = 8;
const MAX_SEARCHES = 6;

export function recordView(product) {
  if (!product) return;
  const slugs = read(STORAGE_KEYS.recentlyViewed, []);
  const next = [product.slug, ...slugs.filter((slug) => slug !== product.slug)].slice(0, MAX_VIEWED);
  write(STORAGE_KEYS.recentlyViewed, next);
}

/** @param {string} excludeSlug omit the product currently being viewed */
export function getRecentlyViewed(excludeSlug = null, limit = 6) {
  return read(STORAGE_KEYS.recentlyViewed, [])
    .filter((slug) => slug !== excludeSlug)
    .map(getBySlug)
    .filter(Boolean)
    .slice(0, limit);
}

export function clearRecentlyViewed() {
  write(STORAGE_KEYS.recentlyViewed, []);
}

export function recordSearch(term) {
  const clean = String(term || '').trim();
  if (clean.length < 2) return;
  const history = read(STORAGE_KEYS.recentSearches, []);
  const next = [clean, ...history.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(
    0,
    MAX_SEARCHES
  );
  write(STORAGE_KEYS.recentSearches, next);
}

export const getRecentSearches = () => read(STORAGE_KEYS.recentSearches, []);
export const clearRecentSearches = () => write(STORAGE_KEYS.recentSearches, []);
