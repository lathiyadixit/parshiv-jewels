# Parshiv Jewels — WhatsApp Commerce Storefront

A static, dependency-free storefront for Parshiv Jewels, Surat. No build step,
no framework, no bundler — the same "upload the files" deployment the site
already used, extended into a full catalogue, cart and WhatsApp ordering flow.

---

## Deploying to Hostinger

Upload the contents of this folder into `public_html`:

```
index.html          the storefront shell
admin.html          the admin panel (protect it — see below)
.htaccess           rewrites, caching, security headers, admin auth block
robots.txt
sitemap.xml
assets/js/          the application (ES modules)
assets/img/         local images
```

**Do not upload** `index.original.html.bak` (the pre-upgrade site, kept for
reference), `index.standalone.html` (the offline build), `tools/`, or
`README.md`. The bundled `.htaccess` denies them if they end up there anyway.

That is the whole deployment. No Node.js runtime is required on the server —
Node is only used locally by the two scripts in `tools/`.

### The one thing `.htaccess` must do

Routes are rendered client-side, so a hard load of `/product/aurelia-blue-topaz-ring`
has to serve `index.html`. The bundled rewrite rules handle this on Hostinger's
Apache/LiteSpeed stack. If you move to a host that ignores `.htaccess`, replicate
this rule or every deep link will 404:

> any request that is not an existing file or directory → serve `/index.html`

### Before going live

1. **HTTPS redirect** — `.htaccess` forces HTTPS. Comment that block out until
   your SSL certificate has been issued, or the site will redirect-loop.
2. **If your host cannot rewrite URLs** — set
   `NEXT_PUBLIC_FORCE_HASH_ROUTING: 'true'` in `index.html`. URLs become
   `/#/shop` instead of `/shop`; everything else works unchanged. Leave it
   `'false'` on Hostinger, where the bundled `.htaccess` handles rewrites.
3. **WhatsApp number** — set it once in `index.html`:
   ```html
   <script>
   window.__ENV__ = { NEXT_PUBLIC_WHATSAPP_NUMBER: '916351916996' };
   </script>
   ```
   Digits only, with country code, no `+` or spaces. The key name matches the
   Next.js convention so it can be reused verbatim if the site ever moves there.
   Re-run the standalone build afterwards so it picks up the change.

---

## Running it locally

There are two ways, depending on what you want.

**Preview with a server (recommended).** This is the real thing — deep links,
clean URLs and caching all behave exactly as they will in production:

```bash
node tools/dev-server.mjs
```

Then open <http://localhost:4173>.

**Just double-click a file.** `index.html` will *not* work this way: browsers
refuse to load JavaScript modules from `file://` addresses, so the page stops
at the loading screen. Open **`index.standalone.html`** instead — it is the
whole site inlined into one file and needs no server. Rebuild it whenever you
change anything under `assets/js/`:

```bash
node tools/build-standalone.mjs
```

The standalone is for local and offline viewing only — **deploy `index.html`**,
which loads the modules separately so browsers can cache them individually.

> If the site ever stops at the loading screen, it now says why on screen
> rather than sitting at 0% — missing files, a stale cache, or `file://`.

---

## Architecture

```
assets/js/
  config/site.config.js      brand, contact, commerce rules, coupons, WhatsApp number
  core/                      router, DOM helpers, formatting, storage, toast, reveals
  data/                      products, reviews, taxonomy, editorial copy
  services/                  catalog, pricing, cart, WhatsApp, SEO, recently-viewed
  components/                product card, cart drawer, quick view, nav, search
  pages/                     one module per route, each returning { meta, html, onMount }
  app.js                     routes + bootstrap
```

The layering rule: **pages compose components, components call services,
services own the rules, data is inert.** Nothing below the component layer
touches the DOM, which is why the pricing and WhatsApp logic can be exercised
directly from the console:

```js
const cart = await import('/assets/js/services/cartService.js');
const wa   = await import('/assets/js/services/whatsappService.js');
cart.add(1, '16', 2);
console.log(wa.formatCartMessage(cart.getSnapshot()));
```

### Where things live

| To change… | Edit |
|---|---|
| WhatsApp number, tax rate, shipping, coupons | `config/site.config.js` |
| Products, prices, stock, images | `data/products.js` |
| Categories, collections, filter vocabularies | `data/taxonomy.js` |
| Customer reviews | `data/reviews.js` |
| About / Story / Policy / guide copy | `data/content.js` |
| The order message sent to WhatsApp | `services/whatsappService.js` |
| Cart rules and edge cases | `services/cartService.js` |
| Money maths | `services/pricingService.js` |

