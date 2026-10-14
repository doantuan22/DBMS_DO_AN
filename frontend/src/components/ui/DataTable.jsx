import Button from './Button';
import AsyncState from './AsyncState';

export default function ResourceTable({
  columns = [],
  rows = [],
  getRowKey = (row, index) => row?.id ?? index,
  rowKey,
  pagination,
  rowNumberLabel = 'STT',
  caption = 'Danh sách dữ liệu',
  status = 'success',
  emptyMessage = 'Chưa có dữ liệu phù hợp.',
  error,
  onRetry,
  label = caption,
  className = '',
}) {
  const tableRows = Array.isArray(rows) ? rows : [];
  const tableColumns = (Array.isArray(columns) ? columns : []).filter(
    (column) => column && typeof column.key === 'string' && column.label !== undefined,
  );

  if (status !== 'success' || tableRows.length === 0) {
    const visibleStatus = status === 'success' ? 'empty' : status;
    return (
      <AsyncState
        status={visibleStatus}
        emptyMessage={emptyMessage}
        error={error}
        onRetry={onRetry}
      />
    );
  }

  if (tableColumns.length === 0) {
    return <AsyncState status="error" errorMessage="Cấu hình cột của bảng chưa hợp lệ." />;
  }

  const page = Number(pagination?.page);
  const pageSize = Number(pagination?.pageSize);
  const total = Number(pagination?.total);
  const canPaginate =
    Number.isSafeInteger(page) &&
    page > 0 &&
    Number.isSafeInteger(pageSize) &&
    pageSize > 0 &&
    Number.isSafeInteger(total) &&
    total >= 0 &&
    typeof pagination?.onPageChange === 'function';
  const pageCount = canPaginate ? Math.max(1, Math.ceil(total / pageSize)) : 0;
  const resolveRowKey = (row, index) => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    if (typeof rowKey === 'string') return row?.[rowKey] ?? index;
    return getRowKey(row, index);
  };

  return (
    <div className="ui-resource-table">
      <div className="ui-data-table-scroll" role="region" aria-label={label} tabIndex={0}>
        <table className={['ui-data-table', className].filter(Boolean).join(' ')} aria-busy="false">
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="ui-data-table__row-number">
                {rowNumberLabel}
              </th>
              {tableColumns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={column.className}
                  style={column.align ? { textAlign: column.align } : undefined}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, rowIndex) => (
              <tr key={resolveRowKey(row, rowIndex)}>
                <td className="ui-data-table__row-number">
                  {(canPaginate ? (page - 1) * pageSize : 0) + rowIndex + 1}
                </td>
                {tableColumns.map((column) => (
                  <td
                    key={column.key}
                    className={column.className}
                    style={column.align ? { textAlign: column.align } : undefined}
                  >
                    {typeof column.render === 'function'
                      ? column.render(row, rowIndex)
                      : (row?.[column.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canPaginate && (
        <nav className="ui-resource-table__pagination" aria-label={`Phân trang ${caption}`}>
          <Button
            variant="secondary"
            size="sm"
            disabled={pagination.disabled || page <= 1}
            onClick={() => pagination.onPageChange(page - 1)}
          >
            Trang trước
          </Button>
          <span aria-live="polite">
            Trang {page} / {pageCount} · {total} kết quả
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={pagination.disabled || page >= pageCount}
            onClick={() => pagination.onPageChange(page + 1)}
          >
            Trang sau
          </Button>
        </nav>
      )}
    </div>
  );
}
