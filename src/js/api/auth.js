import { authFetch } from './fetcher.js';

const API_BASE = 'https://v2.api.noroff.dev';

/**
 * register a new user.
 * @param {{ name: string, email: string, password: string, avatar?: string }} data
 */
export async function registerUser({ name, email, password }) {
  const body = { name, email, password };

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.errors?.[0]?.message ?? 'Registration failed');
  return json.data;
}

/**
 * log in and return 
 * @param {{ email: string, password: string }} credentials
 */
export async function loginUser({ email, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.errors?.[0]?.message ?? 'Login failed');
  return json.data;
}

/**
 * create a persistent API key for the authenticated user
 * store the result and reuse it
 * @param {string} accessToken
 */
export async function createApiKey(accessToken) {
  const res = await authFetch(`${API_BASE}/auth/create-api-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name: 'Offgrid client key' }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.errors?.[0]?.message ?? 'API key creation failed');
  return json.data.key;
}
