export function LoadingState({ children = 'Đang tải dữ liệu…' }) {
  return (
    <p className="catalog-state" role="status">
      {children}
    </p>
  );
}

export function EmptyState({ children = 'Chưa có dữ liệu phù hợp.' }) {
  return (
    <p className="catalog-state" role="status">
      {children}
    </p>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <section className="catalog-state catalog-state--error" role="alert">
      <p>
        {error?.status === 404
          ? 'Không tìm thấy nội dung yêu cầu.'
          : 'Không thể tải dữ liệu lúc này.'}
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </section>
  );
}
