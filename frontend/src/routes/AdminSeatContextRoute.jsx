import FacilityScreen from '../features/facilities/FacilityScreen';

// 3B owns paired cinema/room validation and the configuration workspace.
export default function AdminSeatContextRoute() {
  return <FacilityScreen kind="seats" />;
}
