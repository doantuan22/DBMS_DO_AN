export function assignmentTransferMessage(selected, values, managers, cinemas) {
  if (!selected || selected.RapID === Number(values.cinemaId)) return null;
  const manager = managers.find((row) => row.NguoiDungID === Number(values.userId));
  const cinema = cinemas.find((row) => row.RapID === Number(values.cinemaId));
  return `Xác nhận chuyển phân công của ${manager?.HoTen ?? selected.TenQuanLy} (${manager?.Email ?? selected.Email}) từ ${selected.TenRap} sang ${cinema?.TenRap}? Phạm vi Manager sẽ theo phân công và thời hạn đã lưu.`;
}
