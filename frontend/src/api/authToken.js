const TOKEN_KEY = 'cinema_access_token';
let version = 0;

export const authTokenStorage = Object.freeze({
  getVersion: () => version,
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
      version++;
    } catch {
      throw new Error('Browser session storage is unavailable.');
    }
  },
  clear() {
    version++;
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
