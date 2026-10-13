export async function loadResource(loader) {
  try {
    const data = await loader();
    return { status: Array.isArray(data) && data.length === 0 ? 'empty' : 'success', data };
  } catch (error) {
    return { status: 'error', error };
  }
}

export function localDateString(date = new Date()) {
  return businessDate(date);
}

export function showtimeFilters(cinemaId, date) {
  return { ...(cinemaId ? { cinemaId } : {}), ...(date ? { date } : {}) };
}
import { businessDate } from '../utils/dateTime.js';
