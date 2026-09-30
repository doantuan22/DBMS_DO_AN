import { Link } from 'react-router-dom';

export default function Forbidden() {
  return <main className="system-state"><h1>Không có quyền truy cập</h1><p>Tài khoản hiện tại không được cấp quyền cho khu vực này.</p><Link to="/">Về trang chủ</Link></main>;
}
