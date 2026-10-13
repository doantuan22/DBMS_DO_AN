import { Link } from 'react-router-dom';
import MediaFrame from '../customer/MediaFrame';
import { filmMetadata, synopsisExcerpt } from './filmPresentation';
import { trailerUrl } from './mediaPolicy';

export default function FeaturedBillboard({ movie, description, loading = false }) {
  const synopsis = synopsisExcerpt(description);
  const metadata = filmMetadata(movie);
  return (
    <section
      className={`cp-billboard cp-billboard--poster${movie ? '' : ' cp-billboard--empty'}`}
      aria-labelledby="billboard-title"
      aria-busy={loading || undefined}
    >
      <div className="cp-billboard__inner">
        <div className="cp-billboard__copy">
          <p className="catalog-eyebrow">TRÊN MÀN ẢNH LỚN</p>
          {movie?.status && (
            <p className="cp-billboard__status">
              <span aria-hidden="true" />
              {movie.status}
            </p>
          )}
          <h1 id="billboard-title">
            {movie?.title ?? (loading ? 'Đang tải phim…' : 'Buổi hẹn bắt đầu từ một bộ phim')}
          </h1>
          {metadata.length > 0 && (
            <ul className="cp-film-meta" aria-label="Thông tin phim">
              {metadata.map((value, index) => (
                <li key={`${index}:${value}`}>{value}</li>
              ))}
            </ul>
          )}
          {synopsis && <p className="cp-billboard__synopsis">{synopsis}</p>}
          {!movie && !loading && (
            <p className="cp-billboard__synopsis">
              Khám phá danh mục phim và tìm lịch chiếu phù hợp với bạn.
            </p>
          )}
          <div className="catalog-actions">
            {movie ? (
              <a className="catalog-button" href="#home-schedule">
                Chọn suất chiếu <span aria-hidden="true">→</span>
              </a>
            ) : (
              !loading && (
                <Link className="catalog-button" to="/movies">
                  Xem danh mục phim <span aria-hidden="true">→</span>
                </Link>
              )
            )}
            {movie && (
              <Link className="catalog-button catalog-button--secondary" to={`/movies/${movie.id}`}>
                Chi tiết phim
              </Link>
            )}
          </div>
          {movie?.director && (
            <p className="cp-billboard__director">
              Một bộ phim của <strong>{movie.director}</strong>
            </p>
          )}
          {trailerUrl(movie?.trailerUrl) && (
            <a
              className="cp-billboard__trailer"
              href={movie.trailerUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span aria-hidden="true">▷</span> Xem trailer
            </a>
          )}
        </div>
        {movie && (
          <figure className="cp-billboard__art">
            <div className="cp-billboard__art-stage">
              <MediaFrame
                src={movie.posterUrl}
                title={movie.title}
                alt={`Poster ${movie.title}`}
                priority
              />
            </div>
            <figcaption className="cp-billboard__art-caption">
              <span>Poster · {movie.title}</span>
              {description && (
                <details className="cp-artwork-source">
                  <summary>Thông tin phim & nguồn ảnh</summary>
                  <p>{description}</p>
                </details>
              )}
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
