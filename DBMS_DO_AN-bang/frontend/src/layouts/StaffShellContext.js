import { createContext, useContext } from 'react';

export const StaffShellContext = createContext(null);

export function useStaffShell() {
  return useContext(StaffShellContext);
}
