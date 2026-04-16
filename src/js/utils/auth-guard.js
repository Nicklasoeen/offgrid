import { getToken, clearSession } from './storage.js';

/** redirect to login if no token exists */
export function requireAuth() {
  if (!getToken()) {
    window.location.replace('/login.html');
  }
}

/** redirect logged-in users */
export function redirectIfLoggedIn() {
  if (getToken()) {
    window.location.replace('/index.html');
  }
}

/** clear stored credentials and redirect to the login page */
export function logout() {
  clearSession();
  window.location.replace('/login.html');
}
