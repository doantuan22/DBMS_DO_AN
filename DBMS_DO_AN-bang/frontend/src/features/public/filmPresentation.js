// Presentation only: a verbatim first sentence, never rewritten movie facts.
// The full API description remains available beside the artwork and on film detail.
// Intl segmentation works for punctuation/abbreviations without a seed-specific regex.
export function synopsisExcerpt(description) {
  if (typeof description !== 'string' || !description.trim()) return null;
  const segmenter = new Intl.Segmenter('vi-VN', { granularity: 'sentence' });
  return [...segmenter.segment(description.trim())][0]?.segment.trim() ?? null;
}

export function filmMetadata(movie) {
  return [
    movie?.ageRating,
    movie?.durationMinutes ? `${movie.durationMinutes} phút` : null,
    ...(movie?.genres ?? []),
  ].filter(Boolean);
}

export function showsByCinema(showtimes) {
  const groups = new Map();
  for (const show of showtimes) {
    const key = show.cinemaId ?? show.cinemaName;
    if (!groups.has(key)) groups.set(key, { key, name: show.cinemaName, shows: [] });
    groups.get(key).shows.push(show);
  }
  return [...groups.values()];
}
