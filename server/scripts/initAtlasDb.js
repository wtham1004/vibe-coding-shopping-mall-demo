/**
 * MongoDB Atlas(또는 연결 URI가 가리키는 DB)에 앱과 동일한 컬렉션·인덱스를 맞춥니다.
 *
 * 사용법:
 * 1. Atlas에서 새 DB를 쓰려면 `MONGODB_URI` 끝의 DB 이름만 변경합니다.
 *    예: ...mongodb.net/shopping-malldemo → ...mongodb.net/my-new-db
 * 2. `npm run db:init` 실행
 *
 * 동작: User / Product / Cart / Order 모델을 로드한 뒤 `syncIndexes()`로
 * unique·복합 인덱스를 MongoDB에 반영합니다. (데이터는 삭제하지 않습니다.)
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDb, resolveMongoUri } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Product } from "../src/models/Product.js";
import { Cart } from "../src/models/Cart.js";
import { Order } from "../src/models/Order.js";

const models = [
  { name: "users", model: User },
  { name: "products", model: Product },
  { name: "carts", model: Cart },
  { name: "orders", model: Order },
];

async function main() {
  const uri = resolveMongoUri();
  const isAtlas = uri.includes("mongodb.net") || uri.includes("mongodb+srv");
  if (!isAtlas) {
    console.warn(
      "[db:init] MONGODB_URI가 Atlas가 아닙니다. 로컬/기타 호스트에도 동일하게 인덱스를 맞춥니다.",
    );
  }

  await connectDb();
  const dbName = mongoose.connection.db?.databaseName;
  console.log(`[db:init] 데이터베이스: ${dbName ?? "(unknown)"}`);

  for (const { name, model } of models) {
    await model.syncIndexes();
    console.log(`[db:init] ${name}: 인덱스 동기화 완료`);
  }

  console.log("[db:init] 완료 — 컬렉션 users, products, carts, orders 가 스키마와 일치합니다.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });
