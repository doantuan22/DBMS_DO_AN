import { Link } from 'react-router-dom';
import { formatTime } from '../../utils/dateTime';
import { customerMoney } from '../customer/customerFormatting';

export default function ShowtimeTimeChip({ showtime }) {
  return (
    <Link
      className="cp-time-chip"
      to={`/booking/${showtime.id}`}
      aria-label={`Chọn suất ${formatTime(showtime.startsAt)}, ${showtime.cinemaName}, ${showtime.roomName}, ${showtime.format}`}
    >
      <strong>{formatTime(showtime.startsAt)}</strong>
      <span>
        {showtime.format} · {showtime.roomName}
      </span>
      {Number.isFinite(showtime.basePrice) && (
        <small>Giá cơ bản {customerMoney(showtime.basePrice)}</small>
      )}
      {Number.isFinite(showtime.availableSeats) && (
        <small>{showtime.availableSeats} ghế trống khi tải</small>
      )}
    </Link>
  );
}
