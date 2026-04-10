import { getToken } from './storage.js';

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
