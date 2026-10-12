// Record media must describe that record. Generic stock hosts in the current seed
// are intentionally not presented as film posters or photographs of a named cinema.
export function recordMediaUrl(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    const url = new URL(value, 'https://cinemastar.invalid');
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    if (/(^|\.)(unsplash\.com|pexels\.com|pixabay\.com)$/.test(url.hostname)) return null;
    return value;
  } catch {
    return null;
  }
}
export function trailerUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    if (url.hostname.endsWith('youtube.com') || url.hostname === 'youtu.be') {
      const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v');
      if (!/^[\w-]{11}$/.test(id ?? '') || /^example/i.test(id)) return null;
    }
    return value;
  } catch {
    return null;
  }
}
