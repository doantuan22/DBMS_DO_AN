// Record media must describe that record. Generic stock hosts in the current seed
// are intentionally not presented as film posters or photographs of a named cinema.
// The database retains the original, licensed Internet URL.  The canonical
// Wikimedia assets are mirrored into public/posters so a React client can render
// them in environments that block third-party egress; source evidence is in the
// volume-seed audit report.
const POSTER_CACHE = new Map([
  ['https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg', '/posters/sintel.jpg'],
  ['https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/960px-Big_buck_bunny_poster_big.jpg', '/posters/big-buck-bunny.jpg'],
  ['https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Tos-poster.png/960px-Tos-poster.png', '/posters/tears-of-steel.png'],
  ['https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/ElephantsDreamPoster.jpg/960px-ElephantsDreamPoster.jpg', '/posters/elephants-dream.jpg'],
  ['https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/CosmosLaundromatPoster.jpg/960px-CosmosLaundromatPoster.jpg', '/posters/cosmos-laundromat.jpg'],
  ['https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Spring2019PillarPosterBlender.jpg/960px-Spring2019PillarPosterBlender.jpg', '/posters/spring.jpg'],
  ['https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/Sprite_Fright-movie_poster.jpg/960px-Sprite_Fright-movie_poster.jpg', '/posters/sprite-fright.jpg'],
  ['https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fd/Charge-movie_poster.jpg/960px-Charge-movie_poster.jpg', '/posters/charge.jpg'],
  ['https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/Coffee_Run-movie_poster.png/960px-Coffee_Run-movie_poster.png', '/posters/coffee-run.png'],
]);

export function recordMediaUrl(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    const url = new URL(value, 'https://cinemastar.invalid');
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    if (/(^|\.)(unsplash\.com|pexels\.com|pixabay\.com)$/.test(url.hostname)) return null;
    return POSTER_CACHE.get(value) ?? value;
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
