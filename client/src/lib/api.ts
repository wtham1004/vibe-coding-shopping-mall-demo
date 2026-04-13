/** Base URL for API calls. Empty = relative URLs (Vite dev proxy handles `/api`). */
export function getApiOrigin(): string {
  return import.meta.env.VITE_API_URL ?? "";
}

export function apiUrl(path: string): string {
  const base = getApiOrigin().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