Ratings are derived from `data/reviews.js` and discounts from `price` vs
`compareAt`, so a product's headline numbers can never drift from its data.

### Adding an informational page

Add an entry to `PAGES` in `data/content.js`, then add its slug to
`INFO_LABELS` in `pages/info.js`. That one addition creates the route, the
page title, the breadcrumb, the sitemap entry and the cross-links at the foot
of every other informational page. Link it from the footer in `index.html` and
from the nav in `components/navigation.js` if it should appear there.

Each section renders in this order:

| Field | Renders as |
|---|---|
| `heading` | section `<h2>` |
| `body[]` | paragraphs |
| `image` | `{ src, alt, caption, fit }` figure |
| `bodyAfter[]` | paragraphs below the image |
| `list[]` | bullets — plain strings, or `{ term, detail }` for a bold lead-in |
| `table` | `{ caption, head[], rows[][] }`, scrollable on mobile |

A page may also set `hero`, `heroAlt`, `heroCaption`, `heroFit`, `heroBg`,
`heroFullSize`, `stats`, `timeline`, `updated` and a `cta` override.

Images — `hero` and `section.image` alike — take:

| Field | Effect |
|---|---|
| `fit: 'contain'` | For a document or diagram rather than a photograph: keeps its own proportions and loses the darkening scrim. Photographs are cropped to a band. |
| `bg: 'dark' \| 'light'` | Backdrop behind a `contain` image. `dark` for artwork on a black ground, so it merges into the page; `light` for anything on white. |
| `fullSize: true` | Adds a "View full size ↗" link to the caption, opening the original file. Worth it for dense charts whose labels shrink on a phone. |
| `caption` | Shown under the image, inside the frame. |

Diagrams always scale to the content column — never cropped, never clipped.

Page headings step down a type size for longer titles automatically, so a
sentence-length `title` doesn't fill a phone screen on its own.

---

## Admin panel

A private business console at **`/admin.html`** — catalogue, inventory,
WhatsApp enquiries, orders, customers, coupons, reviews, content, media,
analytics and settings.

Sign in with the values in `window.__ENV__` in `admin.html`:

```
ADMIN_EMAIL:    admin@parshivjewels.in
ADMIN_PASSCODE: parshiv-admin      ← change this before deploying
```

### ⚠ Read this before the admin goes on a public URL

**The sign-in is a UI gate, not security.** The site has no server, so the
check runs in the visitor's browser using code they can read. It stops a
casual passer-by; it does not stop anyone determined.

Protect it at the web-server level. `.htaccess` contains a ready block —
uncomment it and create the password file:

```bash
htpasswd -c /home/USERNAME/.htpasswd owner
```

Hostinger's hPanel has a "Password Protect Directories" tool that does the
same thing. Until that is in place, treat the panel as reachable by anyone
who guesses the URL.

### Where the data lives

Everything the admin writes goes to `localStorage` **in that one browser**.
That means:

- Edits are **not** visible to customers, and not on your other devices.
- Clearing site data erases them — use **Settings → Export backup** first.
- Analytics counts activity from that browser only, not real site traffic.

This is deliberate: `assets/js/admin/data/db.js` is the single data-access
layer, with an async, collection-shaped API (`list`, `find`, `insert`,
`update`, `remove`, `bulkUpdate`). Swapping to a real backend means
reimplementing those six functions with `fetch` — no repository or page
changes. That is the file to replace when a database is added.

### Structure

```
assets/js/admin/
  core/        auth (roles + permissions), hash router
  data/        db.js — the data-access layer, seed.js — first-run catalogue
  repositories/ catalog, commerce, analytics, alerts — all business rules
  components/  UI kit, SVG charts, modal/confirm, layout + sidebar
  pages/       one module per screen, returning { html, onMount }
```

Pages render; repositories decide. No page computes a total, a stock state
or a discount itself.

### Enquiry details

Before a cart (or a single piece) is handed to WhatsApp, the storefront asks
for the customer's **name**, **phone** and an optional **note**
(`components/enquiryDialog.js`). Name and phone are remembered locally, so a
returning customer confirms rather than retypes; the note always starts blank
because it belongs to that enquiry.

