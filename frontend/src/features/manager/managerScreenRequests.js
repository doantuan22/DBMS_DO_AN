import { loadAuthorizedSections } from '../../utils/authorization.js';

export function loadManagerScreen(user, section, cinemaId, api) {
  const definitions = {
    rooms: { permission: 'QL_PHONG', load: () => api.getRooms(cinemaId) },
    showtimes: { permission: 'QL_SUAT_CHIEU', load: () => api.getManagerShowtimes(cinemaId) },
    pricing: { permission: 'QL_BANG_GIA', load: () => api.getPricing(cinemaId) },
  };
  const needed =
    {
      rooms: ['rooms'],
      seats: ['rooms'],
      showtimes: ['rooms', 'showtimes'],
      pricing: ['pricing'],
      revenue: [],
    }[section] ?? Object.keys(definitions);
  return loadAuthorizedSections(
    user,
    'QUAN_LY_RAP',
    Object.fromEntries(needed.map((key) => [key, definitions[key]])),
  );
}

export function createManagerRequestOwner(store) {
  const ownsContext = store.capture();
  let active = true;
  const generations = new Map();
  const isCurrent = () => active && ownsContext();
  return {
    isCurrent,
    activate() {
      active = true;
    },
    dispose() {
      active = false;
      generations.clear();
    },
    begin(channel) {
      const generation = Symbol(channel);
      generations.set(channel, generation);
      return () => isCurrent() && generations.get(channel) === generation;
    },
  };
}
