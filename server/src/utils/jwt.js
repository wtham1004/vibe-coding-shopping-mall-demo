import jwt from "jsonwebtoken";

/** 로그인 성공 시 액세스 토큰(JWT) 발급 */
export function issueAccessToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    user_type: user.user_type,
  };
  const token = jwt.sign(payload, secret, { expiresIn });
  const decoded = jwt.decode(token);
  const expiresAt =
    decoded && typeof decoded.exp === "number"
      ? new Date(decoded.exp * 1000).toISOString()
      : null;
  return { token, expiresAt, expiresIn };
}

/**
 * Bearer 토큰 검증. 실패 시 jwt.JsonWebTokenError 등 throw.
 * @returns {{ sub: string, email: string, user_type: string }}
 */
export function verifyAccessToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  const decoded = jwt.verify(token, secret);
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("invalid token payload");
  }
  const { sub, email, user_type } = decoded;
  if (typeof sub !== "string" || typeof email !== "string") {
    throw new Error("invalid token payload");
  }
  return {
    sub,
    email,
    user_type: typeof user_type === "string" ? user_type : "customer",
  };
}
