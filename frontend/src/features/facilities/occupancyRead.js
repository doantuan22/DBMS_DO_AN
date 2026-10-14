// Read-only observation. Resolve membership before calling the public seats endpoint.
export async function loadOccupancy({
  scope,
  showtimeId,
  showtimes,
  readSeats,
  accepts = () => true,
}) {
  if (
    !showtimes.some(
      (row) =>
        String(row.id) === showtimeId &&
        String(row.roomId) === scope.roomId &&
        String(row.cinemaId) === scope.cinemaId,
    )
  )
    throw Object.assign(new Error('Không tìm thấy suất chiếu thuộc phòng đang chọn.'), {
      status: 404,
    });
  const rows = await readSeats(showtimeId);
  if (!accepts()) return;
  if (!Array.isArray(rows) || rows.some((row) => String(row.roomId) !== scope.roomId))
    throw Object.assign(new Error('Ghế của suất chiếu không khớp phòng.'), { status: 409 });
  return rows;
}
