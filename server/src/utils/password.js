import bcrypt from "bcrypt";

/** bcrypt cost factor (higher = slower & stronger) */
export const PASSWORD_HASH_ROUNDS = 12;

/** One-way hash for storing passwords (not encryption — cannot be decrypted). */
export async function hashPassword(plainText) {
  if (typeof plainText !== "string" || plainText.length === 0) {
    throw new Error("password must be a non-empty string");
  }
  return bcrypt.hash(plainText, PASSWORD_HASH_ROUNDS);
}

/** True if value looks like a bcrypt hash (avoid double-hashing). */
export function isBcryptHash(value) {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);
}
