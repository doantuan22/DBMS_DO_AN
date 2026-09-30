import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getShowtimeDetail } from '../api/catalogApi';
import { ErrorState, LoadingState } from '../components/CatalogStates';

export default function BookingPreparation() {
  const { showtimeId } = useParams();
  const [state, setState] = useState({ status: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    getShowtimeDetail(showtimeId, { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setState({ status: 'success', data: result }); })
      .catch((error) => { if (!controller.signal.aborted) setState({ status: 'error', error }); });
    return () => controller.abort();
  }, [showtimeId]);

  if (state.status === 'loading') return <LoadingState>Đang xác nhận suất chiếu…</LoadingState>;
  if (state.status === 'error') return <ErrorState error={state.error} />;
  const showtime = state.data;
  return (
    <section className="catalog-page booking-preparation">
      <p className="catalog-eyebrow">SUẤT CHIẾU ĐÃ CHỌN</p>
      <h1>{showtime.movieTitle}</h1>
      <p>{showtime.cinemaName} · {showtime.roomName} · {showtime.format}</p>
      <p>{showtime.date} · {showtime.startTime}{showtime.endTime ? ` – ${showtime.endTime}` : ''}</p>
      <p className="catalog-muted">Mã suất chiếu: {showtime.id}</p>
      <div className="phase-note">Chọn ghế sẽ được triển khai ở Phase 4.</div>
      <Link className="catalog-button catalog-button--secondary" to={`/movies/${showtime.movieId}`}>Quay lại lịch chiếu</Link>
    </section>
  );
}
