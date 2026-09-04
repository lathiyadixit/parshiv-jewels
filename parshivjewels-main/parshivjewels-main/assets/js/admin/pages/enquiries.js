/* WhatsApp enquiries — the storefront's checkout equivalent.
   Rows are imported from WhatsApp-click events, then worked by hand. */
import { $, esc } from '../../core/dom.js';
import { setQuery, refresh } from '../core/adminRouter.js';
import { toast } from '../../core/toast.js';
import * as commerce from '../repositories/commerceRepo.js';
import { confirmAction, openModal, closeModal } from '../components/modal.js';
import { pageHeader, table, statusBadge, btn, searchInput, select, kpi, money, emptyState, field, textarea, badge, cardList } from '../components/ui.js';

const STATUS_OPTIONS = commerce.ENQUIRY_STATUSES.map((s) => ({ value: s, label: s.replace(/-/g, ' ') }));

export default async function enquiriesPage({ query }) {
  // Catch anything logged since boot (e.g. the storefront open in another tab).
  const imported = await commerce.syncEnquiriesFromEvents();
  const all = await commerce.listEnquiries();
  const dismissedCount = await commerce.countDismissedEnquiries();
  const rows = commerce.queryEnquiries(all, {
    search: query.q || '', status: query.status || '',
    from: query.from ? new Date(query.from) : null,
    to: query.to ? new Date(`${query.to}T23:59:59`) : null,
  });

  const value = rows.reduce((s, e) => s + (e.value || 0), 0);
  const converted = all.filter((e) => e.status === 'converted');

  /* A bespoke commission arrives as a brief rather than a basket, so it
     gets its own panel in place of the cart lines. */
  const designBrief = (d) => {
    const row = (label, value) => (value
      ? `<div><dt class="text-[10px] uppercase tracking-[0.18em] text-sand/70">${esc(label)}</dt>
           <dd class="mt-0.5 text-[13px] text-ivory">${esc(value)}</dd></div>`
      : '');
    return `<div class="rounded-xl border border-gold/25 bg-gold/5 p-4">
      <p class="text-[10px] uppercase tracking-[0.18em] text-gold">Custom design brief</p>
      <dl class="mt-3 grid gap-3 sm:grid-cols-3">
        ${row('Piece', d.type)}${row('Occasion', d.occasion)}${row('Stones', d.diamond)}
        ${row('Metal', d.metal)}${row('Finish', d.finish)}
        ${row(d.sizeLabel || 'Size', d.size)}${row('Email', d.email)}
      </dl>
      ${d.brief ? `<div class="mt-4 border-t border-gold/20 pt-3">
        <p class="text-[10px] uppercase tracking-[0.18em] text-sand/70">In their words</p>
        <p class="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-ivory">${esc(d.brief)}</p>
      </div>` : ''}
      ${d.referenceUrl ? `<a href="${esc(d.referenceUrl)}" target="_blank" rel="noopener"
        class="mt-3 inline-block text-[12px] text-gold-light underline underline-offset-2 transition hover:text-gold">Reference link ↗</a>` : ''}
      ${d.hasPhotos ? `<p class="mt-3 text-[12px] text-sand">📎 The customer said they would send reference photos in the WhatsApp chat.</p>` : ''}
    </div>`;
  };

  const detail = (e) => `
    <div class="rounded-2xl border border-line/10 bg-card p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div><p class="text-[13px] text-ivory">${esc(e.customerName || 'Unnamed customer')}</p>
          <p class="text-[11px] text-sand/70">${new Date(e.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p></div>
        ${statusBadge(e.status)}
      </div>
      <p class="mt-3 text-[13px] text-gold">${e.customDesign
        ? `Custom design · ${esc(e.customDesign.type || 'bespoke piece')}`
        : `${money(e.value)} · ${e.itemCount} item${e.itemCount === 1 ? '' : 's'}`}</p>
      <button type="button" data-open="${e.id}" class="btn-line btn-compact mt-3 w-full">Open</button>
    </div>`;

  return {
    breadcrumb: [{ label: 'Dashboard', path: '/' }, { label: 'WhatsApp Enquiries', path: '/enquiries' }],
    html: `<div class="space-y-5">
      ${pageHeader({ title: 'WhatsApp Enquiries', subtitle: `${rows.length} of ${all.length} enquiries${imported ? ` · ${imported} newly imported` : ''}` })}

      ${dismissedCount ? `
      <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-line/10 bg-card px-4 py-3">
        <span class="text-[12px] text-sand">
          <span class="text-ivory">${dismissedCount}</span> deleted ${dismissedCount === 1 ? 'enquiry is' : 'enquiries are'} hidden.
          The WhatsApp clicks behind them still count in analytics.
        </span>
        ${btn('Restore deleted', { size: 'sm', attrs: 'data-restore', className: 'ml-auto' })}
      </div>` : ''}

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${kpi({ label: 'Enquiries shown', value: rows.length, tone: 'ivory' })}
        ${kpi({ label: 'New', value: all.filter((e) => e.status === 'new').length, tone: 'ivory' })}
        ${kpi({ label: 'Estimated value', value: money(value), sub: 'Cart value at hand-off' })}
        ${kpi({ label: 'Converted', value: converted.length, sub: `${money(converted.reduce((s, e) => s + (e.value || 0), 0))} enquiry value` })}
      </div>

      <div class="rounded-2xl border border-line/10 bg-card p-4">
        <div class="flex flex-wrap items-center gap-2.5">
          ${searchInput('enqSearch', 'Search reference, customer, product…', query.q || '')}
          ${select({ id: 'enqStatus', value: query.status || '', className: 'min-w-[150px]', options: [{ value: '', label: 'Any status' }, ...STATUS_OPTIONS] })}
          <span class="flex items-center gap-1.5 rounded-full border border-line/15 px-3 py-1">
            <input type="date" id="enqFrom" value="${esc(query.from || '')}" class="admin-date" aria-label="From">
            <span class="text-sand/50">→</span>
            <input type="date" id="enqTo" value="${esc(query.to || '')}" class="admin-date" aria-label="To">
          </span>
          ${btn('Clear', { variant: 'ghost', size: 'sm', attrs: 'data-clear' })}
        </div>
      </div>

      ${all.length === 0 ? emptyState({
        title: 'No enquiries yet',
        message: 'Every time a customer taps “Proceed to WhatsApp”, the cart contents and value are recorded here so you can follow up.',
      }) : `
        <div class="hidden lg:block">${table({
          columns: [
            { key: 'at', label: 'When', render: (e) => `<span class="text-sand">${new Date(e.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>` },
            { key: 'reference', label: 'Reference', render: (e) => `<span class="text-ivory">${esc(e.reference || '—')}</span>` },
            { key: 'items', label: 'Products', nowrap: false, render: (e) => e.customDesign
                ? `<span class="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] text-gold-light">✦ Custom design · ${esc(e.customDesign.type || 'bespoke')}</span>`
                : (e.items || []).length
                ? `<div class="flex items-center gap-2">
                    ${(e.items || []).slice(0, 3).map((i) => i.image
                      ? `<img src="${esc(i.image)}" alt="" loading="lazy" title="${esc(i.name)}"
                          class="h-8 w-8 shrink-0 rounded-lg border border-line/10 bg-night object-cover"
                          onerror="this.style.visibility='hidden'">` : '').join('')}
                    <span class="min-w-0 truncate text-sand">${esc((e.items || []).map((i) => `${i.name} ×${i.qty}`).join(', '))}</span>
                  </div>`
                : '<span class="text-sand/50">—</span>' },
            { key: 'value', label: 'Value', align: 'right', render: (e) => e.customDesign
                ? `<span class="text-sand">${esc(e.customDesign.budget || '—')}</span>`
                : `<span class="text-gold">${money(e.value)}</span>` },
            { key: 'device', label: 'Device', render: (e) => `<span class="capitalize text-sand">${esc(e.device || '—')}</span>` },
            { key: 'customerName', label: 'Customer', render: (e) => e.customerName || e.phone
                ? `<div><span class="block text-ivory">${esc(e.customerName || '—')}</span>
                    <span class="block text-[11px] text-sand/70">${esc(e.phone || '')}</span></div>`
                : '<span class="text-sand/50">—</span>' },
            { key: 'status', label: 'Status', render: (e) => statusBadge(e.status) },
            { key: 'actions', label: '', align: 'right', render: (e) => `<button type="button" data-open="${e.id}" class="admin-icon-btn" aria-label="Open enquiry">›</button>` },
          ],
          rows, empty: 'No enquiries match those filters.',
        })}</div>
        <div class="lg:hidden">${cardList(rows, detail, 'No enquiries match those filters.')}</div>`}
    </div>`,

    onMount: (scope) => {
      const root = $('#adminMain');
      let timer;
      scope.on($('#enqSearch'), 'input', (e) => {
        clearTimeout(timer); timer = setTimeout(() => setQuery({ q: e.target.value }), 350);
      });
      scope.on($('#enqStatus'), 'change', (e) => setQuery({ status: e.target.value }));
      scope.on($('#enqFrom'), 'change', (e) => setQuery({ from: e.target.value }));
      scope.on($('#enqTo'), 'change', (e) => setQuery({ to: e.target.value }));
      scope.delegate(root, 'click', '[data-clear]', () => setQuery({ q: '', status: '', from: '', to: '' }));

      scope.delegate(root, 'click', '[data-restore]', async () => {
        const restored = await commerce.restoreDismissedEnquiries();
        toast(`${restored} enquir${restored === 1 ? 'y' : 'ies'} restored`, { tone: 'success' });
        refresh();
      });

      scope.delegate(root, 'click', '[data-open]', async (e, el) => {
        const enquiry = await commerce.getEnquiry(el.dataset.open);
        const items = (enquiry.items || []);
        const modal = openModal({
          title: `Enquiry ${enquiry.reference || ''}`.trim(), size: 'max-w-2xl',
          body: `
            <div class="space-y-5">
              <div class="grid gap-3 sm:grid-cols-3">
                <div class="rounded-xl border border-line/10 bg-night/40 p-3"><p class="text-[10px] uppercase tracking-[0.18em] text-sand/70">Received</p>
                  <p class="mt-1 text-[13px] text-ivory">${new Date(enquiry.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p></div>
                <div class="rounded-xl border border-line/10 bg-night/40 p-3"><p class="text-[10px] uppercase tracking-[0.18em] text-sand/70">${enquiry.customDesign ? 'Budget' : 'Value'}</p>
                  <p class="mt-1 text-[13px] text-gold">${enquiry.customDesign ? esc(enquiry.customDesign.budget || '—') : money(enquiry.value)}</p></div>
                <div class="rounded-xl border border-line/10 bg-night/40 p-3"><p class="text-[10px] uppercase tracking-[0.18em] text-sand/70">Device / source</p>
                  <p class="mt-1 text-[13px] capitalize text-ivory">${esc(enquiry.device || '—')} · ${esc(enquiry.source || '—')}</p></div>
              </div>

              ${enquiry.customDesign ? designBrief(enquiry.customDesign) : `
              <div>
                <p class="mb-2 text-[11px] uppercase tracking-[0.16em] text-sand">Cart contents</p>
                ${items.length ? `<div class="space-y-2">
                  ${items.map((i) => `
                    <div class="flex items-center gap-3 rounded-xl border border-line/10 bg-night/40 p-2.5">
                      ${i.image
                        ? `<img src="${esc(i.image)}" alt="${esc(i.name)}" loading="lazy"
                             class="h-14 w-14 shrink-0 rounded-lg border border-line/10 bg-night object-cover"
                             onerror="this.style.visibility='hidden'">`
                        : '<span class="h-14 w-14 shrink-0 rounded-lg border border-line/10 bg-night"></span>'}
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-[13px] text-ivory">${esc(i.name)}${i.variant ? `<span class="text-sand/70"> · ${esc(i.variant)}</span>` : ''}</p>
                        <p class="text-[11px] text-sand/70">${esc(i.sku || '')}</p>
                        ${i.url ? `<a href="${esc(i.url)}" target="_blank" rel="noopener"
                            class="mt-0.5 inline-block text-[11px] text-gold-light underline underline-offset-2 transition hover:text-gold">View on the storefront ↗</a>` : ''}
                      </div>
                      <div class="shrink-0 text-right">
                        <p class="text-[11px] text-sand">×${i.qty}</p>
                        <p class="text-[13px] text-gold">${money((i.price || 0) * (i.qty || 1))}</p>
                      </div>
                    </div>`).join('')}
                </div>` : '<p class="text-[13px] text-sand">No line detail was captured for this enquiry.</p>'}
              </div>`}

              ${enquiry.customerNote ? `
              <div class="rounded-xl border border-gold/25 bg-gold/5 p-4">
                <p class="text-[10px] uppercase tracking-[0.18em] text-gold">Note from the customer</p>
                <p class="mt-1.5 text-[13px] leading-relaxed text-ivory">${esc(enquiry.customerNote)}</p>
              </div>` : ''}

              <div class="grid gap-4 sm:grid-cols-2">
                ${field({ id: 'eqName', label: 'Customer name', value: enquiry.customerName || '' })}
                ${field({ id: 'eqPhone', label: 'Phone', value: enquiry.phone || '', hint: 'Used to group enquiries into a customer record.' })}
              </div>
              ${select({ id: 'eqStatus', label: 'Status', value: enquiry.status, options: STATUS_OPTIONS })}
              ${textarea({ id: 'eqNotes', label: 'Your notes', value: enquiry.notes || '', rows: 3, hint: 'What was discussed, what was promised.' })}
            </div>`,
          footer: `<div class="flex flex-wrap justify-end gap-3">
            ${btn('Delete', { variant: 'danger', size: 'sm', attrs: 'data-delete' })}
            <span class="flex-1"></span>
            ${enquiry.status !== 'converted' ? btn('Convert to order', { size: 'sm', attrs: 'data-convert' }) : ''}
            ${btn('Save', { variant: 'gold', size: 'sm', attrs: 'data-save' })}
          </div>`,
        });

        const collect = () => ({
          customerName: modal.querySelector('#eqName').value.trim(),
          phone: modal.querySelector('#eqPhone').value.trim(),
          status: modal.querySelector('#eqStatus').value,
          notes: modal.querySelector('#eqNotes').value.trim(),
        });

        modal.querySelector('[data-save]').addEventListener('click', async () => {
          await commerce.updateEnquiry(enquiry.id, collect());
          closeModal(); toast('Enquiry updated', { tone: 'success' }); refresh();
        });
        modal.querySelector('[data-delete]').addEventListener('click', async () => {
          const ok = await confirmAction({ title: 'Delete enquiry?', message: 'This removes the record permanently.' });
          if (!ok) return;
          await commerce.deleteEnquiry(enquiry.id);
          closeModal(); toast('Enquiry deleted', { tone: 'success' }); refresh();
        });
        modal.querySelector('[data-convert]')?.addEventListener('click', async () => {
          const data = collect();
          if (!data.phone) { toast('Add a phone number before converting', { tone: 'error' }); return; }
          await commerce.updateEnquiry(enquiry.id, data);
          const order = await commerce.convertEnquiry(enquiry.id, data);
          closeModal();
          toast(`Order ${order.orderNumber} created`, { tone: 'success' });
          window.location.hash = `/orders`;
        });
      });
    },
  };
}
