/* Admin UI kit. Built from the storefront's own tokens (gold, ivory,
   card, line) so the panel reads as the same brand, laid out for work
   rather than for browsing. */
import { esc } from '../../core/dom.js';
import { inr } from '../../core/format.js';

/* ─────────────── Page furniture ─────────────── */

export function pageHeader({ title, subtitle, actions = [] }) {
  return `<div class="flex flex-wrap items-end justify-between gap-4 border-b border-line/10 pb-6">
    <div>
      <h1 class="font-display text-3xl font-semibold text-ivory sm:text-4xl">${esc(title)}</h1>
      ${subtitle ? `<p class="mt-2 text-[14px] text-sand">${esc(subtitle)}</p>` : ''}
    </div>
    ${actions.length ? `<div class="flex flex-wrap items-center gap-2.5">${actions.join('')}</div>` : ''}
  </div>`;
}

export const card = (content, className = '') =>
  `<div class="rounded-2xl border border-line/10 bg-card ${className}">${content}</div>`;

export const sectionTitle = (text, hint = '') =>
  `<div class="mb-4"><h2 class="font-display text-xl text-ivory">${esc(text)}</h2>
   ${hint ? `<p class="mt-1 text-[13px] text-sand/80">${esc(hint)}</p>` : ''}</div>`;

/* ─────────────── Buttons ─────────────── */

export function btn(label, { variant = 'line', size = 'md', icon = '', attrs = '', className = '' } = {}) {
  const sizes = { sm: 'px-3.5 py-2 text-[11px]', md: 'px-5 py-2.5 text-[12px]', lg: 'px-7 py-3 text-[13px]' };
  const variants = {
    gold: 'btn-gold',
    line: 'btn-line',
    ghost: 'inline-flex items-center justify-center gap-2 rounded-full border border-transparent font-body uppercase tracking-[0.12em] text-sand transition hover:bg-line/10 hover:text-ivory',
    danger: 'inline-flex items-center justify-center gap-2 rounded-full border border-danger/40 font-body uppercase tracking-[0.12em] text-danger transition hover:bg-danger/10',
  };
  return `<button type="button" class="${variants[variant]} ${sizes[size]} ${className}" ${attrs}>${icon}${esc(label)}</button>`;
}

/* ─────────────── Status ─────────────── */

const TONES = {
  green: 'border-success/30 bg-success/10 text-success',
  gold: 'border-gold/40 bg-gold/10 text-gold-light',
  red: 'border-danger/30 bg-danger/10 text-danger',
  grey: 'border-line/20 bg-line/5 text-sand',
  blue: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
};

export const badge = (label, tone = 'grey') =>
  `<span class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${TONES[tone] || TONES.grey}">${esc(label)}</span>`;

export const STATUS_TONE = {
  active: 'green', draft: 'grey', archived: 'red', inactive: 'grey',
  'in-stock': 'green', 'low-stock': 'gold', 'out-of-stock': 'red',
  new: 'blue', contacted: 'gold', 'in-discussion': 'gold', converted: 'green', closed: 'grey',
  pending: 'gold', confirmed: 'blue', processing: 'blue', shipped: 'blue', delivered: 'green', cancelled: 'red',
  approved: 'green', hidden: 'grey', expired: 'red', exhausted: 'red',
};

export const statusBadge = (status) =>
  badge(String(status || '').replace(/-/g, ' '), STATUS_TONE[status] || 'grey');

/* ─────────────── KPI ─────────────── */

export function kpi({ label, value, sub = '', trend: t = null, tone = 'gold', href = '' }) {
  const arrow = t
    ? `<span class="ml-2 inline-flex items-center gap-1 text-[11px] ${
        t.direction === 'up' ? 'text-success' : t.direction === 'down' ? 'text-danger' : 'text-sand/70'
      }">${t.direction === 'up' ? '▲' : t.direction === 'down' ? '▼' : '—'} ${t.percent}%</span>`
    : '';
  const inner = `<div class="rounded-2xl border border-line/10 bg-card p-5 transition duration-300 hover:border-gold/30">
    <p class="text-[10px] uppercase tracking-[0.22em] text-sand/80">${esc(label)}</p>
    <p class="mt-2.5 flex items-baseline font-display text-[26px] leading-none ${tone === 'gold' ? 'text-gold' : 'text-ivory'}">${esc(String(value))}${arrow}</p>
    ${sub ? `<p class="mt-2 text-[11px] text-sand/70">${esc(sub)}</p>` : ''}
  </div>`;
  return href ? `<a href="${href}" class="block">${inner}</a>` : inner;
}

/* ─────────────── Tables ─────────────── */

/**
 * @param {object} cfg columns[{key,label,align,width,render}], rows, empty,
 *   selectable, rowId, rowHref
 */
