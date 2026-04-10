const page = document.body.dataset.page;

if (page === 'login') {
  import('./pages/login.js').then(({ initLoginPage }) => initLoginPage());
} else if (page === 'register') {
  import('./pages/register.js').then(({ initRegisterPage }) => initRegisterPage());
} else if (page === 'feed') {
  import('./utils/auth-guard.js').then(({ requireAuth }) => requireAuth());
}