import { adminApi } from '../../api/adminApi.js';
import { userCanAct } from '../../utils/authorization.js';
export function analyticsAdapter(user) {
  const can = (...codes) => userCanAct(user, 'ADMIN', ...codes);
  return { allowed: can('XEM_BAO_CAO_TOANHE'), can,
    report: adminApi.revenue, dashboard: async () => (await adminApi.dashboard()).dashboard,
    cinemas: async () => can('QL_RAP') ? (await adminApi.cinemas()).cinemas.map((r) => ({ id: r.RapID, label: r.TenRap })) : (await adminApi.revenue({})).byCinema.map((r) => ({ id: r.RapID, label: r.TenRap })),
  };
}
