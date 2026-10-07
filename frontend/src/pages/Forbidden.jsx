import { Link } from 'react-router-dom';

export default function Forbidden() {
  return (
    <div className="system-state" role="region" aria-label="Lỗi phân quyền">
      <h1>Không có quyền truy cập</h1>
      <p>Tài khoản hiện tại không được cấp quyền cho khu vực này.</p>
      <Link to="/" className="btn btn--primary">Về trang chủ</Link>
    </div>
  );
}
