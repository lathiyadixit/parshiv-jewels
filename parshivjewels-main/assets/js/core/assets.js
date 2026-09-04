/* Resolves paths to bundled files under assets/.
   Root-relative URLs ("/assets/img/x.webp") are correct when the site is
   served from a domain root, but resolve to the filesystem root when the
   standalone build is opened from file://. This works out the right base
   once, so local images load in both cases. */

const isHttp = typeof location !== 'undefined' && /^https?:$/.test(location.protocol);

/** Directory containing the current document, used for file:// resolution. */
const documentDir =
  typeof location === 'undefined'
    ? '/'
    : location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');

export const ASSET_BASE = isHttp ? '/' : documentDir;

/** True for anything already resolvable: absolute URL, data URI, or root path. */
export const isLocalAssetPath = (value) => typeof value === 'string' && /^[./]/.test(value);

/** "/assets/img/x.webp" → a URL that works from a server root or from file://. */
export function asset(path) {
  if (!path) return '';
  if (/^(https?:|data:)/.test(path)) return path;
  return ASSET_BASE + String(path).replace(/^\.?\//, '');
}
