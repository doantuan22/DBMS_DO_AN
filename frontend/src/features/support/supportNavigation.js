export function supportRoute(pathname) {
  if (
    pathname === '/support' ||
    pathname === '/support/' ||
    pathname === '/support/complaints' ||
    pathname === '/support/complaints/'
  )
    return { kind: 'queue' };
  const match = /^\/support\/complaints\/([1-9]\d*)\/?$/.exec(pathname),
    id = Number(match?.[1]);
  return match && Number.isSafeInteger(id) && id <= 2147483647
    ? { kind: 'case', id }
    : { kind: 'notFound' };
}
export function supportQuery(filters) {
  return new URLSearchParams(
    Object.entries(filters).filter(([key, value]) => ['status', 'priority'].includes(key) && value),
  ).toString();
}
export function supportDestination(destination) {
  try {
    return /^\/support(?:\/|$)/.test(new URL(destination, 'http://localhost').pathname);
  } catch {
    return false;
  }
}
export function supportCasePath(id, filters) {
  const query = supportQuery(filters);
  return `/support/complaints${id ? `/${id}` : ''}${query ? `?${query}` : ''}`;
}
