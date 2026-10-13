import { formatApiValue } from '../utils/dateTime';
import { EmptyState } from './CatalogStates';

function RevenueTable({ title, rows, identity }) {
  return (
    <section className="catalog-section">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <EmptyState>Không có dữ liệu trong kỳ này.</EmptyState>
      ) : (
        <div className="catalog-table-wrap">
          <table className="catalog-table">
            <thead>
              <tr>
                {Object.keys(rows[0]).map((field) => (
                  <th key={field}>{field}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={identity === 'summary' ? 'summary' : row[identity]}>
                  {Object.entries(row).map(([field, value]) => (
                    <td key={field}>{formatApiValue(value)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function AdminRevenue({ report }) {
  return (
    <>
      <RevenueTable
        title="Tổng hợp doanh thu"
        rows={report.summary ? [report.summary] : []}
        identity="summary"
      />
      <RevenueTable title="Theo rạp" rows={report.byCinema ?? []} identity="RapID" />
      <RevenueTable title="Theo phim" rows={report.byMovie ?? []} identity="PhimID" />
      <RevenueTable title="Theo ngày" rows={report.byDate ?? []} identity="Ngay" />
    </>
  );
}
