import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMovies } from '../api/catalogApi';
import MovieGrid from '../components/MovieGrid';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';
import { loadResource } from '../services/catalogResource';
import MediaFrame from '../features/customer/MediaFrame';
import { movieGroups } from '../features/customer/discoveryModel';
import '../features/customer/customer-discovery.css';

export default function Home() {
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    loadResource(() => getMovies({}, { signal: controller.signal })).then((result) => {
      if (!controller.signal.aborted) setState({ ...result, attempt });
    });
    return () => controller.abort();
  }, [attempt]);
  const resource = state.attempt === attempt ? state : { status: 'loading' };
  const featured = resource.status === 'success' ? resource.data[0] : null;

  return (
    <div className="catalog-page customer-discovery">
      <section className="customer-hero">
        <div className="customer-hero__copy"><p className="catalog-eyebrow">CINEMA STAR · HẸN NHAU TẠI RẠP</p><h1>Chọn phim hay, tìm suất chiếu phù hợp</h1><p>Một câu chuyện mới, một buổi xem phim trọn vẹn. Khám phá phim và chọn lịch chiếu phù hợp với bạn.</p><div className="catalog-actions"><Link className="catalog-button" to="/movies">Khám phá phim</Link><Link className="catalog-button catalog-button--secondary" to="/cinemas">Tìm rạp chiếu</Link></div></div>
        {featured && <Link className="customer-hero__poster" to={`/movies/${featured.id}`} aria-label={`Khám phá ${featured.title}`}><MediaFrame src={featured.posterUrl} alt={`Poster ${featured.title}`} priority /><p>{featured.title}</p></Link>}
      </section>
      <section className="catalog-section">
        <div className="catalog-section-heading">
          <div>
            <p className="catalog-eyebrow">DANH MỤC</p>
            <h2>Phim</h2>
          </div>
          <Link to="/movies">Xem tất cả</Link>
        </div>
        {resource.status === 'loading' && <LoadingState>Đang tải danh sách phim…</LoadingState>}
        {resource.status === 'empty' && <EmptyState>Hiện chưa có phim trong danh mục.</EmptyState>}
        {resource.status === 'error' && (
          <ErrorState error={resource.error} onRetry={() => setAttempt((value) => value + 1)} />
        )}
        {resource.status === 'success' && movieGroups(resource.data).map(([label, movies]) => <section key={label} aria-label={label}><div className="catalog-section-heading"><h3>{label}</h3><Link to={`/movies${['Đang chiếu', 'Sắp chiếu'].includes(label) ? `?status=${encodeURIComponent(label)}` : ''}`}>Xem thêm</Link></div><MovieGrid movies={movies.slice(0, 8)} headingLevel={4} /></section>)}
      </section>
      <section className="customer-discovery__cinemas"><div><p className="catalog-eyebrow">KHÔNG GIAN ĐIỆN ẢNH</p><h2>Tìm rạp cho buổi hẹn của bạn</h2><p>Xem địa chỉ, hình ảnh và lịch chiếu tại rạp.</p></div><Link className="catalog-button" to="/cinemas">Khám phá rạp chiếu</Link></section>
      <section aria-labelledby="booking-steps"><h2 id="booking-steps">Từ chọn phim đến chỗ ngồi</h2><ol className="customer-discovery__steps"><li><strong>01 · Chọn phim và suất</strong><p>Tìm lịch chiếu theo rạp và ngày phù hợp.</p></li><li><strong>02 · Chọn chỗ ngồi</strong><p>Xem sơ đồ ghế và chọn sản phẩm cho buổi xem.</p></li><li><strong>03 · Xác nhận và thanh toán</strong><p>Kiểm tra đơn và hoàn tất thanh toán trong thời gian giữ chỗ.</p></li></ol></section>
    </div>
  );
}
