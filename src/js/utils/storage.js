const TOKEN_KEY = 'offgrid_token';
const USER_KEY = 'offgrid_user';
const API_KEY_KEY = 'offgrid_api_key';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const getUser = () => JSON.parse(localStorage.getItem(USER_KEY) ?? 'null');
export const setUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));

export const getApiKey = () => localStorage.getItem(API_KEY_KEY);
export const setApiKey = (key) => localStorage.setItem(API_KEY_KEY, key);

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(API_KEY_KEY);
}
