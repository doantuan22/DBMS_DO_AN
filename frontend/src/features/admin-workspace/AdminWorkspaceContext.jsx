import { useState, useSyncExternalStore } from 'react';
import { createAdminWorkspaceStore } from './adminWorkspaceStore';
import useBookingDraftGuard from '../staff-bookings/useBookingDraftGuard';

import { AdminWorkspaceContext, isAdminDestination } from './AdminWorkspaceContext';
export function AdminWorkspaceProvider({ children }) {
  const [store] = useState(createAdminWorkspaceStore);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useBookingDraftGuard(state.dirty, state.pending, {
    readState: store.getSnapshot,
    isSafeDestination: isAdminDestination,
    message: 'Có thay đổi quản trị chưa lưu. Rời vùng Admin và bỏ bản nháp?',
  });
  return <AdminWorkspaceContext.Provider value={store}>{children}</AdminWorkspaceContext.Provider>;
}