Those details ride along in two places:

- **The WhatsApp message** — a customer block above the items, plus each
  product's page URL on its own line. WhatsApp cannot embed an image in a text
  message, so the URL is what carries the piece; WhatsApp previews it with the
  product photo.
- **The admin** — Enquiries shows product thumbnails in the list, and the
  detail view shows each line with its image, SKU, a "View on the storefront"
  link, and the customer's own note highlighted separately from your notes.
  Name and phone arrive pre-filled, so converting to an order is one click.

### Analytics

`assets/js/services/analyticsService.js` records storefront events —
page view, product view, search, add/remove from cart, cart view, WhatsApp
click, coupon applied. The admin reads that log; nothing else does.

It also forwards every event to `window.gtag` and `window.dataLayer` if
either is present, so connecting Google Analytics is a matter of adding
their snippet to `index.html` — no component changes.

WhatsApp clicks carry the full cart, which is how the Enquiries screen
reconstructs what someone was asking about.

---

## Theming

The site ships dark (the house default) and a warm ivory light mode. Until a
visitor picks one, it follows their operating system.

The whole palette lives in CSS variables at the top of `index.html`, and every
Tailwind colour resolves through them:

```
:root                     dark palette
html[data-theme="light"]  light palette
```

So `bg-night`, `text-ivory`, `border-line/15` and the rest all flip on their
own — **adding a colour means adding a variable, not a second set of classes.**
A small inline script in `<head>` applies the stored choice before first paint,
so the page never flashes the wrong palette.

Tokens that exist purely so both palettes stay legible:

| Token | Purpose |
|---|---|
| `ink` | Text on a gold fill. Dark on the bright dark-mode gold, light on the deeper light-mode gold — never `text-night`, which would invert with the page. |
| `line` | Hairline borders. Replaces `white/10`-style literals, which vanish on a light page. |
| `veil` | Drawer and modal scrims. |
| `success` / `danger` | Status text. Tailwind's built-in `green-400` sits at 1.7:1 on a white card; these flip to darker equivalents in light mode. |

Colour-opacity steps (`border-line/15`) only generate for values listed in
`theme.extend.opacity` — custom colours don't get Tailwind's full built-in
scale. A step that isn't declared there fails to compile **and takes the whole
stylesheet down with it**, so add new steps to that list.

Artwork with a baked-in black background uses `panel-artwork`, which stays dark
in both palettes rather than stranding black artwork on an ivory page.

---

## After changing the catalog

Regenerate the sitemap so new products are crawlable:

```bash
node tools/generate-sitemap.mjs
```

---

## Images

Any image reference — a product photo, a page hero — may be either an Unsplash
photo id (resized on their CDN) or a local path under `assets/img/`.
`services/catalogService.js` resolves both, so switching one for the other
needs no other change:

```js
hero: 'photo-1598560917505-59a3ad559071',        // Unsplash, CDN-resized
hero: '/assets/img/igi-diamond-report.webp',      // local file
```

Local paths are resolved through `core/assets.js`, which works both from a
domain root and from `file://`, and the standalone build embeds them as data
URIs so it stays a single file.

**Product photography is still placeholder.** `IMAGE_POOLS` in
`data/products.js` points at Unsplash, and several products share a
photograph. To replace with real studio shots:

1. Export each piece at ~1400px on the long edge, in WebP.
2. Put them in `assets/img/products/`.
3. Point the pools at the local paths.

Local files get no automatic `srcset` (there is no CDN to resize them), so
export at a sensible size — around 150 KB for a full-width image. Every image
already carries descriptive alt text derived from the product name and
material; page heroes can override it with `heroAlt`.

---

## Notes on behaviour worth knowing

- **The cart is revalidated on every load.** Removed products, discontinued
  sizes, sold-out stock, quantities beyond stock and price changes are all
  reconciled against the live catalogue, and the shopper is told what changed.
- **Stock is held per variant.** A ring size with two in stock caps that line at
  two, and the message says so rather than silently clamping.
- **Money is whole rupees** throughout, rounded once in `pricingService.js`, so
  the drawer, the cart page and the WhatsApp message always agree.
- **Old `#/products`-style links still work** and redirect to their new paths.
- **WhatsApp opens `web.whatsapp.com` on desktop** and `wa.me` on mobile. If a
  pop-up blocker intervenes, `/order-enquiry` offers the link again and a
  copy-to-clipboard fallback.
