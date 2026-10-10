import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCinemas, getCinemaImages } from '../api/catalogApi';
import { ErrorState, LoadingState } from '../components/CatalogStates';
import CinemaGallery from '../components/CinemaGallery';

export default function CinemaDetail() {
  const { cinemaId } = useParams();
  const [attempt, setAttempt] = useState(0);
  const [cinema, setCinema] = useState({ status: 'loading' });
  const [gallery, setGallery] = useState({ status: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    const key = `${cinemaId}:${attempt}`;
    getCinemas({}, { signal: controller.signal })
      .then((rows) => {
        if (controller.signal.aborted) return;
        const data = rows.find((row) => String(row.id) === cinemaId);
        setCinema(
          data
            ? { status: 'success', data, key }
            : { status: 'error', error: { status: 404 }, key },
        );
      })
      .catch((error) => {
        if (!controller.signal.aborted) setCinema({ status: 'error', error, key });
      });
    getCinemaImages(cinemaId, { signal: controller.signal })
      .then((images) => {
        if (!controller.signal.aborted) setGallery({ status: 'success', images, key });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setGallery({ status: 'error', error, key });
      });
    return () => controller.abort();
  }, [cinemaId, attempt]);
  const key = `${cinemaId}:${attempt}`;
  const currentCinema = cinema.key === key ? cinema : { status: 'loading' };
  const currentGallery = gallery.key === key ? gallery : { status: 'loading' };
  return (
    <section className="catalog-page">
      <Link className="catalog-back" to="/cinemas">
        ← Danh sách rạp
      </Link>
      {currentCinema.status === 'loading' && <LoadingState>Đang tải rạp…</LoadingState>}
      {currentCinema.status === 'error' && (
        <ErrorState error={currentCinema.error} onRetry={() => setAttempt((value) => value + 1)} />
      )}
      {currentCinema.status === 'success' && (
        <>
          <p className="catalog-eyebrow">{currentCinema.data.city}</p>
          <h1>{currentCinema.data.name}</h1>
          <p>{currentCinema.data.address}</p>
          <p>{currentCinema.data.description}</p>
          {currentCinema.data.phone && (
            <a href={`tel:${currentCinema.data.phone}`}>{currentCinema.data.phone}</a>
          )}
          {currentGallery.status === 'loading' && <LoadingState>Đang tải ảnh rạp…</LoadingState>}
          {currentGallery.status === 'error' && (
            <ErrorState
              error={currentGallery.error}
              onRetry={() => setAttempt((value) => value + 1)}
            />
          )}
          {currentGallery.status === 'success' && (
            <CinemaGallery images={currentGallery.images} cinemaName={currentCinema.data.name} />
          )}
        </>
      )}
    </section>
  );
}
