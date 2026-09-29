// Thin REST client. The frontend only knows HTTP endpoints, never database objects.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function request(path, { method = 'GET', body, headers, signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message ?? `HTTP ${response.status}`);
    error.status = response.status;
    error.code = payload?.error?.code;
    throw error;
  }
  return payload;
}
