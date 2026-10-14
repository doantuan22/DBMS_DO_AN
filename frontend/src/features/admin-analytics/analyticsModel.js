import { businessDate, formatDate } from '../../utils/dateTime.js';
import { money } from '../admin-resources/resourceModel.js';
export const REPORT_METRICS = [
  ['TongDoanhThuThucTe', 'Tiền thực thu', money, 'VND · thanh toán thành công'],
  ['TongSoDonToanHeThong', 'Đơn thanh toán thành công', count, 'đơn · tiền và/hoặc điểm'],
  ['SoDonHopLe', 'Đơn còn hiệu lực', count, 'đơn · không gồm đơn bị hủy'],
  ['SoDonCoTienThucThu', 'Đơn có tiền thực thu', count, 'đơn · tiền thật > 0'],
  ['TienThuocDonHuy', 'Tiền thuộc đơn bị hủy suất', money, 'VND · đã thu, không hoàn lại'],
  ['TongGiaTriThanhToanBangDiem', 'Giá trị trả bằng điểm', money, 'VND · không tính doanh thu'],
  ['TongSoVeBan', 'Vé theo đơn đã thu', count, 'vé còn hiệu lực'],
  ['TongDoanhThuVe', 'Tiền vé snapshot', money, 'VND'],
  ['TongDoanhThuDoAn', 'Tiền đồ ăn snapshot', money, 'VND'],
  ['TongTienGiam', 'Giảm giá snapshot', money, 'VND'],
];
export const DASHBOARD_METRICS = [
  [
    'TongDoanhThuToanThoiGian',
    'Tiền thực thu toàn thời gian',
    money,
    'VND · thanh toán thành công',
  ],
  [
    'TongDonThanhCong',
    'Đơn đã thanh toán / hoàn thành',
    count,
    'đơn còn hiệu lực · toàn thời gian',
  ],
  ['TongDonThanhToanThanhCong', 'Đơn thanh toán thành công', count, 'đơn · gồm đơn đã hủy suất'],
  ['TienThuocDonHuy', 'Tiền thuộc đơn bị hủy suất', money, 'VND · đã thu, không hoàn lại'],
  ['TongGiaTriThanhToanBangDiem', 'Giá trị trả bằng điểm', money, 'VND · không tính doanh thu'],
  ['SuatChieuHomNay', 'Suất chiếu hôm nay', count, 'suất · chưa hủy · ngày Việt Nam'],
  ['KhieuNaiChuaXuLy', 'Khiếu nại mới', count, 'hồ sơ · hiện tại'],
  ['TongNguoiDung', 'Tài khoản hoạt động', count, 'tài khoản · hiện tại'],
  ['TongRap', 'Rạp hoạt động', count, 'rạp · hiện tại'],
  ['TongPhongChieu', 'Phòng hoạt động', count, 'phòng · hiện tại'],
  ['PhimDangChieu', 'Phim đang chiếu', count, 'phim · hiện tại'],
];
export function count(value) {
  return value == null ? 'Chưa có dữ liệu' : new Intl.NumberFormat('vi-VN').format(value);
}
export function defaultReportFilters() {
  const today = businessDate();
  return { fromDate: `${today.slice(0, 7)}-01`, toDate: today, cinemaId: '' };
}
export function validateReportFilters(filters, cinemas) {
  try {
    if (!filters.fromDate || !filters.toDate) return 'Chọn đủ từ ngày và đến ngày.';
    formatDate(filters.fromDate);
    formatDate(filters.toDate);
    if (filters.fromDate > filters.toDate) return 'Từ ngày không được sau đến ngày.';
    if (filters.cinemaId && !cinemas.rows.some((r) => String(r.id) === filters.cinemaId))
      return 'Rạp chưa tra cứu được; tải lại danh mục hoặc chọn Tất cả.';
  } catch {
    return 'Ngày báo cáo chưa hợp lệ.';
  }
  return null;
}
export const reportQuery = (filters) =>
  new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '')).toString();
export function parseReportQuery(query, cached) {
  const p = new URLSearchParams(query);
  return Object.fromEntries(
    Object.entries(cached ?? defaultReportFilters()).map(([key, value]) => [
      key,
      p.has(key) ? p.get(key) : value,
    ]),
  );
}
