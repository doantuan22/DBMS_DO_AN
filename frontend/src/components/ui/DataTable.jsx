import AsyncState from './AsyncState';

export default function DataTable({
  columns = [],
  rows = [],
  getRowKey = (row, index) => row?.id ?? index,
  caption = 'Danh sách dữ liệu',
  status = 'success',
  emptyMessage = 'Chưa có dữ liệu phù hợp.',
  error,
  onRetry,
  label = caption,
  className = '',
}) {
  if (status !== 'success' || rows.length === 0) {
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

  return (
    <div className="ui-data-table-scroll" role="region" aria-label={label} tabIndex={0}>
      <table className={['ui-data-table', className].filter(Boolean).join(' ')} aria-busy="false">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
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
          {rows.map((row, rowIndex) => (
            <tr key={getRowKey(row, rowIndex)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={column.className}
                  style={column.align ? { textAlign: column.align } : undefined}
                >
                  {column.render ? column.render(row, rowIndex) : row?.[column.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
