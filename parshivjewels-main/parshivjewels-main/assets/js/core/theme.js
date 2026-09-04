/* ══════════════════════════════════════════════════════════════
   THEME
   Dark is the house default; light is a warm ivory reading of the
   same palette. The choice is stored, and until the visitor makes
   one we follow the operating system.

   The palette itself lives in CSS variables (see index.html), so
   this module only ever sets one attribute.
   ══════════════════════════════════════════════════════════════ */
import { read, write } from './storage.js';
import { createEmitter } from './emitter.js';

const KEY = 'pj.theme.v1';
const emitter = createEmitter();

/** Bar colour so the mobile browser chrome matches the page. */
const BAR = { dark: '#0a0806', light: '#faf7f1' };

const media = window.matchMedia('(prefers-color-scheme: light)');

/** 'dark' | 'light' | 'system' */
export const getPreference = () => read(KEY, 'system');

/** The theme actually in force right now. */
export function getTheme() {
  const pref = getPreference();
  if (pref === 'dark' || pref === 'light') return pref;
  return media.matches ? 'light' : 'dark';
}

function paint(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', BAR[theme]);
}

/** @param {'dark'|'light'|'system'} preference */
export function setPreference(preference) {
  if (preference === 'system') write(KEY, 'system');
  else write(KEY, preference);
  const theme = getTheme();
  paint(theme);
  emitter.emit('change', { theme, preference: getPreference() });
  return theme;
}

export const toggle = () => setPreference(getTheme() === 'dark' ? 'light' : 'dark');

export const onChange = (handler) => emitter.on('change', handler);

export function initTheme() {
  paint(getTheme());
  // Follow the system only while the visitor hasn't expressed a preference.
  media.addEventListener('change', () => {
    if (getPreference() === 'system') {
      const theme = getTheme();
      paint(theme);
      emitter.emit('change', { theme, preference: 'system' });
    }
  });
}
