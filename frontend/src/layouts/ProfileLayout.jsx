import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles';
import AreaLayout from './AreaLayout';
import StaffShell from './StaffShell';

const STAFF_PORTALS = {
  [ROLES.ADMIN]: 'admin',
  [ROLES.MANAGER]: 'manager',
  [ROLES.SUPPORT]: 'support',
};

export default function ProfileLayout() {
  const { user } = useAuth();
  const portal = STAFF_PORTALS[user?.role];

  return portal ? <StaffShell portal={portal} /> : <AreaLayout title="Hồ sơ cá nhân" />;
}
