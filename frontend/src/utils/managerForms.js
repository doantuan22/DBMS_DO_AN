import {
  ROOM_TYPES,
  SEAT_TYPES,
  DAY_TYPES,
  RESOURCE_STATUSES,
} from '../../../shared/resourceContract.mjs';
import {
  businessDate,
  defaultShowtimeLocal,
  instantToBusinessLocal,
  businessLocalToInstant,
} from './dateTime';

const field = (name, label, type = 'text', options) => ({ name, label, type, options });
export const managerFields = {
  room: [field('name', 'Tên phòng'), field('type', 'Loại phòng', 'select', ROOM_TYPES)],
  seat: [
    field('row', 'Hàng ghế'),
    field('number', 'Số ghế', 'number'),
    field('type', 'Loại ghế', 'select', SEAT_TYPES),
  ],
  showtime: [
    { ...field('movieId', 'Phim', 'resource'), lookup: 'movies' },
    { ...field('roomId', 'Phòng', 'resource'), lookup: 'rooms' },
    field('startsAt', 'Bắt đầu', 'datetime-local'),
    field('endsAt', 'Kết thúc', 'datetime-local'),
    field('format', 'Định dạng', 'select', ROOM_TYPES),
    field('basePrice', 'Giá vé cơ bản', 'number'),
  ],
  pricing: [
    field('seatType', 'Loại ghế bảng giá', 'select', [...SEAT_TYPES, 'Tất cả']),
    field('dayType', 'Loại ngày', 'select', DAY_TYPES),
    field('format', 'Định dạng bảng giá', 'select', [...ROOM_TYPES, 'Tất cả']),
    field('surcharge', 'Phụ thu', 'number'),
    field('startsOn', 'Ngày áp dụng', 'date'),
    field('endsOn', 'Ngày kết thúc', 'date'),
  ],
};
export function fieldsFor(kind, editing = false) {
  const fields =
    editing && kind === 'seat'
      ? managerFields.seat.filter((f) => f.name === 'type')
      : editing && kind === 'showtime'
        ? managerFields.showtime.map((f) =>
            f.name === 'roomId' ? { ...f, readOnly: true, submit: false } : f,
          )
        : managerFields[kind];
  const resource = { room: 'rooms', seat: 'seats', showtime: 'showtimes', pricing: 'pricing' }[
    kind
  ];
  return editing
    ? [
        ...fields,
        field(
          'status',
          'Trạng thái',
          'select',
          RESOURCE_STATUSES[resource].filter(
            (status) => kind !== 'showtime' || status !== 'Đã hủy',
          ),
        ),
      ]
    : fields;
}
export function initialManagerValues(kind, row) {
  if (row)
    return Object.fromEntries(
      fieldsFor(kind, true).map(({ name, type }) => [
        name,
        type === 'datetime-local'
          ? instantToBusinessLocal(row[name])
          : type === 'resource'
            ? String(row[name] ?? '')
            : (row[name] ?? ''),
      ]),
    );
  return {
    room: { name: '', type: '2D' },
    seat: { row: 'Z', number: 1, type: 'Thường' },
    showtime: {
      movieId: '',
      roomId: '',
      startsAt: defaultShowtimeLocal(30, '10:00'),
      endsAt: defaultShowtimeLocal(30, '12:46'),
      format: '2D',
      basePrice: 80000,
    },
    pricing: {
      seatType: 'Thường',
      dayType: 'Ngày thường',
      format: '2D',
      surcharge: 0,
      startsOn: businessDate(),
      endsOn: '',
    },
  }[kind];
}
export function managerBody(kind, values, editing = false) {
  if (kind === 'pricing' && !DAY_TYPES.includes(values.dayType))
    throw new Error('Loại ngày không hợp lệ.');
  if (kind === 'pricing' && values.endsOn && values.endsOn < values.startsOn)
    throw new Error('Ngày kết thúc không được trước ngày áp dụng.');
  return Object.fromEntries(
    fieldsFor(kind, editing)
      .filter(({ submit }) => submit !== false)
      .map(({ name, type }) => {
        const value = values[name];
        if (type === 'resource') {
          if (!/^[1-9]\d*$/.test(String(value ?? '')) || !Number.isSafeInteger(Number(value)))
            throw new Error(`Vui lòng chọn ${name === 'movieId' ? 'phim' : 'phòng'} hợp lệ.`);
          return [name, Number(value)];
        }
        return [
          name,
          type === 'number'
            ? Number(value)
            : type === 'datetime-local'
              ? businessLocalToInstant(value)
              : name === 'endsOn'
                ? value || null
                : value,
        ];
      }),
  );
}
