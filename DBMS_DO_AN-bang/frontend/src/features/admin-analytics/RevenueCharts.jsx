import { useId } from 'react';
import { formatDate } from '../../utils/dateTime';
import { money } from '../admin-resources/resourceModel';

const compactMoney = (value) =>
  new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
export function RevenueTrend({ rows = [] }) {
  const gradientId = useId().replace(/:/g, '');
  const points = [...rows]
    .filter((row) => row.DoanhThuThucTe != null && Number.isFinite(Number(row.DoanhThuThucTe)))
    .sort((a, b) => String(a.Ngay).localeCompare(String(b.Ngay)));
  if (!points.length)
    return <p className="admin-analytics__report-note">Không có khoản thu trong kỳ đã chọn.</p>;
  const width = 680,
    height = 275,
    left = 64,
    right = 18,
    top = 24,
    bottom = 42;
  const values = points.map((row) => Number(row.DoanhThuThucTe));
  const max = Math.max(1, ...values) * 1.12,
    min = Math.min(0, ...values);
  const y = (value) => top + ((max - value) / (max - min)) * (height - top - bottom);
  const x = (index) =>
    points.length === 1
      ? (left + width - right) / 2
      : left + (index / (points.length - 1)) * (width - left - right);
  const line = points
    .map((row, index) => `${index ? 'L' : 'M'}${x(index)},${y(Number(row.DoanhThuThucTe))}`)
    .join(' ');
  const area = `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const labels = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  return (
    <figure className="admin-revenue-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Tiền thực thu theo ngày: ${points.length} ngày có dữ liệu. Xem giá trị chính xác ở bảng Theo ngày.`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity=".2" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity=".01" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((tick) => {
          const value = min + ((max - min) * tick) / 4;
          return (
            <g key={tick}>
              <line
                className="admin-revenue-chart__grid"
                x1={left}
                x2={width - right}
                y1={y(value)}
                y2={y(value)}
              />
              <text x={left - 12} y={y(value) + 4} textAnchor="end">
                {compactMoney(value)}
              </text>
            </g>
          );
        })}
        <path d={area} fill={`url(#${gradientId})`} />
        <path className="admin-revenue-chart__line" d={line} />
        {points.map((row, index) => (
          <circle
            className="admin-revenue-chart__point"
            key={`${row.Ngay}:${index}`}
            cx={x(index)}
            cy={y(Number(row.DoanhThuThucTe))}
            r={points.length > 40 ? 2 : 4}
          >
            <title>{`${formatDate(row.Ngay)}: ${money(row.DoanhThuThucTe)}`}</title>
          </circle>
        ))}
        {labels.map((index) => (
          <text
            key={index}
            x={x(index)}
            y={height - 12}
            textAnchor={
              points.length === 1
                ? 'middle'
                : index === 0
                  ? 'start'
                  : index === points.length - 1
                    ? 'end'
                    : 'middle'
            }
          >
            {formatDate(points[index].Ngay)}
          </text>
        ))}
      </svg>
      <figcaption>
        Chỉ nối các ngày có dữ liệu; ngày thiếu không được tính là 0. Xem số liệu chính xác trong
        bảng theo ngày.
      </figcaption>
    </figure>
  );
}

export function RevenueMix({ summary = {} }) {
  const tickets = Number(summary.TongDoanhThuVe),
    food = Number(summary.TongDoanhThuDoAn);
  const valid =
    summary.TongDoanhThuVe != null &&
    summary.TongDoanhThuDoAn != null &&
    Number.isFinite(tickets) &&
    Number.isFinite(food) &&
    tickets >= 0 &&
    food >= 0;
  const gross = valid ? tickets + food : 0,
    ratio = gross ? tickets / gross : 0;
  const circumference = 2 * Math.PI * 70;
  return (
    <div className="admin-revenue-mix">
      <div className="admin-revenue-mix__ring">
        <svg
          viewBox="0 0 180 180"
          role="img"
          aria-label={
            gross
              ? `Tiền vé chiếm ${Math.round(ratio * 100)}% giá trị trước giảm giá`
              : 'Chưa có giá trị đơn để tính cơ cấu'
          }
        >
          <circle
            cx="90"
            cy="90"
            r="70"
            fill="none"
            stroke="var(--color-surface-alt)"
            strokeWidth="18"
          />
          {gross > 0 && (
            <>
              <circle cx="90" cy="90" r="70" fill="none" stroke="#9cb9ff" strokeWidth="18" />
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="18"
                strokeDasharray={`${ratio * circumference} ${circumference}`}
              />
            </>
          )}
        </svg>
        <div className="admin-revenue-mix__center">
          <strong>{gross ? `${Math.round(ratio * 100)}%` : '—'}</strong>
          <span>{gross ? 'Tỷ trọng tiền vé' : 'Chưa có dữ liệu'}</span>
        </div>
      </div>
      <dl className="admin-revenue-mix__legend">
        <div>
          <dt>
            <span className="admin-revenue-mix__dot" />
            Tiền vé
          </dt>
          <dd>{money(summary.TongDoanhThuVe)}</dd>
        </div>
        <div>
          <dt>
            <span className="admin-revenue-mix__dot admin-revenue-mix__dot--food" />
            Đồ ăn
          </dt>
          <dd>{money(summary.TongDoanhThuDoAn)}</dd>
        </div>
        <div>
          <dt>Giảm giá</dt>
          <dd>{money(summary.TongTienGiam)}</dd>
        </div>
      </dl>
      <p className="admin-revenue-mix__note">
        Cơ cấu theo snapshot giá trị đơn trước giảm giá. Tiền thực thu được thể hiện riêng trong báo
        cáo.
      </p>
    </div>
  );
}
