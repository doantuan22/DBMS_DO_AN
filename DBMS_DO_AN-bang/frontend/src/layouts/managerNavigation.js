import { MANAGER_SECTION_ROUTES } from '../routes/managerSectionRoutes';
import { userCanAct } from '../utils/authorization';
import { ROLES } from '../constants/roles';

const groups = [
  ['Tổng quan', [['overview', 'grid', 'Dashboard']]],
  [
    'Cơ sở vật chất',
    [
      ['rooms', 'layout', 'Phòng chiếu'],
      ['seats', 'table', 'Ghế'],
    ],
  ],
  [
    'Lịch chiếu & giá',
    [
      ['showtimes', 'calendar', 'Suất chiếu'],
      ['pricing', 'dollar-line', 'Bảng giá'],
      ['bookings', 'box-line', 'Quản lý đặt vé'],
    ],
  ],
  ['Báo cáo', [['revenue', 'pie-chart', 'Doanh thu']]],
];

export function managerNavigation(user) {
  return groups
    .map(([label, items]) => ({
      label,
      items: items
        .filter(([key]) => userCanAct(user, ROLES.MANAGER, MANAGER_SECTION_ROUTES[key].permission))
        .map(([key, icon, customLabel]) => ({
          key,
          icon,
          ...MANAGER_SECTION_ROUTES[key],
          label: customLabel ?? MANAGER_SECTION_ROUTES[key].label,
        })),
    }))
    .filter((group) => group.items.length);
}
