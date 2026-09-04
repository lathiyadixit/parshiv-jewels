/* Content, media, settings and admin users. */
import { $, $$, esc } from '../../core/dom.js';
import { refresh } from '../core/adminRouter.js';
import { toast } from '../../core/toast.js';
import * as db from '../data/db.js';
import * as commerce from '../repositories/commerceRepo.js';
import * as catalog from '../repositories/catalogRepo.js';
import { seed } from '../data/seed.js';
import { getUser, ROLES, PERMISSIONS } from '../core/auth.js';
import { confirmAction, openModal, closeModal } from '../components/modal.js';
import { pageHeader, card, sectionTitle, field, textarea, select, toggle, btn, table, badge, statusBadge, emptyState, kpi, searchInput } from '../components/ui.js';

const val = (id) => $(`#${id}`)?.value ?? '';

/* ─────────────── Homepage content ─────────────── */

export async function contentPage() {
  const content = await db.getDoc('content', {});
  const products = await catalog.listProducts();
  const featured = products.filter((p) => p.featured);
  const best = products.filter((p) => p.bestSeller);
  const fresh = products.filter((p) => p.newArrival);

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'Homepage', path: '/content' }],
    html: `<div class="space-y-5">
      ${pageHeader({ title: 'Homepage content', subtitle: 'Text shown across the storefront', actions: [btn('Save changes', { variant: 'gold', attrs: 'data-save' })] })}

      ${card(`${sectionTitle('Announcement bar', 'The scrolling strip above the header. One message per line.')}
        <div class="grid gap-4">
          ${toggle({ id: 'annEnabled', label: 'Show the announcement bar', checked: content.announcement?.enabled !== false })}
          ${textarea({ id: 'annItems', label: 'Messages', value: (content.announcement?.items || []).join('\n'), rows: 5 })}
        </div>`, 'p-5')}

      ${card(`${sectionTitle('Hero')}
        <div class="grid gap-4 sm:grid-cols-2">
          ${field({ id: 'heroEyebrow', label: 'Eyebrow', value: content.hero?.eyebrow || '' })}
          ${field({ id: 'heroTitle1', label: 'Headline line 1', value: content.hero?.titleLine1 || '' })}
          ${field({ id: 'heroTitle2', label: 'Headline line 2', value: content.hero?.titleLine2 || '' })}
          ${textarea({ id: 'heroBody', label: 'Intro paragraph', value: content.hero?.body || '', rows: 3, className: 'sm:col-span-2' })}
        </div>`, 'p-5')}

      ${card(`${sectionTitle('Homepage product bands', 'Driven by product flags — set them on each product')}
        <div class="grid gap-4 sm:grid-cols-3">
          ${kpi({ label: 'Featured collection', value: featured.length, sub: featured.slice(0, 3).map((p) => p.name).join(', ') || 'None flagged', tone: 'ivory' })}
          ${kpi({ label: 'Best sellers', value: best.length, sub: best.slice(0, 3).map((p) => p.name).join(', ') || 'None flagged', tone: 'ivory' })}
          ${kpi({ label: 'New arrivals', value: fresh.length, sub: fresh.slice(0, 3).map((p) => p.name).join(', ') || 'None flagged', tone: 'ivory' })}
        </div>
        <p class="mt-4 text-[12px] text-sand">Flag a product as Featured, Best seller or New arrival in its editor to place it in these bands.</p>`, 'p-5')}

      ${card(`${sectionTitle('Newsletter')}
        <div class="grid gap-4">
          ${field({ id: 'nlTitle', label: 'Heading', value: content.newsletter?.title || '' })}
          ${textarea({ id: 'nlBody', label: 'Body', value: content.newsletter?.body || '', rows: 2 })}
        </div>`, 'p-5')}

      ${card(`${sectionTitle('Testimonials', `${(content.testimonials || []).length} shown on the homepage`)}
        ${table({
          columns: [
            { key: 'author', label: 'Author', render: (t) => `<span class="text-ivory">${esc(t.author)}</span>` },
            { key: 'context', label: 'Context', render: (t) => `<span class="text-sand">${esc(t.context || '—')}</span>` },
            { key: 'body', label: 'Quote', nowrap: false, render: (t) => `<span class="line-clamp-2 max-w-lg text-sand">${esc(t.body)}</span>` },
            { key: 'status', label: 'Status', render: (t) => statusBadge(t.status || 'active') },
          ],
          rows: content.testimonials || [], empty: 'No testimonials.',
        })}`, 'p-5')}
    </div>`,
    onMount: (scope) => {
      scope.delegate($('#adminMain'), 'click', '[data-save]', async () => {
        await db.setDoc('content', {
          ...content,
          announcement: {
            enabled: $('#annEnabled').checked,
            items: val('annItems').split('\n').map((s) => s.trim()).filter(Boolean),
          },
          hero: { eyebrow: val('heroEyebrow'), titleLine1: val('heroTitle1'), titleLine2: val('heroTitle2'), body: val('heroBody') },
          newsletter: { title: val('nlTitle'), body: val('nlBody') },
        });
        toast('Content saved', { tone: 'success' });
      });
    },
  };
}

