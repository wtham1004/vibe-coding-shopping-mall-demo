/** Practical email shape check (not full RFC 5322). */
export function isValidEmail(value: string): boolean {
  const s = value.trim()
  if (!s) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}
