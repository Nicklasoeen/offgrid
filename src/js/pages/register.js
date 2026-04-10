import { registerUser } from '../api/auth.js';
import { redirectIfLoggedIn } from '../utils/auth-guard.js';

export function initRegisterPage() {
  redirectIfLoggedIn();

  const form = document.querySelector('[aria-label="Register form"]');
  const submitBtn = form.querySelector('[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError(form);

    const { name, email, password, avatar } = Object.fromEntries(new FormData(form));
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account…';

    try {
      await registerUser({ name, email, password, avatar: avatar || undefined });
      window.location.href = '/login.html?registered=1';
    } catch (err) {
      showError(form, err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create account';
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
