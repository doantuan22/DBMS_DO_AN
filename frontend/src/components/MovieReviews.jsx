import { userCanAct } from '../utils/authorization';
import { formatDateTime } from '../utils/dateTime';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createReview, getReviews } from '../api/feedbackApi';
import { useAuth } from '../context/AuthContext';
import { EmptyState, ErrorState, LoadingState } from './CatalogStates';

function errorMessage(error) {
  if (error?.code === 'REVIEW_NOT_ELIGIBLE') return 'Bạn chỉ có thể đánh giá sau khi đã xem phim.';
  if (error?.code === 'REVIEW_ALREADY_EXISTS') return 'Bạn đã đánh giá phim này.';
  return error?.message ?? 'Không thể gửi đánh giá.';
}

export default function MovieReviews({ movieId }) {
  const { user } = useAuth();
  const scope = `${movieId}:${user?.userId}:${user?.permissions?.map(item => item.code).sort().join(',')}`;
  return <ReviewContext key={scope} movieId={movieId} />;
}

function ReviewContext({ movieId }) {
  const { user } = useAuth();
  const canReview = userCanAct(user, 'KHACH_HANG', 'DANH_GIA');
  const [resource, setResource] = useState({ status: 'loading' });
  const [rating, setRating] = useState('5');
  const [content, setContent] = useState('');
  const [submit, setSubmit] = useState({ status: 'idle' });
  const mounted = useRef(true);
  const readGeneration = useRef(0);
  const writePending = useRef(false);
  const errorFeedback = useRef(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; readGeneration.current++; }; }, []);
  useEffect(() => { if (submit.status === 'error') errorFeedback.current?.focus(); }, [submit.status]);
  const load = useCallback(async () => {
    const request = ++readGeneration.current;
    setResource({ status: 'loading' });
    try { const result = await getReviews(movieId); if (mounted.current && request === readGeneration.current) setResource({ status: 'success', data: result.reviews }); }
    catch (error) { if (mounted.current && request === readGeneration.current) setResource({ status: 'error', error }); }
  }, [movieId]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  async function onSubmit(event) {
    event.preventDefault(); if (!canReview || writePending.current) return;
    writePending.current = true; setSubmit({ status: 'loading' });
    try {
      await createReview(movieId, { rating: Number(rating), content: content || null });
      if (!mounted.current) return;
      setContent(''); setSubmit({ status: 'success', message: 'Đã gửi đánh giá.' }); await load();
    } catch (error) { if (mounted.current) setSubmit({ status: 'error', message: errorMessage(error) }); }
    finally { writePending.current = false; }
  }
  return <section className="catalog-section" aria-labelledby="movie-reviews"><h2 id="movie-reviews">Đánh giá</h2>
    {resource.status === 'loading' && <LoadingState>Đang tải đánh giá…</LoadingState>}{resource.status === 'error' && <ErrorState error={resource.error} onRetry={load} />}
    {resource.status === 'success' && resource.data.length === 0 && <EmptyState>Chưa có đánh giá.</EmptyState>}{resource.status === 'success' && resource.data.length > 0 && <div className="review-list">{resource.data.map((review) => <article className="review-card" key={review.id}><strong>{review.reviewerName} · {review.rating}/5</strong>{review.content && <p>{review.content}</p>}<small>{formatDateTime(review.createdAt)}</small></article>)}</div>}
    {canReview && <form className="catalog-form" onSubmit={onSubmit}><h3>Viết đánh giá</h3><label>Điểm <select value={rating} onChange={(event) => setRating(event.target.value)} disabled={submit.status === 'loading'}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}/5</option>)}</select></label><label>Nội dung (không bắt buộc)<textarea value={content} maxLength="1000" onChange={(event) => setContent(event.target.value)} disabled={submit.status === 'loading'} /></label>{submit.status === 'error' && <p role="alert" tabIndex="-1" ref={errorFeedback}>{submit.message}</p>}{submit.status === 'success' && <p role="status">{submit.message}</p>}<button className="catalog-button" type="submit" disabled={submit.status === 'loading'}>{submit.status === 'loading' ? 'Đang gửi…' : 'Gửi đánh giá'}</button></form>}
    {!user && <p>Đăng nhập với tài khoản khách hàng để gửi đánh giá.</p>}
  </section>;
}
