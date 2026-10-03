import { useEffect, useState } from 'react';
import { formatDateTime, remainingHoldSeconds } from '../utils/dateTime';

export default function HoldDeadline({ deadline }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!deadline) return null;
  const seconds = remainingHoldSeconds(deadline, now);
  return <span>Giữ ghế đến: {formatDateTime(deadline)} · Còn {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span>;
}
