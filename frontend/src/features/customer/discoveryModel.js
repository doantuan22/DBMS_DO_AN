export const textMatch = (values, search) =>
  values.some((value) =>
    String(value ?? '')
      .toLocaleLowerCase('vi')
      .includes(search.trim().toLocaleLowerCase('vi')),
  );
export const cinemaView = (rows, filters) =>
  rows.filter(
    (r) =>
      (!filters.city || r.city === filters.city) &&
      (!filters.search || textMatch([r.name, r.address], filters.search)),
  );
export function movieGroups(rows) {
  return [
    ['Đang chiếu', rows.filter((r) => r.status === 'Đang chiếu')],
    ['Sắp chiếu', rows.filter((r) => r.status === 'Sắp chiếu')],
    ['Khám phá thêm', rows.filter((r) => !['Đang chiếu', 'Sắp chiếu'].includes(r.status))],
  ].filter(([, movies]) => movies.length);
}
