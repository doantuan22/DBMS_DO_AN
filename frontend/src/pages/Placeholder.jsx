import { Link } from 'react-router-dom';

export default function Placeholder({ title }) {
  const isAccount = title?.toLowerCase().includes('customer') || title?.toLowerCase().includes('khách hàng');

  if (isAccount) {
    return (
      <section className="catalog-page" style={{ maxWidth: '40rem', margin: '2rem auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Tài khoản khách hàng</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
          Chào mừng bạn đến với khu vực tài khoản. Chọn một tác vụ dưới đây để tiếp tục:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))', gap: '1rem' }}>
          <Link to="/" className="catalog-button catalog-button--secondary" style={{ padding: '1rem' }}>
            🏠 Trang chủ
          </Link>
          <Link to="/orders" className="catalog-button" style={{ padding: '1rem' }}>
            🎟️ Đơn đặt vé của tôi
          </Link>
          <Link to="/profile" className="catalog-button catalog-button--secondary" style={{ padding: '1rem' }}>
            👤 Hồ sơ cá nhân
          </Link>
          <Link to="/complaints" className="catalog-button catalog-button--secondary" style={{ padding: '1rem' }}>
            💬 Gửi khiếu nại
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="catalog-page" style={{ maxWidth: '36rem', margin: '3rem auto', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
      <h2>{title || '404 - Không tìm thấy trang'}</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
        Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <Link to="/" className="catalog-button">
          Về trang chủ
        </Link>
        <Link to="/movies" className="catalog-button catalog-button--secondary">
          Xem lịch chiếu phim
        </Link>
      </div>
    </section>
  );
}
