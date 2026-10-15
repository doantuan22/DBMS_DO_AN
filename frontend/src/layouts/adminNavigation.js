import { ADMIN_SECTION_ROUTES } from '../routes/adminSectionRoutes';
import { ADMIN_SECTION_PERMISSIONS, userCanAct } from '../utils/authorization';
import { ROLES } from '../constants/roles';

const groups = [
  [
    'Rạp & cơ sở vật chất',
    [
      ['cinemas', 'map-icon'],
      ['cinemaImages', 'page'],
      ['rooms', 'layout'],
      ['seats', 'table'],
    ],
  ],
  [
    'Nội dung',
    [
      ['movies', 'videos'],
      ['genres', 'list'],
      ['actors', 'user-circle'],
    ],
  ],
  [
    'Kinh doanh & vận hành',
    [
      ['showtimes', 'calendar'],
      ['pricing', 'dollar-line'],
      ['bookings', 'box-line'],
      ['products', 'box-cube'],
      ['promotions', 'star-line'],
    ],
  ],
  [
    'Chăm sóc & báo cáo',
    [
      ['complaints', 'chat'],
      ['escalations', 'box-line'],
      ['revenue', 'pie-chart'],
    ],
  ],
  [
    'Tài khoản & phân công',
    [
      ['users', 'group'],
      ['assignments', 'task-icon'],
    ],
  ],
];

export function adminNavigation(user) {
  const navigation = groups
    .map(([label, items]) => ({
      label,
      items: items
        .filter(([key]) => userCanAct(user, ROLES.ADMIN, ADMIN_SECTION_PERMISSIONS[key]))
        .map(([key, icon]) => ({ key, icon, ...ADMIN_SECTION_ROUTES[key] })),
    }))
    .filter((group) => group.items.length);

  return [
    ...navigation,
    {
      label: 'Tài khoản',
      items: [{ key: 'profile', path: '/profile', label: 'Hồ sơ', icon: 'user-circle' }],
    },
  ];
}
