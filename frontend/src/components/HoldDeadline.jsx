import { useEffect, useRef, useState } from 'react';
import { formatDateTime, remainingHoldSeconds } from '../utils/dateTime';

export default function HoldDeadline({ deadline, onElapsed }) {
  const [now, setNow] = useState(() => Date.now());
  const reported = useRef(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (deadline && remainingHoldSeconds(deadline, now) === 0 && reported.current !== deadline) {
      reported.current = deadline;
      onElapsed?.();
    }
  }, [deadline, now, onElapsed]);
  if (!deadline) return null;
  const seconds = remainingHoldSeconds(deadline, now);
  return (
    <span className="hold-deadline">
      ⏱ Giữ ghế đến: {formatDateTime(deadline)} · Còn{' '}
      <strong>
        {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
      </strong>
    </span>
  );
}
