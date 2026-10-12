import { PROCESSING_STATUSES, DEFAULT_PROCESSING_STATUS, EMPTY_SUPPORT_FILTERS } from '../support/supportDraftStore.js';
export { PROCESSING_STATUSES, EMPTY_SUPPORT_FILTERS };
export const COMPLAINT_STATUSES = ['Mới', ...PROCESSING_STATUSES];
export const PRIORITIES = ['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp'];
export const actionDraft = (complaint) => { const status = PROCESSING_STATUSES.includes(complaint.status) ? complaint.status : DEFAULT_PROCESSING_STATUS; return { processing: { content: '', nextStatus: status }, status }; };
export const complaintQuery = (state) => new URLSearchParams({ ...Object.fromEntries(['status', 'priority'].filter((k) => state.applied[k]).map((k) => [k, state.applied[k]])), ...(state.selectedId ? { selectedId: state.selectedId } : {}), ...(state.page > 1 ? { page: state.page } : {}) }).toString();
export function parseComplaintQuery(query) { const p = new URLSearchParams(query), page = Number(p.get('page')); return { applied: { ...EMPTY_SUPPORT_FILTERS, status: p.get('status') ?? '', priority: p.get('priority') ?? '' }, selectedId: /^[1-9]\d*$/.test(p.get('selectedId') ?? '') ? Number(p.get('selectedId')) : null, page: Number.isSafeInteger(page) && page > 0 ? page : 1 }; }
