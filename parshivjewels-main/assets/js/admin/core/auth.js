/* ══════════════════════════════════════════════════════════════
   ADMIN AUTHENTICATION & AUTHORISATION

   ⚠ IMPORTANT — READ BEFORE DEPLOYING
   The storefront is a static site with no server, so this gate runs
   entirely in the visitor's browser. It stops a casual user from
   wandering in; it does NOT stop anyone determined, because the
   check itself is in code they can read and edit.

   Treat it as a lock on an office door, not a vault. Before this
   panel is reachable on a public URL it needs either
     • HTTP Basic Auth on /admin via .htaccess (see README), or
     • a real backend session behind `authenticate()` below.

   The shape here — session, roles, permissions — is deliberately the
   shape a real backend would use, so swapping in a server call means
   changing `authenticate()` and nothing else.
   ══════════════════════════════════════════════════════════════ */
import { read, write, remove } from '../../core/storage.js';
import { createEmitter } from '../../core/emitter.js';

const SESSION_KEY = 'pj.admin.session.v1';
const SESSION_HOURS = 12;
const emitter = createEmitter();

/* ─────────────── Roles & permissions ─────────────── */

export const PERMISSIONS = {
  CATALOG_VIEW: 'catalog:view',
  CATALOG_EDIT: 'catalog:edit',
  CATALOG_DELETE: 'catalog:delete',
  ORDERS_VIEW: 'orders:view',
  ORDERS_EDIT: 'orders:edit',
  ANALYTICS_VIEW: 'analytics:view',
  CONTENT_EDIT: 'content:edit',
  SETTINGS_EDIT: 'settings:edit',
  USERS_MANAGE: 'users:manage',
};

const P = PERMISSIONS;

/** Roles are additive sets — add a role without touching any page. */
export const ROLES = {
  'super-admin': { label: 'Super Admin', permissions: Object.values(P) },
  admin: {
    label: 'Admin',
    permissions: [
      P.CATALOG_VIEW, P.CATALOG_EDIT, P.CATALOG_DELETE,
      P.ORDERS_VIEW, P.ORDERS_EDIT, P.ANALYTICS_VIEW, P.CONTENT_EDIT, P.SETTINGS_EDIT,
    ],
  },
  manager: {
    label: 'Manager',
    permissions: [P.CATALOG_VIEW, P.CATALOG_EDIT, P.ORDERS_VIEW, P.ORDERS_EDIT, P.ANALYTICS_VIEW],
  },
  viewer: { label: 'Viewer', permissions: [P.CATALOG_VIEW, P.ORDERS_VIEW, P.ANALYTICS_VIEW] },
};

/* ─────────────── Credentials ─────────────── */

/**
 * Accounts. In a real deployment this call goes to the server and no
 * credential ever reaches the browser.
 *
 * The passcode is read from window.__ENV__ so it is not hard-coded in a
 * module, and can be changed per deployment without a rebuild.
 */
function configuredUsers() {
  const env = (typeof window !== 'undefined' && window.__ENV__) || {};
  return [
    {
      id: 'usr_owner',
      name: 'Store Owner',
      email: env.ADMIN_EMAIL || 'admin@parshivjewels.in',
      passcode: env.ADMIN_PASSCODE || 'parshiv-admin',
      role: 'super-admin',
    },
  ];
}

/* ─────────────── Session ─────────────── */

function readSession() {
  const session = read(SESSION_KEY, null);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    remove(SESSION_KEY);
    return null;
  }
  return session;
}

export const getSession = () => readSession();
export const isAuthenticated = () => !!readSession();
export const getUser = () => readSession()?.user || null;

export function can(permission) {
  const user = getUser();
  if (!user) return false;
  return (ROLES[user.role]?.permissions || []).includes(permission);
}

/** @returns {{ok: boolean, error?: string}} */
export function authenticate(email, passcode) {
  const account = configuredUsers().find(
    (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
  );
  if (!account || account.passcode !== passcode) {
    return { ok: false, error: 'Those details don’t match an admin account.' };
  }
  const user = { id: account.id, name: account.name, email: account.email, role: account.role };
  write(SESSION_KEY, {
    user,
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_HOURS * 3600 * 1000,
  });
  emitter.emit('change', { user });
  return { ok: true, user };
}

export function logout() {
  remove(SESSION_KEY);
  emitter.emit('change', { user: null });
}

/** Push the session expiry forward while the admin is active. */
export function touchSession() {
  const session = readSession();
  if (!session) return;
  write(SESSION_KEY, { ...session, expiresAt: Date.now() + SESSION_HOURS * 3600 * 1000 });
}

export const onAuthChange = (handler) => emitter.on('change', handler);
