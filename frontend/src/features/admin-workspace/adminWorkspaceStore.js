// Memory owned by the mounted Admin layout, discarded on logout/actor change.
export function createAdminWorkspaceStore() {
  let state = { dirty: false, pending: false };
  const drafts = new Map(),
    screens = new Map(),
    writes = new Set(),
    listeners = new Set();
  const publish = () => {
    state = { dirty: [...drafts.values()].some((draft) => draft.dirty), pending: writes.size > 0 };
    listeners.forEach((listener) => listener());
  };
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,
    getDraft: (key) => drafts.get(key),
    setDraft(key, value) {
      if (value) drafts.set(key, value);
      else drafts.delete(key);
      publish();
    },
    getScreen: (key) => screens.get(key),
    setScreen: (key, value) => screens.set(key, value),
    beginWrite() {
      const token = Symbol();
      writes.add(token);
      publish();
      return token;
    },
    endWrite(token) {
      writes.delete(token);
      publish();
    },
  };
}
