import { Link } from 'react-router-dom';
import MediaFrame from '../features/customer/MediaFrame';

export default function CinemaList({ cinemas, layout = 'grid', headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;
  return (
    <div className={`cinema-grid cinema-grid--${layout}`}>
      {cinemas.map((cinema) => (
        <article className="cinema-card" key={cinema.id}>
          <Link
            className="cinema-card__image"
            to={`/cinemas/${cinema.id}`}
            aria-label={`Xem lịch chiếu tại ${cinema.name}`}
          >
            <MediaFrame
              src={cinema.coverImageUrl}
              alt={`Ảnh đại diện ${cinema.name}`}
              kind="cinema"
            />
            {cinema.description?.toLocaleLowerCase('vi-VN').includes('minh họa') && (
              <span className="cinema-card__image-label">Ảnh minh họa · rạp demo</span>
            )}
          </Link>
          <div className="cinema-card__body">
            <span className="cinema-card__city">{cinema.city}</span>
            <Heading>{cinema.name}</Heading>
            <p>{cinema.address}</p>
            {cinema.phone && (
              <p>
                <a href={`tel:${cinema.phone}`}>{cinema.phone}</a>
              </p>
            )}
            {cinema.description && (
              <details className="cinema-card__source">
                <summary>Thông tin rạp & nguồn ảnh</summary>
                <p>{cinema.description}</p>
              </details>
            )}
            <Link className="catalog-button catalog-button--secondary" to={`/cinemas/${cinema.id}`}>
              Xem lịch chiếu <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
