// Tab-local state, owned by the persistent Manager layout. No URL or storage PII.
export function createManagerCinemaStore(preferredCinemaId = '') {
  let snapshot = { status: 'loading', cinemas: [], cinemaId: String(preferredCinemaId), epoch: 0, dirty: false, pending: false };
  const listeners = new Set();
  const drafts = new Map();
  const screens = new Map();
  const writes = new Set();
  const publish = (patch) => {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  };
  const reset = () => { drafts.clear(); screens.clear(); };
  return {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    getSnapshot: () => snapshot,
    reconcile(cinemas) {
      const cinemaId = cinemas.some((cinema) => String(cinema.id) === snapshot.cinemaId)
        ? snapshot.cinemaId : String(cinemas[0]?.id ?? '');
      const changed = cinemaId !== snapshot.cinemaId;
      if (changed) reset();
      publish({ status: 'success', error: null, cinemas, cinemaId,
        epoch: snapshot.epoch + Number(changed), dirty: changed ? false : snapshot.dirty });
    },
    fail(error) { reset(); publish({ status: 'error', error, cinemas: [], cinemaId: '', dirty: false, epoch: snapshot.epoch + 1 }); },
    switchCinema(cinemaId, discard = false) {
      cinemaId = String(cinemaId);
      if (!snapshot.cinemas.some((cinema) => String(cinema.id) === cinemaId)) return 'invalid';
      if (cinemaId === snapshot.cinemaId) return 'same';
      if (writes.size) return 'busy';
      if (snapshot.dirty && !discard) return 'dirty';
      reset();
      publish({ cinemaId, epoch: snapshot.epoch + 1, dirty: false });
      return 'changed';
    },
    getDraft: (key) => drafts.get(key),
    setDraft(key, draft) {
      if (draft) drafts.set(key, draft); else drafts.delete(key);
      const dirty = [...drafts.values()].some((entry) => entry.dirty);
      if (dirty !== snapshot.dirty) publish({ dirty });
    },
    getScreen: (section) => screens.get(section),
    setScreen(section, state) { screens.set(section, state); },
    beginWrite() { const token = Symbol(); writes.add(token); publish({ pending: true }); return token; },
    endWrite(token) { writes.delete(token); publish({ pending: writes.size > 0 }); },
    // Captured before an async operation; rejects late A responses even after A -> B -> A.
    capture() {
      const { cinemaId, epoch } = snapshot;
      return () => snapshot.cinemaId === cinemaId && snapshot.epoch === epoch && snapshot.status === 'success';
    },
  };
}
