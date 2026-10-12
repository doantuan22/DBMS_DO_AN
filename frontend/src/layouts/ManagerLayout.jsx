import { useEffect, useState, useSyncExternalStore } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAssignedCinemas } from '../api/managerApi';
import { ManagerCinemaContext } from '../features/manager/ManagerCinemaContext';
import { createManagerCinemaStore } from '../features/manager/managerCinemaStore';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import useBookingDraftGuard from '../features/staff-bookings/useBookingDraftGuard';

const isManagerDestination = (destination) => {
  if (!destination) return false;
  const url = new URL(destination, window.location.href);
  return url.origin === window.location.origin && (url.pathname === '/manager' || url.pathname.startsWith('/manager/'));
};

export default function ManagerLayout() {
  const { user } = useAuth();
  return <ManagerCinemaProvider key={user?.userId} user={user}><Outlet /></ManagerCinemaProvider>;
}

export function ManagerCinemaProvider({ user, children }) {
  const storageKey = user?.userId == null ? null : `manager-cinema:${user.userId}`;
  const [store] = useState(() => {
    let preferred = '';
    try { if (storageKey && typeof window !== 'undefined') preferred = window.sessionStorage.getItem(storageKey) ?? ''; } catch { /* Storage can be unavailable. */ }
    return createManagerCinemaStore(preferred);
  });
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [confirmation, setConfirmation] = useState(null);
  useBookingDraftGuard(state.dirty, state.pending, { isSafeDestination: isManagerDestination,
    readState: store.getSnapshot, message: 'Có thay đổi quản lý rạp chưa lưu. Rời vùng Manager và bỏ thay đổi?' });
  const assignments = user?.cinemaAssignments;
  const assignmentKey = assignments?.map((item) => String(item.cinemaId)).sort().join(',');
  useEffect(() => {
    if (!storageKey || state.status !== 'success') return;
    try {
      if (state.cinemaId) window.sessionStorage.setItem(storageKey, state.cinemaId);
      else window.sessionStorage.removeItem(storageKey);
    } catch { /* Cinema selection still works without persistence. */ }
  }, [storageKey, state.status, state.cinemaId]);
  useEffect(() => {
    let active = true;
    getAssignedCinemas().then(({ cinemas }) => {
      if (!active) return;
      store.reconcile(cinemas.filter((cinema) => assignmentKey == null || assignmentKey.split(',').includes(String(cinema.id))));
    }).catch((error) => { if (active) store.fail(error); });
    return () => { active = false; };
  }, [store, assignmentKey]);
  const changeCinema = (cinemaId) => {
    if (assignmentKey != null && !assignmentKey.split(',').includes(String(cinemaId))) return;
    if (store.switchCinema(cinemaId) === 'dirty') setConfirmation({ cinemaId, epoch: state.epoch });
  };
  return (
    <ManagerCinemaContext.Provider value={{ store, state, changeCinema }}>
      {children}
      <ConfirmDialog open={Boolean(confirmation)} title="Bỏ thay đổi chưa lưu và chuyển rạp?"
        description="Các bản nháp và lựa chọn phụ thuộc rạp hiện tại sẽ bị bỏ."
        entityLabel={state.cinemas.find((cinema) => String(cinema.id) === state.cinemaId)?.name}
        confirmLabel="Bỏ thay đổi và chuyển rạp" busy={state.pending}
        onOpenChange={(open) => { if (!open) setConfirmation(null); }}
        onConfirm={() => {
          if (confirmation?.epoch === store.getSnapshot().epoch &&
            (assignmentKey == null || assignmentKey.split(',').includes(String(confirmation.cinemaId))))
            store.switchCinema(confirmation.cinemaId, true);
          setConfirmation(null);
        }} />
    </ManagerCinemaContext.Provider>
  );
}
