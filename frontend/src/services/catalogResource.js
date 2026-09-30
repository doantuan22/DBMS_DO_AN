export async function loadResource(loader) {
  try {
    const data = await loader();
    return { status: Array.isArray(data) && data.length === 0 ? 'empty' : 'success', data };
  } catch (error) {
    return { status: 'error', error };
  }
}

export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function showtimeFilters(cinemaId, date) {
  return { ...(cinemaId ? { cinemaId } : {}), ...(date ? { date } : {}) };
}
