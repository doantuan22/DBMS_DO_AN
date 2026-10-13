import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AccessErrorHandler() {
  const { refreshCurrentUser } = useAuth();

  useEffect(() => {
    let refreshing = false;
    const onForbidden = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        await refreshCurrentUser();
      } catch {
        /* The operation error remains visible. */
      } finally {
        refreshing = false;
      }
    };
    window.addEventListener('auth:forbidden', onForbidden);
    return () => window.removeEventListener('auth:forbidden', onForbidden);
  }, [refreshCurrentUser]);

  return null;
}
