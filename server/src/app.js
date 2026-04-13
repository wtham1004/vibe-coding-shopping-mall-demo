import cors from "cors";
import express from "express";
import routes from "./routes/index.js";

const app = express();

/** Heroku 등 리버스 프록시 뒤에서 올바른 클라이언트 IP·프로토콜 인식 */
app.set("trust proxy", 1);

/**
 * CORS: 프로덕션에서는 CLIENT_ORIGIN 만 허용 (쉼표로 여러 개 가능).
 * 미설정 시 origin: true — 요청 Origin 을 그대로 허용 (로컬 개발용).
 */
function buildCorsOptions() {
  const raw = process.env.CLIENT_ORIGIN;
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return { origin: true };
  }
  const origins = String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    return { origin: true };
  }
  return { origin: origins.length === 1 ? origins[0] : origins };
}

app.use(cors(buildCorsOptions()));
app.use(express.json());
app.use("/api", routes);

export default app;
