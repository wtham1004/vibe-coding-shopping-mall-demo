export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}
