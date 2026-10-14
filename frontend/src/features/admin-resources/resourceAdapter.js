import { adminApi } from '../../api/adminApi.js';
import { userCanAct } from '../../utils/authorization.js';
import { resourceDefinitions } from './resourceModel.js';
export function resourceAdapter(kind, user) {
  const can = (...permissions) => userCanAct(user, 'ADMIN', ...permissions);
  const definition = resourceDefinitions[kind];
  const lookups =
    kind === 'users'
      ? {
          roles: async () =>
            (await adminApi.roles()).roles.map((r) => ({
              id: r.VaiTroID,
              label: r.TenVaiTro,
              code: r.MaVaiTro,
            })),
        }
      : kind === 'assignments'
        ? {
            managers: can('QL_NGUOIDUNG')
              ? async () =>
                  (await adminApi.users()).users
                    .filter((r) => r.MaVaiTro === 'QUAN_LY_RAP')
                    .map((r) => ({
                      id: r.NguoiDungID,
                      label: `${r.HoTen} · ${r.Email}`,
                      name: r.HoTen,
                    }))
              : null,
            cinemas: can('QL_RAP')
              ? async () =>
                  (await adminApi.cinemas()).cinemas.map((r) => ({ id: r.RapID, label: r.TenRap }))
              : null,
          }
        : kind === 'movies'
          ? {
              genres: can('QL_THELOAI')
                ? async () =>
                    (await adminApi.genres()).genres.map((r) => ({
                      id: r.TheLoaiID,
                      label: r.TenTheLoai,
                    }))
                : null,
              actors: async () =>
                (await adminApi.actors()).actors.map((r) => ({ id: r.DienVienID, label: r.HoTen })),
            }
          : ['actors', 'genres'].includes(kind)
            ? {
                movies: can('QL_DANHMUC_PHIM')
                  ? async () =>
                      (await adminApi.movies()).movies.map((r) => ({
                        id: r.PhimID,
                        label: r.TenPhim,
                        row: r,
                      }))
                  : null,
              }
            : {};
  return {
    kind,
    allowed: Boolean(definition && can(definition.permission)),
    can,
    lookups,
    list: async () => (await adminApi[kind]())[kind],
    save: (row, body) =>
      row
        ? adminApi.update(`${kind}/${row[definition.id]}${kind === 'users' ? '/status' : ''}`, body)
        : adminApi.create(kind, body),
    cast: (row, body) => adminApi.update(`movies/${row.PhimID}/actors`, body),
    remove: (row) => adminApi.remove(`${kind}/${row[definition.id]}`),
  };
}
