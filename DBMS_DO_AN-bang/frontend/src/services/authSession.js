export function createAuthSession({ api, storage }) {
  let version = 0;
  const getVersion = () => version;
  const assertOwner = (owner) => {
    if (owner !== version) throw Object.assign(new Error('Authentication request belongs to an earlier session.'), { name: 'AbortError' });
  };
  const logout = () => { version++; storage.clear(); };
  async function initialize(options) {
    const owner = version;
    if (!storage.get()) return null;
    try {
      const result = await api.getCurrentUser(options);
      assertOwner(owner);
      return result.user;
    } catch (error) {
      if (owner === version && error.status === 401) logout();
      throw error;
    }
  }

  async function login(credentials) {
    const owner = ++version;
    let tokenStored = false;
    try {
      const result = await api.login(credentials);
      assertOwner(owner);
      storage.set(result.token);
      tokenStored = true;
      const user = (await api.getCurrentUser()).user;
      assertOwner(owner);
      return user;
    } catch (error) {
      if (owner === version && tokenStored) storage.clear();
      throw error;
    }
  }

  const register = (fields) => api.registerCustomer(fields);

  async function updateProfile(fields) {
    const owner = version;
    const user = (await api.updateCurrentUser(fields)).user;
    assertOwner(owner);
    return user;
  }

  return { initialize, login, register, logout, updateProfile, getVersion };
}
