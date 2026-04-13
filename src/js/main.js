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
}