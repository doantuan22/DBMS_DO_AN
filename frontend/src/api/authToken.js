const TOKEN_KEY = 'cinema_access_token';

export const authTokenStorage = Object.freeze({
  get() {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      throw new Error('Browser session storage is unavailable.');
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* Storage may be disabled. */
    }
  },
});

export function expireAuthToken() {
  authTokenStorage.clear();
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth:unauthorized'));
}
