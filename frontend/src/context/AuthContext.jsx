import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/authApi';
import { authTokenStorage } from '../api/authToken';
import { createAuthSession } from '../services/authSession';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);
const issueFor = (error) => (error?.status === 401 ? { kind: 'expired' } : { kind: 'unavailable' });

export function AuthProvider({ children }) {
  const [session] = useState(() => createAuthSession({ api: authApi, storage: authTokenStorage }));
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(() => Boolean(authTokenStorage.get()));
  const [authIssue, setAuthIssue] = useState(null);

  const refreshCurrentUser = useCallback(async () => {
    const owner = session.getVersion();
    setAuthIssue(null);
    setInitializing(true);
    try {
      const currentUser = await session.initialize();
      if (owner === session.getVersion()) setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (
        owner === session.getVersion() ||
        (error.status === 401 && !authTokenStorage.get())
      ) {
        setUser(null);
        setAuthIssue(issueFor(error));
      }
      throw error;
    } finally {
      if (owner === session.getVersion() || !authTokenStorage.get()) setInitializing(false);
    }
  }, [session]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const onUnauthorized = () => {
      session.logout();
      setUser(null);
      setAuthIssue({ kind: 'expired' });
      setInitializing(false);
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);

    if (authTokenStorage.get()) {
      const owner = session.getVersion();
      session
        .initialize({ signal: controller.signal })
        .then((currentUser) => {
          if (active && owner === session.getVersion()) {
            setUser(currentUser);
            setAuthIssue(null);
          }
        })
        .catch((error) => {
          if (
            active &&
            error.name !== 'AbortError' &&
            (owner === session.getVersion() ||
              (error.status === 401 && !authTokenStorage.get()))
          ) {
            setUser(null);
            setAuthIssue(issueFor(error));
          }
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
      setAuthIssue(null);
      const result = session.login(credentials);
      const owner = session.getVersion();
      const currentUser = await result;
      if (owner === session.getVersion()) {
        setUser(currentUser);
        setAuthIssue(null);
      }
      return currentUser;
    },
    [session],
  );

  const logout = useCallback(() => {
    session.logout();
    setUser(null);
    setAuthIssue(null);
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
      authIssue,
      login,
      register,
      logout,
      refreshCurrentUser,
      updateProfile,
    }),
    [user, initializing, authIssue, login, register, logout, refreshCurrentUser, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
