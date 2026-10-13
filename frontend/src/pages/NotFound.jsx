import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="system-state" aria-labelledby="not-found-heading">
      <h1 id="not-found-heading">404 - Không tìm thấy trang</h1>
      <p>Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển.</p>
      <div className="catalog-actions">
        <Link className="catalog-button" to="/">
          Về trang chủ
        </Link>
        <Link className="catalog-button catalog-button--secondary" to="/movies">
          Xem phim đang chiếu
        </Link>
      </div>
    </section>
  );
}
