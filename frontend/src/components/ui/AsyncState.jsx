import Button from './Button';

export default function AsyncState({
  status = 'idle',
  children,
  loadingMessage = 'Đang tải dữ liệu…',
  emptyMessage = 'Chưa có dữ liệu phù hợp.',
  error,
  errorMessage,
  onRetry,
  forbiddenMessage = 'Bạn không có quyền xem dữ liệu này.',
  notFoundMessage = 'Không tìm thấy nội dung yêu cầu.',
  conflictMessage = 'Dữ liệu đã thay đổi. Hãy tải lại trước khi tiếp tục.',
}) {
  if (status === 'idle') return null;
  if (status === 'success') return children ?? null;

  const errorStatus = Number(error?.status);
  const resolvedStatus =
    status === 'error'
      ? errorStatus === 401 || errorStatus === 403
        ? 'forbidden'
        : errorStatus === 404
          ? 'notFound'
          : errorStatus === 409
            ? 'conflict'
            : 'error'
      : status;

  if (resolvedStatus === 'loading') {
    return (
      <p className="ui-async-state" role="status" aria-live="polite">
        <span className="ui-async-state__spinner" aria-hidden="true" />
        {loadingMessage}
      </p>
    );
  }

  if (resolvedStatus === 'empty') {
    return (
      <p className="ui-async-state" role="status">
        {emptyMessage}
      </p>
    );
  }

  if (['error', 'forbidden', 'notFound', 'conflict'].includes(resolvedStatus)) {
    const stateMessages = {
      forbidden: forbiddenMessage,
      notFound: notFoundMessage,
      conflict: conflictMessage,
    };
    const message =
      errorMessage ??
      stateMessages[resolvedStatus] ??
      error?.message ??
      'Không thể tải dữ liệu lúc này.';

    return (
      <section
        className={`ui-async-state ui-async-state--${resolvedStatus}`}
        role={resolvedStatus === 'notFound' ? 'status' : 'alert'}
      >
        <p>{message}</p>
        {onRetry && resolvedStatus === 'error' && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Thử lại
          </Button>
        )}
      </section>
    );
  }

  return null;
}
