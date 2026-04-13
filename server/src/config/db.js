import dns from "node:dns";
import mongoose from "mongoose";

/** Windows 등에서 IPv6/SRV 조회 순서로 인한 `querySrv ECONNREFUSED` 완화 */
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  /* Node 버전에 따라 미지원일 수 있음 */
}

/** 앱 기본 DB 이름 — URI 경로에 없으면 붙입니다 (Atlas Drivers 복사본에 `/dbname` 없을 때). */
export const DEFAULT_MONGODB_DATABASE = "shopping-malldemo";

/** MONGODB_URI가 없거나 비어 있을 때 사용하는 로컬 MongoDB */
const LOCAL_MONGODB_URI = `mongodb://127.0.0.1:27017/${DEFAULT_MONGODB_DATABASE}`;

/**
 * 호스트 뒤 경로에 DB 이름이 없으면 `DEFAULT_MONGODB_DATABASE` 를 넣습니다.
 * 예: `...mongodb.net/?appName=...` → `...mongodb.net/shopping-malldemo?...`
 */
export function ensureMongoDatabaseName(uri, dbName = DEFAULT_MONGODB_DATABASE) {
  const s = String(uri).trim();
  const m = s.match(
    /^(mongodb(?:\+srv)?:\/\/(?:[^@]+@)?[^/?]+)(\/?[^?#]*)?(\?[^#]*)?(#.*)?$/i,
  );
  if (!m) return s;
  const base = m[1];
  const pathPart = m[2] ?? "";
  const tail = (m[3] ?? "") + (m[4] ?? "");
  const firstSegment = pathPart.replace(/^\//, "").split("/")[0];
  if (!firstSegment) {
    return `${base}/${dbName}${tail}`;
  }
  return s;
}

/**
 * 연결 문자열 결정:
 * - `MONGODB_URI`가 있고 공백이 아니면 그 값 사용 (예: Atlas — `.env` / `.env.example` 기본값)
 * - 없거나 빈 문자열이면 로컬 주소 사용
 * - 경로에 DB 이름이 없으면 `shopping-malldemo` 사용
 */
export function resolveMongoUri() {
  const raw = process.env.MONGODB_URI;
  if (raw === undefined || raw === null) {
    return LOCAL_MONGODB_URI;
  }
  const trimmed = String(raw).trim();
  if (trimmed === "") {
    return LOCAL_MONGODB_URI;
  }
  return ensureMongoDatabaseName(trimmed);
}

/** mongodb+srv DNS(SRV) 실패 시 대안: Atlas UI의 Standard connection string(mongodb:// 호스트 나열) 사용 */
const MONGO_CONNECT_OPTS = {
  serverSelectionTimeoutMS: 60_000,
  socketTimeoutMS: 45_000,
  /** IPv4 우선 — SRV/IPv6 환경에서 연결 거부 완화 */
  family: 4,
};

function isQuerySrvFailure(err) {
  return err && err.code === "ECONNREFUSED" && err.syscall === "querySrv";
}

async function disconnectQuietly() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch {
    /* ignore */
  }
}

/**
 * Atlas `mongodb+srv` 연결 시 로컬/회사 DNS가 SRV 조회를 거부하면 `querySrv ECONNREFUSED` 가 납니다.
 * 1) 공용 DNS(8.8.8.8)로 재시도
 * 2) 실패 시 `MONGODB_STANDARD_URI` 가 있으면 비-SRV 문자열로 연결
 */
export async function connectDb() {
  const primary = resolveMongoUri();
  const standardEnv = process.env.MONGODB_STANDARD_URI;
  const standard =
    standardEnv !== undefined && standardEnv !== null
      ? ensureMongoDatabaseName(String(standardEnv).trim())
      : "";

  const tryUri = async (connectionUri) => {
    await disconnectQuietly();
    await mongoose.connect(connectionUri, MONGO_CONNECT_OPTS);
  };

  let uriUsed = primary;

  try {
    await tryUri(primary);
  } catch (err) {
    if (!isQuerySrvFailure(err)) {
      throw err;
    }

    console.warn(
      "[db] querySrv ECONNREFUSED — retrying with public DNS resolvers (8.8.8.8)…",
    );
    try {
      dns.setServers(["8.8.8.8", "8.8.4.4"]);
      await tryUri(primary);
      console.warn("[db] MongoDB connected after DNS resolver change.");
    } catch (err2) {
      if (!isQuerySrvFailure(err2)) {
        throw err2;
      }
      if (standard) {
        console.warn(
          "[db] SRV still failing — using MONGODB_STANDARD_URI (mongodb://, no SRV)…",
        );
        await tryUri(standard);
        uriUsed = standard;
        console.warn("[db] MongoDB connected via MONGODB_STANDARD_URI.");
      } else {
        console.error(
          "[db] Fix: set MONGODB_STANDARD_URI in .env to Atlas “Standard connection string” (mongodb://host:27017,.../dbname), or fix DNS for SRV queries.",
        );
        throw err2;
      }
    }
  }

  const isLocal =
    uriUsed.startsWith("mongodb://127.0.0.1") ||
    uriUsed.startsWith("mongodb://localhost");
  console.log(`MongoDB connected (${isLocal ? "local" : "remote"})`);
}
