import { createContext, useContext } from 'react';
export const AdminWorkspaceContext = createContext(null);
export const useAdminWorkspace = () => useContext(AdminWorkspaceContext);
export const isAdminDestination = (destination) => {
  const url = new URL(destination, window.location.href);
  return (
    url.origin === window.location.origin &&
    (url.pathname === '/admin' || url.pathname.startsWith('/admin/'))
  );
};
