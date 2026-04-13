import { Router } from "express";
import {
  authenticate,
  requireAdmin,
} from "../middleware/authMiddleware.js";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "../controllers/productController.js";

const router = Router();

/** 스토어 메인 등 — 로그인 없이 카탈로그 조회 */
router.get("/", listProducts);
router.get("/:id", getProduct);

router.post("/", authenticate, requireAdmin, createProduct);
router.patch("/:id", authenticate, requireAdmin, updateProduct);
router.delete("/:id", authenticate, requireAdmin, deleteProduct);

export default router;
