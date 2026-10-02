export default function CinemaList({ cinemas }) {
  return (
    <div className="cinema-grid">
      {cinemas.map((cinema) => (
        <article className="cinema-card" key={cinema.id}>
          {cinema.coverImageUrl
            ? <img className="cinema-card__image" src={cinema.coverImageUrl} alt={`Ảnh đại diện ${cinema.name}`} />
            : <div className="cinema-card__image cinema-card__image--placeholder" aria-label="Chưa có ảnh đại diện">Chưa có ảnh</div>}
          <span className="cinema-card__city">{cinema.city}</span>
          <h2>{cinema.name}</h2>
          <p>{cinema.address}</p>
          {cinema.phone && <p><a href={`tel:${cinema.phone}`}>{cinema.phone}</a></p>}
          {cinema.description && <p className="catalog-muted">{cinema.description}</p>}
        </article>
      ))}
    </div>
  );
}
