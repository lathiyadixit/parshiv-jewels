/* ══════════════════════════════════════════════════════════════
   CHARTS
   Hand-rolled inline SVG — no charting library. Keeps the bundle
   small, inherits the brand palette through currentColor and CSS
   variables, and themes automatically with the rest of the panel.
   ══════════════════════════════════════════════════════════════ */
import { esc } from '../../core/dom.js';

const GOLD = 'rgb(var(--c-gold))';
const GOLD_LIGHT = 'rgb(var(--c-gold-light))';
const LINE = 'rgb(var(--c-line) / 0.12)';

const shortDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${d.getDate()}/${d.getMonth() + 1}`;
};

const niceMax = (max) => {
  if (max <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / mag) * mag;
};

export function emptyChart(message = 'No activity in this period yet.') {
  return `<div class="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-line/15 text-[13px] text-sand/70">${esc(message)}</div>`;
}

/**
 * Area + line chart over a daily series.
 * @param {{label:string,value:number}[]} series
 */
export function lineChart(series, { height = 220, format = (v) => v, id = 'lc' } = {}) {
  if (!series.length || series.every((p) => !p.value)) return emptyChart();

  const W = 640, H = height, padL = 44, padR = 12, padT = 16, padB = 26;
  const max = niceMax(Math.max(...series.map((p) => p.value)));
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const stepX = series.length > 1 ? innerW / (series.length - 1) : 0;
  const x = (i) => padL + i * stepX;
  const y = (v) => padT + innerH - (v / max) * innerH;

  const points = series.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
  const area = `${padL},${padT + innerH} ${points} ${padL + innerW},${padT + innerH}`;

  const gridlines = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const gy = padT + innerH - f * innerH;
    return `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="${LINE}" stroke-width="1"/>
            <text x="${padL - 8}" y="${gy + 3.5}" text-anchor="end" font-size="9" fill="currentColor" opacity=".55">${esc(String(format(Math.round(max * f))))}</text>`;
  }).join('');

  // Label roughly six ticks regardless of range length.
  const every = Math.max(1, Math.ceil(series.length / 6));
  const labels = series.map((p, i) =>
    i % every === 0 || i === series.length - 1
      ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="9" fill="currentColor" opacity=".55">${esc(shortDate(p.label))}</text>`
      : ''
  ).join('');

  const dots = series.map((p, i) =>
    `<circle cx="${x(i)}" cy="${y(p.value)}" r="8" fill="transparent"><title>${esc(shortDate(p.label))}: ${esc(String(format(p.value)))}</title></circle>`
  ).join('');

  return `<svg viewBox="0 0 ${W} ${H}" class="w-full text-sand" style="height:${H}px" role="img" aria-label="Trend chart">
    <defs><linearGradient id="${id}-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity=".28"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </linearGradient></defs>
    ${gridlines}
    <polygon points="${area}" fill="url(#${id}-fill)"/>
    <polyline points="${points}" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${labels}${dots}
  </svg>`;
}

/** Horizontal bars — best for ranked lists (top products, categories). */
export function barChart(rows, { format = (v) => v, max: forcedMax = null } = {}) {
  if (!rows.length || rows.every((r) => !r.value)) return emptyChart('No data for this period.');
  const max = forcedMax || Math.max(...rows.map((r) => r.value)) || 1;
  return `<div class="space-y-2.5">
    ${rows.map((r) => `
      <div class="flex items-center gap-3">
        <span class="w-[38%] shrink-0 truncate text-[12px] text-ivory/90" title="${esc(r.label)}">${esc(r.label)}</span>
        <span class="h-2 flex-1 overflow-hidden rounded-full bg-line/10">
          <span class="block h-full rounded-full" style="width:${Math.max(2, (r.value / max) * 100)}%;background:linear-gradient(90deg,${GOLD} 0%,${GOLD_LIGHT} 100%)"></span>
        </span>
        <span class="w-16 shrink-0 text-right text-[12px] tabular-nums text-sand">${esc(String(format(r.value)))}</span>
      </div>`).join('')}
  </div>`;
}

/** Donut for share-of-total breakdowns (device, source). */
export function donutChart(rows, { size = 168 } = {}) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (!total) return emptyChart('No data yet.');

  const shades = ['rgb(var(--c-gold))', 'rgb(var(--c-gold-light))', 'rgb(var(--c-gold-deep))', 'rgb(var(--c-sand))', 'rgb(var(--c-line) / 0.35)'];
  const r = size / 2 - 14, cx = size / 2, cy = size / 2, circumference = 2 * Math.PI * r;
  let offset = 0;

  const arcs = rows.slice(0, 5).map((row, i) => {
    const fraction = row.value / total;
    const dash = `${fraction * circumference} ${circumference}`;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${shades[i % shades.length]}"
      stroke-width="14" stroke-dasharray="${dash}" stroke-dashoffset="${-offset}"
      transform="rotate(-90 ${cx} ${cy})"><title>${esc(row.label)}: ${row.value}</title></circle>`;
    offset += fraction * circumference;
    return seg;
  }).join('');

  const legend = rows.slice(0, 5).map((row, i) => `
    <li class="flex items-center gap-2 text-[12px]">
      <span class="h-2.5 w-2.5 shrink-0 rounded-full" style="background:${shades[i % shades.length]}"></span>
      <span class="flex-1 truncate capitalize text-ivory/90">${esc(row.label)}</span>
      <span class="tabular-nums text-sand">${Math.round((row.value / total) * 100)}%</span>
    </li>`).join('');

  return `<div class="flex flex-wrap items-center gap-6">
    <svg viewBox="0 0 ${size} ${size}" style="width:${size}px;height:${size}px" role="img" aria-label="Breakdown">
      ${arcs}
      <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="20" font-weight="600" fill="rgb(var(--c-ivory))">${total}</text>
      <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="9" fill="rgb(var(--c-sand))" letter-spacing="1.5">TOTAL</text>
    </svg>
    <ul class="min-w-[150px] flex-1 space-y-2">${legend}</ul>
  </div>`;
}

/** Conversion funnel — each step as a share of the first. */
export function funnelChart(steps) {
  const top = steps[0]?.value || 0;
  if (!top) return emptyChart('No visitor activity yet.');
  return `<div class="space-y-3">
    ${steps.map((step, i) => {
      const pct = top ? (step.value / top) * 100 : 0;
      const prev = i > 0 ? steps[i - 1].value : null;
      const drop = prev ? Math.round((1 - step.value / (prev || 1)) * 100) : null;
      return `<div>
        <div class="flex items-baseline justify-between text-[12px]">
          <span class="text-ivory/90">${esc(step.label)}</span>
          <span class="tabular-nums text-sand">${step.value}${drop !== null && drop > 0 ? ` <span class="text-danger/80">−${drop}%</span>` : ''}</span>
        </div>
        <div class="mt-1.5 h-2.5 overflow-hidden rounded-full bg-line/10">
          <div class="h-full rounded-full" style="width:${Math.max(1.5, pct)}%;background:linear-gradient(90deg,${GOLD} 0%,${GOLD_LIGHT} 100%)"></div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

/** Tiny inline trend line for KPI cards. */
export function sparkline(series, { width = 96, height = 28 } = {}) {
  if (!series.length) return '';
  const max = Math.max(...series.map((p) => p.value), 1);
  const step = series.length > 1 ? width / (series.length - 1) : 0;
  const points = series.map((p, i) => `${i * step},${height - (p.value / max) * height}`).join(' ');
  return `<svg viewBox="0 0 ${width} ${height}" style="width:${width}px;height:${height}px" aria-hidden="true">
    <polyline points="${points}" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>`;
}
