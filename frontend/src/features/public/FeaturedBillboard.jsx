import { Link } from 'react-router-dom';
import MediaFrame from '../customer/MediaFrame';
export default function FeaturedBillboard({ movie, description }) {
  return (
    <section
      className={`cp-billboard${movie ? '' : ' cp-billboard--empty'}`}
      aria-labelledby="billboard-title"
    >
      <div className="cp-billboard__inner">
        <div className="cp-billboard__copy">
          <p className="catalog-eyebrow">CINEMASTAR / TRÊN MÀN ẢNH LỚN</p>
          {movie?.status && (
            <p className="cp-billboard__status">
              <span aria-hidden="true" />
              {movie.status}
            </p>
          )}
          <h1 id="billboard-title">{movie?.title ?? 'Chọn một bộ phim cho buổi hẹn tiếp theo'}</h1>
          {movie && (
            <p className="cp-film-meta">
              {[
                movie.ageRating,
                movie.durationMinutes ? `${movie.durationMinutes} phút` : null,
                ...(movie.genres ?? []),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          <p className="cp-billboard__synopsis">
            {description ||
              'Chọn câu chuyện bạn muốn xem. Tìm một suất chiếu phù hợp và dành chỗ cho buổi hẹn tại rạp.'}
          </p>
          <div className="catalog-actions">
            <a className="catalog-button" href={movie ? '#home-schedule' : '/movies'}>
              Chọn suất chiếu <span aria-hidden="true">→</span>
            </a>
            {movie && (
              <Link className="catalog-button catalog-button--secondary" to={`/movies/${movie.id}`}>
                Chi tiết phim
              </Link>
            )}
          </div>
        </div>
        {movie && (
          <div className="cp-billboard__art">
            <MediaFrame
              src={movie.posterUrl}
              title={movie.title}
              alt={`Poster ${movie.title}`}
              priority
            />
            <p className="cp-billboard__art-caption">
              {movie.director ? `Đạo diễn · ${movie.director}` : 'Phim tại CinemaStar'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
