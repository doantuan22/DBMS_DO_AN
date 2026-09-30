import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/authApi';
import { authTokenStorage } from '../api/authToken';
import { createAuthSession } from '../services/authSession';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session] = useState(() => createAuthSession({ api: authApi, storage: authTokenStorage }));
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(() => Boolean(authTokenStorage.get()));

  const refreshCurrentUser = useCallback(async () => {
    const currentUser = await session.initialize();
    setUser(currentUser);
    return currentUser;
  }, [session]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const onUnauthorized = () => {
      setUser(null);
      setInitializing(false);
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);

    if (authTokenStorage.get()) {
      authApi.getCurrentUser({ signal: controller.signal })
        .then((result) => { if (active) setUser(result.user); })
        .catch((error) => {
          if (active && error.name !== 'AbortError') setUser(null);
        })
        .finally(() => { if (active) setInitializing(false); });
    }

    return () => {
      active = false;
      controller.abort();
      window.removeEventListener('auth:unauthorized', onUnauthorized);
    };
  }, []);

  const register = useCallback((fields) => session.register(fields), [session]);

  const login = useCallback(async (credentials) => {
    const currentUser = await session.login(credentials);
    setUser(currentUser);
    return currentUser;
  }, [session]);

  const logout = useCallback(() => {
    session.logout();
    setUser(null);
  }, [session]);

  const updateProfile = useCallback(async (fields) => {
    const currentUser = await session.updateProfile(fields);
    setUser(currentUser);
    return currentUser;
  }, [session]);

  const value = useMemo(() => ({
    user,
    initializing,
    authenticated: Boolean(user),
    login,
    register,
    logout,
    refreshCurrentUser,
    updateProfile,
  }), [user, initializing, login, register, logout, refreshCurrentUser, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
