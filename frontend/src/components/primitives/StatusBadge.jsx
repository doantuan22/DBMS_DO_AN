export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  let variant = 'muted';
  const s = String(status).toLowerCase();

  if (s.includes('hoạt động') || s.includes('mở bán') || s.includes('thành công') || s.includes('đã thanh toán') || s.includes('đã giải quyết') || s.includes('hiệu lực')) {
    variant = 'success';
  } else if (s.includes('khóa') || s.includes('hủy') || s.includes('từ chối') || s.includes('hỏng') || s.includes('hết hạn')) {
    variant = 'danger';
  } else if (s.includes('chờ') || s.includes('đang xử lý') || s.includes('bảo trì') || s.includes('tạm')) {
    variant = 'warning';
  } else if (s.includes('mới') || s.includes('sắp chiếu')) {
    variant = 'info';
  }

  return (
    <span className={`badge badge--${variant} ${className}`.trim()} role="status">
      {status}
    </span>
  );
}
