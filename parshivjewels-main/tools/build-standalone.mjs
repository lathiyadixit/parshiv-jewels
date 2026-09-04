/* ══════════════════════════════════════════════════════════════
   STANDALONE BUILD
   Produces index.standalone.html — the whole site as one file that
   runs from a plain double-click, with no server.

   Browsers refuse to load ES modules over file:// (CORS, origin
   "null"), so this bundles every module into a single classic
   <script> behind a tiny CommonJS-style registry. Each module keeps
   its own scope, so identically-named locals across modules
   (mount, render, card…) cannot collide.

   Run:  node tools/build-standalone.mjs
   ══════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const JS_ROOT = join(ROOT, 'assets/js');
const ENTRY = 'app.js';

/* ─────────────── Collect modules ─────────────── */

function walk(dir, found = []) {
  for (const name of readdirSync(dir)) {
    // The admin panel is a separate entry point with its own HTML; bundling it
    // into the storefront would double the file for no benefit.
    if (name === 'admin') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, found);
    else if (name.endsWith('.js')) found.push(full);
  }
  return found;
}

/** Module id = path relative to assets/js, POSIX-style. */
const idOf = (file) => relative(JS_ROOT, file).split('\\').join('/');

/* ─────────────── ESM → registry transform ─────────────── */

/** Resolve a relative specifier against the importing module's id. */
function resolveId(fromId, spec) {
  const abs = resolve(dirname(join(JS_ROOT, fromId)), spec);
  return idOf(abs);
}

/** `{ query as runQuery, esc }` → `{ query: runQuery, esc }` for destructuring. */
function namedBindings(list) {
  return list
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split(/\s+as\s+/);
      return parts.length === 2 ? `${parts[0].trim()}: ${parts[1].trim()}` : entry;
    })
    .join(', ');
}

function transform(source, id) {
  let out = source;

  // import defaultName, { a, b as c } from './x.js'
  out = out.replace(
    /^import\s+([A-Za-z_$][\w$]*)\s*,\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?/gm,
    (_, def, named, spec) =>
      `const __m = __req(${JSON.stringify(resolveId(id, spec))}); ` +
      `const ${def} = __m.default; const {${namedBindings(named)}} = __m;`
  );

  // import { a, b as c } from './x.js'
  out = out.replace(
    /^import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?/gm,
    (_, named, spec) => `const {${namedBindings(named)}} = __req(${JSON.stringify(resolveId(id, spec))});`
  );

  // import * as ns from './x.js'
  out = out.replace(
    /^import\s*\*\s*as\s+([A-Za-z_$][\w$]*)\s*from\s*['"]([^'"]+)['"];?/gm,
    (_, ns, spec) => `const ${ns} = __req(${JSON.stringify(resolveId(id, spec))});`
  );

  // import defaultName from './x.js'
  out = out.replace(
    /^import\s+([A-Za-z_$][\w$]*)\s*from\s*['"]([^'"]+)['"];?/gm,
    (_, def, spec) => `const ${def} = __req(${JSON.stringify(resolveId(id, spec))}).default;`
  );

  // side-effect import
  out = out.replace(/^import\s*['"]([^'"]+)['"];?/gm, (_, spec) =>
    `__req(${JSON.stringify(resolveId(id, spec))});`
  );

  // export default function name(...)  — strip the prefix only; the export is
  // assigned in the module tail so the parameter list stays intact and the
  // hoisted declaration is fully defined by the time we reference it.
  let defaultExport = null;
  out = out.replace(
    /^export\s+default\s+(async\s+)?function\s+([A-Za-z_$][\w$]*)/gm,
    (_, asyncKw = '', name) => {
      defaultExport = name;
      return `${asyncKw}function ${name}`;
    }
  );
  // export default class Name
  out = out.replace(/^export\s+default\s+class\s+([A-Za-z_$][\w$]*)/gm, (_, name) => {
    defaultExport = name;
    return `class ${name}`;
  });
  // export default <expression>  (anonymous function, object, literal…)
  out = out.replace(/^export\s+default\s+/gm, () => '__exports.default = ');

  // export function|const|let|class NAME
  const exported = new Set();
  out = out.replace(
    /^export\s+(async\s+)?(function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm,
    (_, asyncKw = '', kind, name) => {
      exported.add(name);
      return `${asyncKw}${kind} ${name}`;
    }
  );

  // export { a, b as c }  (with or without a `from`)
  out = out.replace(
    /^export\s*\{([^}]*)\}\s*(?:from\s*['"]([^'"]+)['"])?;?/gm,
    (_, list, spec) => {
      const src = spec ? `__req(${JSON.stringify(resolveId(id, spec))})` : null;
      return list
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
          const [local, alias = local] = entry.split(/\s+as\s+/).map((s) => s.trim());
          return `__exports.${alias} = ${src ? `${src}.${local}` : local};`;
        })
        .join(' ');
    }
  );

  // Re-export the names declared with `export` above. Assigned at the end of
  // the factory so hoisted functions and initialised consts are both ready.
  const tail = [...exported].map((name) => `__exports.${name} = ${name};`);
  if (defaultExport) tail.push(`__exports.default = ${defaultExport};`);
  return `${out}\n${tail.join('\n')}\n`;
}

