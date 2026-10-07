import { Link } from 'react-router-dom';

export default function Forbidden() {
  return (
    <section className="system-state" aria-labelledby="forbidden-heading">
      <h1 id="forbidden-heading">Không có quyền truy cập</h1>
      <p>Tài khoản hiện tại không được cấp quyền cho khu vực này.</p>
      <Link className="catalog-button" to="/">Về trang chủ</Link>
    </section>
  );
}
