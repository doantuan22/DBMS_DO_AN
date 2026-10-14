export const DEFAULT_PROCESSING_STATUS = 'Đang xử lý';

export const PROCESSING_STATUSES = Object.freeze([
  DEFAULT_PROCESSING_STATUS,
  'Đã giải quyết',
  'Đã đóng',
  'Từ chối',
]);

export const EMPTY_SUPPORT_FILTERS = Object.freeze({
  status: '',
  type: '',
  search: '',
  priority: '',
});

const memoryStorage = new Map();
const filterKeys = Object.keys(EMPTY_SUPPORT_FILTERS);

function sessionStorageOrNull() {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function normalizeFilters(value) {
  return Object.fromEntries(
    filterKeys.map((key) => [key, typeof value?.[key] === 'string' ? value[key] : '']),
  );
}

function normalizeComplaintId(value) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) {
    const id = Number(value);
    return Number.isSafeInteger(id) ? id : null;
  }
  return null;
}

function normalizeProcessing(value) {
  if (!value || typeof value.content !== 'string') return null;
  return {
    content: value.content,
    nextStatus: PROCESSING_STATUSES.includes(value.nextStatus)
      ? value.nextStatus
      : DEFAULT_PROCESSING_STATUS,
  };
}

export function createSupportDraftStore(scope, storage = sessionStorageOrNull()) {
  const prefix = `uxr-v3:support:${encodeURIComponent(String(scope ?? 'anonymous'))}`;
  const read = (key) => {
    let raw;
    try {
      raw = storage?.getItem(key) ?? null;
    } catch {
      raw = null;
    }
    raw ??= memoryStorage.get(key) ?? null;
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      memoryStorage.delete(key);
      try {
        storage?.removeItem(key);
      } catch {}
      return null;
    }
  };
  const write = (key, value) => {
    const raw = JSON.stringify(value);
    memoryStorage.set(key, raw);
    try {
      storage?.setItem(key, raw);
    } catch {
      // The in-memory fallback still protects SPA navigation in this tab.
    }
  };
  const remove = (key) => {
    memoryStorage.delete(key);
    try {
      storage?.removeItem(key);
    } catch {}
  };
  const workspaceKey = `${prefix}:workspace`;
  const complaintKey = (complaintId) => {
    const id = normalizeComplaintId(complaintId);
    return id ? `${prefix}:complaint:${id}` : null;
  };

  function readComplaintDraft(complaintId) {
    const key = complaintKey(complaintId);
    if (!key) return { processing: null, statusValue: null };
    const saved = read(key);
    return {
      processing: normalizeProcessing(saved?.processing),
      statusValue: PROCESSING_STATUSES.includes(saved?.statusValue) ? saved.statusValue : null,
    };
  }

  function writeComplaintDraft(complaintId, value = {}) {
    const key = complaintKey(complaintId);
    if (!key) return;
    const processing = normalizeProcessing(value.processing);
    const statusValue = PROCESSING_STATUSES.includes(value.statusValue) ? value.statusValue : null;
    if (!processing && !statusValue) {
      remove(key);
      return;
    }
    write(key, { processing, statusValue });
  }

  return {
    hasDrafts() {
      let savedKeys = [];
      try {
        savedKeys = Object.keys(storage ?? {});
      } catch {}
      const keys = new Set([...memoryStorage.keys(), ...savedKeys]);
      return [...keys].some(
        (key) =>
          key.startsWith(`${prefix}:complaint:`) &&
          Boolean(read(key)?.processing || read(key)?.statusValue),
      );
    },
    readWorkspace() {
      const saved = read(workspaceKey);
      return {
        draftFilters: normalizeFilters(saved?.draftFilters),
        appliedFilters: normalizeFilters(saved?.appliedFilters),
        selectedId: normalizeComplaintId(saved?.selectedId),
      };
    },
    writeWorkspace(value = {}) {
      write(workspaceKey, {
        draftFilters: normalizeFilters(value.draftFilters),
        appliedFilters: normalizeFilters(value.appliedFilters),
        selectedId: normalizeComplaintId(value.selectedId),
      });
    },
    readComplaintDraft,
    writeComplaintDraft,
    clearProcessingDraft(complaintId) {
      const draft = readComplaintDraft(complaintId);
      writeComplaintDraft(complaintId, { statusValue: draft.statusValue });
    },
    clearStatusDraft(complaintId) {
      const draft = readComplaintDraft(complaintId);
      writeComplaintDraft(complaintId, { processing: draft.processing });
    },
    clearComplaintDraft(complaintId) {
      const key = complaintKey(complaintId);
      if (key) remove(key);
    },
  };
}
