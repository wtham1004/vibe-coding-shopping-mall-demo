import { verifyAccessToken } from "../utils/jwt.js";

/** `Authorization: Bearer <token>` 검증 후 `req.auth`에 페이로드 설정 */
export function authenticate(req, res, next) {
  const raw = req.headers.authorization;
  if (!raw || typeof raw !== "string" || !raw.startsWith("Bearer ")) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }
  const token = raw.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }
  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "유효하지 않거나 만료된 토큰입니다." });
  }
}

/** `req.auth.user_type === "admin"` 일 때만 통과 */
export function requireAdmin(req, res, next) {
  if (req.auth?.user_type !== "admin") {
    return res.status(403).json({ error: "관리자 권한이 필요합니다." });
  }
  next();
}
