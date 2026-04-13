import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { issueAccessToken } from "../utils/jwt.js";
import { EMAIL_REGEX, normalizeEmail } from "../utils/validation.js";

/** 계정 존재 여부를 숨기기 위해 로그인 실패 시 동일 메시지 */
const INVALID_CREDENTIALS = "이메일 또는 비밀번호가 올바르지 않습니다.";

export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({
        error: "이메일과 비밀번호를 입력해 주세요.",
      });
    }
    if (!EMAIL_REGEX.test(String(email).trim())) {
      return res.status(400).json({ error: "올바른 이메일 형식이 아닙니다." });
    }

    const emailNorm = normalizeEmail(email);
    const user = await User.findOne({ email: emailNorm }).select("+password");
    if (!user) {
      return res.status(401).json({ error: INVALID_CREDENTIALS });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: INVALID_CREDENTIALS });
    }

    let tokenPayload;
    try {
      tokenPayload = issueAccessToken(user);
    } catch (e) {
      if (e.message === "JWT_SECRET is not configured") {
        return res.status(500).json({
          error: "서버 인증 설정(JWT_SECRET)이 필요합니다.",
        });
      }
      throw e;
    }

    const safe = await User.findById(user._id).select("-password").lean();
    return res.status(200).json({
      token: tokenPayload.token,
      tokenType: "Bearer",
      expiresIn: tokenPayload.expiresIn,
      expiresAt: tokenPayload.expiresAt,
      user: safe,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