/* ─────────────── Emit ─────────────── */

const files = walk(JS_ROOT);
const modules = files
  .map((file) => {
    const id = idOf(file);
    const body = transform(readFileSync(file, 'utf8'), id);
    return `__def(${JSON.stringify(id)}, function (__req, __exports, module) {\n${body}\n});`;
  })
  .join('\n\n');

const bundle = `/* Parshiv Jewels — standalone build. Generated by tools/build-standalone.mjs.
   Do not edit by hand; edit assets/js/ and re-run the build. */
(function () {
  'use strict';
  var __registry = {}, __cache = {};
  function __def(id, factory) { __registry[id] = factory; }
  function __req(id) {
    if (__cache[id]) return __cache[id].exports;
    var factory = __registry[id];
    if (!factory) throw new Error('Module not found: ' + id);
    var module = __cache[id] = { exports: {} };
    factory(__req, module.exports, module);
    return module.exports;
  }

${modules}

  __req(${JSON.stringify(ENTRY)});
})();`;

/* ─────────────── Inline local images ───────────────
   The point of this build is one file you can double-click or email, so any
   image under assets/img/ is embedded as a data URI rather than left as a
   sibling-folder reference that would silently 404. */
const unresolved = new Set();
let inlinedCount = 0;
function inlineLocalImages(code) {
  const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', avif: 'image/avif' };
  return code.replace(/\/assets\/img\/([\w.-]+)/g, (match, name) => {
    const file = join(ROOT, 'assets/img', name);
    try {
      const ext = name.split('.').pop().toLowerCase();
      const data = readFileSync(file).toString('base64');
      inlinedCount += 1;
      return `data:${MIME[ext] || 'application/octet-stream'};base64,${data}`;
    } catch {
      // Illustrative paths inside doc comments won't resolve; that's fine.
      unresolved.add(match);
      return match;
    }
  });
}

/* Inline it into a copy of index.html.
   Any literal `</script` in the JS — even inside a comment — would close the
   tag early and truncate the bundle, so it is escaped. `<\/script` is
   equivalent in a string literal and harmless in a comment. */
const inlineSafe = inlineLocalImages(bundle)
  .replace(/<\/(script)/gi, '<\\/$1')
  .replace(/<!--/g, '<\\!--');

let html = readFileSync(join(ROOT, 'index.html'), 'utf8');

// NOTE: a replacer *function*, not a string. In a string replacement `$$`
// means a literal `$`, which silently rewrites every `$$` in the bundle.
html = html.replace(
  /<script type="module" src="\/assets\/js\/app\.js"><\/script>/,
  () => `<script>\n${inlineSafe}\n</script>`
);
// The modulepreload hint points at files this build does not use. The boot
// watchdog is kept — a bundle that throws should still explain itself — and
// flagged so it doesn't tell a file:// user to go and find a web server.
html = html.replace(/^\s*<link rel="modulepreload"[^>]*>\n/m, '');
html = html.replace(
  '<script>\nwindow.__ENV__',
  () => '<script>\nwindow.__pjStandalone = true;\nwindow.__ENV__'
);
html = html.replace(
  '<title>',
  () => '<!-- STANDALONE BUILD — runs without a server. Deploy index.html instead. -->\n<title>'
);

// The header, footer and favicon reference images from the HTML itself, not
// from the bundle — inline those too, or the "single file" would still need
// a sibling assets/img folder.
html = inlineLocalImages(html);

writeFileSync(join(ROOT, 'index.standalone.html'), html);
const inlined = inlinedCount;
console.log(
  `index.standalone.html written — ${files.length} modules, ${inlined} inlined image${
    inlined === 1 ? '' : 's'
  }, ${(html.length / 1024).toFixed(0)} KB`
);
if (unresolved.size) {
  console.log(`  (${unresolved.size} path-like strings in comments left alone: ${[...unresolved].join(', ')})`);
}
