import { logout } from './utils/auth-guard.js';
import { getUser } from './utils/storage.js';

document.querySelector('[data-logout-btn]')?.addEventListener('click', () => logout());

const page = document.body.dataset.page;

if (page === 'login') {
  import('./pages/login.js').then(({ initLoginPage }) => initLoginPage());
} else if (page === 'register') {
  import('./pages/register.js').then(({ initRegisterPage }) => initRegisterPage());
} else if (page === 'feed') {
  Promise.all([import('./utils/auth-guard.js'), import('./pages/feed.js')]).then(
    ([{ requireAuth }, { initFeedPage }]) => {
      requireAuth();
      initFeedPage();
    },
  );
} else if (page === 'profile') {
  Promise.all([import('./utils/auth-guard.js'), import('./pages/profile.js')]).then(
    ([{ requireAuth }, { initProfilePage }]) => {
      requireAuth();
      initProfilePage();
    },
  );
}