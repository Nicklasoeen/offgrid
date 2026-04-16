import { logout } from '../utils/auth-guard.js';

/**
 * thin wrapper around fetch that handles 401 globally.
 * If the server responds with 401 the user's session is cleared and
 * they are redirected to the login page.
 */
export async function authFetch(url, options = {}) {
  const res = await fetch(url, options);

  if (res.status === 401) {
    logout();
    throw new Error('Session expired — please log in again.');
  }

  return res;
}
