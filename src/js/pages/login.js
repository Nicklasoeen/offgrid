import { loginUser, createApiKey } from '../api/auth.js';
import { setToken, setUser, setApiKey, getApiKey } from '../utils/storage.js';
import { redirectIfLoggedIn } from '../utils/auth-guard.js';

export function initLoginPage() {
  redirectIfLoggedIn();

  if (new URLSearchParams(location.search).get('registered') === '1') {
    showBanner('Account created — you can now log in.');
  }

  const form = document.querySelector('[aria-label="Login form"]');
  const submitBtn = form.querySelector('[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError(form);

    const { email, password } = Object.fromEntries(new FormData(form));
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in…';

    try {
      const data = await loginUser({ email, password });
      setToken(data.accessToken);
      setUser({ name: data.name, email: data.email, avatar: data.avatar ?? null });

      // create an API key once
      if (!getApiKey()) {
        const key = await createApiKey(data.accessToken);
        setApiKey(key);
      }

      window.location.href = '/index.html';
    } catch (err) {
      showError(form, err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log in';
    }
  });
}

function showError(form, message) {
  let el = form.querySelector('.form-error');
  if (!el) {
    el = document.createElement('p');
    el.className = 'form-error';
    form.querySelector('[type="submit"]').insertAdjacentElement('beforebegin', el);
  }
  el.textContent = message;
}

function clearError(form) {
  form.querySelector('.form-error')?.remove();
}

function showBanner(message) {
  const banner = document.createElement('p');
  banner.className = 'form-banner';
  banner.textContent = message;
  document.querySelector('.auth-card')?.prepend(banner);
}
