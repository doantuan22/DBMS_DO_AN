export function createAuthSession({ api, storage }) {
  async function initialize() {
    if (!storage.get()) return null;
    try {
      const result = await api.getCurrentUser();
      return result.user;
    } catch (error) {
      if (error.status === 401) storage.clear();
      throw error;
    }
  }

  async function login(credentials) {
    const result = await api.login(credentials);
    storage.set(result.token);
    try {
      return (await api.getCurrentUser()).user;
    } catch (error) {
      storage.clear();
      throw error;
    }
  }

  const register = (fields) => api.registerCustomer(fields);
  const logout = () => storage.clear();

  async function updateProfile(fields) {
    return (await api.updateCurrentUser(fields)).user;
  }

  return { initialize, login, register, logout, updateProfile };
}