/* ─────────────── Media ─────────────── */

export async function mediaPage({ query }) {
  const all = await commerce.listMedia();
  let rows = all;
  if (query.q) rows = rows.filter((m) => `${m.alt} ${m.folder} ${m.usedBy}`.toLowerCase().includes(query.q.toLowerCase()));

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'Media Library', path: '/media' }],
    html: `<div class="space-y-5">
      ${pageHeader({ title: 'Media Library', subtitle: `${all.length} images`, actions: [btn('Add image', { variant: 'gold', attrs: 'data-new' })] })}
      <div class="rounded-2xl border border-line/10 bg-card p-4">${searchInput('medSearch', 'Search alt text or folder…', query.q || '')}</div>
      ${rows.length
        ? `<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            ${rows.map((m) => `<div class="overflow-hidden rounded-xl border border-line/10 bg-card">
              <div class="relative aspect-square bg-night">
                <img src="${esc(m.src)}" alt="${esc(m.alt || '')}" loading="lazy" class="h-full w-full object-cover" onerror="this.style.opacity=.15">
              </div>
              <div class="space-y-2 p-3">
                <p class="truncate text-[11px] text-sand" title="${esc(m.alt || '')}">${esc(m.alt || 'No alt text')}</p>
                <div class="flex gap-1">
                  <button type="button" data-copy="${esc(m.src)}" class="admin-icon-btn" title="Copy URL">⧉</button>
                  <button type="button" data-edit="${m.id}" class="admin-icon-btn" title="Edit alt text">✎</button>
                  <button type="button" data-delete="${m.id}" class="admin-icon-btn hover:!text-danger" title="Delete">✕</button>
                </div>
              </div></div>`).join('')}
          </div>`
        : emptyState({ title: 'No images', message: 'Add an image URL to build the library.' })}
      <p class="text-center text-[11px] text-sand/60">Images are referenced by URL. Upload files to <code class="text-gold-light">assets/img/</code> and reference them here, or paste a remote URL.</p>
    </div>`,
    onMount: (scope) => {
      const root = $('#adminMain');
      let timer;
      scope.on($('#medSearch'), 'input', (e) => { clearTimeout(timer); timer = setTimeout(() => { window.location.hash = `/media?q=${encodeURIComponent(e.target.value)}`; }, 350); });

      scope.delegate(root, 'click', '[data-copy]', async (e, el) => {
        try { await navigator.clipboard.writeText(el.dataset.copy); toast('URL copied', { tone: 'success' }); }
        catch { toast('Copy failed', { tone: 'error' }); }
      });
      scope.delegate(root, 'click', '[data-new]', () => {
        const modal = openModal({
          title: 'Add image', size: 'max-w-lg',
          body: `${field({ id: 'mdSrc', label: 'Image URL', required: true, placeholder: '/assets/img/piece.webp' })}
                 ${field({ id: 'mdAlt', label: 'Alt text', placeholder: 'Describe the image' })}
                 ${field({ id: 'mdFolder', label: 'Folder', value: 'products' })}`,
          footer: `<div class="flex justify-end gap-3">${btn('Cancel', { variant: 'ghost', attrs: 'data-modal-close' })}${btn('Add', { variant: 'gold', attrs: 'data-ok' })}</div>`,
        });
        modal.querySelector('[data-ok]').addEventListener('click', async () => {
          const src = modal.querySelector('#mdSrc').value.trim();
          if (!src) { toast('A URL is required', { tone: 'error' }); return; }
          await commerce.createMedia({ src, alt: modal.querySelector('#mdAlt').value.trim(), folder: modal.querySelector('#mdFolder').value.trim() });
          closeModal(); toast('Image added', { tone: 'success' }); refresh();
        });
      });
      scope.delegate(root, 'click', '[data-edit]', async (e, el) => {
        const item = all.find((m) => m.id === el.dataset.edit);
        const modal = openModal({
          title: 'Edit image', size: 'max-w-lg',
          body: `${field({ id: 'mdSrc', label: 'Image URL', value: item.src })}${field({ id: 'mdAlt', label: 'Alt text', value: item.alt || '' })}`,
          footer: `<div class="flex justify-end gap-3">${btn('Cancel', { variant: 'ghost', attrs: 'data-modal-close' })}${btn('Save', { variant: 'gold', attrs: 'data-ok' })}</div>`,
        });
        modal.querySelector('[data-ok]').addEventListener('click', async () => {
          await commerce.updateMedia(item.id, { src: modal.querySelector('#mdSrc').value.trim(), alt: modal.querySelector('#mdAlt').value.trim() });
          closeModal(); toast('Image updated', { tone: 'success' }); refresh();
        });
      });
      scope.delegate(root, 'click', '[data-delete]', async (e, el) => {
        const ok = await confirmAction({ title: 'Delete image?', message: 'It is removed from the library. Products already using the URL keep working.' });
        if (!ok) return;
        await commerce.deleteMedia(el.dataset.delete);
        toast('Image deleted', { tone: 'success' }); refresh();
      });
    },
  };
}

