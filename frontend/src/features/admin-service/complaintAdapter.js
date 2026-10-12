import { adminApi } from '../../api/adminApi.js';
import { userCanAct } from '../../utils/authorization.js';
export function complaintAdapter(user) {
  const can = (...permissions) => userCanAct(user, 'ADMIN', ...permissions);
  return { allowed: can('QL_KHIEUNAI'), writable: can('QL_KHIEUNAI', 'XULY_KHIEUNAI'), referenceAllowed: can('QL_KHIEUNAI', 'TRA_CUU_DON'),
    list: async (filters) => (await adminApi.complaints(filters)).complaints,
    detail: async (id) => (await adminApi.complaint(id)).complaint,
    process: adminApi.addComplaintProcessing, status: adminApi.updateComplaintStatus,
  };
}
