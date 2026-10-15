import { useEffect, useRef, useState } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import { formatDate, businessDate } from '../../utils/dateTime';

export default function DateRail({ dates, selected, onSelect, label = 'Ngày có suất chiếu' }) {
  const ref = useRef(null);
  const [overflow, setOverflow] = useState(false);
  const [navigation, setNavigation] = useState({ previous: false, next: false });
  useEffect(() => {
    const el = ref.current;
    const update = () => {
      setOverflow(el.scrollWidth > el.clientWidth + 2);
      setNavigation({
        previous: el.scrollLeft > 2,
        next: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();
    el.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', update);
    };
  }, [dates]);
  const move = (direction) =>
    ref.current.scrollBy({
      left: direction * ref.current.clientWidth * 0.75,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  return (
    <div className="cp-date-control">
      <div ref={ref} className="cp-date-strip" role="group" aria-label={label}>
        {dates.map((day) => (
          <button
            key={day}
            type="button"
            aria-pressed={day === selected}
            disabled={day < businessDate()}
            onClick={() => onSelect(day)}
          >
            <span>
              {day === businessDate()
                ? 'Hôm nay'
                : Temporal.PlainDate.from(day).toLocaleString('vi-VN', { weekday: 'short' })}
            </span>
            <strong>{formatDate(day)}</strong>
          </button>
        ))}
      </div>
      {overflow && (
        <div className="cp-date-arrows">
          <button
            type="button"
            aria-label={`Cuộn ${label.toLocaleLowerCase('vi-VN')} về trước`}
            onClick={() => move(-1)}
            disabled={!navigation.previous}
          >
            ←
          </button>
          <button
            type="button"
            aria-label={`Cuộn ${label.toLocaleLowerCase('vi-VN')} tiếp theo`}
            onClick={() => move(1)}
            disabled={!navigation.next}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