/* ─────────────── Store settings ─────────────── */

export async function settingsPage() {
  const s = await db.getDoc('settings', {});
  const b = s.business || {}, st = s.store || {}, wa = s.whatsapp || {}, seo = s.seo || {};

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'Store Settings', path: '/settings' }],
    html: `<div class="space-y-5">
      ${pageHeader({ title: 'Store settings', subtitle: 'Business details, commerce rules and WhatsApp', actions: [btn('Save settings', { variant: 'gold', attrs: 'data-save' })] })}

      <div class="rounded-2xl border border-gold/25 bg-gold/5 px-5 py-4">
        <p class="text-[11px] uppercase tracking-[0.18em] text-gold">Where these reach</p>
        <p class="mt-2 text-[13px] leading-relaxed text-sand">Contact details apply to the storefront footer and contact page <span class="text-ivory">in this browser</span>.
        Because the site has no backend yet, customers keep seeing the values in
        <code class="text-gold-light">assets/js/config/site.config.js</code> until you edit that file and redeploy.</p>
      </div>

      ${card(`${sectionTitle('Business')}
        <div class="grid gap-4 sm:grid-cols-2">
          ${field({ id: 'bName', label: 'Brand name', value: b.name || '' })}
          ${field({ id: 'bEmail', label: 'Business email', value: b.email || '', type: 'email' })}
          ${field({ id: 'bPhone', label: 'Business phone', value: b.phone || '', hint: 'Shown first in the footer and on the contact page.' })}
          ${field({ id: 'bPhone2', label: 'Secondary phone', value: b.phoneSecondary || '', hint: 'A second line. Leave blank to hide it from the storefront.' })}
          ${field({ id: 'bWhats', label: 'WhatsApp number', value: b.whatsapp || '', hint: 'Digits only with country code, e.g. 916351916996' })}
          ${textarea({ id: 'bAddress', label: 'Address', value: b.address || '', rows: 2, className: 'sm:col-span-2' })}
          ${field({ id: 'bInstagram', label: 'Instagram URL', value: b.instagram || '' })}
          ${field({ id: 'bFacebook', label: 'Facebook URL', value: b.facebook || '' })}
        </div>`, 'p-5')}

      ${card(`${sectionTitle('Store')}
        <div class="grid gap-4 sm:grid-cols-3">
          ${field({ id: 'sCurrency', label: 'Currency', value: st.currency || 'INR' })}
          ${field({ id: 'sTax', label: 'Tax rate (%)', value: st.taxRate ?? 18, type: 'number', attrs: 'min="0" max="100" step="0.1"' })}
          ${field({ id: 'sShipFlat', label: 'Shipping charge (₹)', value: st.shippingFlat ?? 0, type: 'number', attrs: 'min="0"', hint: '0 keeps shipping free.' })}
          ${field({ id: 'sLowStock', label: 'Low-stock threshold', value: st.lowStockThreshold ?? 4, type: 'number', attrs: 'min="0"' })}
          ${field({ id: 'sMaxQty', label: 'Max quantity per line', value: st.maxQtyPerLine ?? 10, type: 'number', attrs: 'min="1"' })}
          ${field({ id: 'sShipLabel', label: 'Shipping label', value: st.shippingLabel || 'Free · Insured' })}
        </div>`, 'p-5')}

      ${card(`${sectionTitle('WhatsApp', 'How the enquiry message is composed')}
        <div class="grid gap-4">
          ${field({ id: 'wNumber', label: 'WhatsApp number', value: wa.number || '', hint: 'Overrides the storefront number when saved.' })}
          ${textarea({ id: 'wGreeting', label: 'Opening line', value: wa.greeting || '', rows: 2 })}
          ${textarea({ id: 'wClosing', label: 'Closing line', value: wa.closing || '', rows: 2 })}
        </div>`, 'p-5')}

      ${card(`${sectionTitle('SEO defaults')}
        <div class="grid gap-4">
          ${field({ id: 'seoTitle', label: 'Default page title', value: seo.title || '' })}
          ${textarea({ id: 'seoDesc', label: 'Default meta description', value: seo.description || '', rows: 2 })}
          ${field({ id: 'seoImage', label: 'Social sharing image', value: seo.shareImage || '' })}
        </div>`, 'p-5')}

      ${card(`${sectionTitle('Data', 'The admin database lives in this browser')}
        <p class="text-[13px] leading-relaxed text-sand">Export a JSON backup before clearing your browser data, or to move the catalogue to another device.</p>
        <div class="mt-4 flex flex-wrap gap-2">
          ${btn('Export backup', { attrs: 'data-export' })}
          ${btn('Import backup', { attrs: 'data-import' })}
          ${btn('Reset to storefront catalogue', { variant: 'danger', attrs: 'data-reseed' })}
        </div>`, 'p-5')}
    </div>`,
    onMount: (scope) => {
      const root = $('#adminMain');
      scope.delegate(root, 'click', '[data-save]', async () => {
        await db.setDoc('settings', {
          business: {
            name: val('bName'), email: val('bEmail'),
            phone: val('bPhone'), phoneSecondary: val('bPhone2'),
            whatsapp: val('bWhats').replace(/\D/g, ''), address: val('bAddress'),
            instagram: val('bInstagram'), facebook: val('bFacebook'),
          },
          store: { currency: val('sCurrency'), taxRate: Number(val('sTax')) || 0, shippingFlat: Number(val('sShipFlat')) || 0, lowStockThreshold: Number(val('sLowStock')) || 0, maxQtyPerLine: Number(val('sMaxQty')) || 10, shippingLabel: val('sShipLabel') },
          whatsapp: { number: val('wNumber').replace(/\D/g, ''), greeting: val('wGreeting'), closing: val('wClosing') },
          seo: { title: val('seoTitle'), description: val('seoDesc'), shareImage: val('seoImage') },
        });
        toast('Settings saved', { tone: 'success' });
      });

      scope.delegate(root, 'click', '[data-export]', async () => {
        const payload = {};
        for (const name of [...Object.values(db.COLLECTIONS), 'settings', 'content', 'meta']) {
          payload[name] = await (Object.values(db.COLLECTIONS).includes(name) ? db.list(name) : db.getDoc(name, {}));
        }
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `parshiv-admin-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast('Backup downloaded', { tone: 'success' });
      });

      scope.delegate(root, 'click', '[data-import]', () => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'application/json';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          try {
            const data = JSON.parse(await file.text());
            for (const [name, value] of Object.entries(data)) {
              if (Array.isArray(value)) await db.replaceAll(name, value); else await db.setDoc(name, value);
            }
            toast('Backup restored', { tone: 'success' });
            refresh();
          } catch {
            toast('That file could not be read', { tone: 'error' });
          }
        };
        input.click();
      });

      scope.delegate(root, 'click', '[data-reseed]', async () => {
        const ok = await confirmAction({
          title: 'Reset the admin database?',
          message: 'Every product edit, order, enquiry and setting made here will be replaced with the storefront catalogue. Export a backup first if you need one.',
          confirmLabel: 'Reset everything',
        });
        if (!ok) return;
        await seed({ force: true });
        toast('Database reset to the storefront catalogue', { tone: 'success' });
        refresh();
      });
    },
  };
}

/* ─────────────── Admin users ─────────────── */

export async function usersPage() {
  const me = getUser();
  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'Admin Users', path: '/settings/users' }],
    html: `<div class="space-y-5">
      ${pageHeader({ title: 'Admin users', subtitle: 'Roles and permissions' })}

      <div class="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p class="text-[11px] uppercase tracking-[0.18em] text-gold">Before this goes live</p>
        <p class="mt-2 text-[13px] leading-relaxed text-ivory">This panel runs entirely in the browser, so its sign-in cannot keep a determined visitor out.
        Protect <code class="text-gold-light">/admin.html</code> with HTTP Basic Auth in <code class="text-gold-light">.htaccess</code> (the README has the exact block), or put a real backend behind the login before the URL is public.</p>
      </div>

      ${card(`${sectionTitle('Signed in')}
        ${table({
          columns: [
            { key: 'name', label: 'Name', render: (u) => `<span class="text-ivory">${esc(u.name)}</span>` },
            { key: 'email', label: 'Email', render: (u) => `<span class="text-sand">${esc(u.email)}</span>` },
            { key: 'role', label: 'Role', render: (u) => badge(ROLES[u.role]?.label || u.role, 'gold') },
          ],
          rows: me ? [me] : [], empty: 'Not signed in.',
        })}`, 'p-5')}

      ${card(`${sectionTitle('Roles', 'Permissions are additive — add a role without touching any page')}
        ${table({
          columns: [
            { key: 'label', label: 'Role', render: (r) => `<span class="text-ivory">${esc(r.label)}</span>` },
            { key: 'count', label: 'Permissions', align: 'right', render: (r) => `<span class="tabular-nums text-sand">${r.permissions.length}</span>` },
            { key: 'permissions', label: 'Grants', nowrap: false, render: (r) => `<div class="flex flex-wrap gap-1">${r.permissions.map((p) => `<span class="rounded-full border border-line/15 px-2 py-0.5 text-[10px] text-sand">${esc(p)}</span>`).join('')}</div>` },
          ],
          rows: Object.entries(ROLES).map(([key, r]) => ({ key, ...r })),
        })}
        <p class="mt-4 text-[12px] text-sand">Accounts are configured in <code class="text-gold-light">window.__ENV__</code> in admin.html
        (<code class="text-gold-light">ADMIN_EMAIL</code>, <code class="text-gold-light">ADMIN_PASSCODE</code>). Adding multi-user management needs the backend described above.</p>`, 'p-5')}
    </div>`,
  };
}
