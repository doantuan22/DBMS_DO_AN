import Button from './Button';

export default function AsyncState({
  status = 'idle',
  children,
  loadingMessage = 'Đang tải dữ liệu…',
  emptyMessage = 'Chưa có dữ liệu phù hợp.',
  error,
  errorMessage,
  onRetry,
}) {
  if (status === 'idle') return null;
  if (status === 'success') return children ?? null;

  if (status === 'loading') {
    return (
      <p className="ui-async-state" role="status" aria-live="polite">
        <span className="ui-async-state__spinner" aria-hidden="true" />
        {loadingMessage}
      </p>
    );
  }

  if (status === 'empty') {
    return (
      <p className="ui-async-state" role="status">
        {emptyMessage}
      </p>
    );
  }

  if (status === 'error') {
    return (
      <section className="ui-async-state ui-async-state--error" role="alert">
        <p>
          {errorMessage ??
            (error?.status === 404
              ? 'Không tìm thấy nội dung yêu cầu.'
              : error?.message || 'Không thể tải dữ liệu lúc này.')}
        </p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Thử lại
          </Button>
        )}
      </section>
    );
  }

  return null;
}
