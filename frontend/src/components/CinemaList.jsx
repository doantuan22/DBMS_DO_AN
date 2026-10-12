import { Link } from 'react-router-dom';
import MediaFrame from '../features/customer/MediaFrame';

export default function CinemaList({ cinemas }) {
  return (
    <div className="cinema-grid">
      {cinemas.map((cinema) => (
        <article className="cinema-card" key={cinema.id}>
          <MediaFrame
            src={cinema.coverImageUrl}
            alt={`Ảnh đại diện ${cinema.name}`}
            kind="cinema"
          />
          <span className="cinema-card__city">{cinema.city}</span>
          <h2>{cinema.name}</h2>
          <p>{cinema.address}</p>
          {cinema.phone && (
            <p>
              <a href={`tel:${cinema.phone}`}>{cinema.phone}</a>
            </p>
          )}
          {cinema.description && <p className="catalog-muted">{cinema.description}</p>}
          <Link className="catalog-button catalog-button--secondary" to={`/cinemas/${cinema.id}`}>
            Xem rạp & lịch chiếu <span aria-hidden="true">↗</span>
          </Link>
        </article>
      ))}
    </div>
  );
}
