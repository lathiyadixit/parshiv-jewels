/* Admin sign-in. Honest about what this gate can and cannot do. */
import { $, esc } from '../../core/dom.js';
import { authenticate } from '../core/auth.js';
import { toast } from '../../core/toast.js';
import { field, btn } from '../components/ui.js';

export function loginMarkup() {
  return `
  <div class="flex min-h-dvh items-center justify-center bg-night px-5 py-12">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <img src="/assets/img/logo-full.webp" alt="Parshiv Jewels" width="640" height="823"
          class="brand-logo mx-auto w-[128px]">
        <h1 class="mt-7 font-display text-2xl font-semibold text-ivory">Admin sign in</h1>
      </div>

      <form id="loginForm" class="rounded-2xl border border-line/10 bg-card p-7" novalidate>
        <div class="grid gap-4">
          ${field({ id: 'loginEmail', label: 'Email', type: 'email', required: true, placeholder: 'admin@parshivjewels.in', attrs: 'autocomplete="username"' })}
          ${field({ id: 'loginPass', label: 'Passcode', type: 'password', required: true, attrs: 'autocomplete="current-password"' })}
        </div>
        <p id="loginError" class="mt-3 hidden text-[12px] text-danger" role="alert"></p>
        <button type="submit" class="btn-gold mt-6 w-full py-3.5">Sign in</button>
      </form>

      <div class="mt-6 rounded-2xl border border-gold/25 bg-gold/5 p-4">
        <p class="text-[10px] uppercase tracking-[0.18em] text-gold">Security notice</p>
        <p class="mt-2 text-[12px] leading-relaxed text-sand">
          This site has no server, so this sign-in runs in the browser and cannot keep a determined visitor out.
          Protect <span class="text-gold-light">admin.html</span> with HTTP Basic Auth in <span class="text-gold-light">.htaccess</span>
          before putting it on a public URL — the README has the exact configuration.
        </p>
      </div>

      <p class="mt-6 text-center text-[12px] text-sand/70">
        <a href="/" class="transition hover:text-gold-light">← Back to the storefront</a>
      </p>
    </div>
  </div>`;
}

export function initLogin(onSuccess) {
  const form = $('#loginForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const error = $('#loginError');
    const result = authenticate($('#loginEmail').value, $('#loginPass').value);
    if (!result.ok) {
      error.textContent = result.error;
      error.classList.remove('hidden');
      $('#loginPass').value = '';
      $('#loginPass').focus();
      return;
    }
    error.classList.add('hidden');
    toast(`Welcome back, ${result.user.name}`, { tone: 'success' });
    onSuccess(result.user);
  });
}
