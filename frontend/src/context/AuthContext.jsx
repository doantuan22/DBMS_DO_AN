import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/authApi';
import { authTokenStorage } from '../api/authToken';
import { createAuthSession } from '../services/authSession';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session] = useState(() => createAuthSession({ api: authApi, storage: authTokenStorage }));
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(() => Boolean(authTokenStorage.get()));

  const refreshCurrentUser = useCallback(async () => {
    const owner = session.getVersion();
    const currentUser = await session.initialize();
    if (owner === session.getVersion()) setUser(currentUser);
    return currentUser;
  }, [session]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const onUnauthorized = () => {
      session.logout();
      setUser(null);
      setInitializing(false);
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);

    if (authTokenStorage.get()) {
      const owner = session.getVersion();
      session
        .initialize({ signal: controller.signal })
        .then((currentUser) => {
          if (active && owner === session.getVersion()) setUser(currentUser);
        })
        .catch((error) => {
          if (active && owner === session.getVersion() && error.name !== 'AbortError') setUser(null);
        })
        .finally(() => {
          if (active) setInitializing(false);
        });
    }

    return () => {
      active = false;
      controller.abort();
      window.removeEventListener('auth:unauthorized', onUnauthorized);
    };
  }, [session]);

  const register = useCallback((fields) => session.register(fields), [session]);

  const login = useCallback(
    async (credentials) => {
      const result = session.login(credentials);
      const owner = session.getVersion();
      const currentUser = await result;
      if (owner === session.getVersion()) setUser(currentUser);
      return currentUser;
    },
    [session],
  );

  const logout = useCallback(() => {
    session.logout();
    setUser(null);
  }, [session]);

  const updateProfile = useCallback(
    async (fields) => {
      const owner = session.getVersion();
      const currentUser = await session.updateProfile(fields);
      if (owner === session.getVersion()) setUser(currentUser);
      return currentUser;
    },
    [session],
  );

  const value = useMemo(
    () => ({
      user,
      initializing,
      authenticated: Boolean(user),
      login,
      register,
      logout,
      refreshCurrentUser,
      updateProfile,
    }),
    [user, initializing, login, register, logout, refreshCurrentUser, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