export function table({ columns, rows, empty = 'Nothing here yet.', selectable = false, rowId = (r) => r.id }) {
  if (!rows.length) return emptyState({ title: empty });

  const head = `<tr class="border-b border-line/10">
    ${selectable ? '<th class="w-10 px-4 py-3"><input type="checkbox" data-select-all class="admin-check"></th>' : ''}
    ${columns.map((c) => `<th scope="col" class="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-sand/80 ${c.align === 'right' ? 'text-right' : 'text-left'}" ${c.width ? `style="width:${c.width}"` : ''}>${esc(c.label)}</th>`).join('')}
  </tr>`;

  const body = rows.map((row) => `<tr class="group border-b border-line/5 transition last:border-0 hover:bg-gold/5" data-row="${esc(rowId(row))}">
      ${selectable ? `<td class="px-4 py-3"><input type="checkbox" data-select="${esc(rowId(row))}" class="admin-check"></td>` : ''}
      ${columns.map((c) => `<td class="px-4 py-3 align-middle text-[13px] ${c.align === 'right' ? 'text-right' : ''} ${c.nowrap === false ? '' : 'whitespace-nowrap'}">${c.render ? c.render(row) : esc(row[c.key] ?? '')}</td>`).join('')}
    </tr>`).join('');

  return `<div class="overflow-x-auto rounded-2xl border border-line/10 bg-card">
    <table class="w-full min-w-[720px] text-left"><thead>${head}</thead><tbody>${body}</tbody></table>
  </div>`;
}

/** Card layout for the same rows on a phone, where a table can't work. */
export function cardList(rows, renderCard, empty = 'Nothing here yet.') {
  if (!rows.length) return emptyState({ title: empty });
  return `<div class="grid gap-3">${rows.map(renderCard).join('')}</div>`;
}

/* ─────────────── States ─────────────── */

export function emptyState({ title, message = '', action = '' , icon = '◆' }) {
  return `<div class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-line/10 bg-card px-6 py-16 text-center">
    <span class="text-3xl text-gold/40" aria-hidden="true">${icon}</span>
    <p class="font-display text-xl text-ivory">${esc(title)}</p>
    ${message ? `<p class="max-w-sm text-[13px] text-sand">${esc(message)}</p>` : ''}
    ${action ? `<div class="mt-2">${action}</div>` : ''}
  </div>`;
}

export const errorState = (message) =>
  emptyState({ icon: '⚠', title: 'Something went wrong', message });

export function skeletonRows(count = 6) {
  return `<div class="space-y-2.5 rounded-2xl border border-line/10 bg-card p-4" role="status" aria-label="Loading">
    ${Array.from({ length: count }, () => '<div class="skeleton h-11 w-full rounded-lg"></div>').join('')}
  </div>`;
}

export function skeletonKpis(count = 4) {
  return `<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-label="Loading">
    ${Array.from({ length: count }, () => '<div class="skeleton h-[104px] rounded-2xl"></div>').join('')}
  </div>`;
}

/* ─────────────── Form fields ─────────────── */

export function field({ id, label, value = '', type = 'text', placeholder = '', hint = '', required = false, attrs = '', className = '' }) {
  return `<div class="${className}">
    <label for="${id}" class="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-sand">${esc(label)}${required ? ' <span class="text-gold">*</span>' : ''}</label>
    <input id="${id}" name="${id}" type="${type}" value="${esc(String(value ?? ''))}" placeholder="${esc(placeholder)}"
      class="admin-input" ${required ? 'required' : ''} ${attrs}>
    ${hint ? `<p class="mt-1.5 text-[11px] text-sand/70">${esc(hint)}</p>` : ''}
    <p data-error-for="${id}" class="mt-1.5 hidden text-[11px] text-danger" role="alert"></p>
  </div>`;
}

export function textarea({ id, label, value = '', rows = 4, placeholder = '', hint = '', required = false, className = '' }) {
  return `<div class="${className}">
    <label for="${id}" class="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-sand">${esc(label)}${required ? ' <span class="text-gold">*</span>' : ''}</label>
    <textarea id="${id}" name="${id}" rows="${rows}" placeholder="${esc(placeholder)}" class="admin-input !rounded-2xl" ${required ? 'required' : ''}>${esc(String(value ?? ''))}</textarea>
    ${hint ? `<p class="mt-1.5 text-[11px] text-sand/70">${esc(hint)}</p>` : ''}
    <p data-error-for="${id}" class="mt-1.5 hidden text-[11px] text-danger" role="alert"></p>
  </div>`;
}

export function select({ id, label, value = '', options = [], hint = '', className = '', attrs = '' }) {
  return `<div class="${className}">
    ${label ? `<label for="${id}" class="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-sand">${esc(label)}</label>` : ''}
    <select id="${id}" name="${id}" class="admin-input admin-select" ${attrs}>
      ${options.map((o) => {
        const v = o.value ?? o; const l = o.label ?? o;
        return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`;
      }).join('')}
    </select>
    ${hint ? `<p class="mt-1.5 text-[11px] text-sand/70">${esc(hint)}</p>` : ''}
  </div>`;
}

export function toggle({ id, label, checked = false, hint = '' }) {
  return `<label for="${id}" class="flex cursor-pointer items-start gap-3 rounded-xl border border-line/10 bg-night/40 p-3.5 transition hover:border-gold/30">
    <input id="${id}" name="${id}" type="checkbox" ${checked ? 'checked' : ''} class="admin-check mt-0.5">
    <span><span class="block text-[13px] text-ivory">${esc(label)}</span>
    ${hint ? `<span class="mt-0.5 block text-[11px] text-sand/70">${esc(hint)}</span>` : ''}</span>
  </label>`;
}

export const money = (n) => inr(Math.round(Number(n) || 0));

export function searchInput(id, placeholder = 'Search…', value = '') {
  return `<div class="relative flex-1 min-w-[180px]">
    <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gold" aria-hidden="true">
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    </span>
    <input id="${id}" type="search" value="${esc(value)}" placeholder="${esc(placeholder)}" class="admin-input !pl-10">
  </div>`;
}
