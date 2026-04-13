import { Router } from "express";
import authRouter from "./auth.js";
import cartRouter from "./cart.js";
import ordersRouter from "./orders.js";
import productsRouter from "./products.js";
import usersRouter from "./users.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.use("/auth", authRouter);
router.use("/cart", cartRouter);
router.use("/orders", ordersRouter);
router.use("/users", usersRouter);
/** /api/products — GET 공개, POST·PATCH·DELETE 는 관리자(라우터 내부 미들웨어) */
router.use("/products", productsRouter);

export default router;
