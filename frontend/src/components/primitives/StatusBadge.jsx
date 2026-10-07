// Status text comes from CHECK constraints in the database, so match it exactly.
const STATUS_VARIANTS = {
  // Đơn đặt vé
  'Chờ thanh toán': 'warning',
  'Đã thanh toán': 'success',
  'Hoàn thành': 'success',
  'Hoàn tiền': 'info',
  'Hết hạn': 'danger',
  'Đã hủy': 'danger',
  // Thanh toán
  'Thành công': 'success',
  'Thất bại': 'danger',
  'Đã hoàn tiền': 'info',
  // Khiếu nại
  'Mới': 'info',
  'Đang xử lý': 'warning',
  'Đã giải quyết': 'success',
  'Đã đóng': 'muted',
  'Từ chối': 'danger',
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  return <span className={`badge badge--${STATUS_VARIANTS[status] ?? 'muted'}`}>{status}</span>;
}
